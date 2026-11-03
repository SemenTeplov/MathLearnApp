// ============================================
// SRC/HOOKS/useMap.ts — карта: позиция игрока, движение, модалка (1.8.0)
// ============================================
// PlayerState + CSS transition 600ms + onTransitionEnd (A47), без setTimeout.
// Ширина полотна — ref на .map + замер после рендера (как в 1.5.0).

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { config } from '../config';

export interface UseMap {
    stats: MapData;
    mapData: MapViewData;
    isMoving: boolean;
    isModalOpen: boolean;
    modalTarget: MapModalTarget | null;
    selectedDifficulty: Difficulty;
    mapRef: React.RefObject<HTMLDivElement | null>;
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
function readMapState(): MapState {
    const map = MapCatalog.get(StatsService.getCurrentMap());
    const zones: Zone[] = Array.isArray(map && map.zones) ? map.zones : config.ZONES;
    const total = zones.reduce((sum, zone) => sum + (zone.trainersCount || 0), 0);

    return {
        zones,
        totalScore: StatsService.getTotalScore(),
        currentTrainerIndex: PlayerRules.normalizeIndex(StatsService.getTrainerIndex(), total)
    };
}

export function useMap(): UseMap {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<PlayerState | null>(null);
    const pendingRef = useRef<MapModalTarget | null>(null);

    const [state, setState] = useState<MapState>(readMapState);
    playerRef.current ??= new PlayerState(state.currentTrainerIndex);

    const [width, setWidth] = useState<number>(MapLayout.FALLBACK_WIDTH);
    const [isMoving, setIsMoving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTarget, setModalTarget] = useState<MapModalTarget | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(config.START_DIFFICULTY);

    const measure = useCallback(() => {
        const element = mapRef.current;
        if (!element) return;
        const measured = element.clientWidth;
        if (measured > 0) {
            setWidth((prev) => (Math.abs(measured - prev) > 0.5 ? measured : prev));
        }
    }, []);

    // Замер после каждого рендера: ширина меняется при появлении скроллбара.
    useLayoutEffect(() => {
        measure();
    });

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

    const geometry: MapGeometry = MapLayout.buildLayout(state.zones, width);
    const playerPoint = MapLayout.getPlayerPoint(geometry.trainers, state.currentTrainerIndex);
    const mapData: MapViewData = { zones: state.zones, geometry, playerPoint };

    const reload = useCallback(() => {
        pendingRef.current = null;
        const next = readMapState();
        playerRef.current = new PlayerState(next.currentTrainerIndex);
        setIsMoving(false);
        setIsModalOpen(false);
        setModalTarget(null);
        setState(next);
    }, []);

    const onTrainerClick = useCallback((zone: Zone | undefined, trainerNumber: number, trainerIndex: number) => {
        if (isMoving || isModalOpen) return;

        const player = playerRef.current;
        if (!player) return;

        const action = PlayerRules.getAction(player.index, trainerIndex);
        if (action === 'ignore') return;

        AudioService.play('click');

        if (action === 'play') {
            setModalTarget({ zoneTitle: zone ? zone.title : '', trainerNumber });
            setIsModalOpen(true);
            return;
        }

        player.moveTo(trainerIndex);
        pendingRef.current = { zoneTitle: zone ? zone.title : '', trainerNumber };
        setIsMoving(true);
        setState((prev) => ({ ...prev, currentTrainerIndex: trainerIndex }));
    }, [isMoving, isModalOpen]);

    const arrived = useCallback(() => {
        const target = pendingRef.current;
        pendingRef.current = null;
        setIsMoving(false);

        if (target) {
            setModalTarget(target);
            setIsModalOpen(true);
        }
    }, []);

    const cancel = useCallback(() => {
        AudioService.play('click');
        setIsModalOpen(false);
        setModalTarget(null);

        const player = playerRef.current;
        if (!player) return;

        const index = player.revert();
        setState((prev) => ({ ...prev, currentTrainerIndex: index }));
    }, []);

    const chooseDifficulty = useCallback((difficulty: Difficulty) => {
        AudioService.play('click');
        setSelectedDifficulty(difficulty);
        setIsModalOpen(false);
        setModalTarget(null);
    }, []);

    const gameFinished = useCallback((isSuccessful: boolean) => {
        const player = playerRef.current;
        if (!player) return;

        if (player.isReplay()) return;

        if (isSuccessful) {
            StatsService.saveTrainerIndex(player.commitWin());
        } else {
            player.revert();
            StatsService.saveTrainerIndex(player.index);
        }

        setState((prev) => ({
            ...prev,
            currentTrainerIndex: player.index,
            totalScore: StatsService.getTotalScore()
        }));
    }, []);

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
