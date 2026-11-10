// ============================================
// DATA/MEMORY-FALLBACK.TS — режим «память вместо диска» (1.10.0)
// ============================================
// Декоратор Repository: хранит копию данных в памяти. После переключения
// основной репозиторий не вызывается ни на чтение, ни на запись (T72).
// Сигнатура Repository не меняется; режим не переживает перезагрузку страницы.

import { Repository } from './repository';

/** Глубокая копия значения: память не делит объекты с вызывающим кодом. */
function copy(value: unknown): unknown {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

/** Резервный репозиторий в памяти на время сессии. */
export class MemoryFallback extends Repository {
    _data: unknown;

    /** @param initial — текущие значения, перенесённые из основного хранилища */
    constructor(initial: unknown = null) {
        super();
        this._data = copy(initial);
    }

    /** Сохраняет данные в память. */
    save(data: unknown): void {
        this._data = copy(data);
    }

    /** Загружает данные из памяти. */
    load(): unknown {
        return copy(this._data);
    }

    /** Очищает данные в памяти. */
    clear(): void {
        this._data = null;
    }
}

/** Фабрика резервного репозитория: получает снимок основного хранилища. */
export type FallbackFactory = (snapshot: unknown) => Repository;

/** Фабрика по умолчанию — MemoryFallback с переносом текущих значений. */
export const createMemoryFallback: FallbackFactory = (snapshot) => new MemoryFallback(snapshot);
