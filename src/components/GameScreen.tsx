// ============================================
// SRC/COMPONENTS/GameScreen.tsx — игровой экран (1.8.0)
// ============================================
// Разметка 1:1 с удалённой game-view.js: шапка (✕, прогресс, счёт, счётчик,
// жизни, «+10»), вопрос, 4 кнопки ответов с классами correct/wrong,
// плашка feedback с кнопкой «Продолжить». Только презентация.

import { CONFIG } from '../core/config';
import type { Problem } from '../core/types';
import type { GameFeedbackView, GameSessionView } from '../ui/types';

export interface GameScreenProps {
    session: GameSessionView;
    question: Problem;
    feedback: GameFeedbackView | null;
    selectedIndex: number | null;
    correctIndex: number | null;
    floatingScore: number | null;
    onAnswer(index: number): void;
    onNext(): void;
    onExit(): void;
}

/** Полоски жизней: ❤️ за каждую оставшуюся, 🖤 за потерянную. */
function renderLives(lives: number): string {
    let text = '';
    for (let i = 0; i < CONFIG.MAX_LIVES; i++) {
        text += i < lives ? '❤️' : '🖤';
    }
    return text;
}

export function GameScreen({
    session,
    question,
    feedback,
    selectedIndex,
    correctIndex,
    floatingScore,
    onAnswer,
    onNext,
    onExit
}: GameScreenProps) {
    const answered = selectedIndex !== null;
    const feedbackClass = feedback
        ? 'feedback ' + (feedback.isCorrect ? 'correct-fb' : 'wrong-fb') + ' show'
        : 'feedback hidden';

    return (
        <>
            <div className="game-header">
                <button className="close-btn" type="button" onClick={onExit}>
                    ✕
                </button>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: session.progress + '%' }} />
                </div>
                <span className="round-score">🏆 {session.roundScore}</span>
                <span className="question-counter">
                    {session.questionNumber}/{session.totalQuestions}
                </span>
                <span className="lives">{renderLives(session.lives)}</span>
                <span className="score-badge" style={{ display: floatingScore === null ? 'none' : 'block' }}>
                    +{floatingScore ?? 0}
                </span>
            </div>

            <div className="question">{question.question}</div>

            <div className="answers">
                {question.options.map((option, index) => {
                    const isCorrect = correctIndex === index;
                    const isWrong = selectedIndex === index && selectedIndex !== correctIndex;
                    const className = 'answer-btn' + (isCorrect ? ' correct' : '') + (isWrong ? ' wrong' : '');

                    return (
                        <button
                            key={index}
                            className={className}
                            type="button"
                            data-index={index}
                            disabled={answered}
                            onClick={() => onAnswer(index)}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>

            <div className={feedbackClass}>
                <div className="feedback-title">{feedback ? feedback.title : ''}</div>
                <div className="feedback-text">{feedback ? feedback.message : ''}</div>
                <button className="btn btn-primary" type="button" onClick={onNext}>
                    Продолжить
                </button>
            </div>
        </>
    );
}
