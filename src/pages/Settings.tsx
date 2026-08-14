import React, { useEffect, useState } from "react"

import {
    Flex,
    HStack,
    Separator,
    Text
} from "@chakra-ui/react"
import {
    LuBell,
    LuBellOff,
    LuMoon,
    LuMoonStar,
    LuRefreshCw,
    LuRefreshCwOff,
    LuVolume2,
    LuVolumeOff
} from "react-icons/lu"

import { Switch } from "@/components/ui/switch"
import { TimetideIcon } from "@/components/ui/icon"
import { useColorMode, type ColorMode } from "@/components/ui/color-mode"

import { createTimetideController } from "@/factories/controllerFactory"
import { createI18nService } from "@/factories/serviceFactory"

const timetideController = createTimetideController()
const i18nService = createI18nService()

type SettingOption = {
    id: string
    label: string
    icon: React.ReactElement
    control?: React.ReactElement
}

export default function Settings() {
    const { colorMode, toggleColorMode } = useColorMode()

    const [localTheme, setLocalTheme] = useState<ColorMode>(colorMode)
    const [soundsEnabled, setSoundsEnabled] = useState(false)
    const [notificationsEnabled, setNotificationsEnabled] = useState(false)
    const [loopSessions, setLoopSessions] = useState(false)

    useEffect(() => {
        const loadUserSettings = async () => {
            const storedSettings = await timetideController.getUserSettings()
            setSoundsEnabled(storedSettings.soundsEnabled)
            setNotificationsEnabled(storedSettings.notificationsEnabled)
            setLoopSessions(storedSettings.loopSessions)
        }

        loadUserSettings()
    }, [])

    const settings: SettingOption[] = [
        {
            id: "sounds",
            label: i18nService.t("settingSounds"),
            icon: soundsEnabled ? <LuVolume2 /> : <LuVolumeOff />,
            control: (
                <Switch
                    checked={soundsEnabled}
                    onCheckedChange={async (e) => {
                        setSoundsEnabled(e.checked)
                        await timetideController.updateUserSettings("soundsEnabled", e.checked)
                    }}
                    colorPalette="timetide"
                />
            )
        },
        {
            id: "notifications",
            label: i18nService.t("settingPopupNotifications"),
            icon: notificationsEnabled ? <LuBell /> : <LuBellOff />,
            control: (
                <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={async (e) => {
                        setNotificationsEnabled(e.checked)
                        await timetideController.updateUserSettings("notificationsEnabled", e.checked)
                    }}
                    colorPalette="timetide"
                />
            )
        },
        {
                id: "loopSessions",
                label: i18nService.t("settingLoopSessions"),
                icon: loopSessions ? <LuRefreshCw /> : <LuRefreshCwOff />,
                control: (
                    <Switch
                    checked={loopSessions}
                    onCheckedChange={async (e) => {
                        setLoopSessions(e.checked)
                        await timetideController.updateUserSettings("loopSessions", e.checked)
                    }}
                    colorPalette="timetide"
                />
            )
        },
        {
            id: "darkTheme",
            label: i18nService.t("settingDarkTheme"),
            icon: localTheme === "dark" ? <LuMoonStar /> : <LuMoon />,
            control: (
                <Switch
                    checked={localTheme === "dark"}
                    onCheckedChange={(e) => {
                        setLocalTheme(e.checked ? "dark" : "light")

                        // fixes switch toggle instantaneous change
                        setTimeout(() => {
                            toggleColorMode()
                        }, 88)
                    }}
                    colorPalette="timetide"
                />
            )
        }
    ]

    return (
        <Flex direction="column" gap={2} pl="auto">
            {settings.map(({ id, label, icon, control }, idx) => (
                <React.Fragment key={id}>
                    <HStack justify="space-between" width="100%">
                    <HStack>
                        <TimetideIcon>{icon}</TimetideIcon>
                        <Text fontSize="lg">{label}</Text>
                    </HStack>
                    {control}
                    </HStack>
                    {idx < settings.length - 1 && <Separator />}
                </React.Fragment>
            ))}
        </Flex>
    )
}
