// interfaces
import type { IAlarmsService } from "@/services/interfaces/IAlarmsService"
import type { IAudioService } from "@/services/interfaces/IAudioService"
import type { IBadgeService } from "@/services/interfaces/IBadgeService"
import type { II18nService } from "@/services/interfaces/II18nService"
import type { INotificationsService } from "@/services/interfaces/INotificationsService"
import type { IRuntimeService } from "@/services/interfaces/IRuntimeService"
import type { IStatService } from "@/services/interfaces/IStatsService"
import type { IStorageService } from "@/services/interfaces/IStorageService"

// core types and configs
import { defaultTimerState, defaultUserSettings } from "@/core/config/storageDefaults"
import type { UserSettings } from "@/core/types/settingsTypes"
import type { TimerState } from "@/core/types/timerTypes"
import type { AlarmType } from "@/core/types/alarmTypes"
import { notificationI18nMap, type NotificationContext, type NotificationType } from "@/core/types/notificationTypes"

// utilities
import { convertTimeStringToSeconds } from "@/utils/utils"

export default class TimetideController {
    private alarmsService: IAlarmsService
    private audioService: IAudioService
    private badgeService: IBadgeService
    private i18nService: II18nService
    private notificationsService: INotificationsService
    private runtimeService: IRuntimeService
    private statService: IStatService
    private storageService: IStorageService
    
    constructor(
        alarmsService: IAlarmsService,
        audioService: IAudioService,
        badgeService: IBadgeService,
        i18nService: II18nService,
        notificationsService: INotificationsService,
        runtimeService: IRuntimeService,
        statService: IStatService,
        storageService: IStorageService
    ) {
        this.alarmsService = alarmsService
        this.audioService = audioService
        this.badgeService = badgeService
        this.i18nService = i18nService
        this.notificationsService = notificationsService
        this.runtimeService = runtimeService
        this.statService = statService
        this.storageService = storageService
    }

    // -----------------------------
    // === CORE TIMER OPERATIONS ===
    // -----------------------------

    /**
     * Starts a new work session from the current timer state.
     * Handles both new sessions and resuming from pauses.
     */
    startWorkFrom(currState: TimerState): void {
        const workDurationSeconds = this.getWorkDurationSeconds(currState)
        const expectedWorkEnd = Date.now() + workDurationSeconds * 1000

        this.updateTimerState(currState, {
            mode: "work",
            status: "running",
            lastWorkTimeString: currState.lastWorkTimeString,
            lastRestTimeString: currState.lastRestTimeString,
            expectedWorkTimerEnd: expectedWorkEnd,
            expectedRestTimerEnd: null,
            secondsRemainingAtPause: null
        })

        this.scheduleAlarm("work", expectedWorkEnd)
        this.setBadge("badgeWork")
    }

    /**
     * Starts a new rest session from the current timer state.
     * Handles both new rest timers and resuming from pause.
     */
    startRestFrom(currState: TimerState): void {
        const restDurationSeconds = this.getRestDurationSeconds(currState)
        const expectedRestEnd = Date.now() + restDurationSeconds * 1000

        this.updateTimerState(currState, {
            mode: "rest",
            status: "running",
            lastWorkTimeString: currState.lastWorkTimeString,
            lastRestTimeString: currState.lastRestTimeString,
            expectedWorkTimerEnd: null,
            expectedRestTimerEnd: expectedRestEnd,
            secondsRemainingAtPause: null
        })

        this.scheduleAlarm("rest", expectedRestEnd)
        this.setBadge("badgeRest")
    }

    /**
     * Pauses the current session and stores the running timer's time left
     * in storage.
     */
    pauseSessionWith(currState: TimerState, secondsRemaining: number): void {
        this.updateTimerState(currState, {
            status: "paused",
            expectedWorkTimerEnd: null,
            expectedRestTimerEnd: null,
            secondsRemainingAtPause: secondsRemaining,
        })

        this.clearAlarmsAndBadge()
        this.setBadge("badgePaused")
    }

    /**
     * Handles skipping the current sessions and updating user statistics
     * accordingly.
     */
    async skipFrom(currState: TimerState, workSecondsLeft = 0, restSecondsLeft = 0): Promise<void> {
        this.clearAlarmsAndBadge()
        const { loopSessions } = await this.getUserSettings()

        const data = this.calculateSkipStats(currState, workSecondsLeft, restSecondsLeft)
        if (data) {
            await this.statService.incrementStats(data.alarm, new Date(), data.duration)
        }

        switch (currState.mode) {
            case "idle":
            case "work":
                this.startRestFrom(currState)
                break
            case "rest":
                if (loopSessions) {
                    this.startWorkFrom(currState)
                } else {
                    this.resetSessionFrom(currState)
                    break
                }
        }

        // const statsUpdate = this.calculateSkipStats(currState, workSecondsLeft, restSecondsLeft)
        // if (statsUpdate) {
        //     this.updateStats(statsUpdate)
        // }
    }

    /**
     * Resets the entire session to idle state and optionally updates user
     * statistics depending on the call to this function (ending timers
     * naturally vs. user-initiated endings through skipping/reset).
     */
    async resetSessionFrom(
        currState: TimerState,
        updateStats = false,
        workSecondsLeft = 0,
        restSecondsLeft = 0
    ): Promise<void> {
        this.updateTimerState(currState, {
            mode: "idle",
            status: "idle",
            expectedWorkTimerEnd: null,
            expectedRestTimerEnd: null,
            secondsRemainingAtPause: null
        })

        this.clearAlarmsAndBadge()

        if (updateStats && currState.mode !== "idle") {
            await this.updateStatsOnReset(currState, workSecondsLeft, restSecondsLeft)
        }
    }

    // --------------------------
    // === SESSION MANAGEMENT ===
    // --------------------------

    async handleRestEndingFromUI(): Promise<boolean> {
        const [timerState, userSettings] = await Promise.all([
            this.getTimerState(),
            this.getUserSettings()
        ])

        if (userSettings.loopSessions) {
            return true
        }

        this.updateTimerState(timerState, {
            mode: "idle",
            status: "idle",
            expectedWorkTimerEnd: null,
            expectedRestTimerEnd: null,
            secondsRemainingAtPause: null
        })

        return false
    }

    // new syncing restore
    async restore(): Promise<{
        restoredTimerState: TimerState
        lastWorkTimeString: string,
        lastRestTimeString: string,
        workSecondsLeft: number
        restSecondsLeft: number,
        workEndMS: number | null,
        restEndMS: number | null,
        shouldStartInterval?: "work" | "rest"
    }> {
        const storedTimerState = await this.getTimerState()
        const {
            status,
            lastWorkTimeString,
            lastRestTimeString,
            expectedWorkTimerEnd,
            expectedRestTimerEnd
        } = storedTimerState

        const totalWorkSeconds = convertTimeStringToSeconds(lastWorkTimeString)
        const totalRestSeconds = convertTimeStringToSeconds(lastRestTimeString)

        let workSecondsLeft = totalWorkSeconds
        let restSecondsLeft = totalRestSeconds
        let shouldStartInterval: AlarmType | undefined

        switch (status) {
            case "running":
                ({ workSecondsLeft, restSecondsLeft, shouldStartInterval } =
                    this.calculateRunningTimeLeft(storedTimerState))
                break
            case "paused":
                ({ workSecondsLeft, restSecondsLeft } =
                    this.calculatePausedTimeLeft(storedTimerState, totalWorkSeconds, totalRestSeconds)
                )
        }

        return {
            restoredTimerState: storedTimerState,
            lastWorkTimeString,
            lastRestTimeString,
            workSecondsLeft,
            restSecondsLeft,
            workEndMS: expectedWorkTimerEnd,
            restEndMS: expectedRestTimerEnd,
            shouldStartInterval
        }
    }

    // ---------------------------
    // === SETTINGS MANAGEMENT ===
    // ---------------------------

    async getUserSettings(): Promise<UserSettings> {
        return await this.storageService.get<UserSettings>("userSettings", "sync") ?? defaultUserSettings
    }

    async updateUserSettings<K extends keyof UserSettings>(
        key: K,
        value: UserSettings[K]
    ): Promise<void> {
        const currentSettings = await this.getUserSettings()
        const updatedSettings: UserSettings = { ...currentSettings, [key]: value }
        await this.storageService.set<UserSettings>("userSettings", updatedSettings, "sync")
    }

    async getTimerState(): Promise<TimerState> {
        return await this.storageService.get<TimerState>("timerState") ?? defaultTimerState
    }

    // ---------------------
    // === NOTIFICATIONS ===
    // ---------------------

    async pushNotification(notificationType: NotificationType): Promise<void> {
        const { loopSessions } = await this.getUserSettings()
        const context = this.getNotificationContext(notificationType, loopSessions)
        const { titleKey, messageKey } = notificationI18nMap[context]

        await this.notificationsService.create(
            notificationType,
            this.runtimeService.getUrl("images/timetide128.png"),
            this.i18nService.t(titleKey),
            this.i18nService.t(messageKey),
        )
    }

    // ----------------------
    // === ALARM HANDLING ===
    // ----------------------

    async handleAlarm(alarmType: AlarmType): Promise<void> {
        const [userSettings, timerState] = await Promise.all([
            this.getUserSettings(),
            this.getTimerState()
        ])

        await this.handleAlarmEffects(alarmType, userSettings)
        await this.processAlarm(alarmType, timerState)
    }

    // ----------------------
    // === INITIALIZATION ===
    // ----------------------

    async initStorage(): Promise<void> {
        await Promise.all([
            this.storageService.set<TimerState>("timerState", defaultTimerState),
            // this.storageService.set<BaseStats>("baseStats", defaultBaseStats, "sync"),
            // this.storageService.set<DatedStats>("datedStats", defaultDatedStats, "sync"),
            this.storageService.set<UserSettings>("userSettings", defaultUserSettings, "sync")
        ])
    }

    registerListeners(): void {
        this.alarmsService.onAlarm(async (alarmType) => {
            await this.handleAlarm(alarmType)
        })

        this.runtimeService.onInstalled((details) => {
            switch (details.reason) {
                case "install":
                    this.initStorage()
                    break
                case "update":
                    // [todo] check timer state for updates to stats
                    break
            }
        })
    }

    subscribeTo<T>(storageKey: string, callback: (state: T) => void): () => void {
        this.storageService.subscribe<T>(storageKey, callback)
        return () => this.storageService.unsubscribe<T>(storageKey, callback)
    }

    // -----------------------
    // === PRIVATE HELPERS ===
    // -----------------------

    private getWorkDurationSeconds(state: TimerState): number {
        return state.status === "paused"
            ? state.secondsRemainingAtPause!
            : convertTimeStringToSeconds(state.lastWorkTimeString)
    }

    private getRestDurationSeconds(state: TimerState): number {
        return state.status === "paused"
            ? state.secondsRemainingAtPause!
            : convertTimeStringToSeconds(state.lastRestTimeString)
    }

    private updateTimerState(currState: TimerState, updates: Partial<TimerState>): void {
        this.storageService.set<TimerState>("timerState", {
            ...currState,
            ...updates
        })
    }

    private scheduleAlarm(name: AlarmType, when: number): void {
        this.alarmsService.createAlarm({ name, when })
    }

    private setBadge(key: string): void {
        this.badgeService.setBadgeText(this.i18nService.t(key))
    }

    private clearAlarmsAndBadge(): void {
        this.alarmsService.clearAllAlarms()
        this.badgeService.clearBadgeText()
    }

    private calculateSkipStats(
        currState: TimerState,
        workSecondsLeft: number,
        restSecondsLeft: number
    ): { alarm: AlarmType; duration: number } | null {
        const { mode, lastWorkTimeString, lastRestTimeString } = currState

        switch (mode) {
            case "work": {
                const duration = convertTimeStringToSeconds(lastWorkTimeString) - workSecondsLeft
                return duration > 0
                    ? { alarm: "work", duration }
                    : null
            }
            case "rest": {
                const duration = convertTimeStringToSeconds(lastRestTimeString) - restSecondsLeft
                return duration > 0
                    ? { alarm: "rest", duration }
                    : null
            }
            case "idle":
            default:
                return null
        }
    }

    private async updateStatsOnReset(
        currState: TimerState,
        workSecondsLeft: number,
        restSecondsLeft: number
    ): Promise<void> {
        switch (currState.mode) {
            case "work": {
                const totalWorkSeconds = convertTimeStringToSeconds(currState.lastWorkTimeString)
                const elapsed = totalWorkSeconds - Math.max(0, workSecondsLeft)
                if (elapsed > 0) {
                    await this.statService.incrementStats("work", new Date(), elapsed)
                }
                return
            }
            case "rest": {
                const totalRestSeconds = convertTimeStringToSeconds(currState.lastRestTimeString)
                const elapsed = totalRestSeconds - Math.max(0, restSecondsLeft)
                if (elapsed > 0) {
                    await this.statService.incrementStats("rest", new Date(), elapsed)
                }
                return
            }
        }
    }

    private calculateRunningTimeLeft(state: TimerState): {
        workSecondsLeft: number,
        restSecondsLeft: number,
        shouldStartInterval?: "work" | "rest"
    } {
        const totalWorkSeconds = convertTimeStringToSeconds(state.lastWorkTimeString)
        const totalRestSeconds = convertTimeStringToSeconds(state.lastRestTimeString)

        if (state.mode === "work") {
            return {
                workSecondsLeft: Math.floor((state.expectedWorkTimerEnd! - Date.now()) / 1000),
                restSecondsLeft: totalRestSeconds,
                shouldStartInterval: "work"
            }
        } else if (state.mode === "rest") {
            return {
                workSecondsLeft: totalWorkSeconds,
                restSecondsLeft: Math.floor((state.expectedRestTimerEnd! - Date.now()) / 1000),
                shouldStartInterval: "rest"
            }
        }

        return {
            workSecondsLeft: totalWorkSeconds,
            restSecondsLeft: totalRestSeconds
        }
    }

    private calculatePausedTimeLeft(
        state: TimerState,
        totalWorkSeconds: number,
        totalRestSeconds: number
    ): { workSecondsLeft: number, restSecondsLeft: number } {
        if (state.mode === "work") {
            return {
                workSecondsLeft: state.secondsRemainingAtPause!,
                restSecondsLeft: totalRestSeconds
            }
        } else if (state.mode === "rest") {
            return {
                workSecondsLeft: totalWorkSeconds,
                restSecondsLeft: state.secondsRemainingAtPause!
            }
        }

        return {
            workSecondsLeft: totalWorkSeconds,
            restSecondsLeft: totalRestSeconds
        }
    }

    // private async getStats(): Promise<[BaseStats, DatedStats]> {
    //     return await Promise.all([
    //         this.storageService.get<BaseStats>("baseStats", "sync").then(stats => stats ?? defaultBaseStats),
    //         this.storageService.get<DatedStats>("datedStats", "sync").then(stats => stats ?? defaultDatedStats)
    //     ])
    // }

    // private getDailyStats(datedStats: DatedStats, isoDate: string) {
    //     return datedStats[isoDate] ?? {
    //         workSeconds: 0,
    //         restSeconds: 0,
    //         workSkips: 0,
    //         restSkips: 0,
    //         resets: 0
    //     }
    // }

    // private updateStatsData(
    //     baseStats: BaseStats,
    //     dailyStats: any,
    //     type: StatsUpdateType,
    //     workIncrementSeconds: number,
    //     restIncrementSeconds: number
    // ): void {
    //     if (type === "reset") {
    //         baseStats.totalResets++
    //         dailyStats.totalResets++
    //     } else if (type === "skipWork") {
    //         baseStats.totalWorkSkips++
    //         dailyStats.workSkips++
    //     } else if (type === 'skipRest') {
    //         baseStats.totalRestSkips++
    //         dailyStats.restSkips++
    //     }

    //     baseStats.totalWorkSeconds += workIncrementSeconds
    //     baseStats.totalRestSeconds += restIncrementSeconds
    //     dailyStats.workSeconds += workIncrementSeconds
    //     dailyStats.restSeoncds += restIncrementSeconds
    // }

    // private async saveStats(
    //     baseStats: BaseStats,
    //     datedStats: DatedStats
    // ): Promise<void> {
    //     await Promise.all([
    //         this.storageService.set<BaseStats>("baseStats", baseStats, "sync"),
    //         this.storageService.set<DatedStats>("datedStats", datedStats, "sync")
    //     ])
    // }

    private getNotificationContext(
        notificationType: NotificationType,
        loopSessions: boolean
    ): NotificationContext {
        return notificationType === "work"
            ? "workEnd"
            : loopSessions ? "restEndLoop" : "restEndNoLoop"
    }

    private async processAlarm(
        alarmType: AlarmType,
        timerState: TimerState
    ): Promise<void> {
        switch (alarmType) {
            case "work":
                await this.statService.incrementStats(
                    "work",
                    new Date(),
                    convertTimeStringToSeconds(timerState.lastWorkTimeString)
                )
                this.startRestFrom(timerState)
                break
            case "rest":
                await this.statService.incrementStats(
                    "work",
                    new Date(),
                    convertTimeStringToSeconds(timerState.lastWorkTimeString)
                )

                const { loopSessions } = await this.getUserSettings()
                if (loopSessions) {
                    this.startWorkFrom(timerState)
                } else {
                    this.resetSessionFrom(timerState)
                }

                break
            default:
                console.error(`Unknown alarm type received: ${alarmType}`)
        }
    }

    private async handleAlarmEffects(
        alarmType: AlarmType,
        userSettings: UserSettings
    ): Promise<void> {
        const { soundsEnabled, notificationsEnabled } = userSettings

        if (soundsEnabled) {
            this.audioService.playSound(alarmType)
        }

        if (notificationsEnabled) {
            this.pushNotification(alarmType)
        }
    }
}
