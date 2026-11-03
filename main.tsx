// ============================================
// MAIN.TSX — единственная точка входа приложения (1.8.0)
// ============================================
// Классические слои (Model/Logic/Storage/Service/Errors) выполнены тегами
// <script> до этого модуля; bootstrap связывает их, затем React монтирует
// <App/> в #root. Старого входа и мостов window.* больше нет.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './src/App';
import { bootstrap } from './src/bootstrap';

bootstrap();

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('#root not found in index.html');
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
