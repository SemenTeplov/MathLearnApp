// ============================================
// SRC/COMPONENTS/Trainer.tsx — кнопка-тренажёр (1.8.0)
// ============================================
// Разметка 1:1 с _buildTrainer + markTrainers: data-zone/data-trainer/data-index,
// координаты и класс доступности по PlayerRules.getAction().

import type { CSSProperties } from 'react';

export interface TrainerProps {
    trainer: TrainerPoint;
    action: 'play' | 'move' | 'ignore';
    onSelect(index: number): void;
}

const ACTION_CLASS: Record<TrainerProps['action'], string> = {
    play: 'map-trainer--current',
    move: 'map-trainer--near',
    ignore: 'map-trainer--far'
};

export function Trainer({ trainer, action, onSelect }: TrainerProps) {
    const style: CSSProperties = {
        left: trainer.x + 'px',
        top: trainer.y + 'px'
    };

    return (
        <button
            className={'map-trainer ' + ACTION_CLASS[action]}
            type="button"
            data-zone={trainer.zoneId}
            data-trainer={trainer.number}
            data-index={trainer.index}
            style={style}
            onClick={() => onSelect(trainer.index)}
        >
            {trainer.number}
        </button>
    );
}
