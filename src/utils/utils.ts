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
    return Math.max(0, (remainingSeconds / convertTimeStringToSeconds(startedTimeString)) * 100)
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

// Folder names in public/_locales
export const AVAILABLE_LOCALES = [
    "am", "bg", "bn", "ca", "cs", "da", "de", "el", "en", "en_AU", "en_GB", "en_US",
    "es", "es_419", "et", "fi", "fil", "fr", "gu", "hi", "hr", "hu", "id", "it", "ja",
    "kn", "ko", "lt", "lv", "ml", "mr", "ms", "nl", "no", "pl", "pt_BR", "pt_PT", "ro",
    "ru", "sk", "sr", "sv", "sw", "ta", "te", "th", "tr", "uk", "vi", "zh_CN", "zh_TW"
]

type Continent = 
    | "Asia" | "Africa" | "North America" | "South America" | "Antarctica" | "Europe" | "Australia"

export const LOCALE_DATA: Record<(typeof AVAILABLE_LOCALES)[number], { flag: string, continent: Continent }> = {
    am:     { flag: "🇪🇹", continent: "Africa" },
    bg:     { flag: "🇧🇬", continent: "Europe" },
    bn:     { flag: "🇧🇩", continent: "Asia" },
    ca:     { flag: "🇪🇸", continent: "Europe" },
    cs:     { flag: "🇨🇿", continent: "Europe" },
    da:     { flag: "🇩🇰", continent: "Europe" },
    de:     { flag: "🇩🇪", continent: "Europe" },
    el:     { flag: "🇬🇷", continent: "Europe" },
    en:     { flag: "🇺🇸", continent: "North America" },
    en_AU:  { flag: "🇦🇺", continent: "Australia" },
    en_GB:  { flag: "🇬🇧", continent: "Europe" },
    en_US:  { flag: "🇺🇸", continent: "North America" },
    es:     { flag: "🇪🇸", continent: "Europe" },
    es_419: { flag: "🌎", continent: "South America" },
    et:     { flag: "🇪🇪", continent: "Europe" },
    fi:     { flag: "🇫🇮", continent: "Europe" },
    fil:    { flag: "🇵🇭", continent: "Asia" },
    fr:     { flag: "🇫🇷", continent: "Europe" },
    gu:     { flag: "🇮🇳", continent: "Asia" },
    hi:     { flag: "🇮🇳", continent: "Asia" },
    hr:     { flag: "🇭🇷", continent: "Europe" },
    hu:     { flag: "🇭🇺", continent: "Europe" },
    id:     { flag: "🇮🇩", continent: "Asia" },
    it:     { flag: "🇮🇹", continent: "Europe" },
    ja:     { flag: "🇯🇵", continent: "Asia" },
    kn:     { flag: "🇮🇳", continent: "Asia" },
    ko:     { flag: "🇰🇷", continent: "Asia" },
    lt:     { flag: "🇱🇹", continent: "Europe" },
    lv:     { flag: "🇱🇻", continent: "Europe" },
    ml:     { flag: "🇮🇳", continent: "Asia" },
    mr:     { flag: "🇮🇳", continent: "Asia" },
    ms:     { flag: "🇲🇾", continent: "Asia" },
    nl:     { flag: "🇳🇱", continent: "Europe" },
    no:     { flag: "🇳🇴", continent: "Europe" },
    pl:     { flag: "🇵🇱", continent: "Europe" },
    pt_BR:  { flag: "🇧🇷", continent: "South America" },
    pt_PT:  { flag: "🇵🇹", continent: "Europe" },
    ro:     { flag: "🇷🇴", continent: "Europe" },
    ru:     { flag: "🇷🇺", continent: "Europe" },
    sk:     { flag: "🇸🇰", continent: "Europe" },
    sr:     { flag: "🇷🇸", continent: "Europe" },
    sv:     { flag: "🇸🇪", continent: "Europe" },
    sw:     { flag: "🇰🇪", continent: "Africa" },
    ta:     { flag: "🇮🇳", continent: "Asia" },
    te:     { flag: "🇮🇳", continent: "Asia" },
    th:     { flag: "🇹🇭", continent: "Asia" },
    tr:     { flag: "🇹🇷", continent: "Asia" },
    uk:     { flag: "🇺🇦", continent: "Europe" },
    vi:     { flag: "🇻🇳", continent: "Asia" },
    zh_CN:  { flag: "🇨🇳", continent: "Asia" },
    zh_TW:  { flag: "🇹🇼", continent: "Asia" },
}

/**
 * Resolves a raw locale into a supported locale of the app
 * 
 * @param rawLocale a raw locale string (BCP 47 language tag)
 * @returns the resolved locale
 */
export function resolveLocale(rawLocale: string): string {
    // "pt-BR" -> "pt_BR" to match folder naming
    const normalized = rawLocale.replace("-", "_")

    if (AVAILABLE_LOCALES.includes(normalized)) {
        return normalized
    }

    // try case-insensitive exact match, e.g. "en-us" -> "en_US"
    const exactMatch = AVAILABLE_LOCALES.find(
        (locale) => locale.toLowerCase() === normalized.toLowerCase()
    )

    if (exactMatch) {
        return exactMatch
    }

    // fall back to the base language, e.g. "fr_CA" -> "fr"
    const baseLang = normalized.split("_")[0]
    const baseMatch = AVAILABLE_LOCALES.find(
        (locale) => locale.toLowerCase() === baseLang.toLowerCase()
    )

    if (baseMatch) {
        return baseMatch
    }

    return "en"
}

type DurationPart = { value: number; i18nKey: "unitHour" | "unitMinute" | "unitSecond" }

export function getDurationParts(totalSeconds: number): DurationPart[] {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = Math.floor(totalSeconds % 60)

    const parts: DurationPart[] = [
        { value: h, i18nKey: "unitHour" },
        { value: m, i18nKey: "unitMinute" },
        { value: s, i18nKey: "unitSecond" },
    ]

    // drop leading zero units (e.g. don't show "0h" if there are no hours),
    // but always keep at least the seconds part so 0s renders as "0s"
    const firstNonZero = parts.findIndex((p) => p.value > 0)
    return firstNonZero === -1 ? [parts[2]] : parts.slice(firstNonZero)
}