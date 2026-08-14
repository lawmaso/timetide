import type {
    NotificationType
} from "@/core/types/notificationTypes"
import type { INotificationsService } from "@/services/interfaces/INotificationsService"

export default class WebNotificationsService implements INotificationsService {
    async create(
        _notificationID: NotificationType,
        _iconUrl: string,
        title: string,
        message: string
    ): Promise<void> {
        window.alert(`${title}. ${message}`)
    }

    async clear(_notificationID: string): Promise<void> {
        return Promise.resolve()
    }
}