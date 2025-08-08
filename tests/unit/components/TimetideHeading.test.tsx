import { renderWithChakra } from "../../utils/testUtils"
import { screen } from "@testing-library/react"
import { TimetideHeading } from "@/components/ui/TimetideHeading"

describe("TimetideHeading", () => {
    it("renders without crashing", () => {
        renderWithChakra(<TimetideHeading />)
    })

    it("renders the heading with correct text", () => {
        renderWithChakra(<TimetideHeading />)
        const heading = screen.getByRole("heading", { name: /timetide/i })
        expect(heading).toBeInTheDocument()
        expect(heading).toHaveTextContent("timetide")
    })
})