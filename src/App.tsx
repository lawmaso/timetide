import React, { useEffect, useRef } from "react"
import { Flex, HStack, Tabs } from "@chakra-ui/react"
import { LuChartLine, LuHouse, LuSettings } from "react-icons/lu"
import { TimetideIcon } from "./components/ui/icon"
import { TimetideHeading } from "./components/ui/TimetideHeading"

export type TabName = "home" | "stats" | "settings"
const Home = React.lazy(() => import("./pages/Home"))
const Stats = React.lazy(() => import("./pages/Stats"))
const Settings = React.lazy(() => import("./pages/Settings"))

export interface TabContentProps {
    value: TabName,
    icon: React.ReactElement
    content: () => React.ReactElement
}

export default function App() {
    const rootRef = useRef<HTMLDivElement>(null)
    const allContent: TabContentProps[] = [
        {
            value: "home",
            icon: <LuHouse />,
            content: () => <Home />
        },
        {
            value: "stats",
            icon: <LuChartLine />,
            content: () => <Stats />
        },
        {
            value: "settings",
            icon: <LuSettings />,
            content: () => <Settings />
        },
    ]

    // handle chakra ui overriding custom tabindexing
    useEffect(() => {
        if (!rootRef.current) return

        const observer = new MutationObserver(() => {
            const contents = rootRef.current?.querySelectorAll<HTMLElement>(".chakra-tabs__content")
            contents?.forEach(el => {
                // override any tabindex changes
                if (el.getAttribute("tabindex") === "0") {
                    el.setAttribute("tabindex", "-1")
                }
            })
        })

        observer.observe(rootRef.current, {
            attributes: true,
            subtree: true,
            attributeFilter: ["tabindex"]
        })

        // initial run in case chakra ui already sets tabindex=0 before observer attached
        const contents = rootRef.current.querySelectorAll<HTMLElement>(".chakra-tabs__content")
        contents.forEach(el => el.setAttribute("tabindex", "-1"))

        return () => observer.disconnect()
    }, [])

    return (
        <Flex
            ref={rootRef}
            flexDir="column"
            p="4"
            gapY="2"
            maxWidth="360px"
            mx="auto"
        >
            <Tabs.Root
                defaultValue="home"
                variant="outline"
                size="sm"
            >
                <Tabs.List justifyContent="space-between">
                    <TimetideHeading />
                    <HStack gap="-1">
                        {allContent.map(({ value, icon }) => (
                            <Tabs.Trigger value={value} key={value}>
                                <TimetideIcon color="timetide.400">
                                    {icon}
                                </TimetideIcon>
                            </Tabs.Trigger>
                        ))}
                    </HStack>
                </Tabs.List>
                {allContent.map(({ value, content }) => (
                    <Tabs.Content
                        value={value}
                        key={value}
                    >
                        {content()}
                    </Tabs.Content>
                ))}
            </Tabs.Root>
        </Flex>
    )
}
