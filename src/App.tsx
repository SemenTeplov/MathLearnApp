// ============================================
// SRC/APP.TSX — весь каркас приложения на React (1.8.0)
// ============================================
// 15.17: React рендерит #mapScreen и .app с теми же id/классами, что были
// в index.html; .active вычисляется из состояния, а не из DOM-роутера.
// Модалки — в дереве App. Состояние экранов — локальное (хуки), без сторов.

import { useCallback, useState } from 'react';
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

type ScreenName = 'map' | 'game' | 'results';

interface ErrorMessage {
    title: string;
    message: string;
}

/** Класс экрана: `.screen` + `.active` у текущего (как в 1.7.0). */
function screenClass(name: ScreenName, current: ScreenName): string {
    return 'screen' + (name === current ? ' active' : '');
}

export function App() {
    const [screen, setScreen] = useState<ScreenName>('map');
    const [error, setError] = useState<ErrorMessage | null>(null);

    const navigate = useCallback((name: ScreenName) => {
        setScreen(name);
    }, []);

    const showError = useCallback((title: string, message: string) => {
        setError({ title, message });
    }, []);

    useSessionLock(showError);

    const map = useMap();
    const results = useResults(map.gameFinished);

    const handleGameFinished = useCallback((roundResults: GameResult) => {
        results.show(roundResults);
        navigate('results');
    }, [results.show, navigate]);

    const handleExitToMap = useCallback(() => {
        map.exitGame();
        navigate('map');
    }, [map.exitGame, navigate]);

    const game = useGame({ onRoundFinished: handleGameFinished, onExitToMap: handleExitToMap });

    const handleMapChanged = useCallback(() => {
        map.reload();
        navigate('map');
    }, [map.reload, navigate]);

    const mapSelection = useMapSelection(handleMapChanged);

    const handleSelectDifficulty = useCallback((difficulty: Difficulty) => {
        map.chooseDifficulty(difficulty);
        game.start(difficulty);
        navigate('game');
    }, [map.chooseDifficulty, game.start, navigate]);

    const handlePlayAgain = useCallback(() => {
        AudioService.play('click');
        game.start();
        navigate('game');
    }, [game.start, navigate]);

    const handleBackToMap = useCallback(() => {
        AudioService.play('click');
        map.reload();
        navigate('map');
    }, [map.reload, navigate]);

    const handleOpenMapSelection = useCallback(() => {
        mapSelection.open();
    }, [mapSelection.open]);

    const handleCloseError = useCallback(() => {
        AudioService.play('click');
        setError(null);
    }, []);

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
