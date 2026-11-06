// ============================================
// SERVICES/AUDIO-SERVICE.TS — управление звуком (1.8.4: ассеты через ?url)
// ============================================

import { AUDIO_URLS, type AudioKind } from '../assets/audio/audio-urls';

export type { AudioKind };

/**
 * Сервис управления звуковым сопровождением.
 * Обрабатывает предзагрузку и воспроизведение звуков.
 * Ошибки игнорируются — игра работает без звука.
 */
export class AudioService {
    _sounds: Map<AudioKind, HTMLAudioElement> = new Map();
    _isReady = false;

    /** Предзагружает все звуки приложения; вызывается один раз при старте. */
    preload(): void {
        (Object.keys(AUDIO_URLS) as AudioKind[]).forEach((kind) => {
            try {
                this._sounds.set(kind, new Audio(AUDIO_URLS[kind]));
            } catch (e) {
                console.warn('[AudioService] Ошибка загрузки звука: ' + kind, e);
            }
        });

        this._isReady = true;
    }

    /** Воспроизводит звук по имени. */
    play(kind: AudioKind): void {
        if (!this._isReady) {
            return;
        }

        const audio = this._sounds.get(kind);
        if (!audio) {
            return;
        }

        try {
            const clone = audio.cloneNode() as HTMLAudioElement;
            clone.play().catch(() => {});
        } catch (e) {
            console.warn('[AudioService] Ошибка воспроизведения: ' + kind, e);
        }
    }
}
