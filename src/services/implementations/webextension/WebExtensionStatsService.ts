import type { AlarmType } from "@/core/types/alarmTypes"
import { emptyDayStats, getDayKey, getYearStorageKey, type DayStats, type YearStats } from "@/core/types/statTypes"
import type { IStatService } from "@/services/interfaces/IStatsService"
import type { IStorageService } from "@/services/interfaces/IStorageService"

export default class WebExtensionStatService implements IStatService {
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
