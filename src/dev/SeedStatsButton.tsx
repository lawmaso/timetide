// src/dev/SeedStatsButton.tsx
import { createStatService } from "@/factories/serviceFactory"
import { seedStats } from "@/dev/seedStats"
import { TimetideIconButton } from "@/components/ui/icon"
import { TbSeeding } from "react-icons/tb"

const statService = createStatService()

export default function SeedStatsButton() {
    if (!import.meta.env.DEV) return null

    return (
        <TimetideIconButton
            size="md"
            variant="ghost"
            onClick={async () => {
                await seedStats(statService, { daysBack: 100, activeRatio: 0.2 })
            }}
            color="timetide.400"
        >
            <TbSeeding />
        </TimetideIconButton>
    )
}
