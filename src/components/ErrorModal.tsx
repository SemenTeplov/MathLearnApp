// ============================================
// SRC/COMPONENTS/ERRORMODAL.TSX — модалка ошибок (1.7.0)
// ============================================
// «Глупый» компонент: только разметка на существующих CSS-классах
// (.modal-overlay.open / .modal / .btn.btn-primary). Без DOM и логики.

import type { MouseEvent } from 'react';

export interface ErrorModalProps {
    title: string;
    message: string;
    onClose: () => void;
}

export function ErrorModal({ title, message, onClose }: ErrorModalProps) {
    const handleOverlayClick = (event: MouseEvent<HTMLDivElement>): void => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay open" onClick={handleOverlayClick}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
                <h2>{title}</h2>
                <p style={{ color: '#666', marginBottom: 20 }}>{message}</p>
                <button className="btn btn-primary" type="button" onClick={onClose}>
                    OK
                </button>
            </div>
        </div>
    );
}
