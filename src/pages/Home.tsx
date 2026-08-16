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

import {
    calculateProgress,
    convertSecondsToTimeString,
    timeStringInvalid
} from "@/utils/utils"

import { useTimetide } from "@/hooks/useTimetide"
import { useI18n } from "@/contexts/I18nContext"

export default function Home() {
    const {
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
    } = useTimetide()
    const { t } = useI18n()

    if (loading) return

    const inputsDisabled = localTimerState?.mode !== "idle"
    const controlsDisabled = timeStringInvalid(localWorkTimeString) || timeStringInvalid(localRestTimeString)

    return (
        <VStack>
            <Flex columnGap="2">
                <TimeInput
                    loading={loading}
                    invalid={timeStringInvalid(localWorkTimeString)}
                    title={t("titleWorkTimeInput")}
                    time={localTimerState.mode === "idle"
                        ? localWorkTimeString
                        : localTimerState.mode !== "work"
                            ? "0"
                            : convertSecondsToTimeString(workSecondsLeft)
                    }
                    setTime={updateWorkTime}
                    progress={localTimerState.mode === "idle"
                        ? 100
                        : localTimerState.mode === "work"
                            ? calculateProgress(workSecondsLeft, localWorkTimeString)
                            : 0
                    }
                    disabled={inputsDisabled}
                />
                <TimeInput
                    loading={loading}
                    invalid={timeStringInvalid(localRestTimeString)}
                    title={t("titleRestTimeInput")}
                    time={localTimerState.mode === "idle" || localTimerState.mode === "work"
                        ? localRestTimeString
                        : convertSecondsToTimeString(restSecondsLeft)
                    }
                    setTime={updateRestTime}
                    progress={localTimerState.mode === "idle" || localTimerState.mode === "work"
                        ? 100
                        : calculateProgress(restSecondsLeft, localRestTimeString)
                    }
                    disabled={inputsDisabled}
                />
            </Flex>
            <Flex justifyContent="space-around">
                <HStack>
                    <Tooltip
                        content={t("tooltipReset")}
                        positioning={{ placement: "left" }}
                    >
                        <TimetideIconButton size="md" variant="ghost" onClick={reset}>
                            <PiArrowCounterClockwiseBold />
                        </TimetideIconButton>
                    </Tooltip>
                    <Tooltip
                        content={localTimerState.mode === "idle"
                            ? t("tooltipStartWork")
                            : localTimerState.mode === "work"
                                ? localTimerState.status === "paused"
                                    ? t("tooltipResumeWork")
                                    : t("tooltipPauseWork")
                                : localTimerState.status === "paused"
                                    ? t("tooltipResumeRest")
                                    : t("tooltipPauseRest")
                        }
                        positioning={{ placement: "top" }}
                    >
                        <TimetideIconButton
                            size="md"
                            variant="ghost"
                            disabled={controlsDisabled}
                            onClick={togglePlayPause}
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
                            ? t("tooltipSkipRest")
                            : t("tooltipSkipWork")
                        }
                        positioning={{ placement: "right" }}
                    >
                        <TimetideIconButton
                            size="md"
                            variant="ghost"
                            onClick={skip}
                            disabled={controlsDisabled}
                        >
                            <PiArrowRightBold />
                        </TimetideIconButton>
                    </Tooltip>
                </HStack>
            </Flex>
        </VStack>
    )
}
