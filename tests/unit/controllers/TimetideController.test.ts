import { describe, it, expect, beforeEach, vi } from "vitest"
import TimetideController from "@/controllers/TimetideController"
import { createMockServices } from "~tests/mocks/mockServices"
import { defaultTimerState, defaultUserSettings } from "@/core/config/storageDefaults"
import type { TimerState } from "@/core/types/timerTypes"
import type { UserSettings } from "@/core/types/settingsTypes"
import {
    expectTimerState,
    expectUserSettings,
    createTimerState,
    createSettings,
    createRunningWorkState,
    createRunningRestState,
    createPausedWorkState,
    createPausedRestState
} from "~tests/helpers"

describe("TimetideController", () => {
    let services: ReturnType<typeof createMockServices>
    let controller: TimetideController

    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2005-04-19T00:00:00Z"))

        services = createMockServices()
        controller = new TimetideController(
            services.alarmsService,
            services.audioService,
            services.badgeService,
            services.i18nService,
            services.notificationsService,
            services.runtimeService,
            services.statService,
            services.storageService,
        )
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe("starting work sessions", () => {
        it("sets mode to work and status to running", () => {
            controller.startWorkFrom(defaultTimerState)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    mode: "work",
                    status: "running"
                })
            )
        })

        it("calculates the expected work timer end from the last work time string", () => {
            const state = createTimerState({ lastWorkTimeString: "002500" })
            const expectedEnd = Date.now() + 25 * 60 * 1000

            controller.startWorkFrom(state)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    expectedWorkTimerEnd: expectedEnd
                })
            )
        })

        it("uses seconds remaining at pause when resuming from paused state", () => {
            const pausedState = createPausedWorkState(300) // 5 minutes left
            const expectedEnd = Date.now() + 300 * 1000    // 5 minutes in the future

            controller.startWorkFrom(pausedState)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    expectedWorkTimerEnd: expectedEnd
                })
            )
        })

        it("clears seconds remaining at pause when starting", () => {
            controller.startWorkFrom(defaultTimerState)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    secondsRemainingAtPause: null
                })
            )
        })

        it("schedules a work alarm at the expected end time", () => {
            const state = createTimerState({ lastWorkTimeString: "002500" })
            const expectedEnd = Date.now() + 25 * 60 * 1000

            controller.startWorkFrom(state)

            expect(services.alarmsService.createAlarm).toHaveBeenCalledWith({
                name: "work",
                when: expectedEnd
            })
        })

        it("sets the badge to indicate work mode", () => {
            controller.startWorkFrom(defaultTimerState)

            expect(services.badgeService.setBadgeText).toHaveBeenCalledWith("badgeWork")
        })

        it("preserves the last work and rest time strings", () => {
            const lastWorkTimeString = "003000"
            const lastRestTimeString = "001000"

            const state = createTimerState({
                lastWorkTimeString,
                lastRestTimeString
            })

            controller.startWorkFrom(state)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    lastWorkTimeString,
                    lastRestTimeString
                })
            )
        })
    })

    describe("starting rest sessions", () => {
        it("sets mode to rest and status to running", () => {
            controller.startRestFrom(defaultTimerState)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    mode: "rest",
                    status: "running"
                })
            )
        })

        it("calculates the expected rest timer end from the last rest time string", () => {
            const state = createTimerState({ lastRestTimeString: "000500" })
            const expectedEnd = Date.now() + 5 * 60 * 1000

            controller.startRestFrom(state)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    expectedRestTimerEnd: expectedEnd
                })
            )
        })

        it("uses seconds remaining at pause when resuming from paused state", () => {
            const pausedState = createPausedRestState(180)  // 3 minutes left
            const expectedEnd = Date.now() + 180 * 1000     // 3 minutes in the future

            controller.startRestFrom(pausedState)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    expectedRestTimerEnd: expectedEnd
                })
            )
        })

        it("clears the expected work timer end when starting rest", () => {
            const state = createTimerState({ expectedWorkTimerEnd: Date.now() + 60000 })

            controller.startRestFrom(state)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    expectedWorkTimerEnd: null
                })
            )
        })

        it("schedules a rest alarm at the expected end time", () => {
            const state = createTimerState({ lastRestTimeString: "000500" })
            const expectedEnd = Date.now() + 5 * 60 * 1000

            controller.startRestFrom(state)

            expect(services.alarmsService.createAlarm).toHaveBeenCalledWith({
                name: "rest",
                when: expectedEnd
            })
        })

        it("sets the badge to indicate rest mode", () => {
            controller.startRestFrom(defaultTimerState)

            expect(services.badgeService.setBadgeText).toHaveBeenCalledWith("badgeRest")
        })
    })

    describe("pausing sessions", () => {
        it("sets status to paused", () => {
            const state = createRunningWorkState()

            controller.pauseSessionWith(state, 120)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    status: "paused"
                })
            )
        })

        it("stores the seconds remaining when paused", () => {
            const state = createRunningWorkState()
            const secondsRemainingAtPause = 888

            controller.pauseSessionWith(state, secondsRemainingAtPause)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    secondsRemainingAtPause
                })
            )
        })

        it("clears the expected work timer end when pausing a work timer", () => {
            const state = createRunningWorkState()
            const secondsRemainingAtPause = 120
            
            controller.pauseSessionWith(state, secondsRemainingAtPause)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    expectedWorkTimerEnd: null
                })
            )
        })
        
        it("clears the expected rest timer end when pausing a rest timer", () => {
            const state = createRunningRestState()
            const secondsRemainingAtPause = 120
            
            controller.pauseSessionWith(state, secondsRemainingAtPause)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    expectedRestTimerEnd: null
                })
            )
        })
        
        it("clears all alarms", () => {
            const state = createRunningWorkState()
            const secondsRemainingAtPause = 120
            
            controller.pauseSessionWith(state, secondsRemainingAtPause)

            expect(services.alarmsService.clearAllAlarms).toHaveBeenCalled()
        })

        it("clears the badge before setting the badge to paused", () => {
            const state = createRunningWorkState()
            const secondsRemainingAtPause = 120
            
            controller.pauseSessionWith(state, secondsRemainingAtPause)

            expect(services.badgeService.clearBadgeText).toHaveBeenCalled()
        })

        it("sets the badge to indicate paused mode", () => {
            const state = createRunningWorkState()
            const secondsRemainingAtPause = 120
            
            controller.pauseSessionWith(state, secondsRemainingAtPause)
            
            expect(services.badgeService.setBadgeText).toHaveBeenCalledWith("badgePaused")
        })
        
        it("preserves the work mode when pausing", () => {
            const workState = createRunningWorkState()
            const secondsRemainingAtPause = 120

            controller.pauseSessionWith(workState, secondsRemainingAtPause)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    mode: "work"
                })
            )
        })
    })

    describe("skipping sessions", () => {
        describe("when in idle mode", () => {
            it("starts rest session", async () => {
                const state = createTimerState({ mode: "idle" })

                await controller.skipFrom(state)

                expect(services.storageService.set).toHaveBeenCalledWith(
                    "timerState",
                    expectTimerState({
                        mode: "rest",
                        status: "running"
                    })
                )
            })
        })

        describe("when in work mode", () => {
            beforeEach(async () => {
                const state = createTimerState({ mode: "work" })

                await controller.skipFrom(state)
            })

            it("clears alarms before transitioning to rest", () => {
                expect(services.alarmsService.clearAllAlarms).toHaveBeenCalled()
            })

            it("transitions to rest mode", () => {
                expect(services.storageService.set).toHaveBeenCalledWith(
                    "timerState",
                    expectTimerState({
                        mode: "rest",
                        status: "running"
                    })
                )
            })

            it("sets badge to rest", () => {
                expect(services.badgeService.setBadgeText).toHaveBeenCalledWith("badgeRest")
            })
        })

        describe("when in rest mode", () => {
            it("loops back to work mode when looping is enabled", async () => {
                services.storageService.get.mockResolvedValue(
                    createSettings({ loopSessions: true })
                )
                const state = createTimerState({ mode: "rest" })
    
                await controller.skipFrom(state)

                expect(services.storageService.set).toHaveBeenCalledWith(
                    "timerState",
                    expectTimerState({
                        mode: "work",
                        status: "running"
                    })
                )
            })
            
            it("loops to idle when looping is disabled", async () => {
                services.storageService.get.mockResolvedValue(
                    createSettings({ loopSessions: false })
                )
                const state = createTimerState({ mode: "rest" })
    
                await controller.skipFrom(state)
    
                expect(services.storageService.set).toHaveBeenCalledWith(
                    "timerState",
                    expectTimerState({
                        mode: "idle",
                        status: "idle"
                    })
                )
                
            })
        })
    })

    describe("rest ending from UI", () => {
        it("returns true when looping is enabled", async () => {
            services.storageService.get
                .mockResolvedValueOnce(defaultTimerState)
                .mockResolvedValueOnce(createSettings({ loopSessions: true }))

            const result = await controller.handleRestEndingFromUI()

            expect(result).toBe(true)
        })

        it("returns false when looping is disabled", async () => {
            services.storageService.get
                .mockResolvedValueOnce(defaultTimerState)
                .mockResolvedValueOnce(createSettings({ loopSessions: false }))

            const result = await controller.handleRestEndingFromUI()

            expect(result).toBe(false)
        })

        it("resets timer state when looping is disabled", async () => {
            services.storageService.get
                .mockResolvedValueOnce(defaultTimerState)
                .mockResolvedValueOnce(createSettings({ loopSessions: false }))

            await controller.handleRestEndingFromUI()

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    mode: "idle",
                    status: "idle"
                })
            )
        })
    })

    describe("restoration", () => {
        describe("when status is idle", () => {
            it("returns the full durations for work and rest", async () => {
                const state = createTimerState({
                    status: "idle",
                    lastWorkTimeString: "002500",
                    lastRestTimeString: "000500"
                })
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.workSecondsLeft).toBe(25 * 60)
                expect(result.restSecondsLeft).toBe(5 * 60)
            })

            it("does no set the interval to start", async () => {
                const state = createTimerState({ status: "idle" })
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.shouldStartInterval).toBeUndefined()
            })
        })

        describe("when status is running in work mode", () => {
            it("calculates remaining work seconds from the expected timer ending", async () => {
                const expectedEnd = Date.now() + 600 * 1000  // 10 minutes in the future
                const state = createTimerState({
                    mode: "work",
                    status: "running",
                    expectedWorkTimerEnd: expectedEnd,
                    lastWorkTimeString: "002500",
                    lastRestTimeString: "000500",
                })
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.workSecondsLeft).toBe(600)
                expect(result.restSecondsLeft).toBe(5 * 60)
            })

            it("sets the interval to start to be the work one", async () => {
                const state = createTimerState({
                    mode: "work",
                    status: "running",
                    expectedWorkTimerEnd: Date.now() + 60000
                })
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.shouldStartInterval).toBe("work")
            })
        })

        describe("when status is running in rest mode", () => {
            it("calculates the remaining rest seconds from the expected rest timer ending", async () => {
                const expectedEnd = Date.now() + 180 * 1000  // 3 minutes in the future
                const state = createTimerState({
                    mode: "rest",
                    status: "running",
                    expectedRestTimerEnd: expectedEnd,
                    lastWorkTimeString: "002500",
                    lastRestTimeString: "000500"
                })
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.workSecondsLeft).toBe(25 * 60)
                expect(result.restSecondsLeft).toBe(180)
            })

            it("sets the interval to start to be the rest one", async () => {
                const state = createTimerState({
                    mode: "rest",
                    status: "running",
                    expectedRestTimerEnd: Date.now() + 60000
                })
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.shouldStartInterval).toBe("rest")
            })
        })

        describe("when status is paused in work mode", () => {
            it("uses the seconds remaining at pause for work seconds", async () => {
                const state = createTimerState({
                    mode: "work",
                    status: "paused",
                    secondsRemainingAtPause: 419,
                    lastWorkTimeString: "002500",
                    lastRestTimeString: "000500"
                })
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.workSecondsLeft).toBe(419)
                expect(result.restSecondsLeft).toBe(5 * 60)
            })

            it("does not set any interval to start", async () => {
                const state = createTimerState({
                    mode: "work",
                    status: "paused",
                    secondsRemainingAtPause: 419
                })
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.shouldStartInterval).toBeUndefined()
            })
        })

        describe("when status is paused in rest mode", () => {
            it("uses the seconds remaining at pause for rest seconds", async () => {
                const state = createTimerState({
                    mode: "rest",
                    status: "paused",
                    secondsRemainingAtPause: 90,
                    lastWorkTimeString: "002500",
                    lastRestTimeString: "000500"
                })
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.workSecondsLeft).toBe(25 * 60)
                expect(result.restSecondsLeft).toBe(90)
            })
        })

        describe("when status is running but mode is idle", () => {
            it("returns full durations without starting an interval", async () => {
                // targets the final return in calculateRunningTimeLeft
                const state: TimerState = {
                    ...defaultTimerState,
                    mode: "idle",  // edge case: running but idle mode
                    status: "running",
                    lastWorkTimeString: "002500",
                    lastRestTimeString: "000500"
                }
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.workSecondsLeft).toBe(25 * 60)
                expect(result.restSecondsLeft).toBe(5 * 60)
                expect(result.shouldStartInterval).toBeUndefined()
            })
        })

        describe("when status is paused but mode is idle", () => {
            it("returns full durations", async () => {
                // targets hits the final return in calculatePausedTimeLeft
                const state: TimerState = {
                    ...defaultTimerState,
                    mode: "idle",  // edge case: paused but idle mode
                    status: "paused",
                    lastWorkTimeString: "002500",
                    lastRestTimeString: "000500",
                    secondsRemainingAtPause: null
                }
                services.storageService.get.mockResolvedValue(state)

                const result = await controller.restore()

                expect(result.workSecondsLeft).toBe(25 * 60)
                expect(result.restSecondsLeft).toBe(5 * 60)
            })
        })

        it("returns the stored timer state", async () => {
            const state = createTimerState({
                lastWorkTimeString: "003000",
                lastRestTimeString: "001000"
            })
            services.storageService.get.mockResolvedValue(state)

            const result = await controller.restore()

            expect(result.restoredTimerState).toEqual(state)
            expect(result.lastWorkTimeString).toBe("003000")
            expect(result.lastRestTimeString).toBe("001000")
        })
    })

    describe("resetting sessions", () => {
        it("sets mode and status to idle", () => {
            const state = createRunningWorkState()

            controller.resetSessionFrom(state)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    mode: "idle",
                    status: "idle"
                })
            )
        })

        it("clears all timer endings", () => {
            const state = createTimerState({
                expectedWorkTimerEnd: Date.now(),
                expectedRestTimerEnd: Date.now()
            })

            controller.resetSessionFrom(state)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    expectedWorkTimerEnd: null,
                    expectedRestTimerEnd: null
                })
            )
        })

        it("clears the seconds remaining at paused when paused", () => {
            const state = createPausedWorkState(300)

            controller.resetSessionFrom(state)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "timerState",
                expectTimerState({
                    secondsRemainingAtPause: null
                })
            )
        })

        it("clears all alarms", () => {
            const state = createRunningWorkState()

            controller.resetSessionFrom(state)

            expect(services.alarmsService.clearAllAlarms).toHaveBeenCalled()
        })

        it("clears the badge", () => {
            const state = createRunningRestState()

            controller.resetSessionFrom(state)

            expect(services.badgeService.clearBadgeText).toHaveBeenCalled()
        })
    })

    describe("handling alarms", () => {
        const setupMocks = (
            settings: Partial<UserSettings> = {},
            timerState: Partial<TimerState> = {}
        ) => {
            // services.storageService.get
            //     .mockResolvedValueOnce(createSettings(settings))
            //     .mockResolvedValueOnce(createTimerState(timerState))

            services.storageService.get.mockImplementation((key: string) => {
                if (key == "userSettings") return Promise.resolve(createSettings(settings))
                if (key == "timerState") return Promise.resolve(createTimerState(timerState))
                return Promise.resolve(null)
            })
        }

        describe("alarm effects", () => {
            it("plays a sound when sounds are enabled", async () => {
                setupMocks({
                    soundsEnabled: true,
                    notificationsEnabled: false
                })

                await controller.handleAlarm("work")

                expect(services.audioService.playSound).toHaveBeenCalledWith("work")
            })

            it("does not play a sound when sounds are disabled", async () => {
                setupMocks({
                    soundsEnabled: false,
                    notificationsEnabled: false
                })

                await controller.handleAlarm("work")

                expect(services.audioService.playSound).not.toHaveBeenCalled()
            })

            it("pushes a notification when notifications are enabled", async () => {
                setupMocks({
                    soundsEnabled: false,
                    notificationsEnabled: true
                })

                await controller.handleAlarm("work")

                expect(services.notificationsService.create).toHaveBeenCalled
            })

            it("does not push a notification when notifications are disabled", async () => {
                setupMocks({
                    soundsEnabled: false,
                    notificationsEnabled: false
                })

                await controller.handleAlarm("work")

                expect(services.notificationsService.create).not.toHaveBeenCalled()
            })

            it("plays both a sound and pushes a notification when both enabled", async () => {
                setupMocks({
                    soundsEnabled: true,
                    notificationsEnabled: true
                })

                await controller.handleAlarm("rest")

                expect(services.audioService.playSound).toHaveBeenCalledWith("rest")
                expect(services.notificationsService.create).toHaveBeenCalled()
            })

            it("plays neither a sound nor pushes a notification when both disabled", async () => {
                setupMocks({
                    soundsEnabled: false,
                    notificationsEnabled: false
                })

                await controller.handleAlarm("work")

                expect(services.audioService.playSound).not.toHaveBeenCalled()
                expect(services.notificationsService.create).not.toHaveBeenCalled()
            })
        })

        describe("work alarm", () => {
            it("transitions to rest mode", async () => {
                setupMocks({}, {
                    mode: "work",
                    lastRestTimeString: "000500"
                })

                await controller.handleAlarm("work")

                expect(services.storageService.set).toHaveBeenCalledWith(
                    "timerState",
                    expectTimerState({
                        mode: "rest",
                        status: "running"
                    })
                )
            })

            it("schedules a rest alarm", async () => {
                setupMocks({}, { lastRestTimeString: "000500" })

                await controller.handleAlarm("work")

                expect(services.alarmsService.createAlarm).toHaveBeenCalledWith({
                    name: "rest",
                    when: expect.any(Number)
                })
            })
        })

        describe("rest alarm", () => {
            it("loops back to work when looping is enabled", async () => {
                setupMocks(
                    { loopSessions: true },
                    { mode: "rest", lastWorkTimeString: "002500" }
                )

                await controller.handleAlarm("rest")

                expect(services.storageService.set).toHaveBeenCalledWith(
                    "timerState",
                    expectTimerState({
                        mode: "work",
                        status: "running"
                    })
                )
            })

            it("resets to idle when looping is disabled", async () => {
                setupMocks(
                    { loopSessions: false },
                    { mode: "rest" }
                )

                await controller.handleAlarm("rest")

                expect(services.storageService.set).toHaveBeenCalledWith(
                    "timerState",
                    expectTimerState({
                        mode: "idle",
                        status: "idle"
                    })
                )
            })
        })

        describe("unknown alarm type", () => {
            it("logs an error for unknown alarm types", async () => {
                const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
                setupMocks()

                await controller.handleAlarm("unknown" as any)

                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining("Unknown alarm type")
                )

                consoleSpy.mockRestore()
            })
        })
    })

    describe("pushing notifications", () => {
        beforeEach(() => {
            services.storageService.get.mockResolvedValue(defaultUserSettings)
        })

        describe("work timer ending", () => {
            beforeEach(async () => {
                await controller.pushNotification("work")
            })

            it("creates notification with work end context and work type", async () => {
                await controller.pushNotification("work")

                expect(services.notificationsService.create).toHaveBeenCalledWith(
                    "work",
                    expect.any(String),
                    expect.any(String),
                    expect.any(String)
                )
            })

            it("uses the runtime service to get the icon URL", async () => {
                expect(services.runtimeService.getUrl).toHaveBeenCalledWith(
                    "images/timetide128.png"
                )
            })

            it("uses the i18n service for the work title and message", async () => {
                expect(services.i18nService.t).toHaveBeenCalled()
            })
        })
        
        describe("rest timer ending", () => {
            beforeEach(async () => {
                await controller.pushNotification("rest")
            })

            it("creates notification with rest end context and rest type", async () => {
                await controller.pushNotification("work")

                expect(services.notificationsService.create).toHaveBeenCalledWith(
                    "work",
                    expect.any(String),
                    expect.any(String),
                    expect.any(String)
                )
            })

            it("uses the runtime service to get the icon URL", async () => {
                expect(services.runtimeService.getUrl).toHaveBeenCalledWith(
                    "images/timetide128.png"
                )
            })

            it("uses the i18n service for the rest title and message", async () => {
                expect(services.i18nService.t).toHaveBeenCalled()
            })
        })
    })

    describe("getting user settings", () => {
        it("returns stored user settings", async () => {
            const settings = createSettings({ soundsEnabled: false })
            services.storageService.get.mockResolvedValue(settings)

            const result = await controller.getUserSettings()

            expect(result).toEqual(settings)
        })

        it("returns default settings when none are stored for some reason", async () => {
            services.storageService.get.mockResolvedValue(null)

            const result = await controller.getUserSettings()

            expect(result).toEqual(defaultUserSettings)
        })
    })

    describe("update user settings", () => {
        it("merges new setting with existing settings", async () => {
            const existingSettings = createSettings({
                soundsEnabled: true,
                notificationsEnabled: true
            })
            services.storageService.get.mockResolvedValue(existingSettings)

            await controller.updateUserSettings("soundsEnabled", false)

            expect(services.storageService.set).toHaveBeenCalledWith(
                "userSettings",
                expectUserSettings({
                    soundsEnabled: false,
                    notificationsEnabled: true
                }),
                "sync"
            )
        })
    })

    describe("getting the timer state", () => {
        it("returns stored timer state", async () => {
            const state = createRunningWorkState()
            services.storageService.get.mockResolvedValue(state)

            const result = await controller.getTimerState()

            expect(result).toEqual(state)
        })

        it("returns the default timer state if no state is stored for some reason", async () => {
            services.storageService.get.mockResolvedValue(null)

            const result = await controller.getTimerState()

            expect(result).toEqual(defaultTimerState)
        })
    })

    describe("storage initialization", () => {
        it("initializes the timer state with defaults", async () => {
            await controller.initStorage()

            expect(services.storageService.set).toHaveBeenCalled()
        })
    })

    describe("listener registration", () => {
        describe("alarm listener", () => {
            it("registers an alarm listener on initialization", () => {
                controller.registerListeners()

                expect(services.alarmsService.onAlarm).toHaveBeenCalledWith(
                    expect.any(Function)
                )
            })

            it("handles an alarm when one fires", async () => {
                // capture the callback passed to onAlarm
                let alarmCallback: (alarmType: string) => Promise<void>
                services.alarmsService.onAlarm.mockImplementation((cb) => {
                    alarmCallback = cb
                })

                // setup mocks for handleAlarm internals
                services.storageService.get.mockImplementation((key: string) => {
                    if (key === "userSettings") return Promise.resolve(defaultUserSettings)
                    if (key === "timerState") return Promise.resolve(defaultTimerState)
                    return Promise.resolve(null)
                })

                controller.registerListeners()
                await alarmCallback!("work")

                // verify handleAlarm side effects occurred
                expect(services.storageService.set).toHaveBeenCalled()
            })
        })

        describe("install listener", () => {
            it("registers an install listener", () => {
                controller.registerListeners()

                expect(services.runtimeService.onInstalled).toHaveBeenCalledWith(
                    expect.any(Function)
                )
            })

            it("initializes storage on fresh install", async () => {
                let installCallback: (details: { reason: string }) => void
                services.runtimeService.onInstalled.mockImplementation((cb) => {
                    installCallback = cb
                })

                controller.registerListeners()
                installCallback!({ reason: "install" })

                expect(services.storageService.set).toHaveBeenCalledWith(
                    "timerState",
                    expect.any(Object)
                )
                expect(services.storageService.set).toHaveBeenCalledWith(
                    "userSettings",
                    expect.any(Object),
                    "sync"
                )
            })

            it("does not initialize storage on update", () => {
                let installCallback: (details: { reason: string }) => void
                services.runtimeService.onInstalled.mockImplementation((cb) => {
                    installCallback = cb
                })

                controller.registerListeners()
                installCallback!({ reason: "update" })

                expect(services.storageService.set).not.toHaveBeenCalled()
            })
        })
    })

    describe("state subscription", () => {
        it("subscribes to storage changes for the given key", () => {
            const callback = vi.fn()

            controller.subscribeTo("timerState", callback)

            expect(services.storageService.subscribe).toHaveBeenCalledWith(
                "timerState",
                callback
            )
        })

        it("returns an unsubscribe function", () => {
            const callback = vi.fn()

            const unsubscribe = controller.subscribeTo("timerState", callback)

            expect(typeof unsubscribe).toBe("function")
        })

        it("unsubscribes when the returned function is called", () => {
            const callback = vi.fn()

            const unsubscribe = controller.subscribeTo("timerState", callback)
            unsubscribe()

            expect(services.storageService.unsubscribe).toHaveBeenCalledWith(
                "timerState",
                callback
            )
        })
    })
})