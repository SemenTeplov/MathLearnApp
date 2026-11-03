// ============================================
// MODEL/STATS-SCHEMA.JS — структура Stats v3 и миграции
// ============================================

/**
 * Схема сохранённой статистики: версия, текущая карта и данные по картам.
 * Только данные: без DOM, Storage, сервисов и звука.
 */
const StatsSchema = {
    /**
     * Пустые данные одной карты.
     * @returns {MapData}
     */
    emptyMap() {
        return { totalScore: 0, currentTrainerIndex: -1 };
    },

    /**
     * Статистика по умолчанию: все карты каталога, пустая позиция.
     * @returns {Stats}
     */
    defaults() {
        const maps = {};
        this._mapIds().forEach((id) => {
            maps[id] = this.emptyMap();
        });

        return {
            version: CONFIG.VERSION,
            currentMap: CONFIG.DEFAULT_MAP,
            maps
        };
    },

    /**
     * Данные текущей карты (T25).
     * @param {Stats} stats
     * @returns {MapData}
     */
    entry(stats) {
        return stats.maps[stats.currentMap];
    },

    /**
     * Приводит запись к актуальной версии (пошагово 1 → 2 → 3).
     * @param {Object} data — сохранённая запись
     * @returns {Stats}
     */
    migrate(data) {
        const stats = data || {};
        const current = CONFIG.VERSION;
        let version = stats.version || 0;

        if (version > current) {
            throw new CorruptedDataError('Формат данных новее текущего.');
        }

        while (version < current) {
            version++;
            switch (version) {
                case 2:
                    stats.currentTrainerIndex = -1;
                    break;
                case 3:
                    this._toMaps(stats);
                    break;
                default:
                    break;
            }
        }

        stats.version = current;
        return this.ensureMaps(stats);
    },

    /**
     * Дополняет запись недостающими картами и полями (US-38).
     * Неизвестный currentMap заменяется картой по умолчанию,
     * данные остальных карт сохраняются.
     * @param {Stats} stats
     * @returns {Stats}
     */
    ensureMaps(stats) {
        if (!stats.maps || typeof stats.maps !== 'object') {
            stats.maps = {};
        }

        this._mapIds().forEach((id) => {
            const map = stats.maps[id];
            if (!map || typeof map !== 'object') {
                stats.maps[id] = this.emptyMap();
                return;
            }
            if (map.totalScore == null) map.totalScore = 0;
            if (map.currentTrainerIndex == null) map.currentTrainerIndex = -1;
        });

        if (!MapCatalog.has(stats.currentMap)) {
            stats.currentMap = this._defaultId();
        }

        return stats;
    },

    /**
     * Переносит плоские поля версии 2 в карту по умолчанию.
     * @param {Object} stats
     */
    _toMaps(stats) {
        const maps = stats.maps && typeof stats.maps === 'object' ? stats.maps : {};
        const mapId = MapCatalog.has(stats.currentMap) ? stats.currentMap : this._defaultId();
        const existing = maps[mapId] && typeof maps[mapId] === 'object' ? maps[mapId] : {};

        maps[mapId] = {
            totalScore: stats.totalScore == null ? (existing.totalScore || 0) : stats.totalScore,
            currentTrainerIndex: stats.currentTrainerIndex == null
                ? (existing.currentTrainerIndex == null ? -1 : existing.currentTrainerIndex)
                : stats.currentTrainerIndex
        };

        stats.maps = maps;
        stats.currentMap = mapId;

        delete stats.totalScore;
        delete stats.currentTrainerIndex;
    },

    /**
     * Идентификаторы карт каталога.
     * @returns {string[]}
     */
    _mapIds() {
        const maps = Array.isArray(CONFIG.MAPS) ? CONFIG.MAPS : [];
        return maps.map((map) => map.id);
    },

    /**
     * Идентификатор карты по умолчанию.
     * @returns {string}
     */
    _defaultId() {
        const map = MapCatalog.getDefault();
        return map ? map.id : CONFIG.DEFAULT_MAP;
    }
};
