// MapScreen: 15 тренажёров, классы доступности, клики, модалка сложности,
// прибытие игрока по transitionend (Path/Player/Trainer/Zone — через него).

import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { MapScreen } from '../../src/components/MapScreen';
import type { MapScreenProps } from '../../src/components/MapScreen';
import { CONFIG } from '../../src/core/config';
import { MapLayout } from '../../src/core/map-layout';
import type { MapData } from '../../src/core/types';

const GEOMETRY = MapLayout.buildLayout(CONFIG.ZONES, 600);
const MAP_DATA = { zones: CONFIG.ZONES, geometry: GEOMETRY, playerPoint: GEOMETRY.trainers[0] };

function makeProps(overrides: Partial<MapScreenProps> = {}): MapScreenProps {
    return {
        stats: { totalScore: 0, currentTrainerIndex: -1 } as MapData,
        mapData: MAP_DATA,
        isMoving: false,
        isModalOpen: false,
        modalTarget: null,
        selectedDifficulty: 'easy',
        mapRef: createRef<HTMLDivElement>(),
        onTrainerClick: vi.fn(),
        onSelectDifficulty: vi.fn(),
        onCancel: vi.fn(),
        onPlayerArrived: vi.fn(),
        ...overrides
    };
}

describe('MapScreen', () => {
    test('рисует 15 тренажёров и три зоны с подписями', () => {
        const { container } = render(<MapScreen {...makeProps()} />);
        const zones = container.querySelectorAll('.map-zone');

        expect(container.querySelectorAll('.map-trainer')).toHaveLength(15);
        expect(zones).toHaveLength(3);
        expect(Array.from(zones).map((item) => item.getAttribute('data-zone'))).toEqual([
            'addition',
            'subtraction',
            'multiplication'
        ]);
        expect(screen.getByText('Сложение')).toBeInTheDocument();
        expect(screen.getByText('Вычитание')).toBeInTheDocument();
        expect(screen.getByText('Умножение')).toBeInTheDocument();
        for (const zone of CONFIG.ZONES) {
            expect(container.querySelectorAll('.map-trainer[data-zone="' + zone.id + '"]')).toHaveLength(5);
        }
        expect(container.querySelectorAll('.map-road')).toHaveLength(1);
        expect(container.querySelectorAll('.map-player')).toHaveLength(1);
    });

    test('текущий тренажёр: --current, следующий --near, дальние --far', () => {
        const { container } = render(
            <MapScreen {...makeProps({ stats: { totalScore: 0, currentTrainerIndex: 0 } })} />
        );
        const trainers = container.querySelectorAll('.map-trainer');

        expect(trainers[0]).toHaveClass('map-trainer--current');
        expect(trainers[1]).toHaveClass('map-trainer--near');
        expect(trainers[2]).toHaveClass('map-trainer--far');
    });

    test('старт с −1: первый --near, остальные --far, --current нет', () => {
        const { container } = render(<MapScreen {...makeProps()} />);
        const trainers = container.querySelectorAll('.map-trainer');

        expect(trainers[0]).toHaveClass('map-trainer--near');
        expect(trainers[1]).toHaveClass('map-trainer--far');
        expect(container.querySelectorAll('.map-trainer--current')).toHaveLength(0);
    });

    test('клик по тренажёру отдаёт (зона, номер, индекс) из data-*', async () => {
        const user = userEvent.setup();
        const props = makeProps();
        const { container } = render(<MapScreen {...props} />);

        await user.click(container.querySelectorAll('.map-trainer')[2]);

        expect(props.onTrainerClick).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'addition', title: 'Сложение' }),
            3,
            2
        );
    });

    test('открытая модалка: заголовок зоны и номера, три сложности и «Отмена»', () => {
        const { container } = render(
            <MapScreen
                {...makeProps({
                    isModalOpen: true,
                    modalTarget: { zoneTitle: 'Сложение', trainerNumber: 1 }
                })}
            />
        );

        expect(screen.getByRole('heading', { name: 'Сложение · Тренажёр 1' })).toBeInTheDocument();
        expect(container.querySelectorAll('.diff-btn')).toHaveLength(3);
        expect(container.querySelectorAll('[data-diff]')).toHaveLength(3);
        expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
    });

    test('выбор сложности отдаёт difficulty', async () => {
        const user = userEvent.setup();
        const props = makeProps({
            isModalOpen: true,
            modalTarget: { zoneTitle: 'Сложение', trainerNumber: 1 }
        });
        const { container } = render(<MapScreen {...props} />);

        await user.click(container.querySelector('[data-diff="hard"]') as HTMLElement);

        expect(props.onSelectDifficulty).toHaveBeenCalledWith('hard');
    });

    test('«Отмена» вызывает onCancel, без isModalOpen модалки нет', async () => {
        const user = userEvent.setup();
        const props = makeProps({
            isModalOpen: true,
            modalTarget: { zoneTitle: 'Сложение', trainerNumber: 1 }
        });
        const { container, rerender } = render(<MapScreen {...props} />);

        await user.click(screen.getByRole('button', { name: 'Отмена' }));
        expect(props.onCancel).toHaveBeenCalledTimes(1);

        rerender(<MapScreen {...makeProps()} />);
        expect(container.querySelector('.modal-overlay')).toBeNull();
    });

    test('transitionend игрока при isMoving вызывает onPlayerArrived', () => {
        const props = makeProps({ isMoving: true });
        const { container } = render(<MapScreen {...props} />);
        const player = container.querySelector('.map-player') as HTMLElement;

        fireEvent.transitionEnd(player, { propertyName: 'transform' });

        expect(props.onPlayerArrived).toHaveBeenCalledTimes(1);
    });

    test('transitionend без isMoving не вызывает onPlayerArrived', () => {
        const props = makeProps();
        const { container } = render(<MapScreen {...props} />);

        fireEvent.transitionEnd(container.querySelector('.map-player') as HTMLElement, {
            propertyName: 'transform'
        });

        expect(props.onPlayerArrived).not.toHaveBeenCalled();
    });
});
