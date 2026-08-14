import WebExtensionAlarmsService from "./WebExtensionAlarmsService"
import WebExtensionAudioService from "./WebExtensionAudioService"
import WebExtensionBadgeService from "./WebExtensionBadgeService"
import WebExtensionI18nService from "./WebExtensionI18nService"
import WebExtensionNotificationsService from "./WebExtensionNotificationsService"
import WebExtensionRuntimeService from "./WebExtensionRuntimeService"
import WebExtensionStatService from "./WebExtensionStatsService"
import WebExtensionStorageService from "./WebExtensionStorageService"

const sharedRuntimeService = new WebExtensionRuntimeService()
const sharedStorageService = new WebExtensionStorageService()

export const createAlarmsService = () => new WebExtensionAlarmsService()
export const createAudioService = () => new WebExtensionAudioService(sharedRuntimeService)
export const createBadgeService = () => new WebExtensionBadgeService()
export const createI18nService = () => new WebExtensionI18nService()
export const createNotificationService = () => new WebExtensionNotificationsService()
export const createRuntimeService = () => sharedRuntimeService
export const createStatsSerfice = () => new WebExtensionStatService(sharedStorageService)
export const createStorageService = () => sharedStorageService
