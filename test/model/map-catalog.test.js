// Каталог карт: get / getDefault / has
const fs = require('fs');

eval(fs.readFileSync('./js/model/map-catalog.js', 'utf8') + '\nglobal.MapCatalog = MapCatalog;');

/** Добавляет временную вторую карту и убирает её после теста. */
function withMap(map, fn) {
    CONFIG.MAPS.push(map);
    try {
        fn();
    } finally {
        CONFIG.MAPS.pop();
    }
}

describe('MapCatalog — get', () => {
    test('известная карта возвращается по id', () => {
        expect(MapCatalog.get('math').id).toBe('math');
    });

    test('возвращает объект из каталога, а не копию', () => {
        expect(MapCatalog.get('math')).toBe(CONFIG.MAPS[0]);
    });

    test('неизвестный id → карта по умолчанию', () => {
        expect(MapCatalog.get('chemistry').id).toBe('math');
    });

    test('undefined → карта по умолчанию', () => {
        expect(MapCatalog.get(undefined).id).toBe('math');
        expect(MapCatalog.get(null).id).toBe('math');
    });

    test('вторая карта каталога доступна по своему id', () => {
        withMap({ id: 'english', title: 'Английский', zones: [] }, () => {
            expect(MapCatalog.get('english').title).toBe('Английский');
        });
    });
});

describe('MapCatalog — getDefault / has', () => {
    test('getDefault() возвращает CONFIG.DEFAULT_MAP', () => {
        expect(MapCatalog.getDefault().id).toBe('math');
    });

    test('getDefault() без DEFAULT_MAP в каталоге → первая карта', () => {
        const saved = CONFIG.DEFAULT_MAP;
        CONFIG.DEFAULT_MAP = 'chemistry';
        try {
            expect(MapCatalog.getDefault().id).toBe('math');
        } finally {
            CONFIG.DEFAULT_MAP = saved;
        }
    });

    test('has() подтверждает карту каталога', () => {
        expect(MapCatalog.has('math')).toBe(true);
    });

    test('has() отклоняет неизвестную карту', () => {
        expect(MapCatalog.has('chemistry')).toBe(false);
        expect(MapCatalog.has(undefined)).toBe(false);
    });
});
