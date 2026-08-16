import type { II18nService } from "@/services/interfaces/II18nService"
import type { IRuntimeService } from "@/services/interfaces/IRuntimeService"
import type { IStorageService } from "@/services/interfaces/IStorageService"
import { resolveLocale } from "@/utils/utils"
// import Browser from "webextension-polyfill"; return Browser.i18n.getMessage(key)

type MessagesJSON = {
    [key: string]: { message: string }
}

const LOCALE_STORAGE_KEY = "locale"

export default class WebExtensionI18nService implements II18nService {
    private locale: string = "ko"
    private messages: MessagesJSON = {}
    private runtimeService: IRuntimeService
    private storageService: IStorageService
    private listeners: Set<(locale: string) => void> = new Set()

    constructor(
        runtimeService: IRuntimeService,
        storageSerive: IStorageService
    ) {
        this.runtimeService = runtimeService
        this.storageService = storageSerive
    }

    async init(fallbackLocale: string = "en") {
        const settings = await this.storageService.get<{ locale?: string }>("userSettings", "sync")
        const initialLocale = settings?.locale ?? resolveLocale(navigator.language || fallbackLocale)

        await this.loadMessages(initialLocale)
        this.storageService.subscribe<{ locale?: string }>("userSettings", this.handleUserSettingsChange)
    }

    private handleUserSettingsChange = async (newSettings: { locale?: string } | undefined): Promise<void> => {
        const newLocale = newSettings?.locale
        if (!newLocale || newLocale === this.locale) return
        await this.loadMessages(newLocale)
        this.listeners.forEach((cb) => cb(this.locale))
    }

    t(key: string): string {
        return this.messages[key]?.message
    }

    getLocale(): string {
        return this.locale
    }

    async setLocale(locale: string): Promise<void> {
        const resolved = resolveLocale(locale)
        await this.storageService.set(LOCALE_STORAGE_KEY, resolved)
    }

    onLocaleChange(callback: (locale: string) => void): () => void {
        this.listeners.add(callback)
        return () => this.listeners.delete(callback)
    }

    private async loadMessages(locale: string): Promise<void> {
        const resolved = resolveLocale(locale)
        try {
            const url = this.runtimeService.getUrl(`/_locales/${resolved}/messages.json`)
            const res = await fetch(url)

            this.messages = await res.json()
            this.locale = resolved
        } catch (err) {
            console.error(`Failed to set locale to ${resolved}`)
            this.messages = {}
        }
    }
}
