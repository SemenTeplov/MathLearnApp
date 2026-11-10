// ============================================
// CORE/PLAYER-STATE.TS — состояние позиции игрока (1.10.2)
// ============================================

/**
 * Машина состояний позиции игрока: текущий тренажёр и точка отката.
 * Без DOM, Storage, Stats и CONFIG — чистый объект состояния.
 */
export class PlayerState {
    _current: number;
    _previous: number;

    /** @param index — стартовая позиция (обычно −1) */
    constructor(index: number) {
        this._current = index;
        this._previous = index;
    }

    /** Текущий индекс. */
    get index(): number {
        return this._current;
    }

    /** Откуда игрок пришёл (цель отката). */
    get previous(): number {
        return this._previous;
    }

    /** Приход на новый тренажёр: текущий становится предыдущим. */
    moveTo(target: number): void {
        this._previous = this._current;
        this._current = target;
    }

    /** Идёт ли игра на текущем тренажёре (без хода). */
    isReplay(): boolean {
        return this._current === this._previous;
    }

    /** Откат на предыдущий тренажёр; возвращает новый текущий индекс. */
    revert(): number {
        this._current = this._previous;
        return this._current;
    }

    /** Победа закрепляет позицию: откатываться больше некуда. */
    commitWin(): number {
        this._previous = this._current;
        return this._current;
    }

    /** Синхронизация с хранилищем: текущая позиция и точка отката — один индекс (T86/A92). */
    restore(index: number): number {
        this._current = index;
        this._previous = index;
        return index;
    }
}
