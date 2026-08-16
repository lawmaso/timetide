import WebExtensionAlarmsService from "./WebExtensionAlarmsService"
import WebExtensionAudioService from "./WebExtensionAudioService"
import WebExtensionBadgeService from "./WebExtensionBadgeService"
import WebExtensionI18nService from "./WebExtensionI18nService"
import WebExtensionNotificationsService from "./WebExtensionNotificationsService"
import WebExtensionRuntimeService from "./WebExtensionRuntimeService"
import WebExtensionStatService from "./WebExtensionStatsService"
import WebExtensionStorageService from "./WebExtensionStorageService"

let sharedRuntimeService: WebExtensionRuntimeService | null = null
let sharedStorageService: WebExtensionStorageService | null = null

function getRuntimeService() {
    if (!sharedRuntimeService) sharedRuntimeService = new WebExtensionRuntimeService()
    return sharedRuntimeService
}

function getStorageService() {
    if (!sharedStorageService) sharedStorageService = new WebExtensionStorageService()
    return sharedStorageService
}

export const createAlarmsService = () => new WebExtensionAlarmsService()
export const createAudioService = () => new WebExtensionAudioService(getRuntimeService())
export const createBadgeService = () => new WebExtensionBadgeService()
export const createI18nService = async () => {
    const i18nService = new WebExtensionI18nService(getRuntimeService(), getStorageService())
    await i18nService.init()
    return i18nService
}
export const createNotificationService = () => new WebExtensionNotificationsService()
export const createRuntimeService = () => getRuntimeService()
export const createStatService = () => new WebExtensionStatService(getStorageService())
export const createStorageService = () => getStorageService()
