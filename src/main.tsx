import { Provider } from "./components/ui/provider.tsx"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { createI18nService } from "./factories/serviceFactory.ts"

const i18nService = await createI18nService()

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Provider>
            <App i18nService={i18nService}/>
        </Provider>
    </StrictMode>,
)
