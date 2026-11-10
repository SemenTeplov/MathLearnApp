// App: свежесть общего счёта на карте — «Играть снова» → ✕ и «На карту» (TR-74, A82).
// Все пути возврата идут через returnToMap(), поэтому счёт одинаковый (TR-85).

import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CONFIG } from '../../src/core/config';
import type { GameMap } from '../../src/core/types';
import { ControlledChannel, resetChannels } from '../support/session-channel';
import { playCorrectly, score, startGame } from '../support/app-drivers';
import { renderApp } from '../support/app-setup';

const ENGLISH: GameMap = { id: 'english', title: 'Английский', zones: CONFIG.ZONES };

beforeEach(() => {
    resetChannels();
    localStorage.clear();
    vi.stubGlobal('BroadcastChannel', ControlledChannel);
});
afterEach(() => vi.unstubAllGlobals());

describe('App — актуальный счёт на карте', () => {
    test('победа → «Играть снова» → ✕ → «Выйти» показывает 100 очков', async () => {
        const { user, container } = renderApp();
        expect(score(container)).toBe('🏆 0');

        await startGame(user, container);
        await playCorrectly(user, container);

        expect(screen.getByText('Заработано: 100 ✓')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Играть снова' }));
        await user.click(container.querySelector('.close-btn') as HTMLElement);
        await user.click(screen.getByRole('button', { name: 'Выйти' }));

        expect(container.querySelector('#mapScreen')).toHaveClass('active');
        expect(score(container)).toBe('🏆 100');
    });

    test('победа → «На карту» показывает тот же счёт 100', async () => {
        const { user, container } = renderApp();

        await startGame(user, container);
        await playCorrectly(user, container);
        await user.click(screen.getByRole('button', { name: 'На карту' }));

        expect(container.querySelector('#mapScreen')).toHaveClass('active');
        expect(score(container)).toBe('🏆 100');
    });

    test('смена карты после победы читает счёт каждой карты заново', async () => {
        const { user, container } = renderApp();
        CONFIG.MAPS.push(ENGLISH);
        try {
            await startGame(user, container);
            await playCorrectly(user, container);
            await user.click(screen.getByRole('button', { name: 'На карту' }));

            await user.click(screen.getByRole('button', { name: 'Выбор карты' }));
            await user.click(screen.getByText('Английский'));
            expect(score(container)).toBe('🏆 0');

            await user.click(screen.getByRole('button', { name: 'Выбор карты' }));
            await user.click(screen.getByText('Математика'));
            expect(score(container)).toBe('🏆 100');
        } finally {
            CONFIG.MAPS.pop();
        }
    });
});
