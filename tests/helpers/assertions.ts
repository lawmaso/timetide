import type { UserSettings } from "@/core/types/settingsTypes"
import type { TimerState } from "@/core/types/timerTypes"

export const expectTimerState = (overrides: Partial<TimerState>) => (
    expect.objectContaining(overrides)
)

export const expectUserSettings = (overrides: Partial<UserSettings>) => (
    expect.objectContaining(overrides)
)
