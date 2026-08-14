import type { TimerState } from "../types/timerTypes"
import type { UserSettings } from "../types/settingsTypes"
import type { BaseStats, DatedStats } from "../types/statsTypes"

export const defaultTimerState: TimerState = {
    status: "idle",
    mode: "idle",
    lastWorkTimeString: "002500",
    lastRestTimeString: "000500",
    expectedWorkTimerEnd: null,
    expectedRestTimerEnd: null,
    secondsRemainingAtPause: null
}

export const defaultUserSettings: UserSettings = {
    soundsEnabled: true,
    notificationsEnabled: true,
    loopSessions: false
}

export const defaultBaseStats: BaseStats = {
    totalWorkSeconds: 0,
    totalRestSeconds: 0,
    totalResets: 0,
    totalWorkSkips: 0,
    totalRestSkips: 0
}

// export const defaultDatedStats: DatedStats = {
//     "2026-02-01T05:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2026-03-01T05:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2026-04-01T04:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2026-05-01T04:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2026-06-01T04:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2026-07-01T04:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2026-08-01T04:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2026-09-01T04:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2026-10-01T04:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2026-11-01T04:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2026-12-01T05:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     },
//     "2027-01-01T05:00:00.000Z": {
//         workSeconds: 250,
//         restSeconds: 120,
//         workSkips: 4,
//         restSkips: 4,
//         resets: 0
//     }
// }

export const defaultDatedStats: DatedStats = {
    "2026-02-01T05:00:00.000Z": { workSeconds: 5400, restSeconds: 1200, workSkips: 1, restSkips: 2, resets: 0 },
    "2026-03-01T05:00:00.000Z": { workSeconds: 7200, restSeconds: 1500, workSkips: 0, restSkips: 1, resets: 0 },
    "2026-04-01T04:00:00.000Z": { workSeconds: 6800, restSeconds: 1400, workSkips: 2, restSkips: 2, resets: 1 },
    "2026-05-01T04:00:00.000Z": { workSeconds: 8200, restSeconds: 1800, workSkips: 0, restSkips: 1, resets: 0 },
    "2026-06-01T04:00:00.000Z": { workSeconds: 9000, restSeconds: 2000, workSkips: 0, restSkips: 0, resets: 0 },
    "2026-07-01T04:00:00.000Z": { workSeconds: 4000, restSeconds: 1000, workSkips: 4, restSkips: 3, resets: 2 }, // burnout dip
    "2026-08-01T04:00:00.000Z": { workSeconds: 3000, restSeconds: 900, workSkips: 5, restSkips: 4, resets: 3 },  // vacation slump
    "2026-09-01T04:00:00.000Z": { workSeconds: 7500, restSeconds: 1600, workSkips: 1, restSkips: 1, resets: 0 }, // recovery
    "2026-10-01T04:00:00.000Z": { workSeconds: 8800, restSeconds: 1900, workSkips: 0, restSkips: 1, resets: 0 },
    "2026-11-01T04:00:00.000Z": { workSeconds: 9400, restSeconds: 2100, workSkips: 0, restSkips: 0, resets: 0 }, // peak
    "2026-12-01T05:00:00.000Z": { workSeconds: 5000, restSeconds: 1300, workSkips: 3, restSkips: 2, resets: 1 }, // holidays
    "2027-01-01T05:00:00.000Z": { workSeconds: 8600, restSeconds: 1800, workSkips: 1, restSkips: 1, resets: 0 }  // new year rebound
}
