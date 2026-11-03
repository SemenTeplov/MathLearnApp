// ============================================
// DATA/LOCAL-REPOSITORY.TS — localStorage реализация (1.8.2)
// ============================================

import {
    CorruptedDataError,
    QuotaExceededError,
    StorageUnavailableError
} from '../core/errors';
import { Repository } from './repository';

/** Реализация Repository через localStorage. */
export class LocalStorageRepository extends Repository {
    _key: string;

    /** @param key — ключ в localStorage */
    constructor(key: string) {
        super();
        this._key = key;
    }

    /** Сохраняет данные. */
    save(data: unknown): void {
        try {
            localStorage.setItem(this._key, JSON.stringify(data));
        } catch (e) {
            const error = e as { name?: string; code?: number };
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                throw new QuotaExceededError('Превышена квота хранилища.');
            }
            throw new StorageUnavailableError('Не удалось сохранить данные.');
        }
    }

    /** Загружает данные. */
    load(): unknown {
        try {
            const raw = localStorage.getItem(this._key);
            if (raw === null || raw === undefined) {
                return null;
            }
            return JSON.parse(raw) as unknown;
        } catch (e) {
            if (e instanceof SyntaxError) {
                throw new CorruptedDataError('Данные повреждены.');
            }
            throw new StorageUnavailableError('Не удалось загрузить данные.');
        }
    }

    /** Очищает данные. */
    clear(): void {
        localStorage.removeItem(this._key);
    }
}
