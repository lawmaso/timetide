export interface DayStats {
    workSeconds: number
    restSeconds: number
}

export type YearStats = Record<string, DayStats>

export type UserStats = Record<number, YearStats>

export interface DateRangeStats extends DayStats {
    isoDate: string  // YYYY-MM-DD
}

export const STATS_KEY_PREFIX = "stats"

export function getYearStorageKey(year: number): string {
    return `${STATS_KEY_PREFIX}:${year}`
}

export function getDayKey(day: Date): string {
    const mm = String(day.getMonth() + 1).padStart(2, "0")
    const dd = String(day.getDate()).padStart(2, "0")
    return `${mm}-${dd}`
}

export function emptyDayStats(): DayStats {
    return { workSeconds: 0, restSeconds: 0 }
}