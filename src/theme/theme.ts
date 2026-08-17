import { createSystem, defaultConfig } from "@chakra-ui/react"

export const system = createSystem(defaultConfig, {
    globalCss: {
        "html, body": {
            "minWidth": "360px",
            "minHeight": "max-content",
            "width": "360px",
            "overflowX": "hidden",
            "boxSizing": "border-box",
        },
    },
    theme: {
        tokens: {
            colors: {
                timetide: {
                    100: { value: "#CCF7F6"},
                    200: { value: "#99EFEE" },
                    300: { value: "#66E6E6" },
                    400: { value: "#00CECB" },
                    // 400: { value: "#6CCDA6" },
                },
            },
        },
        semanticTokens: {
            colors: {
                timetide: {
                    solid: { value: "colors.timetide.400" },
                    contrast: { value: "white" },
                    // fg: { value: "colors.timetide.400" },
                    // muted: { value: "colors.timetide.400" },
                    // subtle: { value: "colors.timetide.400" },
                    // emphasized: { value: "colors.timetide.400" },
                    // focusRing: { value: "colors.timetide.400" },
                },
            },
        },
    },
})
