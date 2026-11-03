// ============================================
// CORE/PLAYER-RULES.TS — правила игрока на карте (1.8.2)
// ============================================

/** Действие по клику на тренажёр. */
export type PlayerAction = 'play' | 'move' | 'ignore';

/**
 * Чистые правила взаимодействия игрока с картой.
 * Без DOM, Storage и CONFIG; решения о позиции принимает PlayerState.
 */
export const PlayerRules = {
    /** Стартовая позиция — перед первым тренажёром (A22, US-32). */
    START_INDEX: -1,

    /** Длительность движения в мс; совпадает с transition в map-player.css (A23, T19). */
    MOVE_MS: 600,

    /**
     * Определяет действие по клику на тренажёр.
     * @param currentIndex — текущий индекс игрока
     * @param targetIndex — индекс тренажёра под кликом
     */
    getAction(currentIndex: number, targetIndex: number): PlayerAction {
        if (targetIndex === currentIndex) {
            return 'play';
        }
        if (Math.abs(targetIndex - currentIndex) === 1) {
            return 'move';
        }
        return 'ignore';
    },

    /**
     * Приводит индекс из хранилища к диапазону [−1, total − 1].
     * @param index — сохранённый индекс
     * @param total — всего тренажёров
     */
    normalizeIndex(index: number | null | undefined, total: number): number {
        const value = Number(index);
        const max = Math.floor(Number(total)) - 1;

        if (index == null || !Number.isFinite(value) || max < 0) {
            return this.START_INDEX;
        }

        return Math.min(max, Math.max(this.START_INDEX, Math.floor(value)));
    }
};
