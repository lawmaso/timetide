import { expect } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import "@testing-library/jest-dom"

// extend the vitest expect function
expect.extend(matchers)

// suppress jsdom css parsing errors from chakra ui
const originalStderrWrite = process.stderr.write.bind(process.stderr) as typeof process.stderr.write
process.stderr.write = (chunk: any, ...args: any[]) => {
    if (typeof chunk === "string" && chunk.includes("Could not parse CSS stylesheet")) {
        return true
    }
    return originalStderrWrite(chunk, ...args)
}
