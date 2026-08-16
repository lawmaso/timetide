import type { TimerState } from "../types/timerTypes"
import type { UserSettings } from "../types/settingsTypes"
import type { UserStats } from "../types/statTypes"
import { resolveLocale } from "@/utils/utils"

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
    loopSessions: false,
    locale: resolveLocale(navigator.language)
}

export const defaultUserStats: UserStats = {}
