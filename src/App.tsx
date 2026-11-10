// ============================================
// SRC/APP.TSX — каркас приложения на React (1.10.2)
// ============================================
// .active вычисляется из состояния, а не из DOM-роутера; модалки — в дереве App.
// Сообщения копятся очередью (A94), звук ✕ играет оболочка (A93).

import { useCallback, useEffect, useState } from 'react';
import type { Services } from './app/types';
import { ConfirmModal } from './components/ConfirmModal';
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
import { SESSION_BUSY_MESSAGE, SESSION_BUSY_TITLE, useSessionLock } from './hooks/useSessionLock';
import type { Difficulty, GameResult } from './core/types';

type ScreenName = 'map' | 'game' | 'results';

export interface AppProps {
    services: Services;
}

function screenClass(name: ScreenName, current: ScreenName): string {
    return 'screen' + (name === current ? ' active' : '');
}

export function App({ services }: AppProps) {
    const [screen, setScreen] = useState<ScreenName>('map');
    const [messages, setMessages] = useState<Array<{ title: string; message: string }>>([]);
    const [exitConfirm, setExitConfirm] = useState<{ roundScore: number } | null>(null);

    const navigate = useCallback((name: ScreenName) => {
        setScreen(name);
    }, []);

    // Сообщение встаёт в конец очереди (A94/T88); подписка на шину — единственный канал (A79).
    const showError = useCallback((title: string, message: string) => {
        setMessages((prev) => [...prev, { title, message }]);
    }, []);
    useEffect(() => services.errors.subscribe(showError), [services, showError]);

    const { blocked } = useSessionLock(showError);
    const map = useMap(services);
    const results = useResults(services, map.gameFinished);
    const { exitGame, reload: reloadMap, chooseDifficulty } = map;
    const { show: showResults } = results;

    // Единственный путь возврата: статистика читается до переключения экрана (A82/T82).
    const returnToMap = useCallback(() => {
        reloadMap();
        navigate('map');
    }, [reloadMap, navigate]);

    const handleGameFinished = useCallback(
        (roundResults: GameResult) => {
            showResults(roundResults);
            navigate('results');
        },
        [showResults, navigate]
    );

    // ✕ не завершает раунд: звук и подтверждение — здесь, повторный ✕ — no-op (A93/T87).
    const handleExitRequested = useCallback(
        (roundScore: number) => {
            if (exitConfirm) return;
            services.audio.play('click');
            setExitConfirm({ roundScore });
        },
        [exitConfirm, services]
    );

    const game = useGame(services, { onRoundFinished: handleGameFinished, onExitRequested: handleExitRequested });
    const { start: startGame } = game;
    const mapSelection = useMapSelection(services, returnToMap);

    const handleSelectDifficulty = useCallback(
        (difficulty: Difficulty) => {
            if (blocked) {
                showError(SESSION_BUSY_TITLE, SESSION_BUSY_MESSAGE);
                return;
            }
            chooseDifficulty(difficulty);
            startGame(difficulty);
            navigate('game');
        },
        [blocked, chooseDifficulty, showError, startGame, navigate]
    );

    const handlePlayAgain = useCallback(() => {
        if (blocked) {
            showError(SESSION_BUSY_TITLE, SESSION_BUSY_MESSAGE);
            return;
        }
        services.audio.play('click');
        startGame();
        navigate('game');
    }, [blocked, services, showError, startGame, navigate]);

    const handleBackToMap = useCallback(() => {
        services.audio.play('click');
        returnToMap();
    }, [services, returnToMap]);

    const handleExitConfirmed = useCallback(() => {
        services.audio.play('click');
        setExitConfirm(null);
        exitGame();
        returnToMap();
    }, [services, exitGame, returnToMap]);

    const handleExitCancelled = useCallback(() => {
        services.audio.play('click');
        setExitConfirm(null);
    }, [services]);

    // Закрытие снимает ровно одно сообщение — следующее показывается сразу (A94).
    const handleCloseError = useCallback(() => {
        services.audio.play('click');
        setMessages((prev) => prev.slice(1));
    }, [services]);

    return (
        <>
            <div className={screenClass('map', screen)} id="mapScreen">
                <Header totalScore={map.stats.totalScore} onOpenMapSelection={mapSelection.open} />
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
            {exitConfirm && (
                <ConfirmModal
                    title="Выйти из игры?"
                    message={'Заработано ' + exitConfirm.roundScore + ' очков сгорят.'}
                    confirmLabel="Выйти"
                    cancelLabel="Остаться"
                    onConfirm={handleExitConfirmed}
                    onCancel={handleExitCancelled}
                />
            )}
            {messages.length > 0 && (
                <ErrorModal title={messages[0].title} message={messages[0].message} onClose={handleCloseError} />
            )}
        </>
    );
}
