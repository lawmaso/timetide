import { useEffect, useRef, useState } from "react"
import {
    Flex,
    HStack,
    VStack
} from "@chakra-ui/react"

import {
    PiArrowCounterClockwiseBold,
    PiArrowRightBold,
    PiPauseBold,
    PiPlayBold
} from "react-icons/pi"
import TimeInput from "@/components/ui/TimeInput"
import { Tooltip } from "@/components/ui/tooltip"
import { TimetideIconButton } from "@/components/ui/icon"

import type { TimerState } from "@/core/types/timerTypes"
import { defaultTimerState } from "@/core/config/storageDefaults"

import {
    calculateProgress,
    convertSecondsToTimeString,
    convertTimeStringToSeconds,
    timeStringInvalid,
    validateTimeString
} from "@/utils/utils"

import { createI18nService } from "@/factories/serviceFactory"
import { createTimetideController } from "@/factories/controllerFactory"

const i18nService = createI18nService()
const timetideController = createTimetideController()

export default function Home() {
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
    const intervalID = useRef<NodeJS.Timeout | null>(null)

    const startWorkInterval = (invokeController: boolean = false) => {
        clearCurrentInterval()

        // invoke controller from paused and idle (as alarms have been destroyed in those states)
        if (invokeController) timetideController.startWorkFrom({
            ...localTimerState,
            // lastWorkTimeString: localWorkTimeString,
            // lastRestTimeString: localRestTimeString
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
    }

    const handleWorkIntervalEnding = (fromSkip: boolean = false) => {
        clearCurrentInterval()

        // never invoke the controller from work -> rest when not skipping 
        //     (service worker handles it as alarms still exist)
        // we only invoke the controller from skips as alarms are destroyed
        startRestInterval(fromSkip)
    }
        
    const startRestInterval = (invokeController: boolean = false) => {
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
    }

    const handleRestIntervalEnding = async (fromSkip: boolean = false) => {
        clearCurrentInterval()

        // local timer state is possibly stale, get state from controller
        const storedTimerState = await timetideController.getTimerState()
        setWorkSecondsLeft(convertTimeStringToSeconds(storedTimerState.lastWorkTimeString))
        setRestSecondsLeft(convertTimeStringToSeconds(storedTimerState.lastRestTimeString))

        const loopToWorkTimer = await timetideController.handleRestEndingFromUI()
        if (loopToWorkTimer) {
            setTimeout(() => startWorkInterval(fromSkip), 0)
        }
    }

    const clearCurrentInterval= () => {
        if (intervalID.current) {
            clearInterval(intervalID.current)
            intervalID.current = null
        }
    }

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
                    setTimeout(() => {
                        startWorkInterval(false)
                    }, syncOffset)
                } else {
                    setTimeout(() => handleWorkIntervalEnding(), syncOffset)
                }
            } else if (shouldStartInterval === "rest" && restEndMS) {
                const remainingMS = restEndMS - now
                const syncOffset = remainingMS % 1000
                if (remainingMS > 300) {
                    setTimeout(() => {
                        startRestInterval(false)
                    }, syncOffset)
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
    }, [])

    if (loading) return

    return (
        <VStack>
            <Flex columnGap="2">
                <TimeInput
                    loading={loading}
                    invalid={timeStringInvalid(localWorkTimeString)}
                    title={i18nService.t("titleWorkTimeInput")}
                    time={localTimerState.mode === "idle" 
                        ? localWorkTimeString
                        : localTimerState.mode !== "work"
                            ? "0"
                            : convertSecondsToTimeString(workSecondsLeft)
                    }
                    setTime={(newWorkTimeString) => {
                        if (loading) return
                        setLocalWorkTimeString(newWorkTimeString)
                        setWorkSecondsLeft(convertTimeStringToSeconds(newWorkTimeString))
                    }}
                    progress={localTimerState.mode === "idle"
                        ? 100
                        : localTimerState.mode === "work"
                            ? calculateProgress(workSecondsLeft, localWorkTimeString)
                            : 0
                    }
                    disabled={localTimerState?.mode !== "idle"}
                />
                <TimeInput
                    loading={loading}
                    invalid={timeStringInvalid(localRestTimeString)}
                    title={i18nService.t("titleRestTimeInput")}
                    time={localTimerState.mode === "idle" || localTimerState.mode === "work"
                        ? localRestTimeString
                        : convertSecondsToTimeString(restSecondsLeft)
                    }
                    setTime={(newRestTimeString) => {
                        if (loading) return
                        setLocalRestTimeString(newRestTimeString)
                        setRestSecondsLeft(convertTimeStringToSeconds(newRestTimeString))
                    }}
                    progress={localTimerState.mode === "idle" || localTimerState.mode === "work"
                        ? 100
                        : calculateProgress(restSecondsLeft, localRestTimeString)
                    }
                    disabled={localTimerState?.mode !== "idle"}
                />
            </Flex>
            <Flex justifyContent="space-around">
                <HStack>
                    <Tooltip
                        content={i18nService.t("tooltipReset")}
                        positioning={{ placement: "left" }}    
                    >
                        <TimetideIconButton
                            size="md"
                            variant="ghost"
                            onClick={async () => {
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
                            }}
                        >
                            <PiArrowCounterClockwiseBold />
                        </TimetideIconButton>
                    </Tooltip>
                    <Tooltip
                        content={localTimerState.mode === "idle"
                            ? i18nService.t("tooltipStartWork")
                            : localTimerState.mode === "work"
                                ? localTimerState.status === "paused"
                                    ? i18nService.t("tooltipResumeWork")
                                    : i18nService.t("tooltipPauseWork")
                                : localTimerState.status === "paused"
                                    ? i18nService.t("tooltipResumeRest")
                                    : i18nService.t("tooltipPauseRest")
                        }
                        positioning={{ placement: "top" }}
                    >
                        <TimetideIconButton
                            size="md"
                            variant="ghost"
                            disabled={timeStringInvalid(localWorkTimeString) || timeStringInvalid(localRestTimeString)}
                            onClick={() => {
                                switch (localTimerState.status) {
                                    case "idle":
                                        const validatedWorkTimeString = validateTimeString(localWorkTimeString)
                                        const validatedRestTimeString = validateTimeString(localRestTimeString)

                                        setWorkSecondsLeft(convertTimeStringToSeconds(validatedWorkTimeString))
                                        setRestSecondsLeft(convertTimeStringToSeconds(validatedRestTimeString))
                                        setLocalWorkTimeString(validatedWorkTimeString)
                                        setLocalRestTimeString(validatedRestTimeString)

                                        setTimeout(() => startWorkInterval(true), 0)
                                        break
                                    case "running":
                                        clearCurrentInterval()

                                        const secondsRemaining = localTimerState.mode === "work"
                                            ? workSecondsLeft
                                            : restSecondsLeft

                                        timetideController.pauseSessionWith(localTimerState, secondsRemaining)
                                        break
                                    case "paused":
                                        if (localTimerState.mode === "work") startWorkInterval(true)
                                        else startRestInterval(true)
                                }
                            }}
                            color="timetide.400"
                            pr="0.5"
                        >
                            { localTimerState.status === "idle" || localTimerState.status === "paused"
                                ? <PiPlayBold />
                                : <PiPauseBold />
                            }
                        </TimetideIconButton>

                    </Tooltip>
                    <Tooltip
                        content={localTimerState.mode === "rest"
                            ? i18nService.t("tooltipSkipRest")
                            : i18nService.t("tooltipSkipWork")
                        }
                        positioning={{ placement: "right" }}
                    >
                        <TimetideIconButton
                            size="md"
                            variant="ghost"
                            onClick={() => {
                                const validatedWorkTimeString = validateTimeString(localWorkTimeString)
                                const validatedRestTimeString = validateTimeString(localRestTimeString)
                                const validatedWorkSecondsLeft = convertTimeStringToSeconds(validatedWorkTimeString)
                                const validatedRestSecondsLeft = convertTimeStringToSeconds(validatedRestTimeString)

                                setWorkSecondsLeft(validatedWorkSecondsLeft)
                                setRestSecondsLeft(validatedRestSecondsLeft)
                                setLocalWorkTimeString(validatedWorkTimeString)
                                setLocalRestTimeString(validatedRestTimeString)

                                timetideController.skipFrom({
                                    ...localTimerState,
                                    lastWorkTimeString: validatedWorkTimeString,
                                    lastRestTimeString: validatedRestTimeString
                                }, validatedWorkSecondsLeft, validatedRestSecondsLeft)

                                switch (localTimerState.mode) {
                                    case "idle":
                                    case "work":
                                        setTimeout(() => handleWorkIntervalEnding(), 0)
                                        break
                                    case "rest":
                                        setTimeout(() => handleRestIntervalEnding(), 0)
                                        break
                                }
                            }}
                            disabled={timeStringInvalid(localWorkTimeString) || timeStringInvalid(localRestTimeString)}
                        >
                            <PiArrowRightBold />
                        </TimetideIconButton>
                    </Tooltip>
                </HStack>
            </Flex>
        </VStack>
    )
}
