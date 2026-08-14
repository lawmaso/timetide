import type { StorageArea } from "@/core/types/storageTypes"
import type {
    IStorageService,
    StorageChangeCallback
} from "@/services/interfaces/IStorageService"

export default class WebStorageService implements IStorageService {
    private listeners = new Map<string, Set<StorageChangeCallback<any>>>()

    private getStorageArea(area: StorageArea = "local") {
        return area === "sync"
            ? localStorage
            : localStorage
    }

    async get<T>(key: string, area: StorageArea = "local"): Promise<T | undefined> {
        const rawData = this.getStorageArea(area).getItem(key)
        try {
            return rawData ? JSON.parse(rawData) as T : undefined
        } catch {
            return undefined
        }
    }

    async set<T>(key: string, value: T, area: StorageArea = "local") {
        const json = JSON.stringify(value)
        this.getStorageArea(area).setItem(key, json)

        // notify listeners
        if (this.listeners.has(key)) {
            for (const callback of this.listeners.get(key)!) {
                callback(value)
            }
        }
    }

    subscribe<T>(key: string, callback: (value: T) => void): void {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set())
        }
        this.listeners.get(key)!.add(callback)
    }

    unsubscribe<T>(key: string, callback: (value: T) => void): void {
        const keyListeners = this.listeners.get(key)
        if (keyListeners) {
            keyListeners.delete(callback)
            if (keyListeners.size === 0) {
                this.listeners.delete(key)
            }
        }
    }
}