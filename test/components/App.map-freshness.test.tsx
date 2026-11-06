// App: свежесть общего счёта на карте — «Играть снова» → ✕ и «На карту» (TR-74, A82).

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { App } from '../../src/App';
import { ErrorBus } from '../../src/app/error-bus';
import type { Services } from '../../src/app/types';
import { StatsService } from '../../src/data/stats-service';
import { MemoryRepository } from '../support/memory-repository';
import { ControlledChannel, resetChannels } from '../support/session-channel';
import { playCorrectly, score, startGame } from '../support/app-drivers';

function makeServices(): Services {
    const errors = new ErrorBus();
    const stats = new StatsService(new MemoryRepository(), errors);
    const audio = { play: vi.fn(), preload: vi.fn() };
    return { audio, stats, errors } as unknown as Services;
}

/** Карта → сложность → победа 10/10 → экран результатов. */
async function winRound(user: ReturnType<typeof userEvent.setup>, container: HTMLElement): Promise<void> {
    await startGame(user, container);
    await playCorrectly(user, container);
}

beforeEach(() => {
    resetChannels();
    localStorage.clear();
    vi.stubGlobal('BroadcastChannel', ControlledChannel);
    vi.stubGlobal(
        'confirm',
        vi.fn(() => true)
    );
});
afterEach(() => vi.unstubAllGlobals());

describe('App — актуальный счёт на карте', () => {
    test('победа → «Играть снова» → ✕ показывает 100 очков', async () => {
        const user = userEvent.setup();
        const { container } = render(<App services={makeServices()} />);
        expect(score(container)).toBe('🏆 0');

        await winRound(user, container);

        expect(screen.getByText('Заработано: 100 ✓')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Играть снова' }));
        await user.click(container.querySelector('.close-btn') as HTMLElement);

        expect(container.querySelector('#mapScreen')).toHaveClass('active');
        expect(score(container)).toBe('🏆 100');
    });

    test('победа → «На карту» показывает тот же счёт 100', async () => {
        const user = userEvent.setup();
        const { container } = render(<App services={makeServices()} />);

        await winRound(user, container);
        await user.click(screen.getByRole('button', { name: 'На карту' }));

        expect(container.querySelector('#mapScreen')).toHaveClass('active');
        expect(score(container)).toBe('🏆 100');
    });
});
