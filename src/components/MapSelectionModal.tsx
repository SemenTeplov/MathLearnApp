// ============================================
// SRC/COMPONENTS/MapSelectionModal.tsx — выбор карты (1.8.0)
// ============================================
// Разметка 1:1 с удалённой global-map-view.js: .modal-overlay.open →
// .modal → h2 → .map-select-list с .map-select-item (selected у текущей) →
// кнопка «Закрыть». Только презентация.

import type { GameMap } from '../core/types';

export interface MapSelectionModalProps {
    maps: GameMap[];
    currentMap: string;
    onSelect(mapId: string): void;
    onClose(): void;
}

export function MapSelectionModal({ maps, currentMap, onSelect, onClose }: MapSelectionModalProps) {
    return (
        <div className="modal-overlay open">
            <div className="modal">
                <h2>Выбор карты</h2>
                <div className="map-select-list">
                    {maps.map((map) => (
                        <button
                            key={map.id}
                            className={'map-select-item' + (map.id === currentMap ? ' selected' : '')}
                            type="button"
                            data-map={map.id}
                            onClick={() => onSelect(map.id)}
                        >
                            {map.title}
                        </button>
                    ))}
                </div>
                <button className="btn btn-secondary" type="button" onClick={onClose}>
                    Закрыть
                </button>
            </div>
        </div>
    );
}
