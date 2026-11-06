## 🏛️ Архитектурные принципы — дополнения (1.8.4)

### A65. Сборка — это артефакт, а не проверка типов

**Правило:** `npm run build` обязан создавать `dist/` настоящей production-сборкой.

**Правила:**

- `build` = `tsc --noEmit && vite build`; алиас на `typecheck` или `tsc` без Vite
  запрещён;
- ошибка типов останавливает сборку (`&&`), а не игнорируется;
- успех сборки подтверждается содержимым `dist`, а не кодом выхода команды;
- сборка всегда проверяется с нуля: `rm -rf dist && npm run build`;
- `dist/` — артефакт, в git не попадает (`.gitignore` уже содержит его).

**Причина:** в 1.8.3 `npm run build` завершался «успешно», но `dist/` не появлялся —
зелёный статус ничего не доказывал.

### A66. Ассеты импортируются, а не собираются строками

**Правило:** файлы ассетов попадают в бандл только через `import` (`?url`), а не
через строковые пути, собранные во время выполнения.

**Правила:**

- `new Audio('audio/' + name + '.mp3')` и любые `'audio/…'` запрещены;
- единственный источник URL — `src/assets/audio/audio-urls.ts` с тремя импортами
  `?url`; сервисы и компоненты берут значения оттуда;
- mp3 лежат в `src/assets/audio/`; корневого `audio/` нет;
- `public/audio/` и ручное копирование ассетов в `dist` запрещены — это второй
  источник правды;
- имена с хешем генерирует Vite; в коде и проверках — glob `assets/*.mp3`, а не
  точное имя;
- отсутствующий файл ассета должен ломать сборку, а не давать 404 в проде.

**Причина:** путь `audio/click.mp3` резолвился относительно документа, работал только
в dev и разваливался при `base: './'` и в `dist`, где каталога `audio/` нет.

### A67. `index.html` принадлежит Vite

**Правило:** в `index.html` нет ручных подключений стилей, скриптов и ассетов.

**Правила:**

- ровно один `<script type="module" src="/src/main.tsx">`; других `<script>` нет;
- нет `<link rel="stylesheet">`, `<style>`, `preload`-ссылок на mp3;
- нет ссылок на `js/…`, `css/…`, `audio/…`;
- Vite сам инжектит собранные CSS/JS в `dist/index.html` — руками это не правится;
- `style="display: contents"` у `#root` — разрешённое исключение (поведение 1.8.2).

**Причина:** ручные теги дублируют граф модулей, ломают хеширование и снова
превращают сборку в набор файлов, которые никто не проверяет.

### A68. `base` — одно место и никаких абсолютных путей

**Правило:** база деплоя задаётся только в `vite.config.ts`.

**Правила:**

- действующее значение — `base: './'` (относительные пути, работают в корне и в
  подпапке, включая GitHub Pages project page);
- в `src/**` и `index.html` запрещены абсолютные `"/assets/…"`, `"/src/…"`,
  `"/audio/…"`;
- URL ассетов берутся из импортов, а не из `location.pathname`;
- смена площадки не требует правок кода; если понадобится абсолютная база — меняется
  только `base`, и это фиксируется в отчёте.

**Причина:** абсолютные пути при `base: './'` дают 404 во всех вложенных деплоях, а
`base` в двух местах — гарантированный рассинхрон.

### A69. Контракт `dist` важнее «сборка прошла»

**Правило:** результат сборки проверяется по инвентарю файлов и по разметке
`dist/index.html`.

**Правила:**

- один module-скрипт `./assets/index-<hash>.js` и один `./assets/index-<hash>.css`;
- три `*.mp3` в `dist/assets`, непустые;
- нет `dist/js/`, `dist/audio/`, `dist/css/`, `dist/src/`, `*.ts`, `*.tsx`;
- нет ссылок на `/src/` и `js/*.ts` в собранном HTML;
- проверка — команды из T60, а не «на глаз».

**Причина:** историческая сборка 1.7.0 копировала `js/` и `css/` как есть; инвариант
«в `dist` только хешированные `assets/`» ловит рецидив сразу.

### A70. Проверка только в браузере и только на `dist`

**Правило:** «работает в dev» не считается доказательством; проверяется собранный
`dist` в `vite preview` и headless Chromium.

**Правила:**

- smoke: карта, **15** тренажёров, `#mapScreen.active`, дорога;
- полный раунд: 10 верных ответов `easy` → `#resultScreen.active`, 10/10;
- ни одного HTTP-ответа ≥ 400 на document/CSS/JS/mp3;
- ни одной `console.error`/`pageerror`;
- автоматизация — `node scripts/verify-dist.mjs` без новых npm-зависимостей;
- Chromium запускается с `--headless=new --no-sandbox --disable-gpu
  --disable-extensions` и временным `--user-data-dir`;
- `localStorage` очищается до прогона, ожидания — опрос DOM с таймаутом.

**Причина:** dev-сервер подставляет пути и модули, которых нет в проде; 404 по mp3 и
CSS виден только на собранных файлах.

### A71. Один модульный формат для инструментов

**Правило:** проект и его конфиги — ESM; CJS-пережитки не оставляем.

**Правила:**

- `package.json`: `"type": "module"`;
- `vite.config.ts`, `vitest.config.ts` — ESM (import/export);
- `jest.config.js` удалён; Jest в проекте не используется;
- плагин `@vitejs/plugin-react` версии, совместимой с Vite 8 (peer `^8.0.0`);
- `npm ls <pkg>` не должен показывать `invalid`.

**Причина:** Vite 8 при CJS-конфиге печатает предупреждение и сломает загрузку в
будущем native-загрузчике; `plugin-react@6` — ESM-only.

---

## 🔧 Технические ограничения — дополнения (1.8.4)

### T56. Структура сборки

```
index.html
vite.config.ts
src/
  main.tsx
  assets/audio/{click,win,lose}.mp3
  assets/audio/audio-urls.ts
  services/audio-service.ts
css/                       # 6 точек входа + *_items/ (не двигаются)
scripts/verify-dist.mjs
dist/                      # артефакт, в git не попадает
```

- корневого `audio/` нет; `public/` для mp3 не используется;
- `dist/` создаётся только `npm run build`;
- `coverage/`, `node_modules/`, кэш Vite в коммит не попадают.

### T57. `vite.config.ts`

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

- `assetsInlineLimit: 0` обязателен: `click.mp3` = 4222 B, дефолтный порог инлайна
  4096 B; без нуля ассет может стать `data:`-URI внутри JS;
- `sourcemap: true` даёт `dist/assets/index-<hash>.js.map`; CSS-карт Vite 8 здесь не
  создаёт — требовать их нельзя;
- порядок плагинов: `react()` единственный; другие плагины не добавляются без
  согласования.

### T58. `package.json`

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

> Фрагмент, а не полный файл: существующие `dependencies`/`devDependencies`
> (React 19, Vite 8, Vitest 5, `@testing-library/*`) сохраняются.

- `@vitejs/plugin-react` — в `devDependencies`; React 19 и Vite 8 не меняются;
- новых npm-скриптов для проверки `dist` нет: `node scripts/verify-dist.mjs`;
- `jest.config.js` удалён; массовая чистка транзитивных `jest-*`/`babel-*` из
  `dependencies` — отдельная задача, не 1.8.4;
- версии пакетов не «обновляются заодно»; допускается только добавление плагина.

### T59. Контракт аудио

```ts
// src/assets/audio/audio-urls.ts
import clickUrl from './click.mp3?url';
import winUrl from './win.mp3?url';
import loseUrl from './lose.mp3?url';

export const AUDIO_URLS = { click: clickUrl, win: winUrl, lose: loseUrl } as const;
export type AudioKind = keyof typeof AUDIO_URLS;

// src/services/audio-service.ts
import { AUDIO_URLS } from '../assets/audio/audio-urls';
import type { AudioKind } from '../assets/audio/audio-urls';

export type { AudioKind };
```

- `preload()` обходит ключи в порядке `click`, `win`, `lose` и делает `new Audio(url)`;
- `AudioService` и `AudioKind` остаются доступны из `src/services/audio-service`;
- поведение сохраняется: try/catch с `console.warn`, `_isReady`, `play()` клонирует
  узел и глотает отказ, `play()` до `preload()` — no-op;
- в тестах ожидаемые значения — `AUDIO_URLS.*`, не литералы `'audio/…'`;
- в vitest `?url` резолвится в `/src/assets/audio/<name>.mp3` — это нормально, тест
  не должен требовать хешированного имени.

### T60. Инвентарь `dist`

```bash
rm -rf dist && npm run build

test -f dist/index.html
test -f "$(ls dist/assets/index-*.js | head -1)"
test -f "$(ls dist/assets/index-*.css | head -1)"
test "$(ls dist/assets/*.mp3 | wc -l)" -eq 3
test ! -d dist/js -a ! -d dist/audio -a ! -d dist/css -a ! -d dist/src
test -z "$(find dist -name '*.ts' -o -name '*.tsx')"

grep -c '<script' dist/index.html            # 1
grep -c 'type="module"' dist/index.html      # 1
grep -c 'stylesheet' dist/index.html         # 1
grep -c '"/assets/' dist/index.html          # 0 (пути только ./assets/…)
grep -l 'linear-gradient(135deg' dist/assets/*.css  # ≥ 1 файл
```

Ожидаемая разметка (значения хешей произвольны):

```html
<script type="module" crossorigin src="./assets/index-XXXXXXXX.js"></script>
<link rel="stylesheet" crossorigin href="./assets/index-XXXXXXXX.css">
```

### T61. Проверка `dist` в браузере

```bash
rm -rf dist
npm run build
npm run preview -- --port 4173 --strictPort &
node scripts/verify-dist.mjs --url http://127.0.0.1:4173/ --chromium /usr/bin/chromium
```

`scripts/verify-dist.mjs`:

- без новых npm-зависимостей: Node 26 (`WebSocket`, `fetch`, `child_process`);
- поднимает Chromium с `--headless=new --no-sandbox --disable-gpu
  --disable-extensions --user-data-dir=<tmp> --remote-debugging-port=<free>`;
- подключается к CDP, фильтрует таргеты `type === 'page'`, слушает
  `Network.responseReceived`, `Network.loadingFailed`, `Runtime.consoleAPICalled`,
  `Runtime.exceptionThrown`;
- до навигации очищает `localStorage` (сброс `ml_stats`);
- проверки:

| # | Проверка |
|---|---|
| 1 | `/` → 200, `<title>Math</title>`, `#root` не пуст |
| 2 | CSS: ссылка → 200, `getComputedStyle(document.body).backgroundImage` содержит `gradient` |
| 3 | JS: единственный module-скрипт → 200, исключений нет |
| 4 | 3 mp3 → 200, `Content-Type: audio/*` |
| 5 | `#mapScreen.active`, `.map-trainer` = 15, `.map-trainer--current` = 1, `svg path` есть |
| 6 | клик `.map-trainer--current` → `.modal-overlay.open`, 3 `.diff-btn` |
| 7 | клик `.diff-btn[data-diff="easy"]` → `#gameScreen.active`, 4 `.answer-btn` |
| 8 | 10 верных ответов → `.feedback.correct-fb.show` → «Продолжить» → `#resultScreen.active`, первый `.stat-value` («Правильных») = 10, `#roundEarnings` начинается с «Заработано» |
| 9 | нет ответов ≥ 400 и `loadingFailed` |
| 10 | нет `console.error`/`pageerror` |

- ответ вычисляется из текста `.question` (`+`, `−` U+2212, `×`) и кликается по
  тексту кнопки; клик по индексу запрещён — варианты перемешаны;
- ожидание — опрос DOM с таймаутом (~5 с), без фиксированных `sleep`;
- вывод: `✓ <проверка>` на каждую, `OK: dist verified` в конце; при провале — код 1
  и сообщение с проверкой/URL/статусом.

### T62. Проверки перед сдачей

```bash
npx tsc --noEmit
npm test
npm run test:coverage
rm -rf dist && npm run build
node scripts/verify-dist.mjs --url http://127.0.0.1:4173/ --chromium /usr/bin/chromium

grep -RInE "new Audio\('audio/|'audio/" src   # пусто
grep -RIn '"/assets' src index.html           # пусто (src="/src/main.tsx" — точка входа Vite)
grep -n "base:" vite.config.ts                # base: './'
test ! -d audio -a ! -f jest.config.js        # ок
grep -c 'assets/.*\.mp3' dist/index.html      # 0 (mp3 не упоминаются в HTML)
```

**Ожидание:** `tsc` 0; тесты и покрытие зелёные; сборка с нуля; скрипт проверки — 0;
все grep-проверки выше — как указано.

---

## 🚫 Запреты — дополнения (1.8.4)

### Z30. Запрещено в сборке и ассетах

- строковые пути к ассетам: `new Audio('audio/…')`, `'./audio/…'`, `'/assets/…'`,
  склейка имени файла во время выполнения;
- копирование mp3 в `public/` или в `dist` руками;
- ручные `<link>`/`<script>` в `index.html` и правка собранного HTML;
- `base: '/'` при заявленной поддержке подпапки и наоборот;
- `npm run build`, который не вызывает `vite build`;
- коммит `dist/`, `coverage/`, `node_modules/`, кэша Vite;
- правка `tsconfig`/`vitest.config.ts` ради обхода ошибки сборки.

### Z31. Запрещено «зелёной» сборкой

- считать успех по коду выхода без проверки инвентаря `dist`;
- игнорировать 404 по CSS/JS/mp3 и ошибки консоли;
- проверять только dev-сервер или открывать `dist/index.html` через `file://`;
- проходить раунд частично (3–4 вопроса) и называть это полным;
- отключать `sourcemap`, убирать `assetsInlineLimit: 0` или «временно» менять `base`,
  чтобы проверка прошла;
- удалять/скипать тесты аудио вместо обновления ожиданий на `AUDIO_URLS`;
- понижать пороги покрытия и объявлять успех по частичному прогону.

### Z32. Запрещено в git

- коммитить артефакты сборки и отчёты покрытия;
- `git add -A` (в дереве есть посторонние файлы документации);
- переписывать историю (`rebase -i`, `reset --hard`, force-push) без согласования;
- обновлять версии React/Vite/Vitest «заодно» с добавлением плагина;
- мержить ветку с красными тестами или непроверенным `dist`.

### Z33. Запрещено в проверке

- новые npm-зависимости для smoke-теста (Playwright, Puppeteer, axe и т.п.);
- фиксированные `sleep` вместо ожидания состояния DOM;
- запуск Chromium без `--disable-extensions` и временного профиля;
- клик по `.answer-btn` по индексу вместо вычисленного ответа;
- проверка, завязанная на точные хеши имён ассетов.

---

## ✅ Обязательства агента — дополнения (1.8.4)

1. Установить `@vitejs/plugin-react`, совместимый с Vite 8; проверить `npm ls`.
2. Создать `vite.config.ts`: `react()`, `base: './'`, `dist`, `sourcemap: true`,
   `assetsInlineLimit: 0`.
3. Включить `"type": "module"`, удалить `jest.config.js`.
4. Заменить скрипты `package.json` на набор из T58; `build` = `tsc && vite build`.
5. Перенести mp3 в `src/assets/audio/` через `git mv`; удалить корневой `audio/`.
6. Ввести `AUDIO_URLS` на `?url`; переписать `AudioService.preload()` без строковых
   путей; сохранить публичный API и обработку ошибок.
7. Обновить `test/services/audio-service.test.ts` на `AUDIO_URLS`, не ослабляя проверки.
8. Сделать `index.html` минимальным; проверить, что CSS-импортов ровно 6 и в порядке.
9. Реализовать `scripts/verify-dist.mjs`; прогнать `vite preview` + headless Chromium:
   15 тренажёров, полный раунд, 0 404, 0 console-ошибок.
10. Проверить `dist` с нуля, `tsc`, тесты и покрытие; зафиксировать результат в отчёте;
    `dist/` не коммитить.

---

## 📌 Краткая памятка агенту — дополнения

✅ `npm run build` = `tsc --noEmit && vite build`
✅ `vite.config.ts`: `react()`, `base: './'`, `dist`, `sourcemap`, `assetsInlineLimit: 0`
✅ `"type": "module"`, `jest.config.js` удалён
✅ mp3 в `src/assets/audio/`, URL через `?url` и `AUDIO_URLS`
✅ `index.html` — `#root` + один module-скрипт
✅ 6 CSS-импортов в `main.tsx` в прежнем порядке
✅ `dist`: один JS, один CSS, три mp3 в `assets/`
✅ `vite preview` + headless: 15 тренажёров, 10/10, 0 404, 0 ошибок
✅ `dist` с нуля; `coverage/` и `dist/` не в git

❌ `new Audio('audio/…')`, строковые пути к ассетам
❌ `public/audio`, ручное копирование в `dist`
❌ `<link>`/`<script>` в `index.html`
❌ `base: '/'` при деплое в подпапку
❌ «build без dist», «проверено в dev»
❌ 404/console-ошибки, списанные на «особенности headless»
❌ коммит `dist/`, `coverage/`, `git add -A`

---

## 🔄 История версий — дополнение

| Версия | Дата | Изменения |
|---|---|---|
| 1.8.1 | 2026 | Счётчики `correct`/`wrong`, `total = отвечено` |
| 1.8.2 | 2026 | ES-модули, слои `core`/`data`/`services`, composition root |
| 1.8.3 | 2026 | Тесты на импортах: без `eval`/`readSource`/копий логики; RTL, хуки, coverage 80/60 |
| **1.8.4** | 2026 | Настоящая сборка Vite: `plugin-react`, `base: './'`, ESM-конфиг, ассеты через `?url`, проверка `dist` в headless Chromium |
