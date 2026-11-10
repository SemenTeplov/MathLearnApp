// App при старте: ошибка хранилища до подписки доходит до игрока (A86/A91, TR-81),
// сообщения показываются очередью без потерь и замен (A94/T88, TR-91).

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { App } from '../../src/App';
import { ErrorBus } from '../../src/app/error-bus';
import type { Services } from '../../src/app/types';
import { CONFIG } from '../../src/core/config';
import { StorageUnavailableError } from '../../src/core/errors';
import { StatsService } from '../../src/data/stats-service';
import type { Repository } from '../../src/data/repository';
import { MemoryRepository } from '../support/memory-repository';
import { ControlledChannel, resetChannels, sendFromOtherTab } from '../support/session-channel';
import { arrive } from '../support/app-drivers';

function makeServices(repo: Repository) {
    const errors = new ErrorBus();
    const stats = new StatsService(repo, errors);
    const audio = { play: vi.fn(), preload: vi.fn() };
    return { services: { audio, stats, errors } as unknown as Services, stats, audio };
}

beforeEach(() => {
    resetChannels();
    localStorage.clear();
    vi.stubGlobal('BroadcastChannel', ControlledChannel);
});
afterEach(() => vi.unstubAllGlobals());

describe('App — стартовая ошибка хранилища', () => {
    test('повреждённая запись: модалка, счёт 0, карта активна, раунд стартует', async () => {
        const user = userEvent.setup();
        const repo = new MemoryRepository();
        repo.save({ version: CONFIG.VERSION + 1, totalScore: 100 });
        const { services, audio } = makeServices(repo);
        const { container } = render(<App services={services} />);

        expect(await screen.findByRole('heading', { name: 'Ошибка хранилища' })).toBeInTheDocument();
        expect(screen.getByText('Данные повреждены. Счёт сброшен.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'OK' }));

        expect(screen.getByText('🏆 0')).toBeInTheDocument();
        expect(container.querySelector('#mapScreen')).toHaveClass('active');
        expect(audio.play).toHaveBeenCalledWith('click');

        await arrive(user, container);
        await user.click(container.querySelector('[data-diff="easy"]') as HTMLElement);
        expect(container.querySelector('#gameScreen')).toHaveClass('active');
    });

    test('недоступное хранилище: модалка, save не бросает, игра идёт', async () => {
        const user = userEvent.setup();
        const repo = new MemoryRepository();
        vi.spyOn(repo, 'load').mockImplementationOnce(() => {
            throw new StorageUnavailableError('Нет хранилища.');
        });
        const { services } = makeServices(repo);
        const { container } = render(<App services={services} />);

        expect(await screen.findByRole('heading', { name: 'Ошибка хранилища' })).toBeInTheDocument();
        expect(screen.getByText('Хранилище недоступно. Игра работает без сохранения.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'OK' }));

        expect(() => services.stats.updateAfterRound(10)).not.toThrow();
        expect(services.stats.updateAfterRound(10)).toBe(true);

        await arrive(user, container);
        await user.click(container.querySelector('[data-diff="easy"]') as HTMLElement);
        expect(container.querySelector('#gameScreen')).toHaveClass('active');
    });

    test('повторный монтаж (StrictMode) показывает модалку один раз', async () => {
        const user = userEvent.setup();
        const repo = new MemoryRepository();
        repo.save({ version: CONFIG.VERSION + 1, totalScore: 100 });
        const { services } = makeServices(repo);
        render(
            <StrictMode>
                <App services={services} />
            </StrictMode>
        );

        expect(await screen.findByRole('heading', { name: 'Ошибка хранилища' })).toBeInTheDocument();
        expect(screen.getAllByRole('heading', { name: 'Ошибка хранилища' })).toHaveLength(1);

        await user.click(screen.getByRole('button', { name: 'OK' }));
        expect(screen.queryByRole('heading', { name: 'Ошибка хранилища' })).toBeNull();
    });
});

describe('App — очередь сообщений', () => {
    test('два report() подряд: первое, затем второе, затем модалки нет', async () => {
        const user = userEvent.setup();
        const { services } = makeServices(new MemoryRepository());
        render(<App services={services} />);

        act(() => {
            services.errors.report('Первая ошибка', 'Первое сообщение.');
            services.errors.report('Вторая ошибка', 'Второе сообщение.');
        });

        expect(screen.getByRole('heading', { name: 'Первая ошибка' })).toBeInTheDocument();
        expect(screen.queryByText('Второе сообщение.')).toBeNull();

        await user.click(screen.getByRole('button', { name: 'OK' }));
        expect(screen.queryByRole('heading', { name: 'Первая ошибка' })).toBeNull();
        expect(screen.getByRole('heading', { name: 'Вторая ошибка' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'OK' }));
        expect(screen.queryByRole('heading', { name: 'Вторая ошибка' })).toBeNull();
    });

    test('стартовая ошибка хранилища не теряется при busy второй вкладки', async () => {
        const user = userEvent.setup();
        const repo = new MemoryRepository();
        repo.save({ version: CONFIG.VERSION + 1, totalScore: 100 });
        const { services } = makeServices(repo);
        render(<App services={services} />);
        sendFromOtherTab(0, { type: 'busy' });

        expect(await screen.findByRole('heading', { name: 'Ошибка хранилища' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'OK' }));

        expect(screen.getByRole('heading', { name: 'Игра уже запущена' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Ошибка хранилища' })).toBeNull();

        await user.click(screen.getByRole('button', { name: 'OK' }));
        expect(screen.queryByRole('heading', { name: 'Игра уже запущена' })).toBeNull();
    });
});
