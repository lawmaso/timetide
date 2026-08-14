"use client"

import { useEffect, useMemo, useState } from "react"
import { Chart, useChart } from "@chakra-ui/charts"
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import type { DateRangeStats, YearStats } from "@/core/types/statTypes"
import { getYearStorageKey } from "@/core/types/statTypes"
import { convertSecondsToTimeString, getTimePartitions } from "@/utils/utils"
import SeedStatsButton from "@/dev/SeedStatsButton"
import { Box, ColorSwatch, createListCollection, Flex, HStack, Portal, Select, Span, Stack, Text } from "@chakra-ui/react"

import { createTimetideController } from "@/factories/controllerFactory"
import { useI18n } from "@/contexts/I18nContext"

const timetideController = createTimetideController()

type DatedData = {
    isoDate: string
    workSeconds: number | null
    restSeconds: number | null
}

const RANGE_DAYS = 30

const timePeriods = createListCollection({
  items: [
    { label: "last 7 days", value: "last_7_days" },
    { label: "current month", value: "current_month" },
    { label: "last month", value: "last_month" },
  ],
})

export default function Stats() {
    const { i18n } = useI18n()

    const [timetideDatedData, setTimetideDatedData] = useState<DatedData[]>([])

    const { start, end, years } = useMemo(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - (RANGE_DAYS - 1))

        const years = new Set<number>()
        for (let y = start.getFullYear(); y <= end.getFullYear(); y++) years.add(y)

        return { start, end, years }
    }, [])

    useEffect(() => {
        const mapToDatedData = (stats: DateRangeStats[]): DatedData[] =>
            stats.map((s) => ({
                isoDate: s.isoDate,
                workSeconds: s.workSeconds,
                restSeconds: s.restSeconds
            }))

        const fetchRangeData = async () => {
            const stats = await timetideController.getStatsForRange(start, end)
            setTimetideDatedData(mapToDatedData(stats))
        }

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
    }, [start, end, years])

    const chart = useChart({
        data: timetideDatedData,
        series: [
            { name: "workSeconds", label: i18n.t("titleWorkTimeInput"), color: "timetide.400" },
            { name: "restSeconds", label: i18n.t("titleRestTimeInput"), color: "gray.300" },

        ]
    })

    // NOTE: name is lexicographically ordered for some reason...
    // (so workSeconds doesn't come before restSeconds since ord(r) < ord(w))
    const SERIES_ORDER = ["workSeconds", "restSeconds"] as const
    const orderedSeries = [...chart.series].sort(
        (a, b) => SERIES_ORDER.indexOf(a.name as typeof SERIES_ORDER[number]) -
                  SERIES_ORDER.indexOf(b.name as typeof SERIES_ORDER[number])
    )

    return (
        <>
            <Select.Root collection={timePeriods} size="sm" width="45%" defaultValue={[timePeriods.at(0)?.label || ""]}>
                <Select.HiddenSelect />
                <Select.Control>
                    <Select.Trigger>
                        <Select.ValueText placeholder="Select timeframe"></Select.ValueText>
                    </Select.Trigger>
                </Select.Control>
                <Portal>
                    <Select.Positioner>
                    <Select.Content>
                        {timePeriods.items.map((framework) => (
                        <Select.Item item={framework} key={framework.value}>
                            {framework.label}
                            <Select.ItemIndicator />
                        </Select.Item>
                        ))}
                    </Select.Content>
                    </Select.Positioner>
                </Portal>
            </Select.Root>

            <Chart.Root
                chart={chart}
                minW="inherit"
            >
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
                                <Stack
                                    minW="8rem"
                                    gap="1"
                                    rounded="l2"
                                    bg="bg.panel"
                                    px="2.5"
                                    py="1"
                                    textStyle="xs"
                                    shadow="md"
                                >
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
                                                        <ColorSwatch rounded="full" boxSize="2" value={chart.color(seriesConfig.color)} />
                                                    )}
                                                    <HStack justify="space-between" flex="1">
                                                        <Span color="fg.muted">{seriesConfig?.label || item.name}</Span>
                                                        {/* fixed: use != null instead of truthy check, so 0 still renders */}
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
                    <Legend
                        wrapperStyle={{ marginBottom: -4 }}
                        content={() => (
                            <Flex gap="3" justify="center">
                                {orderedSeries.map((graph) => (
                                    <HStack
                                        key={graph.name}
                                        gap="1.5"
                                        style={{
                                            opacity: chart.getSeriesOpacity(graph.name, 0.6),
                                            cursor: "pointer"
                                        }}
                                        onMouseEnter={() => chart.setHighlightedSeries(graph.name!)}
                                        onMouseLeave={() => chart.setHighlightedSeries(null)}
                                    >
                                        <ColorSwatch boxSize="2" value={chart.color(graph.color)} />
                                        <Span color="fg.muted">{graph.label}</Span>
                                    </HStack>
                                ))}
                            </Flex>
                        )}
                    />
                    {orderedSeries.map((graph) => (
                        <Line
                            key={graph.name}
                            dataKey={chart.key(graph.name)}
                            stroke={chart.color(graph.color)}
                            strokeWidth={2}
                            type="bump"
                            isAnimationActive={false}
                            dot={false}
                            strokeDasharray={graph.strokeDasharray}
                            opacity={chart.getSeriesOpacity(graph.name)}
                        />
                    ))}
                </LineChart>
            </Chart.Root>
            <SeedStatsButton />
        </>
    )
}
