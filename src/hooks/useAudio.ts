// ============================================
// SRC/HOOKS/useAudio.ts — обёртка над AudioService (1.8.0)
// ============================================
// Тонкая типизированная обёртка: компонентам не нужен глобал напрямую.

import { useCallback } from 'react';

/** Имя звука в AudioService. */
export type AudioKind = 'click' | 'win' | 'lose';

export interface UseAudio {
    /** Воспроизводит звук; ошибки глотает AudioService. */
    play(kind: AudioKind): void;
}

export function useAudio(): UseAudio {
    const play = useCallback((kind: AudioKind): void => {
        AudioService.play(kind);
    }, []);

    return { play };
}
