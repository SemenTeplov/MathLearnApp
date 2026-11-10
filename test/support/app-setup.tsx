// ============================================
// TEST/SUPPORT/APP-SETUP.TSX — рендер App на реальных хуках (1.10.1)
// ============================================
// Фейковый Services (D41): MemoryRepository + ErrorBus + звук-шпион.
// Один вызов вместо трёх строк в каждом тесте App-сьютов.

import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { App } from '../../src/App';
import { ErrorBus } from '../../src/app/error-bus';
import type { Services } from '../../src/app/types';
import { StatsService } from '../../src/data/stats-service';
import type { Repository } from '../../src/data/repository';
import { MemoryRepository } from './memory-repository';
import type { User } from './app-drivers';

export interface AppKit {
    user: User;
    container: HTMLElement;
    services: Services;
    audio: { play: ReturnType<typeof vi.fn>; preload: ReturnType<typeof vi.fn> };
}

/** Сервисы App: реальный StatsService на двойнике, шина и звук-шпион. */
export function makeAppServices(repo: Repository = new MemoryRepository()): Omit<AppKit, 'user' | 'container'> {
    const errors = new ErrorBus();
    const stats = new StatsService(repo, errors);
    const audio = { play: vi.fn(), preload: vi.fn() };
    return { services: { audio, stats, errors } as unknown as Services, audio };
}

/** Рендер App: `prepare` правит статистику до первого чтения карты. */
export function renderApp(prepare?: (services: Services) => void): AppKit {
    const { services, audio } = makeAppServices();
    prepare?.(services);
    const { container } = render(<App services={services} />);
    return { user: userEvent.setup(), container, services, audio };
}
