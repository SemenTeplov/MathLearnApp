// ============================================
// LOGIC/MAP-LAYOUT.JS — геометрия карты (переехал из view/ в 1.8.0)
// ============================================

/**
 * Чистая геометрия карты: полосы зон, координаты тренажёров, путь дороги
 * и точка игрока. Не обращается к DOM и CONFIG — удобно для юнит-тестов.
 */
const MapLayout = {
    TRAINER_SPACING: 100,
    TRAINER_SIZE: 52,
    PLAYER_SIZE: 52,
    PLAYER_START_GAP: 20,
    TOP_OFFSET: 50,
    AMPLITUDE_RATIO: 0.18,
    AMPLITUDE_MIN: 60,
    AMPLITUDE_MAX: 110,
    FALLBACK_WIDTH: 600,

    /**
     * Строит раскладку карты по списку зон.
     * @param {Zone[]} zones — зоны из CONFIG.ZONES
     * @param {number} width — ширина полотна в px
     * @returns {MapGeometry}
     */
    buildLayout(zones, width) {
        const list = Array.isArray(zones) ? zones : [];
        const canvasWidth = this._normalizeWidth(width);
        const centerX = canvasWidth / 2;
        const amplitude = this._amplitude(canvasWidth);
        const bands = [];
        const trainers = [];
        let top = 0;

        list.forEach((zone) => {
            const count = Math.max(0, Math.floor(zone.trainersCount) || 0);
            bands.push({
                id: zone.id,
                title: zone.title,
                color: zone.color,
                top: top,
                height: count * this.TRAINER_SPACING
            });

            for (let number = 1; number <= count; number++) {
                const index = trainers.length;
                trainers.push({
                    index: index,
                    zoneId: zone.id,
                    number: number,
                    x: this._round(centerX + (index % 2 === 0 ? -amplitude : amplitude)),
                    y: top + (number - 0.5) * this.TRAINER_SPACING
                });
            }

            top += count * this.TRAINER_SPACING;
        });

        return {
            width: canvasWidth,
            height: top,
            bands: bands,
            trainers: trainers,
            roadPath: this.buildRoadPath(trainers)
        };
    },

    /**
     * Точка игрока для указанного индекса.
     * @param {TrainerPoint[]} trainers — тренажёры из buildLayout()
     * @param {number} index — плоский индекс игрока
     * @returns {Point|null} — null для пустой карты
     */
    getPlayerPoint(trainers, index) {
        if (!Array.isArray(trainers) || trainers.length === 0) return null;

        if (index < 0) {
            const first = trainers[0];
            return { x: first.x, y: first.y - this.PLAYER_START_GAP };
        }

        const point = trainers[Math.min(Math.floor(index), trainers.length - 1)];
        return { x: point.x, y: point.y };
    },

    /**
     * Строит один непрерывный SVG-путь по всем тренажёрам.
     * @param {Point[]} trainers
     * @returns {string} — значение атрибута d
     */
    buildRoadPath(trainers) {
        const points = Array.isArray(trainers) ? trainers : [];
        if (points.length === 0) return '';

        let d = 'M ' + this._round(points[0].x) + ' ' + this._round(points[0].y);

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const point = points[i];
            const half = (point.y - prev.y) / 2;

            d += ' C ' + this._round(prev.x) + ' ' + this._round(prev.y + half) +
                ', ' + this._round(point.x) + ' ' + this._round(point.y - half) +
                ', ' + this._round(point.x) + ' ' + this._round(point.y);
        }

        return d;
    },

    /**
     * Приводит ширину к положительному числу.
     * @param {number} width
     * @returns {number}
     */
    _normalizeWidth(width) {
        const value = Number(width);
        return value > 0 ? value : this.FALLBACK_WIDTH;
    },

    /**
     * Боковое смещение тренажёров от центра.
     * @param {number} width
     * @returns {number}
     */
    _amplitude(width) {
        const value = width * this.AMPLITUDE_RATIO;
        return Math.min(this.AMPLITUDE_MAX, Math.max(this.AMPLITUDE_MIN, value));
    },

    /**
     * Округляет координату до 0.1px.
     * @param {number} value
     * @returns {number}
     */
    _round(value) {
        return Math.round(value * 10) / 10;
    }
};
