import { createTimetideController } from "@/factories/controllerFactory"
import { createI18nService } from "@/factories/serviceFactory"

(async () => {
    const i18nService = await createI18nService()
    const timetideController = await createTimetideController(i18nService)
    timetideController.registerListeners()
})()