// ============================================
// MODEL/MAP-CATALOG.JS — каталог карт (предметов)
// ============================================

/**
 * Каталог карт. Только чтение CONFIG.MAPS:
 * без DOM, Storage и Stats.
 */
const MapCatalog = {
    /**
     * Возвращает карту по идентификатору.
     * Неизвестный или отсутствующий id → карта по умолчанию.
     * @param {string} [id]
     * @returns {GameMap}
     */
    get(id) {
        const maps = this._all();
        return maps.find((map) => map.id === id) || this.getDefault();
    },

    /**
     * Возвращает карту по умолчанию (CONFIG.DEFAULT_MAP,
     * фолбэк — первая карта каталога).
     * @returns {GameMap}
     */
    getDefault() {
        const maps = this._all();
        return maps.find((map) => map.id === CONFIG.DEFAULT_MAP) || maps[0];
    },

    /**
     * Есть ли карта с таким id в каталоге.
     * @param {string} id
     * @returns {boolean}
     */
    has(id) {
        return this._all().some((map) => map.id === id);
    },

    /**
     * Список карт каталога.
     * @returns {GameMap[]}
     */
    _all() {
        return Array.isArray(CONFIG.MAPS) ? CONFIG.MAPS : [];
    }
};
