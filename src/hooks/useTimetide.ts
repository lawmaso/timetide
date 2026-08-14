import { useEffect, useRef, useState, useCallback } from "react"

import type { TimerState } from "@/core/types/timerTypes"
import { defaultTimerState } from "@/core/config/storageDefaults"

import {
    convertTimeStringToSeconds,
    getSecondsRemaining,
    validateTimeString
} from "@/utils/utils"

import { createTimetideController } from "@/factories/controllerFactory"

const timetideController = createTimetideController()

export function useTimetide() {
    // restoration flag
    const [loading, setLoading] = useState(true)

    // localized time strings (cache for local user changes before pushes to storage)
    const [localWorkTimeString, setLocalWorkTimeString] = useState<string>("000000")
    const [localRestTimeString, setLocalRestTimeString] = useState<string>("000000")

    // localized timer state
    const [localTimerState, setLocalTimerState] = useState<TimerState>(defaultTimerState)

    // interval-related state
    const [workSecondsLeft, setWorkSecondsLeft] = useState(0)
    const [restSecondsLeft, setRestSecondsLeft] = useState(0)

    // @ts-expect-error
    const intervalID = useRef<NodeJS.Timeout | null>(null)

    const clearCurrentInterval = useCallback(() => {
        if (intervalID.current) {
            clearInterval(intervalID.current)
            intervalID.current = null
        }
    }, [])

    const startWorkInterval = useCallback((invokeController: boolean = false) => {
        clearCurrentInterval()

        // invoke controller from paused and idle (as alarms have been destroyed in those states)
        if (invokeController) timetideController.startWorkFrom({
            ...localTimerState,
            lastWorkTimeString: validateTimeString(localWorkTimeString),
            lastRestTimeString: validateTimeString(localRestTimeString)
        })

        intervalID.current = setInterval(() => {
            setWorkSecondsLeft((workSeconds) => {
                const newWorkSeconds = workSeconds - 1

                // check if we need to end the interval on the next render
                if (newWorkSeconds <= 0 && intervalID.current) {
                    // use setTimeout to ensure this runs after the state update
                    setTimeout(() => {
                        handleWorkIntervalEnding()
                    }, 0)
                }

                return Math.max(0, newWorkSeconds)
            })
        }, 1000)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localTimerState, localWorkTimeString, localRestTimeString, clearCurrentInterval])

    const handleWorkIntervalEnding = useCallback((fromSkip: boolean = false) => {
        clearCurrentInterval()

        // never invoke the controller from work -> rest when not skipping
        //     (service worker handles it as alarms still exist)
        // we only invoke the controller from skips as alarms are destroyed
        startRestInterval(fromSkip)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearCurrentInterval])

    const startRestInterval = useCallback((invokeController: boolean = false) => {
        clearCurrentInterval()

        // only invoke the controller if we're paused
        if (invokeController) timetideController.startRestFrom({
            ...localTimerState,
            lastWorkTimeString: validateTimeString(localWorkTimeString),
            lastRestTimeString: validateTimeString(localRestTimeString)
        })

        intervalID.current = setInterval(() => {
            setRestSecondsLeft((restSeconds) => {
                const newRestSeconds = restSeconds - 1

                // check if we need to end the interval on the next render
                if (newRestSeconds <= 0 && intervalID.current !== null) {
                    // use setTimeout to ensure this runs after the state update
                    setTimeout(() => {
                        handleRestIntervalEnding()
                    }, 0)
                }

                return Math.max(0, newRestSeconds)
            })
        }, 1000)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localTimerState, localWorkTimeString, localRestTimeString, clearCurrentInterval])

    const handleRestIntervalEnding = useCallback(async (fromSkip: boolean = false) => {
        clearCurrentInterval()

        // local timer state is possibly stale, get state from controller
        const storedTimerState = await timetideController.getTimerState()
        setWorkSecondsLeft(convertTimeStringToSeconds(storedTimerState.lastWorkTimeString))
        setRestSecondsLeft(convertTimeStringToSeconds(storedTimerState.lastRestTimeString))

        const loopToWorkTimer = await timetideController.handleRestEndingFromUI()
        if (loopToWorkTimer) {
            setTimeout(() => startWorkInterval(fromSkip), 0)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearCurrentInterval, startWorkInterval])

    const reset = useCallback(async () => {
        clearCurrentInterval()
        timetideController.resetSessionFrom(
            localTimerState,
            true,
            workSecondsLeft,
            restSecondsLeft
        )

        const { lastWorkTimeString, lastRestTimeString } = await timetideController.getTimerState()
        setLocalWorkTimeString(lastWorkTimeString)
        setLocalRestTimeString(lastRestTimeString)
        setWorkSecondsLeft(convertTimeStringToSeconds(lastWorkTimeString))
        setRestSecondsLeft(convertTimeStringToSeconds(lastRestTimeString))
    }, [clearCurrentInterval, localTimerState, workSecondsLeft, restSecondsLeft])

    const togglePlayPause = useCallback(() => {
        switch (localTimerState.status) {
            case "idle": {
                const validatedWorkTimeString = validateTimeString(localWorkTimeString)
                const validatedRestTimeString = validateTimeString(localRestTimeString)

                setWorkSecondsLeft(convertTimeStringToSeconds(validatedWorkTimeString))
                setRestSecondsLeft(convertTimeStringToSeconds(validatedRestTimeString))
                setLocalWorkTimeString(validatedWorkTimeString)
                setLocalRestTimeString(validatedRestTimeString)

                setTimeout(() => startWorkInterval(true), 0)
                break
            }
            case "running": {
                clearCurrentInterval()

                const secondsRemaining = localTimerState.mode === "work"
                    ? workSecondsLeft
                    : restSecondsLeft

                timetideController.pauseSessionWith(localTimerState, secondsRemaining)
                break
            }
            case "paused":
                if (localTimerState.mode === "work") startWorkInterval(true)
                else startRestInterval(true)
        }
    }, [
        localTimerState,
        localWorkTimeString,
        localRestTimeString,
        workSecondsLeft,
        restSecondsLeft,
        startWorkInterval,
        startRestInterval,
        clearCurrentInterval
    ])

    const skip = useCallback(() => {
        
        const validatedWorkTimeString = validateTimeString(localWorkTimeString)
        const validatedRestTimeString = validateTimeString(localRestTimeString)
        const fullWorkSeconds = convertTimeStringToSeconds(validatedWorkTimeString)
        const fullRestSeconds = convertTimeStringToSeconds(validatedRestTimeString)

        let remainingWorkSeconds = fullWorkSeconds
        let remainingRestSeconds = fullRestSeconds

        switch (localTimerState.mode) {
            case "work":
                remainingWorkSeconds = getSecondsRemaining(
                    "work",
                    localTimerState,
                    workSecondsLeft,
                    restSecondsLeft
                )
                break
            case "rest":
                remainingRestSeconds = getSecondsRemaining(
                    "rest",
                    localTimerState,
                    workSecondsLeft,
                    restSecondsLeft
                )
                break      
        }

        setWorkSecondsLeft(fullWorkSeconds)
        setRestSecondsLeft(fullRestSeconds)
        setLocalWorkTimeString(validatedWorkTimeString)
        setLocalRestTimeString(validatedRestTimeString)

        timetideController.skipFrom({
            ...localTimerState,
            lastWorkTimeString: validatedWorkTimeString,
            lastRestTimeString: validatedRestTimeString
        }, remainingWorkSeconds, remainingRestSeconds)

        switch (localTimerState.mode) {
            case "idle":
            case "work":
                setTimeout(() => handleWorkIntervalEnding(), 0)
                break
            case "rest":
                setTimeout(() => handleRestIntervalEnding(), 0)
                break
        }
    }, [localTimerState, localWorkTimeString, localRestTimeString, handleWorkIntervalEnding, handleRestIntervalEnding])

    const updateWorkTime = useCallback((newWorkTimeString: string) => {
        if (loading) return
        setLocalWorkTimeString(newWorkTimeString)
        setWorkSecondsLeft(convertTimeStringToSeconds(newWorkTimeString))
    }, [loading])

    const updateRestTime = useCallback((newRestTimeString: string) => {
        if (loading) return
        setLocalRestTimeString(newRestTimeString)
        setRestSecondsLeft(convertTimeStringToSeconds(newRestTimeString))
    }, [loading])

    useEffect(() => {
        const restoreUI = async () => {
            const {
                restoredTimerState,
                lastWorkTimeString,
                lastRestTimeString,
                workSecondsLeft,
                restSecondsLeft,
                workEndMS,
                restEndMS,
                shouldStartInterval
            } = await timetideController.restore()

            setLocalTimerState(restoredTimerState)
            setLocalWorkTimeString(lastWorkTimeString)
            setLocalRestTimeString(lastRestTimeString)
            setWorkSecondsLeft(workSecondsLeft)
            setRestSecondsLeft(restSecondsLeft)
            setLoading(false)

            const now = Date.now()

            if (shouldStartInterval === "work" && workEndMS) {
                const remainingMS = workEndMS - now
                const syncOffset = remainingMS % 1000
                if (remainingMS > 300) {
                    setTimeout(() => startWorkInterval(false), syncOffset)
                } else {
                    setTimeout(() => handleWorkIntervalEnding(), syncOffset)
                }
            } else if (shouldStartInterval === "rest" && restEndMS) {
                const remainingMS = restEndMS - now
                const syncOffset = remainingMS % 1000
                if (remainingMS > 300) {
                    setTimeout(() => startRestInterval(false), syncOffset)
                } else {
                    setTimeout(() => handleRestIntervalEnding(), syncOffset)
                }
            }
        }

        restoreUI()
        const unsubscribe = timetideController.subscribeTo<TimerState>("timerState", setLocalTimerState)

        return () => {
            clearCurrentInterval()
            unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return {
        loading,
        localTimerState,
        localWorkTimeString,
        localRestTimeString,
        workSecondsLeft,
        restSecondsLeft,
        updateWorkTime,
        updateRestTime,
        reset,
        togglePlayPause,
        skip
    }
}
