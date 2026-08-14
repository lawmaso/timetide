import { vi } from "vitest"

export function createMockServices() {
    return {
        // mock the alarms service
        alarmsService: {
            createAlarm: vi.fn(),
            clearAlarm: vi.fn(),
            clearAllAlarms: vi.fn(),
            onAlarm: vi.fn(),
            getAlarm: vi.fn(),
            getAllAlarms: vi.fn()
        },

        // mock the audio service
        audioService: {
            playSound: vi.fn()
        },

        // mock the badge service
        badgeService: {
            setBadgeText: vi.fn(),
            clearBadgeText: vi.fn()
        },

        // mock the i18n service
        i18nService: {
            t: vi.fn((k: string) => k),
            getLocale: vi.fn(),
            setLocale: vi.fn()
        },

        // mock the notifications service
        notificationsService: {
            create: vi.fn(),
            clear: vi.fn()
        },

        // mock the runtime service
        runtimeService: {
            getUrl: vi.fn((path: string) => `mocks:///${path}`),
            onInstalled: vi.fn(),
            onMessage: vi.fn(),
            sendMessage: vi.fn()
        },

        // mock stat service
        statService: {
            incrementStats: vi.fn()
        },

        // mock the storage service
        storageService: {
            get: vi.fn(),
            set: vi.fn(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn()
        }
    }
}
