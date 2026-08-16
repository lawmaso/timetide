
import TimetideController from "@/controllers/TimetideController"
import {
    createAlarmsService,
    createAudioService,
    createBadgeService,
    createNotificationService,
    createRuntimeService,
    createStatService,
    createStorageService
} from "./serviceFactory"
import type { II18nService } from "@/services/interfaces/II18nService"

export const createTimetideController = async (i18nService: II18nService): Promise<TimetideController> => {
    return new TimetideController(
        createAlarmsService(),
        createAudioService(),
        createBadgeService(),
        i18nService,  // pass shared instance so we have a source of truth on i18n listeners
        createNotificationService(),
        createRuntimeService(),
        createStatService(),
        createStorageService()
    )
}
