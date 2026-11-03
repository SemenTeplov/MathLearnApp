// ============================================
// SERVICES/AUDIO-SERVICE.TS — управление звуком (1.8.2)
// ============================================

/** Имя звука, который умеет проигрывать AudioService. */
export type AudioKind = 'click' | 'win' | 'lose';

/** Звуки приложения; порядок предзагрузки сохранён с 1.2.0. */
const SOUND_NAMES: AudioKind[] = ['click', 'win', 'lose'];

/**
 * Сервис управления звуковым сопровождением.
 * Обрабатывает предзагрузку и воспроизведение звуков.
 * Ошибки игнорируются — игра работает без звука.
 */
export class AudioService {
    _sounds: Map<string, HTMLAudioElement> = new Map();
    _isReady = false;

    /** Предзагружает все звуки приложения; вызывается один раз при старте. */
    preload(): void {
        SOUND_NAMES.forEach((name) => {
            try {
                const audio = new Audio('audio/' + name + '.mp3');
                this._sounds.set(name, audio);
            } catch (e) {
                console.warn('[AudioService] Ошибка загрузки звука: ' + name, e);
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
