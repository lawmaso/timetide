import {
    createContext,
    useContext,
    useState,
    type ReactNode
} from "react"

import type { II18nService } from "@/services/interfaces/II18nService"

interface I18nContextValue {
    i18n: II18nService,
    locale: string,
    setLocale: (local: string) => Promise<void>
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
    service: II18nService
    children: ReactNode
}

export function I18nProvider({ service, children }: I18nProviderProps) {
    const [locale, setLocaleState] = useState(service.getLocale())

    const setLocale = async (locale: string) => {
        await service.setLocale(locale)
        setLocaleState(service.getLocale())
    }

    return (
        <I18nContext.Provider
            value={{
                i18n: service,
                locale,
                setLocale
            }}
        >
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