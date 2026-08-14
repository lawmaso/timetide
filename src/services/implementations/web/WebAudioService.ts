import type { IAudioService } from "@/services/interfaces/IAudioService"
import type { IRuntimeService } from "@/services/interfaces/IRuntimeService"
import type { SoundEvent } from "@/core/types/soundEvents"

export default class WebAudioService implements IAudioService {
    constructor(_runtimeService: IRuntimeService) {}

    playSound(_soundEvent: SoundEvent): Promise<void> {
        return Promise.resolve()
    }
}