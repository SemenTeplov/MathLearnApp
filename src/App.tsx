// ============================================
// SRC/APP.TSX — весь каркас приложения на React (1.8.2)
// ============================================
// 15.17: React рендерит #mapScreen и .app с теми же id/классами, что были
// в index.html; .active вычисляется из состояния, а не из DOM-роутера.
// Модалки — в дереве App. Состояние экранов — локальное (хуки), без сторов.

import { useCallback, useState } from 'react';
import type { Services } from './app/types';
import { ErrorModal } from './components/ErrorModal';
import { GameScreen } from './components/GameScreen';
import { Header } from './components/Header';
import { MapScreen } from './components/MapScreen';
import { MapSelectionModal } from './components/MapSelectionModal';
import { ResultsScreen } from './components/ResultsScreen';
import { useGame } from './hooks/useGame';
import { useMap } from './hooks/useMap';
import { useMapSelection } from './hooks/useMapSelection';
import { useResults } from './hooks/useResults';
import { useSessionLock } from './hooks/useSessionLock';
import type { Difficulty, GameResult } from './core/types';

type ScreenName = 'map' | 'game' | 'results';

interface ErrorMessage {
    title: string;
    message: string;
}

export interface AppProps {
    services: Services;
}

/** Класс экрана: `.screen` + `.active` у текущего (как в 1.7.0). */
function screenClass(name: ScreenName, current: ScreenName): string {
    return 'screen' + (name === current ? ' active' : '');
}

export function App({ services }: AppProps) {
    const [screen, setScreen] = useState<ScreenName>('map');
    const [error, setError] = useState<ErrorMessage | null>(null);

    const navigate = useCallback((name: ScreenName) => {
        setScreen(name);
    }, []);

    const showError = useCallback((title: string, message: string) => {
        setError({ title, message });
    }, []);

    useSessionLock(showError);

    const map = useMap(services);
    const results = useResults(services, map.gameFinished);

    // Методы хуков деструктурируются: объекты хуков новые на каждый рендер,
    // а сами методы стабильны, поэтому в зависимостях useCallback — методы.
    const { exitGame, reload: reloadMap, chooseDifficulty } = map;
    const { show: showResults } = results;

    const handleGameFinished = useCallback(
        (roundResults: GameResult) => {
            showResults(roundResults);
            navigate('results');
        },
        [showResults, navigate]
    );

    const handleExitToMap = useCallback(() => {
        exitGame();
        navigate('map');
    }, [exitGame, navigate]);

    const game = useGame(services, { onRoundFinished: handleGameFinished, onExitToMap: handleExitToMap });
    const { start: startGame } = game;

    const handleMapChanged = useCallback(() => {
        reloadMap();
        navigate('map');
    }, [reloadMap, navigate]);

    const mapSelection = useMapSelection(services, handleMapChanged);
    const { open: openMapSelection } = mapSelection;

    const handleSelectDifficulty = useCallback(
        (difficulty: Difficulty) => {
            chooseDifficulty(difficulty);
            startGame(difficulty);
            navigate('game');
        },
        [chooseDifficulty, startGame, navigate]
    );

    const handlePlayAgain = useCallback(() => {
        services.audio.play('click');
        startGame();
        navigate('game');
    }, [services, startGame, navigate]);

    const handleBackToMap = useCallback(() => {
        services.audio.play('click');
        reloadMap();
        navigate('map');
    }, [services, reloadMap, navigate]);

    const handleOpenMapSelection = useCallback(() => {
        openMapSelection();
    }, [openMapSelection]);

    const handleCloseError = useCallback(() => {
        services.audio.play('click');
        setError(null);
    }, [services]);

    return (
        <>
            <div className={screenClass('map', screen)} id="mapScreen">
                <Header totalScore={map.stats.totalScore} onOpenMapSelection={handleOpenMapSelection} />
                <MapScreen
                    stats={map.stats}
                    mapData={map.mapData}
                    isMoving={map.isMoving}
                    isModalOpen={map.isModalOpen}
                    modalTarget={map.modalTarget}
                    selectedDifficulty={map.selectedDifficulty}
                    mapRef={map.mapRef}
                    onTrainerClick={map.onTrainerClick}
                    onSelectDifficulty={handleSelectDifficulty}
                    onCancel={map.cancel}
                    onPlayerArrived={map.arrived}
                />
            </div>

            <div className="app">
                <div className={screenClass('game', screen)} id="gameScreen">
                    {game.question && (
                        <GameScreen
                            session={game.session}
                            question={game.question}
                            feedback={game.feedback}
                            selectedIndex={game.selectedIndex}
                            correctIndex={game.correctIndex}
                            floatingScore={game.floatingScore}
                            onAnswer={game.answer}
                            onNext={game.next}
                            onExit={game.exit}
                        />
                    )}
                </div>
                <div className={screenClass('results', screen)} id="resultScreen">
                    {results.view && (
                        <ResultsScreen
                            results={results.view.results}
                            rating={results.view.rating}
                            earnings={results.view.earnings}
                            onPlayAgain={handlePlayAgain}
                            onBackToMap={handleBackToMap}
                        />
                    )}
                </div>
            </div>

            {mapSelection.isOpen && (
                <MapSelectionModal
                    maps={mapSelection.maps}
                    currentMap={mapSelection.currentMap}
                    onSelect={mapSelection.select}
                    onClose={mapSelection.close}
                />
            )}
            {error && <ErrorModal title={error.title} message={error.message} onClose={handleCloseError} />}
        </>
    );
}
