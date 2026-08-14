import type { TimerMode, TimerState } from "@/core/types/timerTypes"

/**
 * Pads a potentially "short" time string with zero(s).
 * @param timeString the time string (from the input component).
 * @returns the time string padded to 6-digits with zero(s).
 */
export function padTimeString(timeString: string): string {
    return timeString.padStart(6, "0")
}

/**
 * Converts a time string (non-formatted) to its duration in seconds.
 * @param timeString the time string (from the input component).
 * @returns the total time represented by the time string.
 */
export function convertTimeStringToSeconds(timeString: string): number {
    timeString = padTimeString(timeString)
    let timeSeconds = 0

    for (let k = 0; k < timeString.length; k += 2) {
        const slicedData = parseInt(timeString.slice(k, k + 2), 10)
        if (k == 0) timeSeconds += 3600 * slicedData
        else if (k == 2) timeSeconds += 60 * slicedData
        else timeSeconds += slicedData
    }

    return timeSeconds
}

/**
 * Converts seconds to a formatted/non-formatted time string representation.
 * @param totalSeconds the total seconds remaining on a timer.
 * @param format whether or not to fully format the resulting time string.
 * @returns the time string representation.
 */
export function convertSecondsToTimeString(
    totalSeconds: number,
    format: boolean = false
): string {
    const HH = Math.floor(totalSeconds / 3600)
    const MM = Math.floor((totalSeconds % 3600) / 60)
    const SS = totalSeconds % 60

    const pad = (n: number) => n.toString().padStart(2, "0")
    const timeString = `${pad(HH)}${pad(MM)}${pad(SS)}`

    return format
        ? formatTimeString(timeString)
        : timeString
}

/**
 * Extracts the time components (i.e., hours, minutes, seconds) from a time string.
 * @param timeString the time string (from the input component).
 * @returns an array of the time components as strings.
 */
export function getTimePartitions(timeString: string): string[] {
    timeString = padTimeString(timeString)
    return [
        timeString.slice(0, 2),
        timeString.slice(2, 4),
        timeString.slice(4, 6)
    ]
}

/**
 * Validates the time string based on an (exclusive) upper bound of 100 hours.
 * 
 * If a time string greater than 100 hours is passed, 99h59m59s is returned
 * as a time string.
 * 
 * @param timeString the time string (from the input component).
 * @returns the validated time string.
 */
export function validateTimeString(timeString: string): string {
    const MAX_TIME_STRING = "995959"
    const maxTimeSeconds = convertTimeStringToSeconds(MAX_TIME_STRING)
    const currentTimeSeconds = convertTimeStringToSeconds(timeString)

    return currentTimeSeconds > maxTimeSeconds
        ? MAX_TIME_STRING
        : timeString
}

/**
 * Formats the time string for the user-facing interface.
 * @param timeString the time string (from the input component).
 * @returns the formatted time string (w/ colons).
 */
export function formatTimeString(timeString: string): string {
    const [HH, MM, SS] = getTimePartitions(padTimeString(timeString))
    return `${HH + ":"}${MM + ":"}${SS}`
}

/**
 * Calculates the percentage left for a running timer.
 * @param remainingSeconds the remaining seconds on the timer.
 * @param startedTimeString the time string associated with the running timer.
 * @returns the progress as a percentage.
 */
export function calculateProgress(remainingSeconds: number, startedTimeString: string): number {
    return (remainingSeconds / convertTimeStringToSeconds(startedTimeString)) * 100
}

/**
 * Checks if a time string is invalid.
 * 
 * Invalid time strings are equivalent to zero seconds.
 * 
 * @param timeString the time string to check.
 * @returns whether or not this time string is invalid.
 */
export function timeStringInvalid(timeString: string): boolean {
    return convertTimeStringToSeconds(timeString) === 0
}

/**
 * Determines the seconds remaining on a timer (for stats computation).
 * 
 * @param mode the current timer mode
 * @param timerState local timer state
 * @param workSecondsLeft seconds left on work timer
 * @param restSecondsLeft seconds left on rest timer
 * @returns the seconds remaining for the <mode> timer
 */
export function getSecondsRemaining(
    mode: TimerMode,
    timerState: TimerState,
    workSecondsLeft: number,
    restSecondsLeft: number
): number {
    if (timerState.status === "paused") {
        return timerState.secondsRemainingAtPause ?? 0
    }

    if (timerState.status !== "running") {
        return mode === "work"
            ? workSecondsLeft
            : restSecondsLeft
    }

    const expectedEnd = mode === "work"
        ? timerState.expectedWorkTimerEnd
        : timerState.expectedRestTimerEnd

    if (!expectedEnd) return 0
    return Math.max(0, Math.ceil((expectedEnd - Date.now()) / 1000))
}
