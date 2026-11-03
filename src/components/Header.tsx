// ============================================
// SRC/COMPONENTS/Header.tsx — шапка карты (1.8.0)
// ============================================
// Разметка 1:1 со статическими #totalScore и #globalMapBtn: общий счёт 🏆
// (sticky сверху) и кнопка 🌍 выбора карты. Только презентация.

export interface HeaderProps {
    totalScore: number;
    onOpenMapSelection(): void;
}

export function Header({ totalScore, onOpenMapSelection }: HeaderProps) {
    return (
        <>
            <div className="total-score">🏆 {totalScore}</div>
            <button
                className="global-map-btn"
                type="button"
                title="Выбор карты"
                aria-label="Выбор карты"
                onClick={onOpenMapSelection}
            >
                🌍
            </button>
        </>
    );
}
