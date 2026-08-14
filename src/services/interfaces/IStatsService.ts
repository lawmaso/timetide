import type { AlarmType } from "@/core/types/alarmTypes"
import type { DateRangeStats } from "@/core/types/statTypes"

export interface IStatService {
    incrementStats(
        type: AlarmType,
        day: Date,
        duration: number
    ): Promise<boolean>

    getStatsForRange(start: Date, end: Date): Promise<DateRangeStats[]>
}
