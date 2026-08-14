import type { InstalledDetails } from "@/core/types/runtimeTypes"
import type { IRuntimeService } from "@/services/interfaces/IRuntimeService"

export default class WebRuntimeService implements IRuntimeService {
    onInstalled(_callback: (details: InstalledDetails) => void): void {}

    onMessage(_callback: (message: any) => void): void {}

    sendMessage(message: any): Promise<any> {
        return Promise.resolve(message)
    }

    getUrl(path: string): string {
        return path
    }
}