// ============================================
// SRC/COMPONENTS/ResultsScreen.tsx — экран результатов (1.8.0)
// ============================================
// Разметка 1:1 с удалённым results-view.js: иконка, заголовок, подзаголовок,
// две карточки статистики, строка «Заработано» (inline-стиль как в HTML 1.7.0)
// и две кнопки. Только презентация — без расчётов и DOM.

export interface ResultsScreenProps {
    results: GameResult;
    rating: Rating;
    /** Готовая строка «Заработано: N ✓» / «Заработано: N (не зачтено)». */
    earnings: string;
    onPlayAgain(): void;
    onBackToMap(): void;
}

export function ResultsScreen({ results, rating, earnings, onPlayAgain, onBackToMap }: ResultsScreenProps) {
    return (
        <>
            <div className="result-icon">{rating.icon}</div>
            <h1>{rating.title}</h1>
            <p className="subtitle">{rating.subtitle}</p>

            <div className="stats">
                <div className="stat-card">
                    <div className="stat-value">{results.correct}</div>
                    <div className="stat-label">Правильных</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{results.roundScore}</div>
                    <div className="stat-label">Очков</div>
                </div>
            </div>

            <div id="roundEarnings" style={{ textAlign: 'center', color: '#888', marginBottom: 15 }}>
                {earnings}
            </div>
            <button className="btn btn-primary" type="button" onClick={onPlayAgain}>
                Играть снова
            </button>
            <button className="btn btn-secondary" type="button" onClick={onBackToMap}>
                На карту
            </button>
        </>
    );
}
