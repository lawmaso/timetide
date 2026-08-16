import type { AlarmType } from "@/core/types/alarmTypes"
import { emptyDayStats, getDayKey, getYearStorageKey, type DateRangeStats, type DayStats, type YearStats } from "@/core/types/statTypes"
import type { IStatService } from "@/services/interfaces/IStatsService"
import type { IStorageService } from "@/services/interfaces/IStorageService"

export default class WebStatService implements IStatService {
    private storageService: IStorageService

    constructor(storageService: IStorageService) {
        this.storageService = storageService
    }
    
    async incrementStats(
        type: AlarmType,
        day: Date,
        duration: number
    ): Promise<boolean> {
        if (duration <= 0) return false
        
        const field = this.getStatsField(type)
        if (!field) return false

        const yearKey = getYearStorageKey(day.getFullYear())
        const dayKey = getDayKey(day)

        try {
            const yearData = await this.storageService.get<YearStats>(yearKey) ?? {}
            const existing = yearData[dayKey] ?? emptyDayStats()

            yearData[dayKey] = {
                ...existing,
                [field]: existing[field] + duration
            }

            await this.storageService.set(yearKey, yearData)
            return true
        } catch (err) {
            console.error("Failed to increment stats", err)
            return false
        }
    }

    async getStatsForRange(start: Date, end: Date): Promise<DateRangeStats[]> {
        const startYear = start.getFullYear()
        const endYear = end.getFullYear()
        const results: DateRangeStats[] = []

        for (let year = startYear; year <= endYear; year++) {
            const yearData = await this.storageService.get<YearStats>(getYearStorageKey(year))
            if (!yearData) continue

            for (const [mmdd, stats] of Object.entries(yearData)) {
                const isoDate = `${year}-${mmdd}`
                const date = new Date(isoDate)

                if (date >= this.startOfDay(start) && date <= this.endOfDay(end)) {
                    results.push({ isoDate, ...stats })
                }
            }
        }

        return results.sort((a, b) => a.isoDate.localeCompare(b.isoDate))
    }

    private startOfDay(date: Date): Date {
        const d = new Date(date)
        d.setHours(0, 0, 0, 0)
        return d
    }

    private endOfDay(date: Date): Date {
        const d = new Date(date)
        d.setHours(23, 59, 59, 999)
        return d
    }

    private getStatsField(alarm: AlarmType): keyof DayStats | undefined {
        switch (alarm) {
            case "work":
                return "workSeconds"
            case "rest":
                return "restSeconds"
            default:
                return undefined
        }
    }
}
