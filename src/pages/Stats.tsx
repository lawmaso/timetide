"use client"

import { useEffect, useMemo, useState } from "react"
import { Chart, useChart } from "@chakra-ui/charts"
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import type { DateRangeStats, YearStats } from "@/core/types/statTypes"
import { getYearStorageKey } from "@/core/types/statTypes"
import { createTimetideController } from "@/factories/controllerFactory"
import { convertSecondsToTimeString, getTimePartitions } from "@/utils/utils"
// import { createI18nService } from "@/factories/serviceFactory"

const timetideController = createTimetideController()
// const i18nService = createI18nService()

type DatedData = {
    isoDate: string
    keyAWorkSeconds: number | null
    keyBRestSeconds: number | null
}

const RANGE_DAYS = 30

export default function Stats() {
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
                keyAWorkSeconds: s.workSeconds,
                keyBRestSeconds: s.restSeconds
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
            // { name: "keyAWorkSeconds", label: i18nService.t("titleWorkTimeInput"), color: "timetide.400" },
            // { name: "keyBRestSeconds", label: i18nService.t("titleRestTimeInput"), color: "gray.300" }
            { name: "keyAWorkSeconds", label: "work time", color: "timetide.400" },
            { name: "keyBRestSeconds", label: "rest time", color: "gray.300" }
        ]
    })

    return (
        <Chart.Root
            chart={chart}
            minW="inherit"
        >
            <LineChart
                data={chart.data}
                responsive
            >
                <CartesianGrid stroke={chart.color("border")} />
                <XAxis
                    dataKey={chart.key("isoDate")}
                    axisLine={false}
                    hide
                />
                <YAxis
                    label={{ value: "date", position: "left" }}
                    axisLine={false}
                    hide
                />
                <Tooltip
                    animationDuration={100}
                    cursor={true}
                    content={<Chart.Tooltip
                        formatter={(value, _name) => {
                            const totalSeconds = Number(value)
                            const timeString = convertSecondsToTimeString(totalSeconds)
                            const [HH, MM, SS] = getTimePartitions(timeString)
                            return `${HH}h ${MM}m ${SS}s`
                        }}
                    />}
                />
                <Legend
                    wrapperStyle={{ marginBottom: 0 }}
                    content={<Chart.Legend interaction="hover" />}
                />
                {chart.series.map((graph) => (
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
    )
}
