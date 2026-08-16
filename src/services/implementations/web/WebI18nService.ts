import type { II18nService } from "@/services/interfaces/II18nService"
import { resolveLocale } from "@/utils/utils"

type MessagesJSON = {
    [key: string]: { message: string }
}

export default class WebI18nService implements II18nService {
    private locale: string = "ko"
    private messages: MessagesJSON = {}
    private listeners: Set<(locale: string) => void> = new Set()

    async init() {
        await this.setLocale(this.locale)
    }

    t(key: string): string {
        return this.messages[key]?.message
    }

    getLocale(): string {
        return this.locale
    }

    async setLocale(locale: string): Promise<void> {
        const resolved = resolveLocale(locale)
        try {
            const res = await fetch(`/_locales/${locale}/messages.json`)
            this.messages = await res.json()
            this.locale = resolved
            this.listeners.forEach((cb) => cb(resolved))  // notify subscribers
        } catch (err) {
            console.error(`Failed to load locale ${locale}`)
            this.messages = {}
        }
    }

    onLocaleChange(callback: (locale: string) => void): () => void {
        this.listeners.add(callback)
        return () => this.listeners.delete(callback)
    }
}
