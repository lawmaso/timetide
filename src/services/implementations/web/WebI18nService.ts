import type { II18nService } from "@/services/interfaces/II18nService"

type MessagesJSON = {
    [key: string]: { message: string }
}

export default class WebI18nService implements II18nService {
    private messages: MessagesJSON = {}
    private locale: string = "en"

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
        try {
            const res = await fetch(`/_locales/${locale}/messages.json`)
            this.messages = await res.json()
            this.locale = locale
        } catch (err) {
            console.error(`failed to load locale ${locale}`)
            this.messages = {}
        }
    }
}
