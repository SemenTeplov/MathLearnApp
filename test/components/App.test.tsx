// App: интеграция на реальных хуках и фейковом Services (D41) — карта, движение,
// игра, результаты, ошибки хранилища, блокировка второй вкладки и выход (TR-83).

import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CONFIG } from '../../src/core/config';
import type { GameMap } from '../../src/core/types';
import { ControlledChannel, resetChannels, sendFromOtherTab } from '../support/session-channel';
import { answers, arrive, playToResults, startGame, trainers } from '../support/app-drivers';
import { renderApp } from '../support/app-setup';

const ENGLISH: GameMap = { id: 'english', title: 'Английский', zones: CONFIG.ZONES };

beforeEach(() => {
    resetChannels();
    localStorage.clear();
    vi.stubGlobal('BroadcastChannel', ControlledChannel);
});
afterEach(() => vi.unstubAllGlobals());

describe('App', () => {
    test('первый рендер: карта активна, 15 тренажёров, счёт из статистики', () => {
        const { container } = renderApp((services) => services.stats.updateAfterRound(40));

        expect(container.querySelector('#mapScreen')).toHaveClass('active');
        expect(trainers(container)).toHaveLength(15);
        expect(screen.getByText('🏆 40')).toHaveClass('total-score');
    });

    test('клик по соседнему и transitionend открывают модалку сложности', async () => {
        const { user, container } = renderApp();

        await arrive(user, container);

        expect(await screen.findByRole('heading', { name: 'Сложение · Тренажёр 1' })).toBeInTheDocument();
        expect(container.querySelector('#gameScreen')).not.toHaveClass('active');
    });

    test('выбор сложности стартует игру: игровой экран, вопрос и 4 ответа', async () => {
        const { user, container } = renderApp();

        await startGame(user, container);

        expect(container.querySelector('#gameScreen')).toHaveClass('active');
        expect(container.querySelector('.question')).not.toBeEmptyDOMElement();
        expect(answers(container)).toHaveLength(4);
        expect(container.querySelector('#resultScreen')).not.toHaveClass('active');
    });

    test('раунд завершается экраном результатов за ≤ 10 итераций', async () => {
        const { user, container } = renderApp();
        await startGame(user, container);

        const iterations = await playToResults(user, container);

        expect(iterations).toBeLessThanOrEqual(10);
        expect(container.querySelector('#resultScreen')).toHaveClass('active');
        expect(screen.getByText('Правильных')).toBeInTheDocument();
        expect(screen.getByText('Очков')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Играть снова' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'На карту' })).toBeInTheDocument();
    });

    test('🌍 открывает модалку выбора карты, текущая карта выделена', async () => {
        const { user, container } = renderApp();

        await user.click(screen.getByRole('button', { name: 'Выбор карты' }));

        expect(screen.getByRole('heading', { name: 'Выбор карты' })).toBeInTheDocument();
        expect(container.querySelector('.map-select-item.selected')).toHaveTextContent('Математика');
    });

    test('смена карты: switchMap(true) меняет карту и закрывает модалку', async () => {
        const { user, services } = renderApp();
        CONFIG.MAPS.push(ENGLISH);
        try {
            await user.click(screen.getByRole('button', { name: 'Выбор карты' }));
            await user.click(screen.getByText('Английский'));

            expect(services.stats.getCurrentMap()).toBe('english');
            expect(screen.queryByRole('heading', { name: 'Выбор карты' })).toBeNull();
        } finally {
            CONFIG.MAPS.pop();
        }
    });

    test('та же карта: модалка остаётся, звук не растёт', async () => {
        const { user, services, audio } = renderApp();
        await user.click(screen.getByRole('button', { name: 'Выбор карты' }));
        const callsBefore = audio.play.mock.calls.length;

        await user.click(screen.getByText('Математика'));

        expect(audio.play.mock.calls.length).toBe(callsBefore);
        expect(screen.getByRole('heading', { name: 'Выбор карты' })).toBeInTheDocument();
        expect(services.stats.getCurrentMap()).toBe('math');
    });

    test('busy от вкладки-владельца показывает модалку, «OK» закрывает', async () => {
        const { user, audio } = renderApp();

        sendFromOtherTab(0, { type: 'busy' });

        expect(screen.getByRole('heading', { name: 'Игра уже запущена' })).toBeInTheDocument();
        expect(screen.getByText('Закройте другую вкладку с MathLingo.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'OK' }));

        expect(screen.queryByRole('heading', { name: 'Игра уже запущена' })).toBeNull();
        expect(audio.play).toHaveBeenCalledWith('click');
    });

    test('заблокированная вкладка не начинает раунд и повторяет модалку', async () => {
        const { user, container } = renderApp();
        sendFromOtherTab(0, { type: 'busy' });

        await arrive(user, container);
        await user.click(container.querySelector('[data-diff="easy"]') as HTMLElement);

        expect(container.querySelector('#gameScreen')).not.toHaveClass('active');
        expect(screen.getByRole('heading', { name: 'Игра уже запущена' })).toBeInTheDocument();
    });

    test('ошибка data-слоя показывается модалкой через шину и закрывается', async () => {
        const { user, services } = renderApp();

        act(() => services.errors.report('Ошибка хранилища', 'Данные повреждены. Счёт сброшен.'));

        expect(screen.getByRole('heading', { name: 'Ошибка хранилища' })).toBeInTheDocument();
        expect(screen.getByText('Данные повреждены. Счёт сброшен.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'OK' }));
        expect(screen.queryByRole('heading', { name: 'Ошибка хранилища' })).toBeNull();
    });

    test('«На карту» с результатов возвращает на карту', async () => {
        const { user, container } = renderApp();
        await startGame(user, container);
        await playToResults(user, container);

        await user.click(screen.getByRole('button', { name: 'На карту' }));

        expect(container.querySelector('#mapScreen')).toHaveClass('active');
        expect(container.querySelector('#resultScreen')).not.toHaveClass('active');
    });

    test('✕ → «Остаться»: экран игры активен, статистика не изменилась', async () => {
        const { user, container, services } = renderApp();
        await startGame(user, container);

        await user.click(container.querySelector('.close-btn') as HTMLElement);
        expect(screen.getByRole('heading', { name: 'Выйти из игры?' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Остаться' }));

        expect(container.querySelector('#gameScreen')).toHaveClass('active');
        expect(services.stats.getTotalScore()).toBe(0);
    });

    test('✕ → «Выйти»: карта активна, счёт раунда не записан', async () => {
        const { user, container, services } = renderApp();
        await startGame(user, container);

        await user.click(container.querySelector('.close-btn') as HTMLElement);
        await user.click(screen.getByRole('button', { name: 'Выйти' }));

        expect(container.querySelector('#mapScreen')).toHaveClass('active');
        expect(container.querySelector('#gameScreen')).not.toHaveClass('active');
        expect(services.stats.getTotalScore()).toBe(0);
    });

    test('звук кликов приходит из App/хуков, а не из компонентов', async () => {
        const { user, container, audio } = renderApp();

        await arrive(user, container);

        expect(audio.play).toHaveBeenCalledWith('click');
    });
});
