// ============================================
// DATA/MEMORY-REPOSITORY.TS — тестовая реализация (1.8.2)
// ============================================

import { Repository } from './repository';

/**
 * Тестовая реализация Repository в памяти.
 * Данные не сохраняются между перезапусками.
 */
export class MemoryRepository extends Repository {
    _data: unknown = null;

    constructor() {
        super();
    }

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
