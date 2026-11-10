// ============================================
// TEST/SUPPORT/MEMORY-REPOSITORY.TS — тестовый двойник Repository (1.10.1)
// ============================================
// Живёт в test/, а не в src/: в проде используется только LocalStorageRepository,
// поэтому класс-двойник не должен попадать в бандл и в coverage src/**.

import { Repository } from '../../src/data/repository';

/** Глубокая копия через JSON — как сериализация localStorage (T84.4). */
function copy(value: unknown): unknown {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

/**
 * Реализация Repository в памяти.
 * Данные не сохраняются между перезапусками и между тестами; save/load
 * сериализуют их так же, как localStorage, а не делят один объект.
 */
export class MemoryRepository extends Repository {
    _data: unknown = null;

    /** Сохраняет данные в память. */
    save(data: unknown): void {
        this._data = copy(data);
    }

    /** Загружает данные из памяти (копия, а не сохранённый объект). */
    load(): unknown {
        return copy(this._data);
    }

    /** Очищает данные в памяти. */
    clear(): void {
        this._data = null;
    }
}
