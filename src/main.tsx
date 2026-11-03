// ============================================
// SRC/MAIN.TSX — единственная точка входа приложения (1.8.2)
// ============================================
// CSS импортируется в прежнем порядке (base, buttons, screens, game, results, map),
// затем создаются сервисы, предзагружается звук, вешаются обработчики ошибок
// и React монтирует <App/> в #root. Классических <script> больше нет.

import '../css/base.css';
import '../css/buttons.css';
import '../css/screens.css';
import '../css/game.css';
import '../css/results.css';
import '../css/map.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createServices } from './app/createServices';
import { initGlobalErrorHandlers } from './core/error-handler';

const services = createServices();
services.audio.preload();
initGlobalErrorHandlers();

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('#root not found in index.html');
}

createRoot(rootElement).render(
    <StrictMode>
        <App services={services} />
    </StrictMode>
);
