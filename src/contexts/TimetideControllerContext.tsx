import type TimetideController from "@/controllers/TimetideController"
import {
    createContext,
    useContext,
    type ReactNode
} from "react"

interface ControllerContextValue {
    controller: TimetideController
}

const ControllerContext = createContext<ControllerContextValue | null>(null)

interface ControllerProviderProps {
    controller: TimetideController
    children: ReactNode
}

export function ControllerProvider({ controller, children }: ControllerProviderProps) {
    return (
        <ControllerContext.Provider value={{ controller }}>
            {children}
        </ControllerContext.Provider>
    )
}

export function useController() {
    const context = useContext(ControllerContext)

    if (!context) {
        throw new Error("useController must be used within ControllerProvider")
    }

    return context
}
