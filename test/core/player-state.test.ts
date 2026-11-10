// Боевая машина состояний PlayerState: moveTo / revert / commitWin / restore.

import { describe, expect, test } from 'vitest';
import { PlayerState } from '../../src/core/player-state';

describe('PlayerState', () => {
    test('на старте обе позиции совпадают — это игра на текущем', () => {
        const state = new PlayerState(-1);

        expect(state.index).toBe(-1);
        expect(state.previous).toBe(-1);
        expect(state.isReplay()).toBe(true);
    });

    test('moveTo делает текущий предыдущим и снимает признак повтора', () => {
        const state = new PlayerState(-1);
        state.moveTo(0);

        expect(state.index).toBe(0);
        expect(state.previous).toBe(-1);
        expect(state.isReplay()).toBe(false);
    });

    test('revert возвращает на предыдущий и снова даёт повтор', () => {
        const state = new PlayerState(-1);
        state.moveTo(0);

        expect(state.revert()).toBe(-1);
        expect(state.index).toBe(-1);
        expect(state.previous).toBe(-1);
        expect(state.isReplay()).toBe(true);
    });

    test('commitWin закрепляет победу: откатываться некуда', () => {
        const state = new PlayerState(0);
        state.moveTo(1);

        expect(state.commitWin()).toBe(1);
        expect(state.index).toBe(1);
        expect(state.previous).toBe(1);
        expect(state.isReplay()).toBe(true);
    });

    test('цепочка ходов: moveTo(1) → moveTo(2) → revert() даёт 1', () => {
        const state = new PlayerState(0);
        state.moveTo(1);
        state.moveTo(2);

        expect(state.previous).toBe(1);
        expect(state.revert()).toBe(1);
        expect(state.isReplay()).toBe(true);
    });

    test('после commitWin следующий ход снова считается новым', () => {
        const state = new PlayerState(0);
        state.moveTo(1);
        state.commitWin();
        state.moveTo(2);

        expect(state.previous).toBe(1);
        expect(state.isReplay()).toBe(false);
    });

    test('откат на текущем не меняет позицию', () => {
        const state = new PlayerState(3);

        expect(state.revert()).toBe(3);
        expect(state.index).toBe(3);
        expect(state.isReplay()).toBe(true);
    });

    test('restore синхронизирует обе позиции с хранилищем и возвращает индекс', () => {
        const state = new PlayerState(0);
        state.moveTo(3);

        expect(state.restore(1)).toBe(1);
        expect(state.index).toBe(1);
        expect(state.previous).toBe(1);
        expect(state.isReplay()).toBe(true);
    });
});
