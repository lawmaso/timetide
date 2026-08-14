"use client"

import { useEffect, useState } from "react"
import { Chart, useChart } from "@chakra-ui/charts"
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import type { BaseStats, DatedStats } from "@/core/types/statsTypes"
import { createTimetideController } from "@/factories/controllerFactory"
import { convertSecondsToTimeString, getTimePartitions } from "@/utils/utils"
import { defaultBaseStats, defaultDatedStats } from "@/core/config/storageDefaults"
// import { createI18nService } from "@/factories/serviceFactory"

const timetideController = createTimetideController()
// const i18nService = createI18nService()

type DatedData = {
    isoDate: string,
    keyAWorkSeconds: number | null,
    keyBRestSeconds: number | null,
}

export default function Stats() {
    const [timetideDatedData, setTimetideDatedData] = useState<DatedData[]>([])
    const [_datedStats, setDatedStats] = useState<DatedStats>(defaultDatedStats)
    const [_baseStats, setBaseStats] = useState<BaseStats>(defaultBaseStats)

    useEffect(() => {
        const fetchDatedData = async () => {
            await timetideController.resetStats()
            const datedStats: DatedStats = await timetideController.getDatedStats()
            let datedData: DatedData[] = []

            for (const [dateKey, dailyStatsObject] of Object.entries(datedStats)) {
                datedData.push({
                    isoDate: dateKey,
                    keyAWorkSeconds: dailyStatsObject.workSeconds,
                    keyBRestSeconds: dailyStatsObject.restSeconds,
                } as DatedData)
            }

            setTimetideDatedData(datedData)
        }

        const unsubscribeFromDatedStats = timetideController.subscribeTo<DatedStats>("datedStats", setDatedStats)
        const unsubscribeFromBaseStats = timetideController.subscribeTo<BaseStats>("baseStats", setBaseStats)
        fetchDatedData()

        return () => {
            unsubscribeFromDatedStats()
            unsubscribeFromBaseStats()
        }
    }, [])

    console.log(timetideDatedData)
    
    const chart = useChart({
        data: timetideDatedData ?? [],
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
                // margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
                <CartesianGrid stroke={chart.color("border")} />
                <XAxis
                    dataKey={chart.key("isoDate")}
                    axisLine={false}
                    hide
                    // tickFormatter={chart.formatDate({ day: "numeric" })}
                />
                <YAxis
                    label={{ value: "date", position: "left", angle: -90 }}
                    axisLine={false}
                    hide
                />
                <Tooltip
                    animationDuration={100}
                    cursor={false}
                    content={<Chart.Tooltip
                        formatter={(value, _name) => {
                            const totalSeconds = Number(value)
                            const timeString = convertSecondsToTimeString(totalSeconds)
                            const [ HH, MM, SS ] = getTimePartitions(timeString)

                            // const hours = HH === "00" ? "" : `${HH}h`
                            // const minutes = MM === "00" ? "" : `${MM}m`
                            // const seconds = SS === "00" ? "" : `${SS}s`
                            
                            // return `${hours}${minutes}${seconds}`

                            return `${HH}h${MM}m${SS}s`
                        }}
                    />}
                />
                <Legend
                    // wrapperStyle={{ marginBottom: 16 }}
                    wrapperStyle={{ marginBottom: 0 }}
                    content={<Chart.Legend
                        interaction="hover"                            
                    />}
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
