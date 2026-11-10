// ============================================
// SRC/COMPONENTS/CONFIRMMODAL.TSX — подтверждение выхода (1.10.1)
// ============================================
// «Глупый» компонент: только разметка на существующих CSS-классах
// (.modal-overlay.open / .modal / .btn.btn-primary / .btn.btn-secondary).
// Без DOM и логики; тексты приходят пропсами (T80).

import type { MouseEvent } from 'react';

export interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm(): void;
    onCancel(): void;
}

export function ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmModalProps) {
    const handleOverlayClick = (event: MouseEvent<HTMLDivElement>): void => {
        if (event.target === event.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="modal-overlay open" onClick={handleOverlayClick}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
                <h2>{title}</h2>
                <p style={{ color: '#666', marginBottom: 20 }}>{message}</p>
                <button className="btn btn-primary" type="button" onClick={onConfirm}>
                    {confirmLabel}
                </button>
                <button className="btn btn-secondary" type="button" onClick={onCancel}>
                    {cancelLabel}
                </button>
            </div>
        </div>
    );
}
