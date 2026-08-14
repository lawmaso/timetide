import type { AlarmType } from "@/core/types/alarmTypes";

export interface IStatService {
    incrementStats(
        type: AlarmType,
        day: Date,
        duration: number
    ): Promise<boolean>
}
