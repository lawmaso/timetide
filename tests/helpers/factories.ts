import { defaultTimerState, defaultUserSettings } from "@/core/config/storageDefaults"
import type { UserSettings } from "@/core/types/settingsTypes"
import type { TimerState } from "@/core/types/timerTypes"

export const createTimerState = (overrides: Partial<TimerState> = {}): TimerState => ({
    ...defaultTimerState,
    ...overrides
})

export const createSettings = (overrides: Partial<UserSettings> = {}): UserSettings => ({
    ...defaultUserSettings,
    ...overrides
})

export const createRunningWorkState = (expectedEnd?: number): TimerState => (
    createTimerState({
        mode: "work",
        status: "running",
        expectedWorkTimerEnd: expectedEnd ?? Date.now() + 25 * 60 * 1000
    })
)

export const createRunningRestState = (expectedEnd?: number): TimerState => (
    createTimerState({
        mode: "rest",
        status: "running",
        expectedRestTimerEnd: expectedEnd ?? Date.now() + 25 * 60 * 1000
    })
)

export const createPausedWorkState = (secondsRemaining: number): TimerState => (
    createTimerState({
        mode: "work",
        status: "paused",
        secondsRemainingAtPause: secondsRemaining
    })
)

export const createPausedRestState = (secondsRemaining: number): TimerState => (
    createTimerState({
        mode: "rest",
        status: "paused",
        secondsRemainingAtPause: secondsRemaining
    })
)
