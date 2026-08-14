export interface BaseStats {
    totalWorkSeconds: number,
    totalRestSeconds: number,
    totalResets: number,
    totalWorkSkips: number,
    totalRestSkips: number
}

export interface DatedStats {
    [isoDate: string]: {
        workSeconds: number,
        restSeconds: number,
        workSkips: number,
        restSkips: number,
        resets: number
    }
}

export interface NewDatedStats {
    [isoDate: string]: {
        
    }
}

export type StatsUpdateType = "work" | "rest" | "reset" | "skipWork" | "skipRest"

export interface StatsUpdatePayload {
    type: StatsUpdateType,
    workIncrementSeconds?: number,
    restIncrementSeconds?: number
}
