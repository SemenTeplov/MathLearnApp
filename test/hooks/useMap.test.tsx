// useMap: позиция игрока, движение 600 мс, модалка сложности, откат и запись
// индекса. Сервисы: реальный StatsService + фейковый звук.

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ErrorBus } from '../../src/app/error-bus';
import type { Services } from '../../src/app/types';
import { CONFIG } from '../../src/core/config';
import { MapLayout } from '../../src/core/map-layout';
import { MemoryRepository } from '../support/memory-repository';
import { StatsService } from '../../src/data/stats-service';
import { useMap } from '../../src/hooks/useMap';

const ADDITION = CONFIG.ZONES[0];

function setup(startIndex = -1) {
    const repo = new MemoryRepository();
    const errors = new ErrorBus();
    const stats = new StatsService(repo, errors);
    if (startIndex >= 0) stats.saveTrainerIndex(startIndex);
    const audio = { play: vi.fn() };
    const services = { audio, stats } as unknown as Services;
    const view = renderHook(() => useMap(services));
    return { ...view, stats, repo, audio };
}

describe('useMap', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test('старт: счёт и позиция из сервиса, геометрия из MapLayout (600px)', () => {
        const { result } = setup();

        expect(result.current.stats).toEqual({ totalScore: 0, currentTrainerIndex: -1 });
        expect(result.current.mapData.zones).toEqual(CONFIG.ZONES);
        expect(result.current.mapData.geometry).toEqual(MapLayout.buildLayout(CONFIG.ZONES, MapLayout.FALLBACK_WIDTH));
        expect(result.current.mapData.geometry.trainers).toHaveLength(15);
        expect(result.current.mapData.playerPoint).not.toBeNull();
    });

    test('клик по текущему тренажёру открывает модалку сложности', () => {
        const { result } = setup(0);

        act(() => result.current.onTrainerClick(ADDITION, 1, 0));

        expect(result.current.isModalOpen).toBe(true);
        expect(result.current.modalTarget).toEqual({ zoneTitle: 'Сложение', trainerNumber: 1 });
    });

    test('клик по соседнему запускает движение и звук', () => {
        const { result, audio } = setup();

        act(() => result.current.onTrainerClick(ADDITION, 1, 0));

        expect(result.current.isMoving).toBe(true);
        expect(result.current.stats.currentTrainerIndex).toBe(0);
        expect(audio.play).toHaveBeenCalledWith('click');
    });

    test('arrived() завершает движение и открывает модалку', () => {
        const { result } = setup();
        act(() => result.current.onTrainerClick(ADDITION, 1, 0));

        act(() => result.current.arrived());

        expect(result.current.isMoving).toBe(false);
        expect(result.current.isModalOpen).toBe(true);
        expect(result.current.modalTarget).toEqual({ zoneTitle: 'Сложение', trainerNumber: 1 });
    });

    test('дальний тренажёр игнорируется: ни звука, ни движения, ни модалки', () => {
        const { result, audio } = setup();

        act(() => result.current.onTrainerClick(ADDITION, 4, 3));

        expect(result.current.isMoving).toBe(false);
        expect(result.current.isModalOpen).toBe(false);
        expect(result.current.stats.currentTrainerIndex).toBe(-1);
        expect(audio.play).not.toHaveBeenCalled();
    });

    test('cancel() откатывает индекс и закрывает модалку', () => {
        const { result, audio } = setup();
        act(() => result.current.onTrainerClick(ADDITION, 1, 0));
        act(() => result.current.arrived());

        act(() => result.current.cancel());

        expect(result.current.isModalOpen).toBe(false);
        expect(result.current.modalTarget).toBeNull();
        expect(result.current.stats.currentTrainerIndex).toBe(-1);
        expect(audio.play).toHaveBeenCalledWith('click');
    });

    test('chooseDifficulty(hard) запоминает сложность и закрывает модалку', () => {
        const { result } = setup(0);
        act(() => result.current.onTrainerClick(ADDITION, 1, 0));

        act(() => result.current.chooseDifficulty('hard'));

        expect(result.current.selectedDifficulty).toBe('hard');
        expect(result.current.isModalOpen).toBe(false);
    });

    test('gameFinished(true) закрепляет победу, повтор — no-op', () => {
        const { result, stats } = setup();
        const save = vi.spyOn(stats, 'saveTrainerIndex');
        act(() => result.current.onTrainerClick(ADDITION, 1, 0));
        act(() => result.current.arrived());

        act(() => result.current.gameFinished(true));
        act(() => result.current.gameFinished(true));

        expect(save).toHaveBeenCalledTimes(1);
        expect(save).toHaveBeenCalledWith(0);
        expect(stats.getTrainerIndex()).toBe(0);
    });

    test('gameFinished(false) откатывает индекс без закрепления', () => {
        const { result, stats } = setup();
        const save = vi.spyOn(stats, 'saveTrainerIndex');
        act(() => result.current.onTrainerClick(ADDITION, 1, 0));

        act(() => result.current.gameFinished(false));

        expect(save).toHaveBeenCalledWith(-1);
        expect(result.current.stats.currentTrainerIndex).toBe(-1);
        expect(stats.getTrainerIndex()).toBe(-1);
    });

    test('exitGame() откатывает индекс без записи в статистику', () => {
        const { result, stats } = setup(0);
        const save = vi.spyOn(stats, 'saveTrainerIndex');
        act(() => result.current.onTrainerClick(ADDITION, 2, 1));

        act(() => result.current.exitGame());

        expect(result.current.stats.currentTrainerIndex).toBe(0);
        expect(save).not.toHaveBeenCalled();
    });

    test('resize пересчитывает ширину через 100 мс debounce', () => {
        vi.useFakeTimers();
        const { result } = setup();
        const element = document.createElement('div');
        Object.defineProperty(element, 'clientWidth', { value: 800, configurable: true });
        (result.current.mapRef as { current: HTMLDivElement | null }).current = element;

        act(() => {
            window.dispatchEvent(new Event('resize'));
        });
        act(() => vi.advanceTimersByTime(99));
        expect(result.current.mapData.geometry.width).toBe(MapLayout.FALLBACK_WIDTH);

        act(() => vi.advanceTimersByTime(1));
        expect(result.current.mapData.geometry.width).toBe(800);
    });
});
