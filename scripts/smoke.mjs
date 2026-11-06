#!/usr/bin/env node
// ============================================
// SCRIPTS/SMOKE.MJS — smoke собранного dist (1.9.0)
// ============================================
// Поднимает `vite preview` на 4173, проверяет HTTP-контракт сборки (документ,
// один module-скрипт, один stylesheet, живые ассеты, три mp3) и гасит сервер.
// Только Node 20.19+: fetch + child_process, без npm-зависимостей.
//
// Запуск: npm run smoke            (перед этим npm run build)
//         npm run smoke:browser    (--browser: ещё 10 проверок в headless Chromium)
//         SMOKE_PORT=4180 npm run smoke

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const BASE = `http://127.0.0.1:${PORT}/`;
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT ?? 30000);
const WITH_BROWSER = process.argv.includes('--browser');

const checks = [];

/** Печатает одну проверку и запоминает результат. */
function check(name, ok, detail = '') {
    checks.push({ name, ok });
    console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

/** Ждёт, пока vite preview начнёт отвечать 200. */
async function waitForServer(child) {
    const started = Date.now();
    while (Date.now() - started < TIMEOUT_MS) {
        if (child.exitCode !== null) {
            throw new Error(`vite preview завершился с кодом ${child.exitCode}`);
        }
        try {
            const res = await fetch(BASE, { cache: 'no-store' });
            if (res.ok) return res;
        } catch {
            // сервер ещё не слушает — нормально на старте
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`vite preview не ответил за ${TIMEOUT_MS} мс: ${BASE}`);
}

/** Прогоняет браузерные проверки dist на том же сервере (verify-dist.mjs + CDP). */
function runBrowserCheck() {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, [join('scripts', 'verify-dist.mjs'), '--url', BASE], {
            stdio: 'inherit'
        });
        child.on('close', (code) => resolve(code ?? 1));
        child.on('error', () => resolve(1));
    });
}

/** Возвращает значения src/href из документа. */
function collectRefs(html) {
    return [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
}

const localRefs = (refs) => refs.filter((ref) => ref.startsWith('./') || ref.startsWith('/assets/'));

async function main() {
    check('dist/ собран', existsSync(join(DIST, 'index.html')), 'иначе сначала npm run build');

    const viteBin = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
    if (!existsSync(viteBin)) throw new Error(`не найден Vite: ${viteBin} (npm ci)`);

    const child = spawn(
        process.execPath,
        [viteBin, 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
        { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    let stderr = '';
    child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
    });

    try {
        const response = await waitForServer(child);
        check('vite preview отвечает 200', response.ok, BASE);

        const html = await response.text();
        check('index.html — HTML-документ', html.includes('id="root"'), 'найден #root');

        const refs = collectRefs(html);
        const scripts = refs.filter((ref) => ref.endsWith('.js'));
        const styles = refs.filter((ref) => ref.endsWith('.css'));
        check('ровно один собранный JS', scripts.length === 1, scripts.join(', '));
        check('ровно один собранный CSS', styles.length === 1, styles.join(', '));
        check('нет ссылок на /src/', !refs.some((ref) => ref.includes('/src/')));
        check('нет ссылок на js/ и audio/', !refs.some((ref) => /(^|\/)(js|audio)\//.test(ref)));

        for (const ref of localRefs(refs)) {
            const url = new URL(ref.replace(/^\.\//, ''), BASE).href;
            const asset = await fetch(url, { cache: 'no-store' });
            const body = await asset.text();
            check(`ассет ${ref}`, asset.ok && body.length > 0, `${asset.status}, ${body.length} B`);
        }

        const mp3 = existsSync(join(DIST, 'assets'))
            ? readdirSync(join(DIST, 'assets')).filter((file) => file.endsWith('.mp3'))
            : [];
        check('три mp3 в dist/assets', mp3.length === 3, mp3.join(', '));

        if (WITH_BROWSER) {
            const code = await runBrowserCheck();
            check('браузерные проверки dist (verify-dist)', code === 0, `exit ${code}`);
        }
    } finally {
        child.kill('SIGTERM');
        if (stderr.trim()) console.log('— вывод vite preview:\n' + stderr.trim());
    }

    const failed = checks.filter((item) => !item.ok);
    console.log(`\n${checks.length - failed.length}/${checks.length} проверок пройдено`);
    if (failed.length > 0) {
        console.error('Провалено: ' + failed.map((item) => item.name).join('; '));
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error('❌ smoke упал: ' + error.message);
    process.exitCode = 1;
});
