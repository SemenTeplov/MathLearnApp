// ============================================
// SCRIPTS/CDP.MJS — минимум протокола DevTools для проверки dist (1.8.4)
// ============================================
// Только Node 26: глобальный WebSocket, node:net, node:child_process.
// Хелперы общие для scripts/verify-dist.mjs; npm-зависимостей нет (Z33).

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Опрос условия до первого истинного значения; фиксированных пауз нет. */
export async function poll(fn, label, timeout = 10000) {
    const started = Date.now();
    for (;;) {
        try {
            const value = await fn();
            if (value) return value;
        } catch {
            // страница или DevTools ещё не готовы — продолжаем опрос
        }
        if (Date.now() - started > timeout) throw new Error('таймаут: ' + label);
        await sleep(50);
    }
}

/** Свободный TCP-порт для --remote-debugging-port. */
export function freePort() {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
    });
}

/**
 * Собирает сетевые и консольные события страницы в одно состояние:
 * requests — requestId → url, responses — все ответы, failures — loadingFailed.
 */
export function createPageRecorder() {
    const state = { requests: new Map(), responses: [], failures: [], consoleIssues: [], exceptions: [] };
    const track = (cdp) =>
        cdp.on(({ method, params }) => {
            if (method === 'Network.requestWillBeSent') {
                state.requests.set(params.requestId, { url: params.request.url });
            } else if (method === 'Network.responseReceived') {
                state.responses.push({ url: params.response.url, status: params.response.status, type: params.type });
            } else if (method === 'Network.loadingFailed') {
                state.failures.push({ url: state.requests.get(params.requestId)?.url ?? '', error: params.errorText });
            } else if (method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(params.type)) {
                state.consoleIssues.push(
                    params.type + ': ' + params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ')
                );
            } else if (method === 'Runtime.exceptionThrown') {
                state.exceptions.push(
                    params.exceptionDetails.text + ' ' + (params.exceptionDetails.exception?.description ?? '')
                );
            }
        });
    return { state, track };
}

/** Минимальный CDP-клиент: id → ответ, события → обработчики. */
export class Cdp {
    constructor(socket) {
        this.socket = socket;
        this.lastId = 0;
        this.pending = new Map();
        this.handlers = [];
        socket.addEventListener('message', (event) => {
            const message = JSON.parse(String(event.data));
            if (message.id && this.pending.has(message.id)) {
                const { resolve, reject } = this.pending.get(message.id);
                this.pending.delete(message.id);
                if (message.error) reject(new Error(message.error.message));
                else resolve(message.result);
            } else if (message.method) {
                this.handlers.forEach((handler) => handler(message));
            }
        });
    }
    on(handler) {
        this.handlers.push(handler);
    }
    send(method, params = {}) {
        const id = ++this.lastId;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.socket.send(JSON.stringify({ id, method, params }));
        });
    }
}

/** Подключается к странице Chromium и возвращает CDP-клиент. */
export async function connectPage(port, timeout) {
    const target = await poll(
        async () => {
            const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
            return list.find((item) => item.type === 'page')?.webSocketDebuggerUrl ?? null;
        },
        'DevTools WebSocket',
        timeout
    );

    const socket = new WebSocket(target);
    await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', () => reject(new Error('WebSocket не подключился')), { once: true });
    });
    return { cdp: new Cdp(socket), socket };
}

/** Открывает новую вкладку (target) в том же Chromium и возвращает её описание. */
export async function openTarget(port, url, timeout = 10000) {
    return poll(
        async () => {
            const response = await fetch(`http://127.0.0.1:${port}/json/new?${url}`, { method: 'PUT' });
            if (!response.ok) return null;
            const target = await response.json();
            return target.webSocketDebuggerUrl ? target : null;
        },
        'новая цель DevTools',
        timeout
    );
}

/** Подключается к произвольной цели по её WebSocket URL. */
export async function connectTarget(webSocketDebuggerUrl) {
    const socket = new WebSocket(webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', () => reject(new Error('WebSocket цели не подключился')), { once: true });
    });
    return { cdp: new Cdp(socket), socket };
}

/** Запускает headless Chromium с временным профилем и CDP-портом. */
export function launchChromium(binary, port, profile) {
    return spawn(
        binary,
        [
            '--headless=new',
            '--no-sandbox',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-default-browser-check',
            '--user-data-dir=' + profile,
            '--remote-debugging-port=' + port,
            'about:blank'
        ],
        { stdio: 'ignore' }
    );
}
