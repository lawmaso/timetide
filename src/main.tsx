import { Provider } from "./components/ui/provider.tsx"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { createI18nService } from "./factories/serviceFactory.ts"
import { createTimetideController } from "./factories/controllerFactory.ts"
import { I18nProvider } from "./contexts/I18nContext.tsx"
import { ControllerProvider } from "./contexts/TimetideControllerContext.tsx"

// To prevent top-level await error, wrap in IIFE
async function bootstrap() {
    const i18nService = await createI18nService()
    const timetideController = await createTimetideController(i18nService)

    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            <Provider>
                <I18nProvider i18nService={i18nService}>
                    <ControllerProvider controller={timetideController}>
                        <App />
                    </ControllerProvider>
                </I18nProvider>
            </Provider>
        </StrictMode>,
    )       
}

bootstrap()
