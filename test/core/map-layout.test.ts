// Боевая геометрия карты: полосы, тренажёры, путь и точка игрока.

import { describe, expect, test } from 'vitest';
import { MapLayout } from '../../src/core/map-layout';
import type { TrainerPoint, Zone } from '../../src/core/types';

const zones: Zone[] = [
    { id: 'addition', title: 'Сложение', color: '#4CAF50', trainersCount: 5 },
    { id: 'subtraction', title: 'Вычитание', color: '#2196F3', trainersCount: 5 },
    { id: 'multiplication', title: 'Умножение', color: '#FF9800', trainersCount: 5 }
];

describe('MapLayout.buildLayout', () => {
    test('строит по тренажёру на каждую позицию', () => {
        const layout = MapLayout.buildLayout(zones, 600);

        expect(layout.trainers).toHaveLength(15);
        expect(layout.width).toBe(600);
        expect(layout.height).toBe(1500);
    });

    test('расстояние между соседними тренажёрами ровно 100px, включая границу зон', () => {
        const layout = MapLayout.buildLayout(zones, 600);
        const ys = layout.trainers.map((trainer) => trainer.y);

        expect(ys[0]).toBe(50);
        expect(ys[ys.length - 1]).toBe(1450);
        for (let i = 1; i < ys.length; i++) {
            expect(ys[i] - ys[i - 1]).toBe(100);
        }
        expect(ys[5] - ys[4]).toBe(100);
    });

    test('полосы зон стыкуются без зазоров', () => {
        const layout = MapLayout.buildLayout(zones, 600);

        expect(layout.bands.map((band) => band.top)).toEqual([0, 500, 1000]);
        expect(layout.bands.map((band) => band.height)).toEqual([500, 500, 500]);
        expect(layout.bands[2].top + layout.bands[2].height).toBe(layout.height);
    });

    test('тренажёры чередуются влево/вправо и не выходят за границы', () => {
        const layout = MapLayout.buildLayout(zones, 600);
        const xs = layout.trainers.map((trainer) => trainer.x);

        expect(xs[0]).toBe(192);
        expect(xs[1]).toBe(408);
        expect(xs[2]).toBe(192);
        xs.forEach((x) => {
            expect(x).toBeGreaterThanOrEqual(MapLayout.TRAINER_SIZE / 2);
            expect(x).toBeLessThanOrEqual(600 - MapLayout.TRAINER_SIZE / 2);
        });
    });

    test('у каждого тренажёра плоский индекс совпадает с порядком', () => {
        const layout = MapLayout.buildLayout(zones, 600);

        layout.trainers.forEach((trainer, position) => {
            expect(trainer.index).toBe(position);
        });
        expect(layout.trainers[14].index).toBe(14);
    });

    test('сохраняет данные зоны в полосе', () => {
        const layout = MapLayout.buildLayout(zones, 600);

        expect(layout.bands[0]).toMatchObject({
            id: 'addition',
            title: 'Сложение',
            color: '#4CAF50'
        });
    });

    test('на узком экране 320px тренажёры не выходят за границы', () => {
        const layout = MapLayout.buildLayout(zones, 320);
        const half = MapLayout.TRAINER_SIZE / 2;

        layout.trainers.forEach((trainer) => {
            expect(trainer.x - half).toBeGreaterThanOrEqual(0);
            expect(trainer.x + half).toBeLessThanOrEqual(320);
        });
    });

    test('при нулевой ширине использует фолбэк', () => {
        expect(MapLayout.buildLayout(zones, 0).width).toBe(MapLayout.FALLBACK_WIDTH);
    });

    test('без зон возвращает пустую карту', () => {
        const layout = MapLayout.buildLayout([], 600);

        expect(layout.trainers).toHaveLength(0);
        expect(layout.height).toBe(0);
        expect(layout.roadPath).toBe('');
    });

    test('зона с нулём тренажёров не создаёт полосу-призрак', () => {
        const layout = MapLayout.buildLayout(
            [{ id: 'empty', title: 'Пусто', color: '#000000', trainersCount: 0 }, zones[0]],
            600
        );

        expect(layout.trainers).toHaveLength(5);
        expect(layout.bands[0].height).toBe(0);
        expect(layout.bands[1].top).toBe(0);
    });
});

describe('MapLayout.buildRoadPath', () => {
    test('строит один непрерывный путь кубическими кривыми', () => {
        const path = MapLayout.buildLayout(zones, 600).roadPath;

        expect(path.startsWith('M 192 50')).toBe(true);
        expect(path.endsWith('192 1450')).toBe(true);
        expect((path.match(/C/g) || []).length).toBe(14);
        expect(path).not.toMatch(/L/);
    });

    test('первая и последняя точки совпадают с тренажёрами', () => {
        const layout = MapLayout.buildLayout(zones, 600);
        const first = layout.trainers[0];
        const last = layout.trainers[layout.trainers.length - 1];

        expect(layout.roadPath.startsWith('M ' + first.x + ' ' + first.y)).toBe(true);
        expect(layout.roadPath.endsWith(last.x + ' ' + last.y)).toBe(true);
    });

    test('пустой список даёт пустую строку', () => {
        expect(MapLayout.buildRoadPath([])).toBe('');
    });

    test('один тренажёр даёт только M', () => {
        expect(MapLayout.buildRoadPath([{ x: 10, y: 20 }])).toBe('M 10 20');
    });
});

describe('MapLayout.getPlayerPoint', () => {
    const layout = MapLayout.buildLayout(zones, 600);

    test('размер игрока совпадает с тренажёром, старт — на PLAYER_START_GAP выше', () => {
        expect(MapLayout.PLAYER_SIZE).toBe(52);
        expect(MapLayout.PLAYER_START_GAP).toBe(20);
        expect(MapLayout.getPlayerPoint(layout.trainers, -1)).toEqual({ x: 192, y: 30 });
    });

    test('индекс 14 — точка последнего тренажёра', () => {
        expect(MapLayout.getPlayerPoint(layout.trainers, 14)).toEqual({ x: 192, y: 1450 });
    });

    test('индекс за границей клампится к последнему тренажёру', () => {
        expect(MapLayout.getPlayerPoint(layout.trainers, 99)).toEqual({ x: 192, y: 1450 });
    });

    test('точка совпадает с центром выбранного тренажёра', () => {
        const point = MapLayout.getPlayerPoint(layout.trainers, 3);

        expect(point).toEqual({ x: layout.trainers[3].x, y: layout.trainers[3].y });
    });

    test('пустой список → null', () => {
        expect(MapLayout.getPlayerPoint([], 0)).toBeNull();
        expect(MapLayout.getPlayerPoint(null as unknown as TrainerPoint[], 0)).toBeNull();
    });
});
