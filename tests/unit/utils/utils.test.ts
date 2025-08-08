import { describe, it, expect } from "vitest"
import {
    padTimeString,
    convertTimeStringToSeconds,
    convertSecondsToTimeString,
    getTimePartitions,
    validateTimeString,
    formatTimeString,
    calculateProgress,
    timeStringInvalid
} from "@/utils/utils"

describe("time string padding", () => {
    it("pads short strings to 6 characters", () => {
        expect(padTimeString("1")).toBe("000001")
        expect(padTimeString("12")).toBe("000012")
        expect(padTimeString("123")).toBe("000123")
    })

    it("leaves 6-character strings unchanged", () => {
        expect(padTimeString("123456")).toBe("123456")
    })
})

describe("conversion from time strings to seconds", () => {
    it("converts hours correctly", () => {
        expect(convertTimeStringToSeconds("010000")).toBe(3600)
        expect(convertTimeStringToSeconds("020000")).toBe(7200)
    })

    it("converts minutes correctly", () => {
        expect(convertTimeStringToSeconds("000100")).toBe(60)
        expect(convertTimeStringToSeconds("002500")).toBe(1500)
    })

    it("converts seconds correctly", () => {
        expect(convertTimeStringToSeconds("000001")).toBe(1)
        expect(convertTimeStringToSeconds("000030")).toBe(30)
    })

    it("converts combined time correctly", () => {
        expect(convertTimeStringToSeconds("012345")).toBe(3600 + 23 * 60 + 45)
    })

    it("handles short strings by padding", () => {
        expect(convertTimeStringToSeconds("1")).toBe(1)
        expect(convertTimeStringToSeconds("100")).toBe(60)
    })
})

describe("conversion from seconds to time strings", () => {
    it("converts to unformatted string by default", () => {
        expect(convertSecondsToTimeString(3661)).toBe("010101")
    })

    it("converts to formatted string when requested", () => {
        expect(convertSecondsToTimeString(3661, true)).toBe("01:01:01")
    })

    it("pads single digits", () => {
        expect(convertSecondsToTimeString(61)).toBe("000101")
    })

    it("handles zero", () => {
        expect(convertSecondsToTimeString(0)).toBe("000000")
    })
})

describe("partitioning time strings", () => {
    it("splits into hours, minutes, seconds", () => {
        expect(getTimePartitions("123456")).toEqual(["12", "34", "56"])
    })

    it("pads short strings before splitting", () => {
        expect(getTimePartitions("1")).toEqual(["00", "00", "01"])
    })
})

describe("time string validation", () => {
    it("returns the same string if under 100 hours", () => {
        expect(validateTimeString("250000")).toBe("250000")
    })

    it("caps at 99:59:59 if over limit", () => {
        expect(validateTimeString("999999")).toBe("995959")
    })

    it("allows exactly 99:59:59", () => {
        expect(validateTimeString("995959")).toBe("995959")
    })
})

describe("time string formatting", () => {
    it("adds colons between time parts", () => {
        expect(formatTimeString("123456")).toBe("12:34:56")
    })

    it("pads before formatting", () => {
        expect(formatTimeString("1")).toBe("00:00:01")
    })
})

describe("progress calculation", () => {
    it("returns 100 when full time remains", () => {
        expect(calculateProgress(1500, "002500")).toBe(100)
    })

    it("returns 50 when half time remains", () => {
        expect(calculateProgress(750, "002500")).toBe(50)
    })

    it("returns 0 when no time remains", () => {
        expect(calculateProgress(0, "002500")).toBe(0)
    })
})

describe("invalid time strings", () => {
    it("returns true for zero time", () => {
        expect(timeStringInvalid("000000")).toBe(true)
        expect(timeStringInvalid("0")).toBe(true)
    })

    it("returns false for non-zero time", () => {
        expect(timeStringInvalid("000001")).toBe(false)
        expect(timeStringInvalid("250000")).toBe(false)
    })
})
