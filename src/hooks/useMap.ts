// ============================================
// SRC/HOOKS/useMap.ts — карта: позиция, движение, модалка (1.10.0)
// ============================================
// PlayerState + transition 600ms + onTransitionEnd (A47); ширина — ref .map.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Services } from '../app/types';
import { CONFIG } from '../core/config';
import { MapCatalog } from '../core/map-catalog';
import { MapLayout } from '../core/map-layout';
import { PlayerRules } from '../core/player-rules';
import { PlayerState } from '../core/player-state';
import type { Difficulty, MapData, Zone } from '../core/types';
import type { MapModalTarget, MapViewData } from '../ui/types';

export interface UseMap {
    stats: MapData;
    mapData: MapViewData;
    isMoving: boolean;
    isModalOpen: boolean;
    modalTarget: MapModalTarget | null;
    selectedDifficulty: Difficulty;
    mapRef: RefObject<HTMLDivElement | null>;
    onTrainerClick(zone: Zone | undefined, trainerNumber: number, trainerIndex: number): void;
    chooseDifficulty(difficulty: Difficulty): void;
    cancel(): void;
    arrived(): void;
    gameFinished(isSuccessful: boolean): void;
    exitGame(): void;
    reload(): void;
}

interface MapState extends MapData {
    zones: Zone[];
}

/** Снимок карты из каталога и Stats (позиция нормализуется). */
function readMapState(services: Services): MapState {
    const map = MapCatalog.get(services.stats.getCurrentMap());
    const zones: Zone[] = Array.isArray(map && map.zones) ? map.zones : CONFIG.ZONES;
    const total = zones.reduce((sum, zone) => sum + (zone.trainersCount || 0), 0);
    return {
        zones,
        totalScore: services.stats.getTotalScore(),
        currentTrainerIndex: PlayerRules.normalizeIndex(services.stats.getTrainerIndex(), total)
    };
}

export function useMap(services: Services): UseMap {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<PlayerState | null>(null);
    const pendingRef = useRef<MapModalTarget | null>(null);
    const [state, setState] = useState<MapState>(() => readMapState(services));
    playerRef.current ??= new PlayerState(state.currentTrainerIndex);
    const [width, setWidth] = useState<number>(MapLayout.FALLBACK_WIDTH);
    const [isMoving, setIsMoving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTarget, setModalTarget] = useState<MapModalTarget | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(CONFIG.START_DIFFICULTY);
    const measure = useCallback(() => {
        const element = mapRef.current;
        if (!element) return;
        const measured = element.clientWidth;
        if (measured > 0) setWidth((prev) => (Math.abs(measured - prev) > 0.5 ? measured : prev));
    }, []);

    // Замер после каждого рендера: ширина меняется при появлении скроллбара.
    useLayoutEffect(measure);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        const onResize = (): void => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                timer = null;
                measure();
            }, 100);
        };
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            if (timer) clearTimeout(timer);
        };
    }, [measure]);

    const geometry = MapLayout.buildLayout(state.zones, width);
    const playerPoint = MapLayout.getPlayerPoint(geometry.trainers, state.currentTrainerIndex);
    const mapData: MapViewData = { zones: state.zones, geometry, playerPoint };
    const reload = useCallback(() => {
        pendingRef.current = null;
        const next = readMapState(services);
        playerRef.current = new PlayerState(next.currentTrainerIndex);
        setIsMoving(false);
        setIsModalOpen(false);
        setModalTarget(null);
        setState(next);
    }, [services]);
    const onTrainerClick = useCallback(
        (zone: Zone | undefined, trainerNumber: number, trainerIndex: number) => {
            if (isMoving || isModalOpen) return;

            const player = playerRef.current;
            if (!player) return;

            const action = PlayerRules.getAction(player.index, trainerIndex);
            if (action === 'ignore') return;

            services.audio.play('click');

            if (action === 'play') {
                setModalTarget({ zoneTitle: zone ? zone.title : '', trainerNumber });
                setIsModalOpen(true);
                return;
            }

            player.moveTo(trainerIndex);
            pendingRef.current = { zoneTitle: zone ? zone.title : '', trainerNumber };
            setIsMoving(true);
            setState((prev) => ({ ...prev, currentTrainerIndex: trainerIndex }));
        },
        [isMoving, isModalOpen, services]
    );

    const arrived = useCallback(() => {
        const target = pendingRef.current;
        pendingRef.current = null;
        setIsMoving(false);
        if (!target) return;
        setModalTarget(target);
        setIsModalOpen(true);
    }, []);

    const cancel = useCallback(() => {
        services.audio.play('click');
        setIsModalOpen(false);
        setModalTarget(null);

        const player = playerRef.current;
        if (!player) return;

        const index = player.revert();
        setState((prev) => ({ ...prev, currentTrainerIndex: index }));
    }, [services]);

    const chooseDifficulty = useCallback(
        (difficulty: Difficulty) => {
            services.audio.play('click');
            setSelectedDifficulty(difficulty);
            setIsModalOpen(false);
            setModalTarget(null);
        },
        [services]
    );

    const gameFinished = useCallback(
        (isSuccessful: boolean) => {
            const player = playerRef.current;
            if (!player || player.isReplay()) return;

            if (isSuccessful) {
                services.stats.saveTrainerIndex(player.commitWin());
            } else {
                services.stats.saveTrainerIndex(player.revert());
            }

            // Счёт читается из хранилища после записи раунда (A82).
            setState((prev) => ({
                ...prev,
                currentTrainerIndex: player.index,
                totalScore: services.stats.getTotalScore()
            }));
        },
        [services]
    );

    const exitGame = useCallback(() => {
        const player = playerRef.current;
        if (!player || player.isReplay()) return;

        const index = player.revert();
        setState((prev) => ({ ...prev, currentTrainerIndex: index }));
    }, []);

    return {
        stats: { totalScore: state.totalScore, currentTrainerIndex: state.currentTrainerIndex },
        mapData,
        isMoving,
        isModalOpen,
        modalTarget,
        selectedDifficulty,
        mapRef,
        onTrainerClick,
        chooseDifficulty,
        cancel,
        arrived,
        gameFinished,
        exitGame,
        reload
    };
}
