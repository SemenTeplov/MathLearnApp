// ============================================
// TEST/SUPPORT/STATS-FIXTURES.TS — фикстуры сьюта StatsService (1.10.0)
// ============================================

import { vi } from 'vitest';
import { ErrorBus } from '../../src/app/error-bus';
import { handleError } from '../../src/core/error-handler';
import { CONFIG } from '../../src/core/config';
import type { GameMap, Stats } from '../../src/core/types';
import { StatsService } from '../../src/data/stats-service';
import { MemoryRepository } from './memory-repository';

/** Временная вторая карта каталога. */
export const ENGLISH: GameMap = { id: 'english', title: 'Английский', zones: [] };
/** Пустые данные одной карты. */
export const emptyMap = { totalScore: 0, currentTrainerIndex: -1 };

/** Добавляет вторую карту каталога на время теста и убирает её после. */
export function withEnglish<T>(fn: () => T): T {
    CONFIG.MAPS.push(ENGLISH);
    try {
        return fn();
    } finally {
        CONFIG.MAPS.pop();
    }
}

/** Ожидаемая статистика по умолчанию (математика, версия 3). */
export function defaults(): Stats {
    return { version: 3, currentMap: 'math', maps: { math: { ...emptyMap } } };
}

/** Связка «репозиторий + шина + сервис + опубликованные сообщения». */
export interface ServiceKit {
    repo: MemoryRepository;
    errors: ErrorBus;
    received: string[][];
    stats: StatsService;
}

/** Фабрика сервиса: память вместо диска, шина с записью сообщений. */
export function makeService(): ServiceKit {
    const repo = new MemoryRepository();
    const errors = new ErrorBus();
    const received: string[][] = [];
    errors.subscribe((title, message) => received.push([title, message]));
    return { repo, errors, received, stats: new StatsService(repo, errors) };
}

/** Ожидаемая запись v3 для карты math. */
export function mapStats(totalScore: number, currentTrainerIndex = -1): Stats {
    return { version: 3, currentMap: 'math', maps: { math: { totalScore, currentTrainerIndex } } };
}

/** Заставляет метод репозитория бросать заданную ошибку. */
export function failsOn(repo: MemoryRepository, method: 'load' | 'save', error: Error): void {
    vi.spyOn(repo, method).mockImplementation(() => {
        throw error;
    });
}

/** Читает запись репозитория как Stats без приведения типов в каждом тесте. */
export function read(repo: MemoryRepository): Stats {
    return repo.load() as Stats;
}

/** Мок handleError, который для неизвестной ошибки ведёт себя как настоящий. */
export function rethrowing(): void {
    const mock = vi.mocked(handleError);
    mock.mockImplementation((error: Error) => {
        throw error;
    });
}
