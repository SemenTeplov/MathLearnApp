// ============================================
// CORE/MAP-CATALOG.TS — каталог карт (предметов) (1.8.2)
// ============================================

import { CONFIG } from './config';
import type { GameMap } from './types';

/**
 * Каталог карт. Только чтение CONFIG.MAPS:
 * без DOM, Storage и Stats.
 */
export const MapCatalog = {
    /** Возвращает карту по идентификатору; неизвестный id → карта по умолчанию. */
    get(id?: string): GameMap {
        const maps = this._all();
        return maps.find((map) => map.id === id) || this.getDefault();
    },

    /** Карта по умолчанию (CONFIG.DEFAULT_MAP, фолбэк — первая карта каталога). */
    getDefault(): GameMap {
        const maps = this._all();
        return maps.find((map) => map.id === CONFIG.DEFAULT_MAP) || maps[0];
    },

    /** Есть ли карта с таким id в каталоге. */
    has(id: string): boolean {
        return this._all().some((map) => map.id === id);
    },

    /** Список карт каталога. */
    _all(): GameMap[] {
        return Array.isArray(CONFIG.MAPS) ? CONFIG.MAPS : [];
    }
};
