import { vi } from "vitest"

const browser = {
    storage: {
        local: {
            get: vi.fn(),
            set: vi.fn(),
            remove: vi.fn()
        }
    },
    alarms: {
        create: vi.fn(),
        clear: vi.fn()
    },
    runtime: {
        sendMessage: vi.fn(),
        onMessage: {
            addListener: vi.fn()
        }
    },
    notifications: {
        create: vi.fn()
    }
}

export default browser