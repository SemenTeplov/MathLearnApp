// ============================================
// LOGIC/PLAYER-STATE.JS — состояние позиции игрока
// ============================================

/**
 * Машина состояний позиции игрока: текущий тренажёр и точка отката.
 * Без DOM, Storage, Stats и CONFIG — чистый объект состояния.
 */
class PlayerState {
    /**
     * @param {number} index — стартовая позиция (обычно −1)
     */
    constructor(index) {
        this._current = index;
        this._previous = index;
    }

    /** @returns {number} — текущий индекс */
    get index() {
        return this._current;
    }

    /** @returns {number} — откуда игрок пришёл (цель отката) */
    get previous() {
        return this._previous;
    }

    /**
     * Приход на новый тренажёр: текущий становится предыдущим.
     * @param {number} target
     */
    moveTo(target) {
        this._previous = this._current;
        this._current = target;
    }

    /**
     * Идёт ли игра на текущем тренажёре (без хода).
     * @returns {boolean}
     */
    isReplay() {
        return this._current === this._previous;
    }

    /**
     * Откат на предыдущий тренажёр.
     * @returns {number} — новый текущий индекс
     */
    revert() {
        this._current = this._previous;
        return this._current;
    }

    /**
     * Победа закрепляет позицию: откатываться больше некуда.
     * @returns {number} — текущий индекс
     */
    commitWin() {
        this._previous = this._current;
        return this._current;
    }
}
