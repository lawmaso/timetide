import type { IBadgeService } from "@/services/interfaces/IBadgeService"

export default class WebBadgeService implements IBadgeService {
    setBadgeText(text: string): Promise<void> {
        document.title = text
        return Promise.resolve()
    }

    clearBadgeText(): Promise<void> {
        return this.setBadgeText("Timetide")
    }
}