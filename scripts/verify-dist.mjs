#!/usr/bin/env node
// ============================================
// SCRIPTS/VERIFY-DIST.MJS — проверка production-сборки (1.8.4)
// ============================================
// Открывает собранный dist в headless Chromium (vite preview) и проверяет
// инварианты 19.6 по DOM и сети. Только Node 26 — без npm-зависимостей (Z33).
// Запуск: node scripts/verify-dist.mjs --url http://127.0.0.1:4173/ --chromium /usr/bin/chromium

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connectPage, createPageRecorder, freePort, launchChromium, poll } from './cdp.mjs';
import { connectTarget, openTarget } from './cdp.mjs';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
    args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
}

const TARGET = new URL(args.url ?? 'http://127.0.0.1:4173/').href;
const TIMEOUT = Number(args.timeout ?? 10000);
const ASSET_TYPES = new Set(['Document', 'Script', 'Stylesheet', 'Media']);

/** Считает ответ для вопроса формата «a + b = ?», «a − b = ?», «a × b = ?». */
function solve(question) {
    const match = /^(\d+) ([+\u2212\u00d7]) (\d+) = \?$/.exec(question.trim());
    if (!match) throw new Error('неизвестный формат вопроса: ' + question);
    const a = Number(match[1]);
    const b = Number(match[3]);
    return match[2] === '+' ? a + b : match[2] === '−' ? a - b : a * b;
}

const recorder = createPageRecorder();
const { responses, failures, consoleIssues, exceptions } = recorder.state;

const port = await freePort();
const profile = mkdtempSync(join(tmpdir(), 'ml-verify-'));
const chromium = launchChromium(args.chromium ?? 'chromium', port, profile);

let socket;

try {
    const connection = await connectPage(port, TIMEOUT);
    socket = connection.socket;
    const { cdp } = connection;

    const evaluate = async (expression) => {
        const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (result.exceptionDetails) {
            throw new Error('JS: ' + (result.exceptionDetails.exception?.description ?? result.exceptionDetails.text));
        }
        return result.result.value;
    };
    const waitFor = (expression, label, timeout = TIMEOUT) => poll(() => evaluate(expression), label, timeout);
    const click = async (selector, label) => {
        const clicked = await evaluate(
            `(() => { const node = document.querySelector(${JSON.stringify(selector)}); if (!node) return false; node.click(); return true; })()`
        );
        if (!clicked) throw new Error('не найден элемент: ' + label);
    };

    recorder.track(cdp);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try { localStorage.clear(); } catch (e) {}' });
    await cdp.send('Page.navigate', { url: TARGET });
    // 1. Документ: 200, <title>Math</title>, смонтированный #root.
    await waitFor(
        'document.readyState === "complete" && document.querySelector("#root").children.length > 0',
        'монтирование #root'
    );
    const documentResponse = await poll(
        () => responses.find((item) => item.type === 'Document' && item.url === TARGET),
        'ответ Document'
    );
    if (documentResponse.status !== 200) throw new Error('документ вернул ' + documentResponse.status);
    if ((await evaluate('document.title')) !== 'Math') throw new Error('title ≠ Math');
    console.log('✓ документ 200, <title>Math</title>, #root смонтирован');
    // 2. CSS: ссылка 200 и градиент фона (значит таблица стилей применилась).
    const cssHref = await evaluate('document.querySelector(\'link[rel="stylesheet"]\').href');
    const cssResponse = await poll(
        () => responses.find((item) => item.type === 'Stylesheet' && item.url === cssHref),
        'ответ CSS'
    );
    if (cssResponse.status !== 200) throw new Error('CSS вернул ' + cssResponse.status);
    const background = await evaluate('getComputedStyle(document.body).backgroundImage');
    if (!background.includes('gradient')) throw new Error('backgroundImage = ' + background);
    console.log('✓ CSS 200 и градиент фона применён');
    // 3. Ровно один module-скрипт, он загрузился 200, исключений ещё нет.
    const modules = await evaluate(
        '[...document.querySelectorAll("script")].filter((s) => s.type === "module").map((s) => s.src)'
    );
    if (modules.length !== 1) throw new Error('module-скриптов: ' + modules.length);
    await poll(
        () => responses.find((item) => item.type === 'Script' && item.url === modules[0] && item.status === 200),
        'ответ module-скрипта'
    );
    if (exceptions.length) throw new Error('исключение при загрузке: ' + exceptions[0]);
    console.log('✓ один module-скрипт, 200, без исключений');

    // 4. Три mp3: имена с хешем достаются из бандла, затем явный fetch() (D50).
    const audio = await evaluate(String.raw`(async () => {
        const src = document.querySelector('script[type="module"]').src;
        const code = await (await fetch(src)).text();
        const found = [...new Set(code.match(/[a-z]+-[A-Za-z0-9_-]{6,}\.mp3/g) ?? [])];
        const dir = new URL('./', src);
        const out = [];
        for (const rel of found) {
            const res = await fetch(new URL(rel, dir).href);
            out.push({ rel, status: res.status, type: res.headers.get('content-type') ?? '', size: (await res.arrayBuffer()).byteLength });
        }
        return out;
    })()`);
    if (audio.length !== 3) throw new Error('mp3 найдено: ' + audio.length);
    for (const item of audio) {
        if (item.status !== 200) throw new Error(item.rel + ' → ' + item.status);
        if (!item.type.startsWith('audio/')) throw new Error(item.rel + ' → content-type ' + item.type);
        if (item.size <= 0) throw new Error(item.rel + ' пустой');
    }
    console.log('✓ три mp3 по 200 с content-type audio/*, ' + audio.map((item) => item.size).join('/') + ' B');

    // 5. Карта: экран, 15 тренажёров, стартовая позиция −1, SVG-дорога (D58).
    await waitFor('document.querySelector("#mapScreen.active") !== null', 'экран карты');
    if ((await evaluate('document.querySelectorAll(".map-trainer").length')) !== 15)
        throw new Error('тренажёров не 15');
    if ((await evaluate('document.querySelectorAll(".map-trainer--current").length')) !== 0)
        throw new Error('на старте есть --current');
    if ((await evaluate('document.querySelectorAll(".map-trainer--near").length')) !== 1)
        throw new Error('на старте не один --near');
    if (!(await evaluate('document.querySelector("svg path") !== null'))) throw new Error('нет svg path');
    console.log('✓ карта: 15 тренажёров, старт −1 (0 --current, 1 --near), svg path');

    // 6. Клик по соседнему тренажёру → движение 600 мс и модалка сложности.
    await click('.map-trainer--near', 'тренажёр --near');
    await waitFor(
        'document.querySelectorAll(".map-trainer--current").length === 1 && document.querySelector(".modal-overlay.open") !== null',
        'прибытие и модалка',
        5000
    );
    if ((await evaluate('document.querySelectorAll(".diff-btn").length')) !== 3)
        throw new Error('кнопок сложности не 3');
    if (!(await evaluate('document.querySelector(\'[data-diff="easy"]\') !== null')))
        throw new Error('нет [data-diff="easy"]');
    console.log('✓ клик по --near → прибытие, модалка, 3 кнопки сложности');

    // 7. Старт игры: #gameScreen.active, 4 ответа, формат вопроса.
    await click('[data-diff="easy"]', 'кнопка «Легко»');
    await waitFor(
        'document.querySelector("#gameScreen.active") !== null && document.querySelectorAll(".answer-btn").length === 4',
        'старт игры'
    );
    const firstQuestion = (await evaluate('document.querySelector(".question").textContent')).trim();
    if (!/^\d+ [+−×] \d+ = \?$/.test(firstQuestion)) throw new Error('вопрос: ' + firstQuestion);
    console.log('✓ игра: 4 ответа, вопрос ' + firstQuestion);

    // 8. Полный раунд из 10 верных ответов → результаты (не 3–4 вопроса, Z31).
    for (let index = 1; index <= 10; index++) {
        const question = (await evaluate('document.querySelector("#gameScreen .question").textContent')).trim();
        const answer = String(solve(question));
        const clicked = await evaluate(
            `(() => { const button = [...document.querySelectorAll(".answer-btn")].find((item) => item.textContent.trim() === ${JSON.stringify(answer)}); if (!button) return false; button.click(); return true; })()`
        );
        if (!clicked) throw new Error('нет кнопки с ответом ' + answer + ' на вопрос ' + question);
        await waitFor('document.querySelector(".feedback.correct-fb.show") !== null', 'верный ответ #' + index);
        await click('.feedback.show .btn-primary', 'кнопка «Продолжить»');
        if (index < 10) {
            await waitFor(
                'document.querySelector(".feedback.show") === null && document.querySelector("#gameScreen.active") !== null',
                'следующий вопрос #' + index
            );
        }
    }
    await waitFor('document.querySelector("#resultScreen.active") !== null', 'экран результатов');
    const resultTitle = (await evaluate('document.querySelector("#resultScreen h1")?.textContent ?? ""')).trim();
    if (!resultTitle) throw new Error('пустой заголовок результатов');
    const correctValue = (
        await evaluate('document.querySelectorAll("#resultScreen .stat-value")[0]?.textContent ?? ""')
    ).trim();
    if (correctValue !== '10') throw new Error('правильных = ' + correctValue);
    const earnings = (await evaluate('document.querySelector("#roundEarnings")?.textContent ?? ""')).trim();
    if (!earnings.startsWith('Заработано')) throw new Error('earnings = ' + earnings);
    console.log('✓ 10/10 ответов → результаты «' + resultTitle + '», ' + earnings);

    // 9. Вторая вкладка (TR-73): претендент получает модалку, владелец молчит.
    const second = await openTarget(port, TARGET, TIMEOUT);
    const tab = await connectTarget(second.webSocketDebuggerUrl);
    const ask = async (expression) => {
        const result = await tab.cdp.send('Runtime.evaluate', { expression, returnByValue: true });
        return result.result.value;
    };
    try {
        const lockTitle = await poll(
            () => ask('document.querySelector(".modal-overlay.open h2")?.textContent ?? null'),
            'модалка второй вкладки',
            TIMEOUT
        );
        if (lockTitle !== 'Игра уже запущена') throw new Error('вторая вкладка: ' + lockTitle);
        if (await ask('document.querySelector("#gameScreen.active") !== null'))
            throw new Error('вторая вкладка играет');
        if ((await ask('document.querySelectorAll(".map-trainer").length')) !== 15) throw new Error('нет карты');
        if (await evaluate('document.querySelector(".modal-overlay.open") !== null'))
            throw new Error('модалка у владельца');
        console.log('✓ вторая вкладка: модалка «Игра уже запущена», владелец без модалки');
    } finally {
        tab.socket.close();
    }

    // 10. Сеть: нет 4xx/5xx по Document/Script/Stylesheet/Media и нет loadingFailed (D52).
    const bad = responses.filter(
        (item) => ASSET_TYPES.has(item.type) && item.status >= 400 && !item.url.endsWith('/favicon.ico')
    );
    if (bad.length) throw new Error('ответы ≥ 400: ' + bad.map((item) => item.status + ' ' + item.url).join(', '));
    const failed = failures.filter((item) => !item.url.includes('favicon'));
    if (failed.length)
        throw new Error('loadingFailed: ' + failed.map((item) => item.error + ' ' + item.url).join(', '));
    console.log('✓ сеть: нет ответов ≥ 400 и loadingFailed');

    // 11. Консоль: ни error/warning, ни необработанных исключений.
    if (consoleIssues.length) throw new Error('консоль: ' + consoleIssues.join(' | '));
    if (exceptions.length) throw new Error('исключения: ' + exceptions.join(' | '));
    console.log('✓ консоль без error/warning и исключений');

    console.log('OK: dist verified');
    process.exitCode = 0;
} catch (error) {
    console.error('✗ ' + error.message);
    process.exitCode = 1;
} finally {
    if (socket) socket.close();
    chromium.kill();
    if (chromium.exitCode === null) {
        await new Promise((resolve) => {
            const timer = setTimeout(resolve, 3000);
            chromium.once('exit', () => {
                clearTimeout(timer);
                resolve();
            });
        });
    }
    try {
        rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
    } catch {
        console.warn('⚠ временный профиль не удалён: ' + profile);
    }
}
