# План — MathLingo

**Версия:** 1.8.4  
**Статус:** Этап 19 «Production-сборка и ассеты» (SPEC 1.8.4). План; код ещё не тронут  
**Базовая линия 1.8.4 (проверено 06.11.2026):** `npx tsc --noEmit` — **0 ошибок**; `npm test` — **261/261 в 28 сьютах** (~13.4 с); `vite.config.ts` отсутствует, `"type": "commonjs"`, `npm run build` = `npm run typecheck`, `dist/` не создаётся  
**Создан на основе:** RULES 1.8.4 (`rules_v_1_8_4.md`: A65–A71, T56–T62, Z30–Z33) и SPEC 1.8.4 (`spec_v1_8_4.md`: TR-51…TR-60)  
**Предыдущая версия плана:** 1.8.3 (`plans/PLAN_v1_8_3.md` — архив)  
**Тип изменения:** **сборка и доставка**, а не поведение игры. `npm run build` становится настоящей production-сборкой Vite (`tsc --noEmit && vite build`), аудио переезжает в `src/assets/audio/` и подключается через `?url`, `dist` проверяется в `vite preview` + headless Chromium. Поведение, разметка, тексты, `CONFIG`, `Stats` v3 и ключи хранилища **не меняются**.

---

## ⚠️ Решения, на которых стоит план

| # | Решение | Следствие |
|---|---------|-----------|
| 1 | **Тесты 1.8.3 не переписываются.** 28 сьютов / 261 тест — baseline; правится **один** сьют (`test/services/audio-service.test.ts`) под новый контракт `AUDIO_URLS` | Этап 19 начинается с зелёного `npm test`; 261 — контрольная цифра на каждом шаге |
| 2 | **Порядок:** фундамент сборки → скрипты и HTML → ассеты → контракт `dist` → `verify-dist` → dev-smoke/аудит → документация | Каждый шаг заканчивается `tsc` 0 + зелёным `npm test`; `dist` собирается уже на 19.1, а полный контракт — к 19.4 |
| 3 | **`src/**` правится только в аудио:** новый `src/assets/audio/audio-urls.ts` + `src/services/audio-service.ts`. `components`, `hooks`, `core`, `data`, `ui`, `app`, `App.tsx`, `main.tsx` — **0 правок** | Разметка, CSS и поведение остаются байт-в-байт; единственная точка вмешательства — загрузка звука |
| 4 | **Плагин ставится с `--force`:** обычный `npm i -D @vitejs/plugin-react@^6` падает `ERESOLVE` на остаточных `babel-jest`/`@babel/core@7` в `dependencies` (проверено dry-run) | `--force` добавляет ровно 1 пакет и ничего не удаляет. `--legacy-peer-deps` **запрещён**: dry-run удаляет `@testing-library/dom` и роняет 11 UI-сьютов (D48) |
| 5 | **`base: './'`** — выбор владельца (D17 спеки) | В dev Vite сам приводит относительный base к `/` (проверено в исходнике vite 8.3.5), в build — `./`; dev не ломается, подпапка деплоя работает |
| 6 | **`assetsInlineLimit: 0`** обязателен | `click.mp3` = 4222 B при дефолтном пороге 4096 B: без нуля звук уедет в JS как `data:`-URI и критерий «3 mp3 в `dist/assets`» сломается |
| 7 | **Аудио через `?url` + `AUDIO_URLS`**, публичный API `AudioService`/`AudioKind` сохраняется | Компоненты и хуки не правятся; тест сравнивает вызовы с `AUDIO_URLS`, а не с литералами и не с хешами (в vitest `?url` = dev-путь) |
| 8 | **`index.html` и CSS не меняются** — они приведены к целевым в 1.8.2 | 19.2/19.4 только **проверяют** инварианты: 1 скрипт, 6 CSS-импортов, один CSS-бандл |
| 9 | **`verify-dist.mjs` — один файл ≈190 строк** без новых npm-зависимостей (Node 26: `WebSocket`, `fetch`, `child_process`) | При выходе за 200 строк хелперы CDP выносятся в `scripts/cdp.mjs`, CLI и проверки остаются на месте (D55) |
| 10 | **Проверка результата — по инвентарю `dist` и по браузеру**, а не по коду выхода `npm run build` (A65/A69) | `rm -rf dist` перед каждой сборкой; «зелёная сборка без `dist`» запрещена (Z31) |
| 11 | **`jest.config.js` удаляется, но `jest-environment-jsdom` остаётся** | Массовая чистка транзитивных `jest-*`/`babel-*` из `dependencies` — отдельная задача (SPEC «Что не входит»), в 1.8.4 не делается |
| 12 | **Ветка — текущая `dev`**, коммиты по шагам; пуш и мерж — по согласованию | `git add -A` запрещён (Z32): в дереве незакоммиченные `SPEC.md`/`RULES.md` 1.8.4 |

---

## 🎯 Цель

Сделать `npm run build` настоящей production-сборкой и доказать, что её результат работает вне dev-сервера.

- `@vitejs/plugin-react@^6` установлен; `vite.config.ts` с `react()`, `base: './'`, `outDir: 'dist'`, `sourcemap: true`, `assetsInlineLimit: 0`.
- `npm run build` = `tsc --noEmit && vite build`; ошибка типов **останавливает** сборку; `dist/` создаётся всегда.
- `package.json`: `"type": "module"`; мёртвый `jest.config.js` удалён; `npx vite build` не печатает предупреждение о CJS-конфиге.
- `index.html` — `#root` + **один** `<script type="module">`; ни `<link rel="stylesheet">`, ни `js/*.ts`, ни `audio/*.mp3`.
- CSS — те же 6 файлов, импорты из `src/main.tsx` в прежнем порядке; в `dist` один `assets/index-<hash>.css`.
- Аудио — `src/assets/audio/{click,win,lose}.mp3`, `AUDIO_URLS` через `?url`, строковых `'audio/…'` нет; корневого `audio/` нет.
- `dist` проходит проверку в `vite preview` + headless Chromium: карта, 15 тренажёров, полный раунд 10/10, 3 mp3, 0 ответов ≥ 400, 0 console-ошибок.
- `base: './'` — единственная точка настройки базы; в `dist/index.html` пути `./assets/…`.
- `npx tsc --noEmit` — 0; `npm test` — 261/261 зелёные; `npm run test:coverage` — пороги 80/60; поведение и разметка не изменились.

---

## 📐 Что именно меняет 1.8.4

| Источник | Требование | Следствие для плана |
|---|---|---|
| **TR-51** | `@vitejs/plugin-react@^6`, `vite.config.ts` (`react()`, `base: './'`, `dist`, `sourcemap`, `assetsInlineLimit: 0`), `"type": "module"`, удалён `jest.config.js` | 19.1 |
| **TR-52** | `build` = `tsc --noEmit && vite build`; `dev`/`preview`; новых скриптов нет | 19.2 |
| **TR-53** | `index.html` — `#root` + один module-скрипт; без `link`/`audio`/`js/` | 19.2 (проверка, файл не меняется) |
| **TR-54** | 6 CSS-импортов в `main.tsx` в порядке base → buttons → screens → game → results → map; в `dist` один CSS | 19.4 (проверка, файлы не меняются) |
| **TR-55** | mp3 → `src/assets/audio/` через `git mv`; `audio-urls.ts` на `?url`; `preload()` без строковых путей; `audio/` удалён | 19.3 |
| **TR-56** | Контракт `dist`: 1 JS (+ `.map`), 1 CSS, 3 mp3, никаких `ts/js/css/audio/src`; пути `./assets/…` | 19.4 |
| **TR-57** | `scripts/verify-dist.mjs`: `vite preview` + headless Chromium, 10 проверок | 19.5 |
| **TR-58** | `base: './'` — только в `vite.config.ts`; нет абсолютных `/assets`, `/src` в коде | 19.1, аудит 19.6 |
| **TR-59** | Dev не сломан: Fast Refresh, HMR, `?url` в dev, без предупреждений | 19.6 |
| **TR-60** | Тест аудио — на `AUDIO_URLS`, остальные 27 сьютов без изменений; `tsc` 0; coverage 80/60 | 19.3, 19.6 |
| **A65–A71** | Сборка = артефакт; ассеты импортируются; `index.html` принадлежит Vite; `base` в одном месте; контракт `dist`; проверка в браузере; один ESM-формат | 19.1–19.6 |
| **T56–T62** | Структура сборки, `vite.config.ts`, `package.json`, контракт аудио, инвентарь `dist`, проверка в браузере, чек-лист сдачи | 19.1–19.6 |
| **Z30–Z33** | Запреты: строковые пути/`public/audio`/ручные теги/`base: '/'`; «зелёная сборка»; git; проверка | Раздел «Запреты», критерий 163 |

---

## ✅ Что НЕ меняется

| Область | Факт |
|---------|------|
| Поведение игры | 10 вопросов, 3 жизни, `+10` за верный ответ, `RATINGS` (100/70/40/0), `GAMEOVER`, «Игра окончена» при `lives <= 0` |
| `CONFIG` / `Stats` | значения 1.8.2, `Stats` v3, миграции `1 → 2 → 3`, ключи `ml_stats`, `ml_session_lock` |
| Разметка | `index.html` (уже минимальный), `id` (`#root`, `#mapScreen`, `#gameScreen`, `#resultScreen`), классы, тексты, эмодзи |
| CSS | **21 файл, 0 правок:** 6 точек входа + `*_items/`, каскад и порядок импортов из 1.8.2 |
| Компоненты/хуки/домен | `src/components` (10), `src/hooks` (5), `src/core` (13), `src/data` (4), `src/ui` (1), `src/app` (2), `App.tsx`, `main.tsx` — **0 правок** |
| Остальные тесты | 27 сьютов / 252 теста не меняются; допустимо только добавление проверок (Z31: не удалять и не скипать) |
| Пороги покрытия | `vitest.config.ts` — 80/60 по группам, без изменений; `coverage/` в `.gitignore` |
| `dist` в git | `.gitignore` уже содержит `dist/` — не коммитится |

---

## 📎 Исходное состояние (проверено 06.11.2026)

| Проверка | Факт | Вывод |
|---|---|---|
| `npx tsc --noEmit` | **0** | Исходная точка зелёная |
| `npm test` | **261/261** в **28** сьютах, ~13.4 с | Baseline для всех шагов |
| `vite.config.ts` | **отсутствует** | `vite build` идёт на дефолтах; `base` = `'/'` |
| `npm run build` | `npm run typecheck` → `tsc --noEmit` | **`dist/` не создаётся** — главный дефект 1.8.4 |
| `package.json` | `"type": "commonjs"`; `scripts`: `dev`, `typecheck`, `build`, `preview`, `test`, `test:watch`, `test:coverage` | 19.1 добавляет `type`, 19.2 меняет `build` |
| `node_modules/@vitejs` | каталога нет | `@vitejs/plugin-react` не установлен |
| `jest.config.js` | есть (CJS), `setupFilesAfterEach: test/setup.js` — файла нет | Мёртвый конфиг: `testMatch` на `*.test.js`, Jest в проекте не используется → удаляется |
| `index.html` | `#root` + один `<script type="module" src="/src/main.tsx">` | Инварианты TR-53 уже выполнены: `<script` = 1, `type="module"` = 1, `stylesheet\|js/\|audio/` = 0 |
| `src/main.tsx` | 6 CSS-импортов в порядке base → buttons → screens → game → results → map | TR-54 выполнен; правок не нужно |
| CSS | **21** файл в `css/`; партиалы через `@import` (`game.css`, `map.css`) | Остаётся на месте (D22 спеки) |
| Аудио | `audio/{click,win,lose}.mp3` = **4222 / 29350 / 52337 B**; `new Audio('audio/' + name + '.mp3')` в `src/services/audio-service.ts` | 19.3: `git mv`, `?url`, правка сервиса и одного теста |
| `tsconfig.json` | `noEmit`, `types: ["vite/client"]`, `include` содержит `vite.config.ts` | `?url` уже типизирован; новых `types`/`paths` не нужно |
| `.gitignore` | `dist/`, `coverage/`, `.vite*`, `*.tsbuildinfo` | Ничего добавлять не нужно |
| `src/assets/`, `scripts/`, `public/` | **отсутствуют** | Создаются в 19.3/19.5; `public/` не создаётся |
| Node / npm / Vite | v26.3.0 / 11.16.0 / 8.3.5 (Rolldown); Vitest 5.0.5; TypeScript ~5.9.3 | `WebSocket`, `fetch` глобальны — CDP-скрипт без зависимостей возможен |
| Chromium | `/usr/bin/chromium` **152.0.7977.82** | Headless и CDP доступны |
| `npm i -D @vitejs/plugin-react@^6` | **ERESOLVE**: `@babel/core@7.29.7` (из `babel-jest` 29 в `dependencies`) против `@babel/core@8.1.0`, который тянет optional-peer `@rolldown/plugin-babel` | `--force` → «added 1 package», ничего не удаляет. `--legacy-peer-deps` → удаляет 7 пакетов, включая `@testing-library/dom` (D48) |
| npm cache | `~/.npm` в песочнице **read-only** (`EROFS` при записи) | Ставить с `--cache /tmp/npm-cache-1.8.4`; запись в `node_modules` вне рабочей области — через approval |
| Git | ветка **`dev`**, HEAD `be0c189`; незакоммичены `M .gigacode/specs/SPEC.md`, `M .gigacode/rulles/RULES.md`, `?? spec_v1_8_4.md`, `?? rules_v_1_8_4.md` | 19.0 фиксирует документы адресно, без `git add -A` |

### Чего не хватает до 1.8.4

1. **Конфига сборки** — `vite.config.ts` нет, `base` не задан, React-плагина нет.
2. **Скрипта сборки** — `build` не вызывает `vite build`, `dist/` не появляется.
3. **ESM-пакета** — `"type": "commonjs"` при ESM-конфигах; `jest.config.js` — CJS-мина.
4. **Ассетов в графе модулей** — mp3 подключаются строкой во время выполнения, в `dist` их нет.
5. **Проверки результата** — нет ни инвентаря `dist`, ни браузерного smoke; «сборка прошла» ничего не доказывает.
6. **Документации** — README/GIGACODE утверждают «в прод-сборке звук не играет», `npm run build` = typecheck.

---

## 🏗️ Архитектура сборки (целевая)

```
index.html ───────────────┐
src/main.tsx ─────────────┤   vite build            dist/
  ├─ 6 × css/*.css ───────┤   (react(), base './')   ├─ index.html      (1 script + 1 stylesheet, ./assets/…)
  ├─ src/assets/audio/    │   tsc --noEmit &&        ├─ assets/index-<hash>.js
  │     {click,win,lose}.mp3 ┤   vite build          │    + index-<hash>.js.map
  │     audio-urls.ts (?url)┤                        ├─ assets/index-<hash>.css  (6 точек входа + партиалы)
  ├─ src/**/*.ts(x) ──────┤                          └─ assets/{click,win,lose}-<hash>.mp3
  └─ React 19 ────────────┘
```

| Режим | Команда | Что подаётся | База | Правда о файлах |
|---|---|---|---|---|
| Dev | `npm run dev` | исходники через ESM + HMR/Fast Refresh | Vite приводит `'./'` к `'/'` | `?url` = `/src/assets/audio/<name>.mp3` |
| Build | `npm run build` | `tsc --noEmit`, затем `vite build` | `'./'` | хешированные `assets/*` |
| Preview | `npm run preview -- --port 4173 --strictPort` | уже собранный `dist` | как в сборке | проверяется `verify-dist.mjs` |

**Каталоги, которые обязаны исчезнуть из выдачи:** `dist/js/`, `dist/css/`, `dist/audio/`, `dist/src/`, любые `*.ts`/`*.tsx`.

---

## 🧩 Контракты

### `vite.config.ts` (NEW, ≈14 строк, TR-51/T57)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: 'dist',
        sourcemap: true,
        assetsInlineLimit: 0
    }
});
```

- Плагин — единственный; другие не добавляются без согласования (T57).
- `base: './'` — единственное место настройки базы (A68); `'/'` не возвращаем.
- `assetsInlineLimit: 0` — иначе `click.mp3` (4222 B > 4096 B) может стать `data:`-URI (D20 спеки).
- `sourcemap: true` даёт `dist/assets/index-<hash>.js.map`; CSS-карт Vite 8 не создаёт — не требуем.

### `src/assets/audio/audio-urls.ts` (NEW, ≈18 строк, TR-55/T59)

```ts
import clickUrl from './click.mp3?url';
import winUrl from './win.mp3?url';
import loseUrl from './lose.mp3?url';

/** URL-ы звуков, которые умеет проигрывать AudioService. */
export const AUDIO_URLS = {
    click: clickUrl,
    win: winUrl,
    lose: loseUrl
} as const;

export type AudioKind = keyof typeof AUDIO_URLS;
```

### `src/services/audio-service.ts` (EDIT, API сохраняется, TR-55/T59)

```ts
import { AUDIO_URLS } from '../assets/audio/audio-urls';
import type { AudioKind } from '../assets/audio/audio-urls';

export type { AudioKind };

export class AudioService {
    _sounds: Map<AudioKind, HTMLAudioElement> = new Map();
    _isReady = false;

    preload(): void {
        (Object.keys(AUDIO_URLS) as AudioKind[]).forEach((kind) => {
            try {
                this._sounds.set(kind, new Audio(AUDIO_URLS[kind]));
            } catch (e) {
                console.warn('[AudioService] Ошибка загрузки звука: ' + kind, e);
            }
        });
        this._isReady = true;
    }

    play(kind: AudioKind): void { /* без изменений: _isReady, cloneNode, catch */ }
}
```

- Порядок `click → win → lose` — из порядка ключей `AUDIO_URLS` (T59).
- `preload()`/`play()` сохраняют поведение 1.8.2: `try/catch` + `console.warn`, `_isReady`, клон узла, глотание `play()`-reject, `play()` до `preload()` — no-op.
- `export type { AudioKind }` обязателен: `import type { AudioKind } from '../services/audio-service'` не должен ломаться (`verbatimModuleSyntax`).

### `package.json` (EDIT, TR-52/T58)

```json
{
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "tsc --noEmit && vite build",
        "preview": "vite preview",
        "typecheck": "tsc --noEmit",
        "test": "vitest run",
        "test:watch": "vitest",
        "test:coverage": "vitest run --coverage"
    },
    "devDependencies": {
        "@vitejs/plugin-react": "^6"
    }
}
```

Фрагмент, а не полный файл: React 19, Vite 8, Vitest 5, `@testing-library/*`, `jsdom` сохраняются. Новых npm-скриптов для проверки `dist` **нет** — запуск `node scripts/verify-dist.mjs`.

### `scripts/verify-dist.mjs` (NEW, ≈190 строк, TR-57/T61)

```
node scripts/verify-dist.mjs --url http://127.0.0.1:4173/ --chromium /usr/bin/chromium [--timeout 5000]
```

Внутренние функции (без новых зависимостей):

| Функция | Назначение |
|---|---|
| `parseArgs(argv)` | `--url`, `--chromium`, `--timeout`; дефолты `http://127.0.0.1:4173/`, `/usr/bin/chromium`, 5000 мс |
| `freePort()` | свободный порт для `--remote-debugging-port` (через `net.createServer`) |
| `launchChromium(bin, port)` | `spawn` с `--headless=new --no-sandbox --disable-gpu --disable-extensions --disable-dev-shm-usage --user-data-dir=<mkdtemp> --remote-debugging-port=<port>` |
| `waitForCdp(base)` | опрос `fetch(base + '/json/version')` до готовности (таймаут) |
| `connect(base)` | `WebSocket` к `webSocketDebuggerUrl` таргета `type === 'page'`; `send(method, params)` по id; подписка на события |
| `evaluate(expression)` | `Runtime.evaluate` с `awaitPromise: true, returnByValue: true`; исключение при `exceptionDetails` |
| `waitFor(expression, timeout)` | опрос DOM каждые ~50 мс; фиксированных `sleep` нет |
| `ok(msg)` / `fail(msg)` | печать `✓ <проверка>`; при первом провале — сообщение (проверка, URL, статус) и `process.exit(1)` |

Проверки (соответствие TR-57):

| # | Проверка | Как именно |
|---|---|---|
| 1 | Страница отдаётся | `Page.navigate` → `Page.loadEventFired`; `document.title === 'Math'`; `#root` имеет дочерние узлы |
| 2 | CSS загружен | `link[rel=stylesheet]` → 200; `getComputedStyle(document.body).backgroundImage` содержит `gradient` |
| 3 | JS загружен | ровно 1 `script[type=module]`, его `src` → 200; `Runtime.exceptionThrown` пуст |
| 4 | Аудио на месте | имена трёх файлов берутся из `dist/assets/*.mp3`; внутри страницы `await fetch('./assets/<name>')` → `ok`, `content-type` начинается с `audio/`, размер > 0 |
| 5 | Карта | `#mapScreen.classList.contains('active')`; `.map-trainer` = **15**; `.map-trainer--current` = **0** и `.map-trainer--near` = **1** (старт `−1`, см. D58); `.map-road path` есть |
| 6 | Модалка | клик по `.map-trainer--near` → ждём `.map-trainer--current` = **1** и `.modal-overlay.open` (реальный CSS-transition ~600 мс, таймаут 5 с); `.diff-btn` = 3; `[data-diff="easy"]` есть |
| 7 | Игра | `.diff-btn[data-diff="easy"].click()` → `#gameScreen.active`; `.answer-btn` = 4; `.question` совпадает с `/^\d+ [+−×] \d+ = \?$/` |
| 8 | Полный раунд | 10 ×: разобрать вопрос → вычислить ответ → клик по `.answer-btn` с этим текстом → `.feedback.correct-fb.show` → клик по кнопке «Продолжить» (`.feedback .btn`) → ждать следующий вопрос или результаты. После 10-го: `#resultScreen.active`, `#resultScreen h1` непустой, первый `.stat-value` = `10`, `#roundEarnings` начинается с «Заработано» |
| 9 | Нет 404 | в `Network.responseReceived` ни одного `status >= 400` для ресурсов `Document`/`Script`/`Stylesheet`/`Media`; ни одного `Network.loadingFailed` |
| 10 | Нет ошибок | `Runtime.consoleAPICalled` с `type: 'error'`/`'warning'` и `Runtime.exceptionThrown` пусты |

Детали, которые легко забыть:

- `localStorage` очищается **до** запуска приложения: `Page.addScriptToEvaluateOnNewDocument` с `try{localStorage.clear()}catch(e){}` **перед** навигацией. Иначе `ml_stats` прошлого прогона сдвинет игрока и раунд станет недетерминированным.
- `/favicon.ico` не считается 404: проверка 9 фильтрует **типы ресурсов**, а не все запросы.
- На чистом `ml_stats` игрок стоит **перед** первым тренажёром (`START_INDEX = -1`): `--current` нет, первый тренажёр `--near`. Модалку открывает **прибытие** (`arrived()`), а не клик по `--current` (D58).
- Клик — по тексту ответа, не по индексу: варианты перемешаны (`ProblemGenerator.build`).
- Ответ вычисляется только для `easy`-форматов: `+`, `−` (U+2212), `×`.
- `--disable-extensions` и временный `--user-data-dir` обязательны: системные расширения (CryptoPro, Госуслуги) добавляют CDP-таргеты и шум в консоли.
- В `finally`: закрыть `WebSocket`, `chromium.kill()`, удалить временный профиль.

---

## 🚀 Этап 19: production-сборка и ассеты (SPEC 1.8.4)

Порядок жёсткий: **фундамент → скрипты/HTML → ассеты → контракт `dist` → браузерная проверка → dev/аудит → документация**. После каждого шага — `npx tsc --noEmit` = 0 и зелёный `npm test` (261).

| Шаг | Что делается | Файлы | Метка коммита |
|---|---|---|---|
| 19.0 | фиксация SPEC/RULES 1.8.4 и плана | `.gigacode/{specs,rulles,plans}` | `docs(1.8.4): spec/rules/plan` |
| 19.1 | плагин, `vite.config.ts`, `"type": "module"`, `git rm jest.config.js` | `vite.config.ts`, `package.json`, `package-lock.json` | `build(1.8.4): vite-framework` |
| 19.2 | скрипты `build`/`preview`, инварианты `index.html` | `package.json` | `build(1.8.4): build-scripts` |
| 19.3 | mp3 → `src/assets/audio/`, `AUDIO_URLS`, `AudioService`, тест аудио | `src/assets/audio/*`, `src/services/audio-service.ts`, `test/services/audio-service.test.ts` | `build(1.8.4): audio-url` |
| 19.4 | контракт `dist`: инвентарь, один CSS, `./assets/…` | проверка, правок нет | `build(1.8.4): dist-contract` |
| 19.5 | `scripts/verify-dist.mjs`, preview + headless | `scripts/verify-dist.mjs` | `test(1.8.4): verify-dist` |
| 19.6 | dev-smoke, coverage, финальный аудит | — | `final-audit` |
| 19.7 | документация и архивы | README, GIGACODE, test/README, SPEC, TASKS, plans | `docs 1.8.4` |

### 19.0. Подготовка и фиксация (TR-51…TR-60, Z32)

- `git status --short` — ожидается: `M .gigacode/specs/SPEC.md`, `M .gigacode/rulles/RULES.md`, `?? .gigacode/specs/spec_v1_8_4.md`, `?? .gigacode/rulles/rules_v_1_8_4.md`. **Никакого `git add -A`.**
- Адресно: `git add .gigacode/specs/SPEC.md .gigacode/specs/spec_v1_8_4.md .gigacode/rulles/RULES.md .gigacode/rulles/rules_v_1_8_4.md .gigacode/plans/PLAN.md .gigacode/plans/PLAN_v1_8_3.md .gigacode/plans/PLAN_v1_8_4.md`.
- Коммит: `docs(1.8.4): spec, rules и план production-сборки`. Пуш — только по согласованию.
- Базовая линия: `npx tsc --noEmit` → 0; `npm test` → 261/28; `ls dist` → нет каталога.

**Проверка:** дерево чистое; `git diff --name-only` не содержит `src/**`, `test/**`. **Охватывает:** подготовку к A65–A71, Z32.

### 19.1. Фундамент сборки (TR-51, TR-58; A65, A68, A71; T57)

```bash
npm i -D @vitejs/plugin-react@^6 --force --cache /tmp/npm-cache-1.8.4
```

- `--force` — вынужденно: `ERESOLVE` из-за остаточных `babel-jest`/`@babel/core@7` в `dependencies` против optional-peer `@rolldown/plugin-babel` (`@babel/core@8`). Dry-run: «added 1 package», ничего не удаляется.
- **Не использовать** `--legacy-peer-deps`: dry-run удаляет `@testing-library/dom` (peer RTL) и 6 транзитивных пакетов — 11 UI-сьютов упадут.
- Проверить: `npm ls @vitejs/plugin-react vite` без `invalid`; `ls node_modules/@vitejs/plugin-react/package.json`.
- Создать `vite.config.ts` (контракт выше).
- `package.json`: добавить `"type": "module"` рядом с `name`/`version` (корень объекта).
- `git rm jest.config.js` (мёртвый CJS-конфиг: `testMatch` на `*.test.js`, `setup.js` не существует).
- `"type": "module"` + `vitest.config.ts` — проверить, что `npm test` остаётся 261/28.

**Проверка:**

```bash
npx vite build 2>&1 | tee /tmp/ml-1.8.4-vite-build.log
grep -c "loaded as CommonJS" /tmp/ml-1.8.4-vite-build.log   # 0
test -f dist/index.html && echo dist-ok
npm ls @vitejs/plugin-react vite                            # без invalid
npx tsc --noEmit && npm test                                # 0 и 261
```

**Критерий:** `vite build` зелёный и без предупреждения о формате конфига, `dist/index.html` существует, `jest.config.js` нет, `tsc` 0, `npm test` 261/28. **Охватывает:** TR-51, TR-58, A65, A68, A71, T57, D48.

### 19.2. Скрипты и минимальный `index.html` (TR-52, TR-53; A67; T58)

- `package.json`: `build` = `tsc --noEmit && vite build` (не `;`, не алиас `typecheck`); `dev`, `preview`, `typecheck`, `test`, `test:watch`, `test:coverage` — как в контракте.
- `index.html` **не меняется** — проверить инварианты:

```bash
grep -c '<script' index.html            # 1
grep -c 'type="module"' index.html      # 1
grep -cE 'stylesheet|js/|audio/' index.html  # 0
```

- `src/main.tsx` **не меняется** — проверить 6 импортов и порядок `base → buttons → screens → game → results → map`.
- Прогнать `rm -rf dist && npm run build`: до 19.3 в `dist/assets` ещё **нет mp3** — это ожидаемо; CSS/JS на месте.

**Критерий:** `build` вызывает Vite; в скрипте именно `&&`, а не `;` (проверяется строкой `package.json`, исходники ломать не нужно); `dist/index.html` есть; инварианты HTML/CSS — 1/1/0 и 6 импортов. **Охватывает:** TR-52, TR-53, A67, T58.

### 19.3. Ассеты и `?url` (TR-55, TR-60; A66; T59; D23)

```bash
mkdir -p src/assets/audio
git mv audio/click.mp3 src/assets/audio/click.mp3
git mv audio/win.mp3   src/assets/audio/win.mp3
git mv audio/lose.mp3  src/assets/audio/lose.mp3
rmdir audio
```

- Создать `src/assets/audio/audio-urls.ts` (контракт выше).
- Переписать `preload()` в `src/services/audio-service.ts`: обход `Object.keys(AUDIO_URLS)`, `new Audio(AUDIO_URLS[kind])`, `_sounds: Map<AudioKind, HTMLAudioElement>`; `export type { AudioKind }` сохранить.
- `test/services/audio-service.test.ts`: импорт `AUDIO_URLS`; проверка «загружает click, win, lose» → `expect(calls).toEqual([AUDIO_URLS.click, AUDIO_URLS.win, AUDIO_URLS.lose])`. Литералы `'audio/click.mp3'` удаляются **полностью**; число проверок не уменьшается (тест «3 звука» остаётся).
- `public/audio/`, ручное копирование в `dist` — запрещены (A66/Z30).

**Проверка:**

```bash
test ! -d audio
grep -RIn "'audio/\|\"audio/\|new Audio('audio/" src   # пусто
grep -c "?url" src/assets/audio/audio-urls.ts          # 3
npx tsc --noEmit && npm test                           # 0 и 261
rm -rf dist && npm run build && ls dist/assets/*.mp3 | wc -l   # 3
```

**Критерий:** корневого `audio/` нет; в `src` нет строковых путей; три `?url`; `tsc` 0; `npm test` 261; в `dist/assets` ровно 3 `*.mp3` размерами ≈ 4222/29350/52337 B. **Охватывает:** TR-55, TR-60, A66, T59, D23 спеки.

### 19.4. Контракт `dist` (TR-56, TR-54; A69; T60; D17)

Правок нет — только доказательства:

```bash
rm -rf dist && npm run build

test -f dist/index.html
test -f "$(ls dist/assets/index-*.js | head -1)"
test -f "$(ls dist/assets/index-*.js.map | head -1)"
test "$(ls dist/assets/index-*.css | wc -l)" -eq 1
test "$(ls dist/assets/*.mp3 | wc -l)" -eq 3
test ! -d dist/js -a ! -d dist/audio -a ! -d dist/css -a ! -d dist/src
test -z "$(find dist -name '*.ts' -o -name '*.tsx')"

grep -c '<script' dist/index.html          # 1
grep -c 'type="module"' dist/index.html    # 1
grep -c 'stylesheet' dist/index.html       # 1
grep -c '"/assets/' dist/index.html        # 0 — пути только ./assets/…
grep -l 'linear-gradient(135deg' dist/assets/*.css   # ≥ 1 файл
grep -l 'map-trainer' dist/assets/*.css              # ≥ 1 файл (map.css)
grep -l 'answer-btn' dist/assets/*.css               # ≥ 1 файл (game.css)
grep -c 'sourceMappingURL' dist/assets/*.js          # 1
```

- Ожидаемая разметка (хеши произвольны):

```html
<script type="module" crossorigin src="./assets/index-XXXXXXXX.js"></script>
<link rel="stylesheet" crossorigin href="./assets/index-XXXXXXXX.css">
```

- `crossorigin` добавляет Vite — это норма (TR-56).
- `sourcemap: true` даёт `index-<hash>.js.map`; CSS-карт не требуем (D53).
- Если CSS-бандл пуст — искать причину в 6 импортах `main.tsx`, а не «дописывать» стили в `dist`.

**Критерий:** все строки выше совпали; `dist/index.html` ссылается только на `./assets/…`; один CSS с правилами всех 6 точек входа. **Охватывает:** TR-54, TR-56, A69, T60, D17.

### 19.5. `scripts/verify-dist.mjs` (TR-57; A70; T61; D50, D51)

```bash
rm -rf dist
npm run build
npm run preview -- --port 4173 --strictPort &
node scripts/verify-dist.mjs --url http://127.0.0.1:4173/ --chromium /usr/bin/chromium
```

- Реализовать по контракту выше: 10 проверок, `✓` на каждую, `OK: dist verified` и код 0 при успехе; код 1 и адресное сообщение при первом провале.
- Только Node 26-встроенное: `WebSocket`, `fetch`, `child_process`, `fs`, `os`, `net`. **Никаких** Playwright/Puppeteer/`ws`/`chrome-remote-interface` (Z33).
- `--headless=new --no-sandbox --disable-gpu --disable-extensions --disable-dev-shm-usage`, временный `--user-data-dir`, фильтр таргетов `type === 'page'`.
- `localStorage` чистится `Page.addScriptToEvaluateOnNewDocument` до навигации (сброс `ml_stats`).
- Ожидания — опрос DOM с таймаутом; `sleep` запрещён (Z33).
- Ответ — по тексту кнопки, вопрос — только `easy`-форматы (`+`, `−`, `×`).

**Проверка:**

```bash
node scripts/verify-dist.mjs --url http://127.0.0.1:4173/ --chromium /usr/bin/chromium; echo "exit: $?"

rm -rf dist && npm run build
node scripts/verify-dist.mjs --url http://127.0.0.1:4173/ --chromium /usr/bin/chromium   # тот же 0
```

**Критерий:** exit 0; в выводе 15 тренажёров, 10/10, 3 mp3, 0 ответов ≥ 400, 0 console-ошибок; повторный прогон с `rm -rf dist` — тоже 0; в `package.json` нет новых зависимостей. **Охватывает:** TR-57, A70, T61, Z33, D50, D51.

### 19.6. Dev-smoke, покрытие и финальный аудит (TR-59, TR-60, T62)

**19.6a — dev:** `npm run dev` (порт 5173) → 200 на `/`, карта и 15 тренажёров, клик по соседнему тренажёру открывает модалку сложности, консоль без ошибок; в логе Vite нет предупреждений о формате конфига и о `base`.

**19.6b — проверки перед сдачей (T62):**

```bash
npx tsc --noEmit
npm test
npm run test:coverage 2>&1 | tee /tmp/ml-1.8.4-coverage.txt
rm -rf dist && npm run build
node scripts/verify-dist.mjs --url http://127.0.0.1:4173/ --chromium /usr/bin/chromium

grep -RInE "new Audio\('audio/|'audio/" src          # пусто
grep -RIn '"/assets' src index.html                  # пусто (кроме src="/src/main.tsx")
grep -n "base:" vite.config.ts                       # base: './'
test ! -d audio -a ! -f jest.config.js               # ок
grep -c 'assets/.*\.mp3' dist/index.html             # 0
```

**19.6c — аудит:**

| # | Проверка | Ожидание |
|---|---|---|
| 1 | `npx tsc --noEmit` | 0 |
| 2 | `npm test` | 28 сьютов / 261 тест, зелёные |
| 3 | `npm run test:coverage` | пороги 80/60 зелёные; агрегат близок к 96.84/88.74 (1.8.3) — отклонение допустимо только из-за нового кода аудио, пороги не понижаются |
| 4 | `npm run build` с нуля | `dist/` создан, инвентарь 19.4 совпал |
| 5 | `verify-dist.mjs` | 0 |
| 6 | `grep -RIn "'audio/" src test` | пусто |
| 7 | `grep -RIn "public/audio" .` | пусто |
| 8 | `grep -RIn "base:" vite.config.ts` | ровно один `base: './'` |
| 9 | `git status --short` | `dist/`, `coverage/`, `node_modules` не в индексе |
| 10 | `git diff --name-only -- src test` | только `src/assets/audio/*`, `src/services/audio-service.ts`, `test/services/audio-service.test.ts`, удалённые `audio/*.mp3` |
| 11 | `wc -l` новых файлов | каждый ≤ 200 |
| 12 | `grep -RIn "new Audio(" src` | одна строка — `new Audio(AUDIO_URLS[kind])` в `audio-service.ts` |

**Критерий:** все пункты зелёные; «озеленение» через отключение `sourcemap`, `assetsInlineLimit` или `base` — запрещено (Z31).

### 19.7. Документация и архивы

- **`README.md`**: раздел «Запуск/сборка» — `npm run build` создаёт `dist`; убрать оговорку «в прод-сборке звук не играет» (теперь играет: mp3 в `dist/assets`); строку таблицы «Прод-сборка» переписать на «✅ собирается, проверено headless»; в структуру добавить `vite.config.ts`, `scripts/verify-dist.mjs`, `src/assets/audio/`.
- **`GIGACODE.md`**: структура (+`vite.config.ts`, +`scripts/`, +`src/assets/audio/`), «Запуск, проверка типов, тесты и сборка» (build = tsc + vite build, dist-контракт), «Звуковое сопровождение» (импортируемые URL, `?url`, работает в проде), «index.html и подключение» (правит Vite), «История миграции» + пункт 1.8.4.
- **`test/README.md`**: контракт аудио-теста — сравнение с `AUDIO_URLS`, а не с литералами/хешами.
- **`.gigacode/specs/SPEC.md`**: 1.8.4 → **Выполнено** (после 19.6).
- **`.gigacode/tasks/TASKS.md`**: архив `TASKS_v1_8_3.md`; версия 1.8.4; этап 19 (19.0–19.7) со статусами; итог «28 сьютов / 261 тест, dist проверен headless».
- **`.gigacode/plans/`**: `PLAN.md` — эта версия; `PLAN_v1_8_3.md` — архив; `PLAN_v1_8_4.md` — однострочный указатель на `PLAN.md` (D47).

**Критерий:** README/GIGACODE не противоречат фактическому поведению (`build` → `dist`, звук в проде работает); SPEC/TASKS/PLAN — 1.8.4; архивы 1.8.3 на месте.

---

## ✅ Критерии завершения (1.8.4, 150–163)

150. **Конфиг сборки** (TR-51/A65): `test -f vite.config.ts`; `grep -q "plugin-react"`; `react()`, `base: './'`, `outDir: 'dist'`, `sourcemap: true`, `assetsInlineLimit: 0`; `npm ls @vitejs/plugin-react vite` без `invalid`.
151. **ESM-инструменты** (A71/TR-51): `"type": "module"`; `jest.config.js` отсутствует; `npx vite build` без «loaded as CommonJS»; `vitest.config.ts` — ESM; `npm test` зелёный после смены типа.
152. **`build` — это сборка** (TR-52/A65): скрипт `tsc --noEmit && vite build`; `rm -rf dist && npm run build` → `dist/index.html`; ошибка типов останавливает сборку.
153. **`index.html` минимальный** (TR-53/A67): `<script` = 1, `type="module"` = 1, `stylesheet|js/|audio/` = 0; `style="display: contents"` — разрешённое исключение.
154. **CSS** (TR-54): 6 импортов в `main.tsx` в порядке base → buttons → screens → game → results → map; в `dist/assets` ровно один `*.css` с `linear-gradient(135deg`; `dist/css` нет.
155. **Аудио** (TR-55/A66/T59): `test ! -d audio`; `grep -RIn "'audio/" src` пусто; три `?url`; три mp3 в `dist/assets`; `AUDIO_URLS` — из `src/assets/audio/audio-urls`, `AudioKind` по-прежнему доступен как реэкспорт из `src/services/audio-service`.
156. **Контракт `dist`** (TR-56/A69/T60): 1 JS + `.map`, 1 CSS, 3 mp3; нет `js/`, `audio/`, `css/`, `src/`, `*.ts`/`*.tsx`; пути только `./assets/…`; `"/assets/` = 0.
157. **`base: './'`** (TR-58/A68): единственная точка настройки; в `src`/`index.html` нет абсолютных `/assets`/`/audio`; `src="/src/main.tsx"` — точка входа Vite, не ассет.
158. **Браузерная проверка** (TR-57/A70/T61): `node scripts/verify-dist.mjs` → 0; 15 тренажёров, старт `−1` (0 `--current`, 1 `--near`), SVG-дорога; после прибытия 1 `--current` и модалка с 3 `.diff-btn`; игра с 4 ответами; полный раунд 10/10 → `#resultScreen.active`, `#resultScreen h1` непуст, первый `.stat-value` = 10, `#roundEarnings` начинается с «Заработано».
159. **Нет 404 и ошибок** (TR-57/T61): ни одного ответа ≥ 400 на document/script/stylesheet/media и ни одного `loadingFailed`; `console.error`/`console.warn` и `pageerror` пусты.
160. **Скрипт без зависимостей** (T61/Z33): `package.json` без Playwright/Puppeteer/`ws`; `verify-dist.mjs` на встроенных `WebSocket`/`fetch`/`child_process`; без `sleep`.
161. **Dev не сломан** (TR-59): `npm run dev` → 200, карта и 15 тренажёров, 0 ошибок консоли; `?url` в dev отдаётся как `/src/assets/audio/<name>.mp3`.
162. **Типы, тесты, покрытие** (TR-60): `npx tsc --noEmit` 0; `npm test` 261/28; пороги 80/60 зелёные; в аудио-тесте нет литералов `'audio/`, сравнение с `AUDIO_URLS`; остальные 27 сьютов не менялись.
163. **Git-дисциплина** (Z32): `dist/`, `coverage/`, `node_modules` не в индексе; нет `git add -A`; ветка `dev`; пуш/мерж — по согласованию.

---

## 📏 Бюджет строк (лимит GIGACODE — 200 строк на файл)

| Файл | Оценка | Как уложиться |
|---|---|---|
| `vite.config.ts` | ≈ 14 | контракт из T57 без комментариев-простыней |
| `src/assets/audio/audio-urls.ts` | ≈ 18 | три импорта + `AUDIO_URLS` + тип |
| `src/services/audio-service.ts` | ≈ 67 | было 63; добавились импорт и `Map<AudioKind, …>` |
| `test/services/audio-service.test.ts` | ≈ 120 | замена трёх `toContain` на `toEqual(AUDIO_URLS…)`; сценарии не удаляются |
| `scripts/verify-dist.mjs` | ≈ 190 | компактные хелперы; при > 200 — вынести CDP-плумбинг в `scripts/cdp.mjs` (D55) |
| `package.json` | — | +1 devDep, `type`, 7 скриптов |

Если `verify-dist.mjs` выходит за 200 — сокращать комментарии и дублирование `evaluate`, **не** убирать проверки 1–10 и не дробить CLI.

---

## 📂 Структура файлов (дельта)

```
vite.config.ts                              # [NEW] react(), base './', dist, sourcemap, assetsInlineLimit 0
jest.config.js                              # [DEL] мёртвый CJS-конфиг
scripts/
└── verify-dist.mjs                         # [NEW] preview + headless CDP, 10 проверок
src/
├── assets/audio/
│   ├── click.mp3                           # [MOV] audio/click.mp3
│   ├── win.mp3                             # [MOV] audio/win.mp3
│   ├── lose.mp3                            # [MOV] audio/lose.mp3
│   └── audio-urls.ts                       # [NEW] AUDIO_URLS через ?url + AudioKind
├── services/audio-service.ts               # [ИЗМ] preload() на AUDIO_URLS, API сохранён
└── … (37 файлов)                           # [без изм.]
audio/                                      # [DEL] пустой каталог удаляется
test/services/audio-service.test.ts         # [ИЗМ] ожидания = AUDIO_URLS
package.json / package-lock.json            # [ИЗМ] type: module, build, +@vitejs/plugin-react
css/ (21)                                   # [без изм.]
index.html                                  # [без изм.] — инварианты проверяются
.gigacode/specs/SPEC.md                     # [ИЗМ] статус 1.8.4 — выполнено
.gigacode/tasks/TASKS.md                    # [ИЗМ] версия 1.8.4, этап 19
.gigacode/tasks/TASKS_v1_8_3.md             # архив (19.7)
.gigacode/plans/PLAN.md                     # этот файл (1.8.4)
.gigacode/plans/PLAN_v1_8_3.md              # архив 1.8.3
.gigacode/plans/PLAN_v1_8_4.md              # указатель на PLAN.md (D47)
```

---

## 🚫 Запреты

### Z30 (сборка и ассеты) — буквально

- Строковые пути к ассетам: `new Audio('audio/…')`, `'./audio/…'`, `'/assets/…'`, склейка имени файла во время выполнения.
- Копирование mp3 в `public/` или в `dist` руками.
- Ручные `<link>`/`<script>` в `index.html` и правка собранного HTML.
- `base: '/'` при заявленной поддержке подпапки (и наоборот).
- `npm run build`, который не вызывает `vite build`.
- Коммит `dist/`, `coverage/`, `node_modules/`, кэша Vite.
- Правка `tsconfig`/`vitest.config.ts` ради обхода ошибки сборки.

### Z31 («зелёная» сборка) — буквально

- Считать успех по коду выхода без проверки инвентаря `dist`.
- Игнорировать 404 по CSS/JS/mp3 и ошибки консоли.
- Проверять только dev-сервер или открывать `dist/index.html` через `file://`.
- Проходить раунд частично (3–4 вопроса) и называть это полным.
- Отключать `sourcemap`, убирать `assetsInlineLimit: 0` или «временно» менять `base`, чтобы проверка прошла.
- Удалять/скипать тест аудио вместо обновления ожиданий на `AUDIO_URLS`.
- Понижать пороги покрытия и объявлять успех по частичному прогону.

### Z32 (git) — буквально

- Коммитить артефакты сборки и отчёты покрытия.
- `git add -A` (в дереве есть посторонние файлы документации).
- Переписывать историю (`rebase -i`, `reset --hard`, force-push) без согласования.
- Обновлять версии React/Vite/Vitest «заодно» с добавлением плагина.
- Мержить ветку с красными тестами или непроверенным `dist`.

### Z33 (проверка) — буквально

- Новые npm-зависимости для smoke-теста (Playwright, Puppeteer, axe, `ws`, `chrome-remote-interface`).
- Фиксированные `sleep` вместо ожидания состояния DOM.
- Запуск Chromium без `--disable-extensions` и временного профиля.
- Клик по `.answer-btn` по индексу вместо вычисленного ответа.
- Проверка, завязанная на точные хеши имён ассетов.

### Дополнительно для 1.8.4

- `--legacy-peer-deps` в этом дереве (удаляет `@testing-library/dom`).
- Чистка «мусорных» `jest-*`/`babel-*`/`istanbul-*` из `dependencies` внутри 1.8.4.
- Правки `src/components`, `src/hooks`, `src/core`, `src/data`, `src/ui`, `App.tsx`, `main.tsx`.
- Перенос `css/` в `src/assets/css` и переписывание `@import`-партиалов.
- «Заодно» обновление версий пакетов.

---

## 📦 Вне области (SPEC 1.8.4)

- Любые изменения поведения игры, разметки, классов, текстов, `CONFIG`, `Stats` v3, ключей `ml_stats`/`ml_session_lock`, CSS-правил и порядка каскада.
- Перенос `css/` в `src/assets/css`.
- Дублирование mp3 в `public/` или ручное копирование в `dist`.
- Чистка транзитивных `jest-*`/`babel-*` из `dependencies` (отдельная задача; удаляется только `jest.config.js`).
- PWA/Service Worker, манифест, офлайн-кэш.
- CI/GitHub Actions и публикация на хостинг (только `vite preview`).
- Playwright/E2E-каталог: проверка `dist` — smoke на CDP, а не новый фреймворк.
- 100% покрытие и тесты ради покрытия.
- `sourcemap: false`/`'hidden'` «ради размера» без согласования.

---

## ⚠️ Отклонения/уточнения от буквы SPEC/RULES

| # | Требование | Уточнение | Как решаем |
|---|---|---|---|
| D47 | SPEC: связанный документ `PLAN_v1_8_4.md` | По конвенции репозитория актуальный план — `PLAN.md`, а архив предыдущей версии — `PLAN_v1_8_3.md` (так делалось в 1.8.1–1.8.3) | `PLAN.md` — эта версия; `PLAN_v1_8_3.md` — архив; `PLAN_v1_8_4.md` — однострочный указатель на `PLAN.md`, чтобы ссылка спеки не была битой |
| D48 | TR-51: `npm i -D @vitejs/plugin-react@^6` | Фактически `ERESOLVE`: `@babel/core@7.29.7` (остаток `babel-jest` в `dependencies`) против `@babel/core@8.1.0` из optional-peer `@rolldown/plugin-babel` | Ставим `--force` (dry-run: +1 пакет, ничего не удаляет). `--legacy-peer-deps` запрещён: удаляет `@testing-library/dom` и ломает UI-сьюты |
| D49 | TR-51/T58: `"type": "module"` | `jest-environment-jsdom` в `devDependencies` не используется, но чистка зависимостей вне 1.8.4 | Оставляем как есть; фиксируем в README-разделе «задолженность», удаление — отдельной задачей |
| D50 | TR-57 п.4: «3 запроса `assets/*.mp3` → 200» | `new Audio(url)` без `play()` не обязан скачивать файл: браузер может ограничиться метаданными, и проверка «по сетевому логу» станет флаки | Проверяем **явным `fetch()`** трёх mp3 из страницы (имена — из `dist/assets`); сетевые ответы, если они были, тоже сверяем на 200/`audio/*` |
| D51 | TR-57/A70: «ожидания — опрос DOM с таймаутом» | В CDP нет встроенного `waitFor` | `evaluate` в цикле каждые ~50 мс с таймаутом 5 с; `sleep` нет |
| D52 | TR-57 п.9: «нет ответов ≥ 400» | Chromium всегда запрашивает `/favicon.ico`, которого в `dist` нет | Фильтр по типам ресурсов `Document`/`Script`/`Stylesheet`/`Media`; favicon не считается 404 |
| D53 | TR-51/T57: `sourcemap: true` | Vite 8 не генерирует CSS-карты для этой конфигурации | Требуем только `index-<hash>.js.map`; отсутствие `*.css.map` — норма |
| D54 | TR-53/A67: `#root` `style="display: contents"` | Это inline-поведение раскладки 1.8.2, а не оформление | Оставляем inline; перенос в CSS — вне 1.8.4 |
| D55 | GIGACODE: лимит 200 строк на файл (`src/`) | `scripts/verify-dist.mjs` с CDP-плумбингом вплотную к лимиту | Держим ≤ 200; при превышении — `scripts/cdp.mjs` рядом, CLI и проверки остаются в `verify-dist.mjs` |
| D56 | Z30/A68: «нет абсолютных `/src/…`» | `index.html` содержит `src="/src/main.tsx"` — это точка входа Vite, а не ассет | Трактуем как в TR-58: проверяем отсутствие `"/assets`, `"/audio`; `/src/main.tsx` разрешён |
| D57 | TR-52: «дополнительные npm-скрипты не добавляются» | `npm test` и `test:coverage` уже есть; новых нет | Проверка `dist` запускается `node scripts/verify-dist.mjs` напрямую, `package.json` не расширяется |
| D58 | TR-57 п.5–6: «`.map-trainer--current` ровно 1» и «клик по `.map-trainer--current` → модалка» | После очистки `ml_stats` игрок стоит на `START_INDEX = -1` (`PlayerRules`): `--current` нет, первый тренажёр — `--near`. Модалку открывает прибытие (`arrived()`), а не клик по `--current` | Проверяем старт: 15 тренажёров, `--current` = 0, `--near` = 1; кликаем `--near` и ждём прибытия (`.map-trainer--current` = 1, `.modal-overlay.open`). Заодно проверяется реальный путь «движение 600 мс → модалка» |

---

## 🔗 Трассировка требований

| Требование | Где реализуется | Шаг | Критерии |
|---|---|---|---|
| TR-51. Плагин, `vite.config.ts`, ESM, `jest.config.js` | `vite.config.ts`, `package.json` | 19.1 | 150, 151 |
| TR-52. `build` = tsc + vite build | `package.json` | 19.2 | 152 |
| TR-53. Минимальный `index.html` | `index.html` (без правок) | 19.2 | 153 |
| TR-54. 6 CSS-импортов, один бандл | `src/main.tsx` (без правок) | 19.2, 19.4 | 154 |
| TR-55. mp3 + `?url` | `src/assets/audio/**`, `audio-service.ts` | 19.3 | 155 |
| TR-56. Контракт `dist` | сборка + инвентарь | 19.4 | 156 |
| TR-57. `verify-dist.mjs` | `scripts/verify-dist.mjs` | 19.5 | 158, 159 |
| TR-58. `base: './'` | `vite.config.ts` | 19.1, 19.6 | 157 |
| TR-59. Dev не сломан | `npm run dev` | 19.6 | 161 |
| TR-60. Тест аудио, `tsc`, coverage | `test/services/audio-service.test.ts` | 19.3, 19.6 | 162 |
| A65. Сборка — артефакт | `package.json`, `vite.config.ts`, инвентарь `dist` | 19.1–19.4 | 150, 152, 156 |
| A66. Ассеты импортируются | `audio-urls.ts` | 19.3 | 155 |
| A67. `index.html` принадлежит Vite | инварианты | 19.2 | 153 |
| A68. `base` в одном месте | `vite.config.ts` | 19.1, 19.6 | 157 |
| A69. Контракт `dist` важнее кода выхода | инвентарь T60 | 19.4 | 156, 159 |
| A70. Проверка в браузере на `dist` | `verify-dist.mjs` | 19.5 | 158–160 |
| A71. Один ESM-формат | `type: module`, удаление CJS | 19.1 | 151 |
| T56–T62. Структура, конфиги, проверки | 19.1–19.6 | 19.1–19.6 | 150–162 |
| Z30–Z33. Запреты | раздел «Запреты» | все шаги | 163 |

---

## ⚠️ Риски и примечания

- **R14. `ERESOLVE` при установке плагина.** `dependencies` засорены `babel-jest` 29 → `@babel/core@7`, а optional-peer `@rolldown/plugin-babel` требует `@babel/core@8`. Лечение — `--force` (проверено dry-run). Если `--force` всё же утянет `@babel/core@8`, сборка не пострадает (Vite 8 использует oxc/rolldown), но `npm test` надо перепроверить.
- **R15. Read-only npm cache.** `~/.npm` в песочнице недоступен для записи (`EROFS`) — установка только с `--cache /tmp/…`; запись в `node_modules` вне рабочей области требует approval. Это окружение, а не проект.
- **R16. Относительный `base` в dev.** Vite 8.3.5: `base === './'` → в build `'./'`, в dev `'/'` (`resolveBaseUrl`/`resolvedBase`). Поэтому `npm run dev` не ломается и предупреждений не печатает.
- **R17. Инлайн mp3.** `click.mp3` = 4222 B > 4096 B: без `assetsInlineLimit: 0` файл может исчезнуть из `dist/assets`. Проверять количество mp3, а не размер бандла.
- **R18. `?url` в vitest.** Резолвится в dev-путь `/src/assets/audio/<name>.mp3`, а не в хеш. Тест обязан сравнивать с `AUDIO_URLS`, а не с `assets/click-<hash>.mp3`.
- **R19. `"type": "module"`.** Затрагивает все `.js`-файлы: `scripts/verify-dist.mjs` — ESM (ок), `jest.config.js` удаляется; сторонних CJS в репозитории нет.
- **R20. Headless Chromium.** Системные расширения (CryptoPro, Госуслуги) создают лишние таргеты и шум в консоли: обязательны `--disable-extensions`, временный `--user-data-dir`, фильтр `type === 'page'`, `--no-sandbox` (контейнер).
- **R21. Недетерминизм `localStorage`.** Без очистки `ml_stats` состояние зависит от прошлого прогона: игрок может стоять на тренажёре (`--current` = 1) или уже пройти часть карты — числа 15/10 и сценарий станут недетерминированными. Чистим `Page.addScriptToEvaluateOnNewDocument` до навигации и начинаем со старта `−1` (D58).
- **R22. `#resultScreen h1`.** Заголовок оценки — `<h1>{rating.title}</h1>` внутри `#resultScreen`; первый `.stat-value` = `results.correct`, `#roundEarnings` начинается с «Заработано» (проверено по `ResultsScreen.tsx`).
- **R23. Порт 4173.** `--strictPort` падает, если порт занят: перед запуском проверить/выбрать свободный и передать его в `--url`.
- **R24. Остатки прошлой сборки.** `dist` всегда пересобирается с `rm -rf dist`; иначе «нет `dist/audio`» пройдёт на старом артефакте.
- **R25. `assetsInlineLimit` и SVG/шрифты.** Нулевой лимит относится ко всем ассетам; других бинарных ассетов в проекте нет, роста числа запросов не будет.
- **R26. `tsc` и `vite.config.ts`.** Конфиг уже в `include`; `defineConfig`/`react()` типизируются из devDeps; `?url` — из `vite/client`. Новых `types` не нужно.
- **R27. Бюджет строк.** `verify-dist.mjs` — самый рискованный по 200-строчному лимиту (D55): сокращать плумбинг, не проверки.
- **R28. Отчёт coverage в песочнице.** Пишется в `coverage/` (в `.gitignore`); при запрете записи — `--coverage.reportsDirectory=/tmp/ml-cov`.
- **R29. CSS-transition в headless.** Прибытие игрока — реальный `transition: transform 600ms` + `onTransitionEnd`; в `--headless=new` переходы проигрываются (сквозной smoke 1.8.0 это подтвердил). Ждём `.map-trainer--current` до 5 с; если события нет — это провал проверки, а не повод кликать по `--current` или подменять сценарий.

### Вопросы владельцу (если не согласовано)

1. **Установка плагина с `--force`** — подтверждаем? Альтернатива: сначала почистить `dependencies` от `jest-*`/`babel-*`, но это выходит за рамки 1.8.4 (D48/D49).
2. **Ветка:** работаем в текущей `dev` или создаём `build/1.8.4`? В плане 1.8.3 упоминалась `feature/001`, фактически сейчас `dev`.
3. **`PLAN_v1_8_4.md`** — оставить указателем на `PLAN.md` (D47) или сделать полной копией?
4. **README/GIGACODE:** сейчас там написано «в prod-сборке звук не играет» — обновляем в 19.7, подтверждаем?

---

## ✅ Ожидаемый результат 1.8.4

- **Сборка работает:** `npm run build` = `tsc --noEmit && vite build`, создаёт `dist/` с одним JS (+ `.map`), одним CSS и тремя mp3 в `assets/`; путей `js/`, `css/`, `audio/`, `src/`, `*.ts` в `dist` нет.
- **ESM-инструменты:** `"type": "module"`, `vite.config.ts` с `react()`/`base: './'`/`assetsInlineLimit: 0`/`sourcemap`, `jest.config.js` удалён, предупреждений о CJS-конфиге нет.
- **Ассеты:** mp3 в `src/assets/audio/`, URL через `?url`/`AUDIO_URLS`, корневого `audio/` нет; звук работает и в dev, и в собранной версии.
- **Проверка результата:** `node scripts/verify-dist.mjs` → 0: 15 тренажёров, полный раунд 10/10, 3 mp3, 0 ответов ≥ 400, 0 console-ошибок; повтор на чистом `dist` — тот же результат.
- **Регрессий нет:** `npx tsc --noEmit` 0; `npm test` 261/28; coverage 80/60 зелёные; поведение, разметка и CSS не изменились (21 файл CSS, 0 правок; компоненты/хуки/домен — 0 правок).
- **Документация 1.8.4:** README/GIGACODE/test/README актуальны; SPEC — «Выполнено»; TASKS — этап 19; PLAN — эта версия, `PLAN_v1_8_3.md` и `TASKS_v1_8_3.md` — архивы.

---

## 📌 Краткая памятка агенту

✅ `npm run build` = `tsc --noEmit && vite build`; успех подтверждается инвентарём `dist`, а не кодом выхода
✅ `vite.config.ts`: `react()`, `base: './'`, `outDir: 'dist'`, `sourcemap: true`, `assetsInlineLimit: 0`
✅ `"type": "module"`; `jest.config.js` удалён; плагин ставится с `--force` (ERESOLVE) и `--cache /tmp/…`
✅ mp3 → `src/assets/audio/` через `git mv`; URL — только `AUDIO_URLS` из `?url`; `audio/` удалён
✅ `index.html` и `main.tsx` не правим — только проверяем 1/1/0 и 6 CSS-импортов
✅ `scripts/verify-dist.mjs` на Node 26 (`WebSocket`/`fetch`): preview + headless, 10 проверок, без `sleep`
✅ `localStorage.clear()` до навигации; клик по тексту ответа; полный раунд 10/10
✅ `tsc` 0 и `npm test` 261 после каждого шага; `dist`/`coverage` не в git

❌ `new Audio('audio/…')`, `public/audio`, ручное копирование в `dist`
❌ `<link>`/`<script>` в `index.html`, правка собранного HTML, `base: '/'`
❌ «build без dist», «проверено в dev», `file://`-проверка
❌ Playwright/Puppeteer/`ws` для smoke; `sleep` вместо ожидания DOM
❌ Правки `src/**` кроме аудио; понижение порогов; отключение `sourcemap`/`assetsInlineLimit` «ради проверки»
❌ `git add -A`, коммит `dist/`/`coverage/`, `--legacy-peer-deps` в этом дереве
