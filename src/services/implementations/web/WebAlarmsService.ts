import type { AlarmType } from "@/core/types/alarmTypes"
import type { AlarmPayload, IAlarmsService } from "@/services/interfaces/IAlarmsService"

export default class WebAlarmsService implements IAlarmsService {
    createAlarm(_payload: AlarmPayload): Promise<void> {
        return Promise.resolve()
    }

    clearAlarm(_name: AlarmType): Promise<boolean> {
        return this.clearAllAlarms()
    }

    clearAllAlarms(): Promise<boolean> {
        return Promise.resolve(true)
    }

    onAlarm(_callback: (name: AlarmType) => void): void { }

    getAlarm(name: AlarmType): Promise<any> {
        return Promise.resolve(name)
    }

    getAllAlarms(): Promise<any[]> {
        return Promise.resolve([])
    }
}