import React, { useEffect, useState } from "react"

import {
    createListCollection,
    Flex,
    HStack,
    Portal,
    Select,
    Separator,
    Text
} from "@chakra-ui/react"
import {
    LuBell,
    LuBellOff,
    LuLanguages,
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

import { useController } from "@/contexts/TimetideControllerContext"
import { useI18n } from "@/contexts/I18nContext"
import { AVAILABLE_LOCALES, LOCALE_DATA } from "@/utils/utils"
import { groupBy } from "es-toolkit"

type SettingOption = {
    id: string
    label: string
    icon: React.ReactElement
    control?: React.ReactElement
}

export default function Settings() {
    const { colorMode, toggleColorMode } = useColorMode()
    const { controller: timetideController } = useController()
    
    const { t, setLocale, locale } = useI18n()
    const locales = createListCollection({
        items: AVAILABLE_LOCALES.map((locale) => ({
            label: [LOCALE_DATA[locale].flag, t(`settingLanguage_${locale}`)].join(" "),
            value: locale
        }))
    })
    const continents = Object.entries(
        groupBy(locales.items, (locale) => LOCALE_DATA[locale.value].continent)
    )

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
            label: t("settingSounds"),
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
            label: t("settingPopupNotifications"),
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
                label: t("settingLoopSessions"),
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
            label: t("settingDarkTheme"),
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
        },
        {
            id: "language",
            label: t("settingLanguage"),
            icon: <LuLanguages />,
            control: (
                <Select.Root
                    collection={locales}
                    defaultValue={[locale]}
                    size="md"
                    width="200px"
                    maxW="200px"
                    onValueChange={async (e) => {
                        setLocale(e.value[0])
                        await timetideController.updateUserSettings("locale", e.value[0])
                    }}
                >
                    <Select.Control>
                        <Select.Trigger>
                        <Select.ValueText placeholder={locale} />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                        <Select.Indicator />
                        </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                        <Select.Positioner>
                        <Select.Content maxH="165px">
                            {continents.map(([continent, items]) => (
                                <Select.ItemGroup key={continent}>
                                    <Select.ItemGroupLabel>{continent}</Select.ItemGroupLabel>
                                    {items.map((locale) => (
                                        <Select.Item item={locale} key={locale.value}>
                                            {locale.label}
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </Select.ItemGroup>
                            ))}
                        </Select.Content>
                        </Select.Positioner>
                    </Portal>
                </Select.Root>
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
