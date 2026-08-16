import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode
} from "react"

import type { II18nService } from "@/services/interfaces/II18nService"

interface I18nContextValue {
    i18nService: II18nService
    t: (key: string) => string
    setLocale: (local: string) => Promise<void>
    locale: string
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
    i18nService: II18nService
    children: ReactNode
}

export function I18nProvider({ i18nService, children }: I18nProviderProps) {
    const [locale, setLocaleState] = useState(i18nService.getLocale())

    useEffect(() => {
        // sync in case locale changed between initial useState and mount
        setLocaleState(i18nService.getLocale())

        const unsubscribe = i18nService.onLocaleChange((newLocale) => {
            setLocaleState(newLocale)
        })

        return unsubscribe
    }, [i18nService])

    const setLocale = useCallback(
        async (newLocale: string) => {
            await i18nService.setLocale(newLocale)  // triggers onLocaleChange -> setLocaleState
            setLocaleState(i18nService.getLocale())
        },
        [i18nService]
    )

    const t = useCallback((key: string) => i18nService.t(key), [i18nService, locale])

    return (
        <I18nContext.Provider value={{ i18nService, t, setLocale, locale }} >
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n() {
    const context = useContext(I18nContext)

    if (!context) {
        throw new Error("useI18n must be used within I18nProvider")
    }

    return context
}
