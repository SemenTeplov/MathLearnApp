// ============================================
// SRC/HOOKS/useMapSelection.ts — модалка выбора карты (1.8.0)
// ============================================
// Перенос модалки выбора карты из 1.7.0. Выбор той же или неизвестной
// карты — полный no-op (без звука, закрытия и записи) — A31/Z14.

import { useCallback, useState } from 'react';

export interface UseMapSelection {
    isOpen: boolean;
    maps: GameMap[];
    currentMap: string;
    open(): void;
    close(): void;
    select(mapId: string): void;
}

/**
 * @param onMapChanged — вызывается после успешной смены карты
 */
export function useMapSelection(onMapChanged: () => void): UseMapSelection {
    const [isOpen, setIsOpen] = useState(false);
    const [maps, setMaps] = useState<GameMap[]>([]);
    const [currentMap, setCurrentMap] = useState('');

    const open = useCallback(() => {
        AudioService.play('click');
        setMaps(CONFIG.MAPS);
        setCurrentMap(StatsService.getCurrentMap());
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        AudioService.play('click');
        setIsOpen(false);
    }, []);

    const select = useCallback((mapId: string) => {
        if (!StatsService.switchMap(mapId)) {
            return;
        }

        AudioService.play('click');
        setIsOpen(false);
        onMapChanged();
    }, [onMapChanged]);

    return { isOpen, maps, currentMap, open, close, select };
}
