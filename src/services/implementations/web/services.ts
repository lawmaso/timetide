import WebAlarmsService from "./WebAlarmsService"
import WebAudioService from "./WebAudioService"
import WebBadgeService from "./WebBadgeService"
import WebI18nService from "./WebI18nService"
import WebNotificationsService from "./WebNotificationsService"
import WebRuntimeService from "./WebRuntimeService"
import WebStatService from "./WebStatService"
import WebStorageService from "./WebStorageService"

let sharedRuntimeService: WebRuntimeService | null = null
let sharedStorageService: WebStorageService | null = null

function getRuntimeService() {
    if (!sharedRuntimeService) sharedRuntimeService = new WebRuntimeService()
    return sharedRuntimeService
}

function getStorageService() {
    if (!sharedStorageService) sharedStorageService = new WebStorageService()
    return sharedStorageService
}

export const createAlarmsService = () => new WebAlarmsService()
export const createAudioService = () => new WebAudioService(getRuntimeService())
export const createBadgeService = () => new WebBadgeService()
export const createI18nService = async () => {
    const webI18nService = new WebI18nService()
    await webI18nService.init()
    return webI18nService
}
export const createNotificationService = () => new WebNotificationsService()
export const createRuntimeService = () => getRuntimeService()
export const createStatService = () => new WebStatService(getStorageService())
export const createStorageService = () => getStorageService()
