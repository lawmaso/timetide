// service interfaces
import type { IAlarmsService } from "@/services/interfaces/IAlarmsService"
import type { IAudioService } from "@/services/interfaces/IAudioService"
import type { IBadgeService } from "@/services/interfaces/IBadgeService"
import type { II18nService } from "@/services/interfaces/II18nService"
import type { INotificationsService } from "@/services/interfaces/INotificationsService"
import type { IRuntimeService } from "@/services/interfaces/IRuntimeService"
import type { IStatService } from "@/services/interfaces/IStatsService"
import type { IStorageService } from "@/services/interfaces/IStorageService"

// unified service implementations for extensions
import WebExtensionAlarmsService from "@/services/implementations/webextension/WebExtensionAlarmsService"
import WebExtensionAudioService from "@/services/implementations/webextension/WebExtensionAudioService"
import WebExtensionBadgeService from "@/services/implementations/webextension/WebExtensionBadgeService"
import WebExtensionI18nService from "@/services/implementations/webextension/WebExtensionI18nService"
import WebExtensionNotificationsService from "@/services/implementations/webextension/WebExtensionNotificationsService"
import WebExtensionRuntimeService from "@/services/implementations/webextension/WebExtensionRuntimeService"
import WebExtensionStorageService from "@/services/implementations/webextension/WebExtensionStorageService"
import WebExtensionStatService from "@/services/implementations/webextension/WebExtensionStatsService"

const sharedWebExtensionRuntimeService = new WebExtensionRuntimeService()
const sharedWebExtensionStorageService = new WebExtensionStorageService()
export const createAlarmsService = (): IAlarmsService => new WebExtensionAlarmsService()
export const createAudioService = (): IAudioService => new WebExtensionAudioService(sharedWebExtensionRuntimeService)
export const createBadgeService = (): IBadgeService => new WebExtensionBadgeService()
export const createI18nService = (): II18nService => new WebExtensionI18nService()
export const createNotificationService = (): INotificationsService => new WebExtensionNotificationsService()
export const createRuntimeService = (): IRuntimeService => sharedWebExtensionRuntimeService
export const createStatService = (): IStatService => new WebExtensionStatService(sharedWebExtensionStorageService)
export const createStorageService = (): IStorageService => sharedWebExtensionStorageService

// service implementations for when running dev server (for testing)
// import WebRuntimeService from "@/services/implementations/web/WebRuntimeService"
// import WebAlarmsService from "@/services/implementations/web/WebAlarmsService"
// import WebAudioService from "@/services/implementations/web/WebAudioService"
// import WebBadgeService from "@/services/implementations/web/WebBadgeService"
// import WebI18nService from "@/services/implementations/web/WebI18nService"
// import WebNotificationsService from "@/services/implementations/web/WebNotificationsService"
// import WebStorageService from "@/services/implementations/web/WebStorageService"
// const sharedWebRuntimeService = new WebRuntimeService()

// export const createAlarmsService = (): IAlarmsService => new WebAlarmsService()
// export const createAudioService = (): IAudioService => new WebAudioService(sharedWebRuntimeService)
// export const createBadgeService = (): IBadgeService => new WebBadgeService()
// export const createI18nService = (): II18nService => new WebI18nService()
// export const createNotificationService = (): INotificationsService => new WebNotificationsService()
// export const createRuntimeService = (): IRuntimeService => sharedWebRuntimeService
// export const createStorageService = (): IStorageService => new WebStorageService()
