import { renderWithChakra } from "../../utils/testUtils"
import { screen, fireEvent } from "@testing-library/react"
import TimeInput from "@/components/ui/TimeInput"

describe("TimeInput", () => {
    it("renders with initial value", () => {
        renderWithChakra(
            <TimeInput
                loading={false}
                invalid={false}
                title="test time"
                time="2500"
                progress={50}
                disabled={false}
            />
        )

        expect(screen.getByText("test time")).toBeInTheDocument()
        expect(screen.getByDisplayValue("00:25:00")).toBeInTheDocument()
        expect(screen.getByText("50.00%")).toBeInTheDocument()
    })

    it("displays loading skeletons when loading is true", () => {
        renderWithChakra(
            <TimeInput
                loading={true}
                invalid={false}
                title="loading test"
                time=""
                progress={0}
                disabled={false}
            />
        )

        // should still render the heading and progress skeletons
        expect(screen.getByText("loading test")).toBeInTheDocument()
    })

    it("calls setTime when typing digits", () => {
        const setTime = vi.fn()

        renderWithChakra(
            <TimeInput
                loading={false}
                invalid={false}
                title="editable time"
                time="12"
                setTime={setTime}
                progress={0}
                disabled={false}
            />
        )

        const input = screen.getByRole("textbox")
        fireEvent.keyDown(input, { key: "8" })
        expect(setTime).toHaveBeenCalled()
    })

    it("handles backspace presses", () => {
        const setTime = vi.fn()

        renderWithChakra(
            <TimeInput
                loading={false}
                invalid={false}
                title="Backspace Time"
                time="1234"
                setTime={setTime}
                progress={0}
                disabled={false}
            />
        )

        const input = screen.getByRole("textbox")
        fireEvent.keyDown(input, { key: "Backspace" })
        expect(setTime).toHaveBeenCalled()
    })

    it("does not call setTime when disabled", () => {
        const setTime = vi.fn()

        renderWithChakra(
            <TimeInput
                loading={false}
                invalid={false}
                title="Disabled Time"
                time="12"
                setTime={setTime}
                progress={0}
                disabled={true}
            />
        )

        const input = screen.getByRole("textbox")
        fireEvent.keyDown(input, { key: "3" })
        expect(setTime).not.toHaveBeenCalled()
    })

    it("shows error border when invalid is true", () => {
        renderWithChakra(
            <TimeInput
                loading={false}
                invalid={true}
                title="Invalid Input"
                time="12"
                progress={0}
                disabled={false}
            />
        )

        const input = screen.getByRole("textbox")
        expect(input).toHaveAttribute("name", "Invalid Input")
    })
})