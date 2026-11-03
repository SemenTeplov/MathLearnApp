// ============================================
// SRC/COMPONENTS/Player.tsx — игрок на карте (1.8.0)
// ============================================
// Разметка 1:1 с MapPlayerView: .map-player с 🚶 и transform-переводом.
// Движение — CSS transition 600ms (map-player.css) + onTransitionEnd (A47).

import type { TransitionEvent } from 'react';

export interface PlayerProps {
    point: Point | null;
    isMoving: boolean;
    onArrived(): void;
}

export function Player({ point, isMoving, onArrived }: PlayerProps) {
    if (!point) {
        return null;
    }

    const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>): void => {
        if (event.propertyName !== 'transform') return;
        if (event.target !== event.currentTarget) return;
        if (!isMoving) return;
        onArrived();
    };

    const style = {
        transform: 'translate(' + point.x + 'px, ' + point.y + 'px) translate(-50%, -50%)'
    };

    return (
        <div className="map-player" style={style} onTransitionEnd={handleTransitionEnd}>
            🚶
        </div>
    );
}
