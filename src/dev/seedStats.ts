// src/dev/seedStats.ts
import type { IStatService } from "@/services/interfaces/IStatsService"
import type { AlarmType } from "@/core/types/alarmTypes"

interface SeedOptions {
    daysBack?: number
    activeRatio?: number   // fraction of days that get any activity
    minSessions?: number   // sessions per active day, per interval type
    maxSessions?: number
}

export async function seedStats(
    statService: IStatService,
    options: SeedOptions = {}
): Promise<void> {
    const {
        daysBack = 30,
        activeRatio = 0.7,
        minSessions = 0,
        maxSessions = 5
    } = options

    const WORK_SESSION_SECONDS = 25 * 60 // matches defaultTimerState "002500"
    const REST_SESSION_SECONDS = 5 * 60  // matches defaultTimerState "000500"

    let daysSeeded = 0

    for (let i = 0; i < daysBack; i++) {
        const day = new Date()
        day.setDate(day.getDate() - i)

        if (Math.random() > activeRatio) continue // leave this day unlogged

        const workSessions = randomInt(minSessions, maxSessions)
        const restSessions = randomInt(minSessions, maxSessions)

        for (let s = 0; s < workSessions; s++) {
            await statService.incrementStats("work", day, WORK_SESSION_SECONDS)
        }
        for (let s = 0; s < restSessions; s++) {
            await statService.incrementStats("rest", day, REST_SESSION_SECONDS)
        }

        if (workSessions > 0 || restSessions > 0) daysSeeded++
    }

    console.log(`[seedStats] Seeded ${daysSeeded} active days over the last ${daysBack} days`)
}

export async function seedKnownDay(
    statService: IStatService,
    day: Date,
    workSeconds: number,
    restSeconds: number
): Promise<void> {
    const results: Record<AlarmType, boolean> = {
        work: workSeconds > 0 ? await statService.incrementStats("work", day, workSeconds) : true,
        rest: restSeconds > 0 ? await statService.incrementStats("rest", day, restSeconds) : true
    }
    console.log(`[seedStats] Seeded ${day.toISOString().slice(0, 10)}:`, results)
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
