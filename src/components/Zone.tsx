// ============================================
// SRC/COMPONENTS/Zone.tsx — полоса зоны карты (1.8.0)
// ============================================
// Разметка 1:1 с _buildZone из удалённой map-view.js: классы, data-zone,
// CSS-переменная --zone-color и подпись сбоку.

import type { CSSProperties } from 'react';
import type { MapBand } from '../core/types';

export interface ZoneProps {
    band: MapBand;
    isFirst: boolean;
    isLast: boolean;
    titleSide: 'left' | 'right';
}

export function Zone({ band, isFirst, isLast, titleSide }: ZoneProps) {
    const className = 'map-zone' + (isFirst ? ' map-zone--first' : '') + (isLast ? ' map-zone--last' : '');
    const style = {
        top: band.top + 'px',
        height: band.height + 'px',
        '--zone-color': band.color
    } as CSSProperties;

    return (
        <div className={className} data-zone={band.id} style={style}>
            <span className={'map-zone-title map-zone-title--' + titleSide}>{band.title}</span>
        </div>
    );
}
