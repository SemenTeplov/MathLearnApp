// App: интеграция на реальных хуках и фейковом Services (D41) — карта, движение,
// игра, результаты, ошибки хранилища и блокировка второй вкладки.

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { App } from '../../src/App';
import { ErrorBus } from '../../src/app/error-bus';
import type { Services } from '../../src/app/types';
import { CONFIG } from '../../src/core/config';
import type { GameMap } from '../../src/core/types';
import { StatsService } from '../../src/data/stats-service';
import { MemoryRepository } from '../support/memory-repository';
import { ControlledChannel, resetChannels, sendFromOtherTab } from '../support/session-channel';
import { answers, arrive, playToResults, startGame, trainers } from '../support/app-drivers';

const ENGLISH: GameMap = { id: 'english', title: 'Английский', zones: CONFIG.ZONES };

function makeServices() {
    const errors = new ErrorBus();
    const stats = new StatsService(new MemoryRepository(), errors);
    const audio = { play: vi.fn(), preload: vi.fn() };
    return { services: { audio, stats, errors } as unknown as Services, audio, errors };
}

beforeEach(() => {
    resetChannels();
    localStorage.clear();
    vi.stubGlobal('BroadcastChannel', ControlledChannel);
});
afterEach(() => vi.unstubAllGlobals());

describe('App', () => {
    test('первый рендер: карта активна, 15 тренажёров, счёт из статистики', () => {
        const { services } = makeServices();
        services.stats.updateAfterRound(40);
        const { container } = render(<App services={services} />);

        expect(container.querySelector('#mapScreen')).toHaveClass('active');
        expect(trainers(container)).toHaveLength(15);
        expect(screen.getByText('🏆 40')).toBeInTheDocument();
        expect(screen.getByText('🏆 40')).toHaveClass('total-score');
    });

    test('клик по соседнему и transitionend открывают модалку сложности', async () => {
        const user = userEvent.setup();
        const { services } = makeServices();
        const { container } = render(<App services={services} />);

        await arrive(user, container);

        expect(await screen.findByRole('heading', { name: 'Сложение · Тренажёр 1' })).toBeInTheDocument();
        expect(container.querySelector('#gameScreen')).not.toHaveClass('active');
    });

    test('выбор сложности стартует игру: игровой экран, вопрос и 4 ответа', async () => {
        const user = userEvent.setup();
        const { services } = makeServices();
        const { container } = render(<App services={services} />);

        await startGame(user, container);

        expect(container.querySelector('#gameScreen')).toHaveClass('active');
        expect(container.querySelector('.question')).not.toBeEmptyDOMElement();
        expect(answers(container)).toHaveLength(4);
        expect(container.querySelector('#resultScreen')).not.toHaveClass('active');
    });

    test('раунд завершается экраном результатов за ≤ 10 итераций', async () => {
        const user = userEvent.setup();
        const { services } = makeServices();
        const { container } = render(<App services={services} />);
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
        const user = userEvent.setup();
        const { services } = makeServices();
        const { container } = render(<App services={services} />);

        await user.click(screen.getByRole('button', { name: 'Выбор карты' }));

        expect(screen.getByRole('heading', { name: 'Выбор карты' })).toBeInTheDocument();
        expect(container.querySelector('.map-select-item.selected')).toHaveTextContent('Математика');
    });

    test('смена карты: switchMap(true) закрывает модалку и меняет текущую карту', async () => {
        const user = userEvent.setup();
        const { services } = makeServices();
        CONFIG.MAPS.push(ENGLISH);
        try {
            render(<App services={services} />);
            await user.click(screen.getByRole('button', { name: 'Выбор карты' }));
            await user.click(screen.getByText('Английский'));

            expect(services.stats.getCurrentMap()).toBe('english');
            expect(screen.queryByRole('heading', { name: 'Выбор карты' })).toBeNull();
        } finally {
            CONFIG.MAPS.pop();
        }
    });

    test('та же карта: модалка остаётся, звук не растёт', async () => {
        const user = userEvent.setup();
        const { services, audio } = makeServices();
        render(<App services={services} />);
        await user.click(screen.getByRole('button', { name: 'Выбор карты' }));
        const callsBefore = audio.play.mock.calls.length;

        await user.click(screen.getByText('Математика'));

        expect(audio.play.mock.calls.length).toBe(callsBefore);
        expect(screen.getByRole('heading', { name: 'Выбор карты' })).toBeInTheDocument();
        expect(services.stats.getCurrentMap()).toBe('math');
    });

    test('busy от вкладки-владельца показывает модалку, «OK» закрывает', async () => {
        const user = userEvent.setup();
        const { services, audio } = makeServices();
        render(<App services={services} />);

        sendFromOtherTab(0, { type: 'busy' });

        expect(screen.getByRole('heading', { name: 'Игра уже запущена' })).toBeInTheDocument();
        expect(screen.getByText('Закройте другую вкладку с MathLingo.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'OK' }));

        expect(screen.queryByRole('heading', { name: 'Игра уже запущена' })).toBeNull();
        expect(audio.play).toHaveBeenCalledWith('click');
    });

    test('заблокированная вкладка не начинает раунд и повторяет модалку', async () => {
        const user = userEvent.setup();
        const { services } = makeServices();
        const { container } = render(<App services={services} />);
        sendFromOtherTab(0, { type: 'busy' });

        await arrive(user, container);
        await user.click(container.querySelector('[data-diff="easy"]') as HTMLElement);

        expect(container.querySelector('#gameScreen')).not.toHaveClass('active');
        expect(screen.getByRole('heading', { name: 'Игра уже запущена' })).toBeInTheDocument();
    });

    test('ошибка data-слоя показывается модалкой через шину и закрывается', async () => {
        const user = userEvent.setup();
        const { services } = makeServices();
        render(<App services={services} />);

        act(() => services.errors.report('Ошибка хранилища', 'Данные повреждены. Счёт сброшен.'));

        expect(screen.getByRole('heading', { name: 'Ошибка хранилища' })).toBeInTheDocument();
        expect(screen.getByText('Данные повреждены. Счёт сброшен.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'OK' }));
        expect(screen.queryByRole('heading', { name: 'Ошибка хранилища' })).toBeNull();
    });

    test('«На карту» с результатов возвращает на карту', async () => {
        const user = userEvent.setup();
        const { services } = makeServices();
        const { container } = render(<App services={services} />);
        await startGame(user, container);
        await playToResults(user, container);

        await user.click(screen.getByRole('button', { name: 'На карту' }));

        expect(container.querySelector('#mapScreen')).toHaveClass('active');
        expect(container.querySelector('#resultScreen')).not.toHaveClass('active');
    });

    test('звук кликов приходит из App/хуков, а не из компонентов', async () => {
        const user = userEvent.setup();
        const { services, audio } = makeServices();
        const { container } = render(<App services={services} />);

        await arrive(user, container);

        expect(audio.play).toHaveBeenCalledWith('click');
    });
});
