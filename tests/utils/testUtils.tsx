import { render } from "@testing-library/react"
import { ChakraProvider } from "@chakra-ui/react"
import { system } from "@/theme/theme"
import type { ReactNode } from "react"

export function renderWithChakra(ui: ReactNode) {
    return render(
        <ChakraProvider value={system}>
            {ui}
        </ChakraProvider>
    )
}

