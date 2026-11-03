// ============================================
// SRC/HOOKS/useMapSelection.ts — модалка выбора карты (1.8.2)
// ============================================
// Выбор той же или неизвестной карты — полный no-op (без звука, закрытия
// и записи) — A31/Z14.

import { useCallback, useState } from 'react';
import type { Services } from '../app/types';
import { CONFIG } from '../core/config';
import type { GameMap } from '../core/types';

export interface UseMapSelection {
    isOpen: boolean;
    maps: GameMap[];
    currentMap: string;
    open(): void;
    close(): void;
    select(mapId: string): void;
}

/**
 * @param services — сервисы приложения (статистика, звук)
 * @param onMapChanged — вызывается после успешной смены карты
 */
export function useMapSelection(
    services: Services,
    onMapChanged: () => void
): UseMapSelection {
    const [isOpen, setIsOpen] = useState(false);
    const [maps, setMaps] = useState<GameMap[]>([]);
    const [currentMap, setCurrentMap] = useState('');

    const open = useCallback(() => {
        services.audio.play('click');
        setMaps(CONFIG.MAPS);
        setCurrentMap(services.stats.getCurrentMap());
        setIsOpen(true);
    }, [services]);

    const close = useCallback(() => {
        services.audio.play('click');
        setIsOpen(false);
    }, [services]);

    const select = useCallback((mapId: string) => {
        if (!services.stats.switchMap(mapId)) {
            return;
        }

        services.audio.play('click');
        setIsOpen(false);
        onMapChanged();
    }, [onMapChanged, services]);

    return { isOpen, maps, currentMap, open, close, select };
}
