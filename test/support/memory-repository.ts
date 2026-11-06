// ============================================
// TEST/SUPPORT/MEMORY-REPOSITORY.TS — тестовый двойник Repository (1.9.0)
// ============================================
// Живёт в test/, а не в src/: в проде используется только LocalStorageRepository,
// поэтому класс-двойник не должен попадать в бандл и в coverage src/**.

import { Repository } from '../../src/data/repository';

/**
 * Реализация Repository в памяти.
 * Данные не сохраняются между перезапусками и между тестами.
 */
export class MemoryRepository extends Repository {
    _data: unknown = null;

    /** Сохраняет данные в память. */
    save(data: unknown): void {
        this._data = data;
    }

    /** Загружает данные из памяти. */
    load(): unknown {
        return this._data;
    }

    /** Очищает данные в памяти. */
    clear(): void {
        this._data = null;
    }
}
