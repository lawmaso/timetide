import WebAlarmsService from "./WebAlarmsService"
import WebAudioService from "./WebAudioService"
import WebBadgeService from "./WebBadgeService"
import WebI18nService from "./WebI18nService"
import WebNotificationsService from "./WebNotificationsService"
import WebRuntimeService from "./WebRuntimeService"
import WebStatService from "./WebStatService"
import WebStorageService from "./WebStorageService"

const sharedRuntimeService = new WebRuntimeService()
const sharedStorageService = new WebStorageService()

export const createAlarmsService = () => new WebAlarmsService()
export const createAudioService = () => new WebAudioService(sharedRuntimeService)
export const createBadgeService = () => new WebBadgeService()
export const createI18nService = async () => {
    const webI18nService = new WebI18nService()
    await webI18nService.init()
    return webI18nService
}
export const createNotificationService = () => new WebNotificationsService()
export const createRuntimeService = () => sharedRuntimeService
export const createStatService = () => new WebStatService(sharedStorageService)
export const createStorageService = () => sharedStorageService
