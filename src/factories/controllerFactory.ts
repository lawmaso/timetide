
import TimetideController from "@/controllers/TimetideController"
import {
    createAlarmsService,
    createAudioService,
    createBadgeService,
    createI18nService,
    createNotificationService,
    createRuntimeService,
    createStatService,
    createStorageService
} from "./serviceFactory"

export const createTimetideController = (): TimetideController => {
    return new TimetideController(
        createAlarmsService(),
        createAudioService(),
        createBadgeService(),
        createI18nService(),
        createNotificationService(),
        createRuntimeService(),
        createStatService(),
        createStorageService()
    )
}
