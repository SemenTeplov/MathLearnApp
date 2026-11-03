// ============================================
// LOGIC/PLAYER-RULES.JS — правила игрока на карте
// ============================================

/**
 * Чистые правила взаимодействия игрока с картой.
 * Без DOM, Storage и CONFIG; решения о позиции принимает PlayerState.
 */
const PlayerRules = {
    /** Стартовая позиция — перед первым тренажёром (A22, US-32). */
    START_INDEX: -1,

    /** Длительность движения в мс; совпадает с transition в map-player.css (A23, T19). */
    MOVE_MS: 600,

    /**
     * Определяет действие по клику на тренажёр.
     * @param {number} currentIndex — текущий индекс игрока
     * @param {number} targetIndex — индекс тренажёра под кликом
     * @returns {'play'|'move'|'ignore'} — текущий / соседний (index ± 1) / дальний
     */
    getAction(currentIndex, targetIndex) {
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
     * @param {number} index — сохранённый индекс
     * @param {number} total — всего тренажёров
     * @returns {number}
     */
    normalizeIndex(index, total) {
        const value = Number(index);
        const max = Math.floor(Number(total)) - 1;

        if (index == null || !Number.isFinite(value) || max < 0) {
            return this.START_INDEX;
        }

        return Math.min(max, Math.max(this.START_INDEX, Math.floor(value)));
    }
};
