// ============================================
// SRC/COMPONENTS/MapScreen.tsx — карта предмета (1.8.0)
// ============================================
// Разметка 1:1 с удалённой map-view.js: .map с ref и высотой полотна,
// полосы зон, одна SVG-дорога, 15 тренажёров, игрок и модалка выбора сложности.
// Только презентация: клики уходят в пропсы, логика — в useMap.

import type { RefObject } from 'react';
import { Player } from './Player';
import { Path } from './Path';
import { Trainer } from './Trainer';
import { Zone } from './Zone';

export interface MapScreenProps {
    stats: MapData;
    mapData: MapViewData;
    isMoving: boolean;
    isModalOpen: boolean;
    modalTarget: MapModalTarget | null;
    selectedDifficulty: Difficulty;
    mapRef: RefObject<HTMLDivElement | null>;
    onTrainerClick(zone: Zone | undefined, trainerNumber: number, trainerIndex: number): void;
    onSelectDifficulty(difficulty: Difficulty): void;
    onCancel(): void;
    onPlayerArrived(): void;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: '😊 Легко' },
    { value: 'medium', label: '🤔 Средне' },
    { value: 'hard', label: '😎 Сложно' }
];

export function MapScreen({
    stats,
    mapData,
    isMoving,
    isModalOpen,
    modalTarget,
    selectedDifficulty,
    mapRef,
    onTrainerClick,
    onSelectDifficulty,
    onCancel,
    onPlayerArrived
}: MapScreenProps) {
    const { zones, geometry, playerPoint } = mapData;
    const currentIndex = PlayerRules.normalizeIndex(stats.currentTrainerIndex, geometry.trainers.length);

    const handleTrainerSelect = (index: number): void => {
        const trainer = geometry.trainers[index];
        if (!trainer) return;
        const zone = zones.find((item) => item.id === trainer.zoneId);
        onTrainerClick(zone, trainer.number, trainer.index);
    };

    return (
        <>
            <div className="map" ref={mapRef} style={{ height: geometry.height + 'px' }}>
                {geometry.bands.map((band, bandIndex) => {
                    const firstTrainer = geometry.trainers.filter((item) => item.zoneId === band.id)[0];
                    const titleSide = firstTrainer && firstTrainer.x > geometry.width / 2 ? 'left' : 'right';

                    return (
                        <Zone
                            key={band.id}
                            band={band}
                            isFirst={bandIndex === 0}
                            isLast={bandIndex === geometry.bands.length - 1}
                            titleSide={titleSide}
                        />
                    );
                })}

                <Path width={geometry.width} height={geometry.height} d={geometry.roadPath} />

                {geometry.trainers.map((trainer) => (
                    <Trainer
                        key={trainer.index}
                        trainer={trainer}
                        action={PlayerRules.getAction(currentIndex, trainer.index)}
                        onSelect={handleTrainerSelect}
                    />
                ))}

                <Player point={playerPoint} isMoving={isMoving} onArrived={onPlayerArrived} />
            </div>

            {isModalOpen && modalTarget && (
                <div className="modal-overlay open">
                    <div className="modal">
                        <h2>
                            {(modalTarget.zoneTitle ? modalTarget.zoneTitle + ' · ' : '') +
                                'Тренажёр ' +
                                modalTarget.trainerNumber}
                        </h2>
                        <div className="difficulty-options">
                            {DIFFICULTIES.map((item) => (
                                <button
                                    key={item.value}
                                    className={'diff-btn' + (selectedDifficulty === item.value ? ' selected' : '')}
                                    type="button"
                                    data-diff={item.value}
                                    onClick={() => onSelectDifficulty(item.value)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <button className="btn btn-secondary" type="button" onClick={onCancel}>
                            Отмена
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
