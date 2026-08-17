import type { IAudioService } from "@/services/interfaces/IAudioService"
import type { IRuntimeService } from "@/services/interfaces/IRuntimeService"
import type { SoundEvent } from "@/core/types/soundEvents"

export default class WebExtensionAudioService implements IAudioService {
    private runtimeService: IRuntimeService
    private workTimerEndAudio: HTMLAudioElement | null = null
    private restTimerEndAudio: HTMLAudioElement | null = null
    private offscreenSupported: boolean = false
    private offscreenPath = "offscreen.html"
    private creating: Promise<void> | null = null

    constructor(runtimeService: IRuntimeService) {
        this.runtimeService = runtimeService
        this.checkOffscreenSupport().then((supported) => {
            if (!supported) this.initAudioElements()
        })
    }

    private initAudioElements() {
        this.workTimerEndAudio = new Audio(this.runtimeService.getUrl("/sounds/timerEnd.mp3"))
        this.restTimerEndAudio = new Audio(this.runtimeService.getUrl("/sounds/timerEnd.mp3"))

        this.workTimerEndAudio.play()
    }

    private async checkOffscreenSupport() {
        this.offscreenSupported =
            typeof chrome !== "undefined" &&
            !!chrome.offscreen &&
            typeof chrome.offscreen.hasDocument === "function"

        return this.offscreenSupported
    }

    private async setupOffscreenDocument(): Promise<void> {
        const offscreenUrl = this.runtimeService.getUrl(this.offscreenPath)
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ["OFFSCREEN_DOCUMENT"],
            documentUrls: [offscreenUrl]
        })

        if (existingContexts.length > 0) return

        if (this.creating) {
            await this.creating
            return
        }

        this.creating = chrome.offscreen.createDocument({
            url: offscreenUrl,
            reasons: ["AUDIO_PLAYBACK"],
            justification: "Play timer ending sounds."
        })

        try {
            await this.creating
        } finally {
            this.creating = null
        }
    }

    async playSound(soundEvent: SoundEvent): Promise<void> {
        if (this.offscreenSupported) {
            try {
                await this.setupOffscreenDocument()
                this.runtimeService.sendMessage({
                    target: "offscreen",
                    soundEvent
                })
                return
            } catch (err) {
                console.warn("offscreen audio failed, attempting direct audio:", err)
            }
        }

        const audioToPlay = soundEvent === "work"
            ? this.workTimerEndAudio
            : this.restTimerEndAudio

        if (audioToPlay) {
            try {
                await audioToPlay.play()
            } catch (err) {
                console.error("direct audio playback faied:", err)
            }
        } else {
            console.error("audio element is null for event:", soundEvent)
        }
    }
}
