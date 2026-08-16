"use client"

import { useEffect, useMemo, useState, useCallback, Fragment } from "react"
import { Chart, useChart } from "@chakra-ui/charts"
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import type { DateRangeStats, YearStats } from "@/core/types/statTypes"
import { emptyDayStats, getYearStorageKey } from "@/core/types/statTypes"
import { convertSecondsToTimeString, getDurationParts, getTimePartitions } from "@/utils/utils"
import { Box, ColorSwatch, createListCollection, Flex, HStack, Portal, Select, Span, Stack, Stat, Text } from "@chakra-ui/react"
import { useController } from "@/contexts/TimetideControllerContext"
import { useI18n } from "@/contexts/I18nContext"

type DatedData = {
    isoDate: string
    workSeconds: number
    restSeconds: number
}

const TIME_PERIODS = {
    L7:  { range: 7 },
    L14: { range: 14 },
    L30: { range: 30 },
    L90: { range: 90 },
} as const

type TimePeriodValue = keyof typeof TIME_PERIODS
const DEFAULT_PERIOD: TimePeriodValue = "L7"

// "N days ago" math
function daysAgo(from: Date, days: number): Date {
    const d = new Date(from)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - days)
    return d
}

// Generates YYYY-MM-DD for every day in [start, end], inclusive.
function isoDateRange(start: Date, end: Date): string[] {
    const dates: string[] = []
    const cur = new Date(start)
    cur.setHours(0, 0, 0, 0)
    const last = new Date(end)
    last.setHours(0, 0, 0, 0)

    while (cur <= last) {
        dates.push(cur.toISOString().slice(0, 10))
        cur.setDate(cur.getDate() + 1)
    }
    return dates
}

export default function Stats() {
    const { controller: timetideController } = useController()
    const { t } = useI18n()

    // Rebuild whenever locale changes, since Select.ValueText reads `label` off this collection.
    const timePeriodsCollection = useMemo(
        () =>
            createListCollection({
                items: (Object.entries(TIME_PERIODS) as [TimePeriodValue, typeof TIME_PERIODS[TimePeriodValue]][])
                    .map(([value, { range }]) => ({
                        value,
                        label: t(`statLast${range}`),
                    })),
            }),
        [t]
    )

    const [datedData, setDatedData] = useState<DatedData[]>([])
    const [aggregation, setAggregation] = useState<{ workSeconds: number, restSeconds: number}>({
        workSeconds: 0, restSeconds: 0
    })
    const aggregationBySeries: Record<typeof SERIES_ORDER[number], number> = {
        workSeconds: aggregation.workSeconds,
        restSeconds: aggregation.restSeconds,
    }
    const [periodValue, setPeriodValue] = useState<TimePeriodValue>(DEFAULT_PERIOD)
    const range = TIME_PERIODS[periodValue].range

    // Recompute start/end only when the range actually changes.
    const { start, end } = useMemo(() => {
        const end = new Date()
        const start = daysAgo(end, range - 1)
        return { start, end }
    }, [range])

    const fetchRangeData = useCallback(async () => {
        const stats = await timetideController.getStatsForRange(start, end)

        // Index fetched stats by isoDate for O(1) lookup while filling gaps.
        const statsByDate = new Map(stats.map((s: DateRangeStats) => [s.isoDate, s]))

        const filled: DatedData[] = isoDateRange(start, end).map((isoDate) => {
            const existing = statsByDate.get(isoDate)
            const { workSeconds, restSeconds } = existing ?? emptyDayStats()
            return { isoDate, workSeconds, restSeconds }
        })

        setDatedData(filled)
        setAggregation({
            workSeconds: filled.reduce((total, dayData) => total + dayData.workSeconds, 0),
            restSeconds: filled.reduce((total, dayData) => total + dayData.restSeconds, 0)
        })
    }, [timetideController, start, end])

    useEffect(() => {
        const years = new Set<number>()
        for (let y = start.getFullYear(); y <= end.getFullYear(); y++) years.add(y)

        // Re-fetch the whole range whenever any touched year's storage changes,
        // rather than trying to patch a single day in place.
        const unsubscribers = Array.from(years).map((year) =>
            timetideController.subscribeTo<YearStats>(
                getYearStorageKey(year),
                () => { fetchRangeData() }
            )
        )

        fetchRangeData()

        return () => {
            unsubscribers.forEach((unsub) => unsub())
        }
    }, [fetchRangeData, start, end, timetideController])

    const chart = useChart({
        data: datedData,
        series: [
            { name: "workSeconds", label: t("titleWorkTimeInput"), color: "timetide.400" },
            { name: "restSeconds", label: t("titleRestTimeInput"), color: "gray.300" },
        ]
    })

    const SERIES_ORDER = ["workSeconds", "restSeconds"] as const
    const orderedSeries = [...chart.series].sort(
        (a, b) => SERIES_ORDER.indexOf(a.name as typeof SERIES_ORDER[number]) -
                  SERIES_ORDER.indexOf(b.name as typeof SERIES_ORDER[number])
    )

    return (
        <>
            <Flex justify="end" mr="1">
                <Select.Root
                    collection={timePeriodsCollection}
                    value={[periodValue]}
                    onValueChange={(e) => {
                        const next = e.value[0] as TimePeriodValue
                        if (next in TIME_PERIODS) setPeriodValue(next)
                    }}
                    size="sm"
                    width="45%"
                >
                    <Select.HiddenSelect />
                    <Select.Control>
                        <Select.Trigger>
                            <Select.ValueText />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                            <Select.Indicator />
                        </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                        <Select.Positioner>
                            <Select.Content>
                                {timePeriodsCollection.items.map((period) => (
                                    <Select.Item item={period} key={period.value}>
                                        {/* {period.label} */}
                                        {t(`statLast${TIME_PERIODS[period.value].range}`)}
                                        <Select.ItemIndicator />
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Positioner>
                    </Portal>
                </Select.Root>
            </Flex>

            <Chart.Root chart={chart}>
                <LineChart data={chart.data} responsive>
                    <CartesianGrid stroke={chart.color("border")} />
                    <XAxis dataKey={chart.key("isoDate")} axisLine={false} hide />
                    <YAxis label={{ value: "date", position: "left" }} axisLine={false} hide />
                    <Tooltip
                        animationDuration={100}
                        cursor={true}
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            return (
                                <Stack minW="8rem" gap="1" rounded="l2" bg="bg.panel" px="2.5" py="1" textStyle="xs" shadow="md">
                                    <Text fontWeight="medium">{label}</Text>
                                    <Box>
                                        {payload.map((item, index) => {
                                            const seriesConfig = chart.getSeries(item)
                                            const totalSeconds = Number(item.value ?? 0)
                                            const timeString = convertSecondsToTimeString(totalSeconds)
                                            const [HH, MM, SS] = getTimePartitions(timeString)
                                            const formattedValue = `${HH}h ${MM}m ${SS}s`

                                            return (
                                                <Flex key={index} gap="1.5" wrap="wrap" align="center" _icon={{ boxSize: "2.5" }}>
                                                    {seriesConfig?.color && (
                                                        <ColorSwatch boxSize="2" value={chart.color(seriesConfig.color)} />
                                                    )}
                                                    <HStack justify="space-between" flex="1">
                                                        <Span color="fg.muted">{seriesConfig?.label || item.name}</Span>
                                                        {item.value != null && (
                                                            <Text fontWeight="medium" fontVariantNumeric="tabular-nums">
                                                                {formattedValue}
                                                            </Text>
                                                        )}
                                                    </HStack>
                                                </Flex>
                                            )
                                        })}
                                    </Box>
                                </Stack>
                            )
                        }}
                    />
                    {orderedSeries.map((graph) => (
                        <Line
                            key={graph.name}
                            dataKey={chart.key(graph.name)}
                            stroke={chart.color(graph.color)}
                            strokeWidth={2}
                            type="bump"
                            isAnimationActive={true}
                            animationDuration={1000}
                            dot={false}
                            strokeDasharray={graph.strokeDasharray}
                            opacity={chart.getSeriesOpacity(graph.name)}
                        />
                    ))}
                </LineChart>
            </Chart.Root>

            <HStack gap="0" mx="1">
                {orderedSeries.map((graph) => {
                    const seconds = aggregationBySeries[graph.name as typeof SERIES_ORDER[number]]
                    const parts = getDurationParts(seconds)

                    return (
                        <Stat.Root key={graph.name} borderWidth={0} alignItems="center">
                            <Stat.Label mb="-1.5">
                                <ColorSwatch boxSize="3" value={chart.color(graph.color)} />
                                {graph.label}
                            </Stat.Label>
                            <Stat.ValueText alignItems="baseline" gap="0.5">
                                {parts.map((part) => (
                                    <Fragment key={part.i18nKey}>
                                        {part.value} <Stat.ValueUnit>{t(part.i18nKey)}</Stat.ValueUnit>
                                    </Fragment>
                                ))}
                            </Stat.ValueText>
                        </Stat.Root>
                    )
                })}
            </HStack>
        </>
    )
}
