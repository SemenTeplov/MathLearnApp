**Версия:** 1.8.4
**Статус:** На утверждении
**Тип документа:** Спецификация сборки и ассетов (SDD)
**Предыдущая версия:** `spec_v1_8_3.md`
**Связанные документы:** `rules_v_1_8_4.md`, `PLAN_v1_8_4.md` (будет создан)

> ⚠️ Это спецификация **сборки**, а не поведения игры. Поведение, разметка, тексты,
> `CONFIG`, формат `Stats` v3 и ключи `ml_stats`/`ml_session_lock` **не меняются**.
> Требования ниже описывают, **как** приложение собирается и доставляется в браузер.

---

## 🎯 Цель 1.8.4

Сделать `npm run build` **настоящей production-сборкой**, а не проверкой типов, и
доказать, что результат работает вне dev-сервера.

Целевое состояние:

1. `@vitejs/plugin-react` установлен; `vite.config.ts` с `react()`, `base: './'`,
   `build.outDir: 'dist'`, `sourcemap: true`.
2. `npm run build` = `tsc --noEmit && vite build`; создаётся `dist/`.
3. `index.html` — минимальный: `#root` + единственный `<script type="module">`;
   ни `<link rel="stylesheet">`, ни `js/*.ts`, ни `audio/*.mp3` в разметке.
4. CSS — те же 6 файлов, импортированы из `src/main.tsx` в прежнем порядке:
   `base, buttons, screens, game, results, map`; в сборке один CSS-файл в `assets/`.
5. Аудио перенесено в `src/assets/audio/{click,win,lose}.mp3` и подключено через
   `?url`; строковых путей `new Audio('audio/…')` в коде нет.
6. `dist` проходит проверку в `vite preview` + headless Chromium: карта, 15 тренажёров,
   полный раунд, ни одного 404 и ни одной console-ошибки.
7. `base` настроен под реальный деплой: **`'./'`** (относительные пути — корень и любая
   подпапка, включая GitHub Pages project page).

**Критерий готовности:** `npm run build` создаёт рабочий `dist`; `dist` проверен
headless-браузером; CSS и mp3 лежат в `dist/assets/`; dev-режим не сломан.

---

## 📉 Исходное состояние (baseline 1.8.4)

| Показатель | Фактическое значение |
|---|---|
| `vite.config.ts` | **отсутствует** |
| `npm run build` | `npm run typecheck` → `tsc --noEmit`; `dist` не создаётся |
| `@vitejs/plugin-react` | **не установлен** (`node_modules/@vitejs` пуст) |
| `index.html` | минимальный, `#root` + `<script type="module" src="/src/main.tsx">` (сделано в 1.8.2) |
| CSS | 6 импортов в `src/main.tsx` в нужном порядке (сделано в 1.8.2); файлы лежат в `css/` в корне, партиалы — через `@import` (`game.css`, `map.css`) |
| Аудио | `audio/{click,win,lose}.mp3` в корне; `new Audio('audio/' + name + '.mp3')` в `src/services/audio-service.ts` |
| `?url`-типы | `tsconfig.json`: `"types": ["vite/client"]` — объявление `*?url` уже доступно |
| `package.json` | `"type": "commonjs"`; скрипта сборки нет |
| `dist` | отсутствует; `dist/` уже в `.gitignore` |
| Vite | 8.3.5 (Rolldown), Node 26.3.0 |
| `@vitejs/plugin-react` (latest) | 6.2.1; peer `vite: ^8.0.0`; engines `node: ^20.19.0 \|\| >=22.12.0` |
| Chromium | `/usr/bin/chromium` 152.0.7977.82; CDP через `--remote-debugging-port` доступен |
| Тесты | 28 сьютов / 261 тест; `test/services/audio-service.test.ts` ждёт литералы `'audio/click.mp3'` |

### Что уже готово и не переделывается

| Требование | Статус |
|---|---|
| CSS импортируется из `src/main.tsx`, `<link>` из `index.html` убран | ✅ 1.8.2 |
| `index.html` без `js/*.ts`-тегов | ✅ 1.8.2 |
| `tsconfig` с `vite/client` и `noEmit` | ✅ 1.8.2 |
| `dist/` в `.gitignore` | ✅ |
| Тесты и покрытие 1.8.3 | ✅ (перепроверяются, не переписываются) |

> Проверено фактически: текущий `npm run build` завершается кодом 0, но `dist/` не
> появляется — это и есть главный дефект 1.8.4. `Vite 8` при `"type": "commonjs"` и
> ESM-синтаксисе в конфиге печатает предупреждение «ESM syntax in a file loaded as
> CommonJS» и обещает сломать это в будущем native-загрузчике конфига.

---

## 🗂️ Целевая структура

```
index.html                      # #root + один module-скрипт (Vite владеет сборкой)
vite.config.ts                  # react(), base './', dist, sourcemap, assetsInlineLimit 0
src/
  main.tsx                      # 6 CSS-импортов + createServices + render
  assets/
    audio/
      click.mp3                 # перенесено из /audio
      win.mp3
      lose.mp3
      audio-urls.ts             # AUDIO_URLS через ?url + тип AudioKind
  services/
    audio-service.ts            # new Audio(AUDIO_URLS[kind]); без строковых путей
  ...
css/                            # остаётся на месте: 6 точек входа + *_items/*.css
scripts/
  verify-dist.mjs               # проверка dist: preview + headless Chromium (CDP)
dist/                           # артефакт сборки, в git не попадает
```

**Правила именования:** хеши в именах ассетов генерирует Vite; руками имена не
задаются и в коде не воспроизводятся.

---

## 📋 Требования

### TR-51. `vite.config.ts` и `@vitejs/plugin-react`

```bash
npm i -D @vitejs/plugin-react@^6
```

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

- Версия плагина должна удовлетворять peer-зависимости Vite 8 (`^8.0.0`); 6.2.1 —
  ESM-only пакет с engines `^20.19.0 || >=22.12.0`.
- В `package.json` — `"type": "module"`. Причина: Vite 8 иначе грузит `.ts`-конфиг как
  CommonJS, печатает предупреждение и в будущем откажется это делать; плагин — ESM-only.
- Мёртвый `jest.config.js` (CJS, Jest не используется) **удаляется** — иначе это
  CJS-файл в ESM-пакете и мина замедленного действия.
- `assetsInlineLimit: 0` обязателен: `click.mp3` весит 4222 B, это всего на 126 B
  больше дефолтного порога инлайна 4096 B. Без явного нуля любая перекодировка
  звука «спрячет» mp3 внутрь JS как `data:`-URI, и критерий «mp3 в `assets/`» сломается.
- `sourcemap: true` — карты в `dist/assets/*.js.map`; CSS-карты Vite 8 для этой
  конфигурации не генерирует, требовать их нельзя.
- `tsconfig.json` уже включает `vite.config.ts`; новых `paths`/`types` не нужно.

**Критерий:** `npx vite build` проходит без предупреждения о формате конфига;
`npm ls @vitejs/plugin-react vite` не показывает `invalid`; `package.json` содержит
`"type": "module"`; `jest.config.js` отсутствует.

### TR-52. Скрипты `package.json`

```json
"scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
}
```

- `build` — именно `tsc --noEmit && vite build`; ошибка типов останавливает сборку
  (`&&`, не `;`).
- `build` не может оставаться алиасом `typecheck`; «сборка без артефакта» запрещена.
- `preview` и `dev` используют один и тот же `vite.config.ts`.
- Дополнительные npm-скрипты не добавляются: проверка `dist` запускается напрямую
  `node scripts/verify-dist.mjs` (T61).

**Критерий:** `npm run build` печатает тишину `tsc`, строку вида
`vite v8.3.5 building client environment for production` и `✓ built in …`, затем
существует `dist/index.html`.

### TR-53. Минимальный `index.html`

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Math</title>
</head>
<body>
    <div id="root" style="display: contents"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- Ровно один `<script>` и он `type="module"`; других скриптов нет.
- Нет `<link rel="stylesheet">`, нет `<link rel="preload">` на mp3, нет `<style>`.
- Нет ссылок на `js/…`, `css/…`, `audio/…`.
- `style="display: contents"` у `#root` — разрешённое исключение: это поведение
  раскладки из 1.8.2, а не оформление. Переносить его в CSS в 1.8.4 не нужно.

**Критерий:** `grep -c '<script' index.html` = 1;
`grep -c 'type="module"' index.html` = 1;
`grep -cE 'stylesheet|js/|audio/' index.html` = 0.

### TR-54. CSS: 6 импортов, один бандл

```ts
import '../css/base.css';
import '../css/buttons.css';
import '../css/screens.css';
import '../css/game.css';
import '../css/results.css';
import '../css/map.css';
```

- Порядок **строго** сохраняется: каскад 1.7.0/1.8.x рассчитан на него.
- Импорты живут только в `src/main.tsx`; компоненты CSS не импортируют.
- Файлы остаются в `css/` в корне (Vite резолвит путь внутри root); перенос в
  `src/assets/css` в 1.8.4 не требуется.
- Партиалы `@import url('game_items/…')` / `map_items/…` инлайнятся в тот же бандл.
- В `dist` — один `assets/index-<hash>.css`; отдельного `dist/css/` нет.

**Критерий:** 6 импортов в указанном порядке; в `dist/assets` ровно один `*.css`,
он не пустой и содержит базовый градиент (`linear-gradient(135deg`); `dist/css`
отсутствует.

### TR-55. Аудио: перенос и `?url`

```bash
mkdir -p src/assets/audio
git mv audio/click.mp3 src/assets/audio/click.mp3
git mv audio/win.mp3   src/assets/audio/win.mp3
git mv audio/lose.mp3  src/assets/audio/lose.mp3
rmdir audio
```

`src/assets/audio/audio-urls.ts`:

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

`src/services/audio-service.ts`:

```ts
import { AUDIO_URLS } from '../assets/audio/audio-urls';
import type { AudioKind } from '../assets/audio/audio-urls';

export type { AudioKind };
```

- В `preload()` обходятся **все** ключи `AUDIO_URLS` (порядок объявления: `click`,
  `win`, `lose`), для каждого — `new Audio(url)`; строка `'audio/' + name + '.mp3'`
  удалена полностью.
- Поведение сервиса не меняется: `preload()` ставит `_isReady`, ошибки `new Audio`
  ловятся и логируются через `console.warn`, `play()` клонирует узел и глотает
  отклонённый `play()`, повторный вызов без `preload()` — no-op.
- Публичный API (`AudioService`, тип `AudioKind` из `src/services/audio-service`)
  сохраняется — компоненты и тесты не переписываются.
- `public/audio/` не создаётся: дубликат источника правды запрещён; mp3 не копируются
  руками ни в `dist`, ни в `public`.
- Корневой каталог `audio/` после переноса удаляется (пустым не остаётся).

**Критерий:** `test ! -d audio`; `grep -RIn "'audio/" src` — пусто; в
`src/assets/audio/audio-urls.ts` три импорта с `?url`; в `dist/assets` три `*.mp3`.

### TR-56. Контракт `dist`

После `npm run build` (на чистом `dist`):

| Путь | Ожидание |
|---|---|
| `dist/index.html` | ровно один `<script type="module" crossorigin src="./assets/index-<hash>.js">`, ровно один `<link rel="stylesheet" crossorigin href="./assets/index-<hash>.css">` |
| `dist/assets/index-<hash>.js` | есть, не пустой, `//# sourceMappingURL` |
| `dist/assets/index-<hash>.js.map` | есть |
| `dist/assets/index-<hash>.css` | есть, не пустой: содержит `linear-gradient` и правила из всех 6 точек входа |
| `dist/assets/click-<hash>.mp3`, `win-…`, `lose-…` | три файла, размеры ≈ 4222 / 29350 / 52337 B |
| `dist/js/`, `dist/css/`, `dist/audio/`, `dist/src/` | **отсутствуют** |
| `dist/**/*.ts`, `dist/**/*.tsx` | **отсутствуют** |

- Скрипт в собранном HTML — только module, без inline-кода приложения.
- Атрибут `crossorigin` Vite добавляет сам; это норма, а не ошибка.
- Пути в `dist/index.html` **относительные** (`./assets/…`), потому что `base: './'`.
  Это осознанное отличие от формулировки «`/assets/index-*.js`»: абсолютный путь
  сломался бы при деплое в подпапку (`D17`).

**Критерий:** перечисление файлов совпадает с таблицей; `find dist -name '*.ts'` пусто;
`grep -c '<script' dist/index.html` = 1;
`grep -c '"/assets/' dist/index.html` = 0 (пути только `./assets/…`).

### TR-57. Проверка `dist`: `vite preview` + headless Chromium

```bash
rm -rf dist
npm run build
npm run preview -- --port 4173 --strictPort &
node scripts/verify-dist.mjs --url http://127.0.0.1:4173/ --chromium /usr/bin/chromium
```

`scripts/verify-dist.mjs` — **без новых npm-зависимостей** (Node 26: глобальный
`WebSocket`, `child_process`, `fetch`). Он обязан проверить:

| # | Проверка | Как |
|---|---|---|
| 1 | Страница отдаётся | HTTP 200 на `/`, `<title>Math</title>`, `#root` не пуст |
| 2 | CSS загружен | `<link rel="stylesheet">` → 200; `getComputedStyle(document.body).backgroundImage` содержит `gradient` |
| 3 | JS загружен | единственный module-скрипт → 200; ошибок в `Runtime.exceptionThrown` нет |
| 4 | Аудио на месте | 3 запроса `assets/*.mp3` → 200, `Content-Type: audio/*`, размеры > 0 |
| 5 | Карта | `#mapScreen.active`; `.map-trainer` ровно **15**; `.map-trainer--current` ровно 1; дорога `svg path` есть |
| 6 | Модалка | клик по `.map-trainer--current` → `.modal-overlay.open`; три `.diff-btn`; `data-diff="easy"` |
| 7 | Игра | клик по `.diff-btn[data-diff="easy"]` → `#gameScreen.active`, 4 `.answer-btn`, вопрос вида `a + b = ?` / `a − b = ?` / `a × b = ?` |
| 8 | Полный раунд | 10 раз: вычислить ответ из текста `.question`, кликнуть `.answer-btn` с этим текстом, дождаться `.feedback.correct-fb.show`, нажать «Продолжить»; после 10-го «Продолжить» — `#resultScreen.active`, заголовок оценки непустой, первый `.stat-value` («Правильных») = 10, `#roundEarnings` начинается с «Заработано» |
| 9 | Нет 404 | ни одного ответа ≥ 400 на document/css/js/mp3; ни одного `Network.loadingFailed` |
| 10 | Нет ошибок | `console.error`/`console.warn` приложения и `pageerror` — пусто |

Требования к запуску браузера:

- `chromium --headless=new --no-sandbox --disable-gpu --disable-extensions
  --user-data-dir=<временный профиль> --remote-debugging-port=<свободный порт>`;
- `--disable-extensions` и чистый профиль обязательны: в системе стоят расширения
  (CryptoPro, Госуслуги), они создают лишние CDP-таргеты и шум в консоли;
- `localStorage` очищается перед прогоном (сброс `ml_stats`), иначе позиция/счёт
  предыдущего прогона сделают раунд недетерминированным;
- ответ вычисляется только для `easy`-форматов (`+`, `−` U+2212, `×`); клик — по
  тексту кнопки, а не по индексу;
- ожидания — опрос DOM с таймаутом (например, 5 с), без фиксированных `sleep`;
- скрипт печатает по строке `✓ <проверка>` и завершает процесс кодом 1 при первом
  провале; при успехе — `OK: dist verified` и код 0.

**Критерий:** скрипт завершается 0; вывод содержит 15 тренажёров, 10/10, 3 mp3,
0 ошибок; повторный запуск на чистом `dist` — тот же результат.

### TR-58. `base` под реальный деплой

- `base: './'` — единственное место, где задаётся база; в коде и `index.html`
  абсолютных `/assets/…` и `/src/…` нет.
- Относительные пути работают при деплое в корень (`https://host/`) и в подпапку
  (`https://sementepelov.github.io/MathLearnApp/`).
- Смена площадки/пути не требует правок кода — только `base`, если понадобится
  абсолютная база.
- Приложение не использует history-роутинг, поэтому относительная база безопасна:
  все переходы — состояние React, а не URL.

**Критерий:** `grep -n "base:" vite.config.ts` → `base: './'`; в `dist/index.html`
все `src`/`href` начинаются с `./assets/`; `grep -RIn '"/assets' src index.html` пусто
(единственный абсолютный путь в исходном `index.html` — `src="/src/main.tsx"`, это
точка входа Vite, а не ассет).

### TR-59. Dev-режим не сломан

- `npm run dev` поднимает Vite с `@vitejs/plugin-react`: React Fast Refresh работает,
  CSS/HMR — тоже.
- В dev `?url` отдаёт `/src/assets/audio/click.mp3`, а не хешированный путь; код
  использует импортированное значение, поэтому различие dev/prod не видно.
- Dev-сервер не печатает предупреждений о формате конфига и о `base`.

**Критерий:** `npm run dev` → 200 на `/`, карта и 15 тренажёров рендерятся, в консоли
браузера нет ошибок; `grep -c "warning"` в логе Vite = 0 (кроме сторонних).

### TR-60. Тесты и типы

- `test/services/audio-service.test.ts` переводится на импорт `AUDIO_URLS`:
  `expect(calls).toEqual([AUDIO_URLS.click, AUDIO_URLS.win, AUDIO_URLS.lose])`.
  Литералы `'audio/click.mp3'` удаляются — контракт изменился, это не ослабление
  теста: число проверок не уменьшается.
- Остальные 27 сьютов не меняются; поведение, разметка и CSS не трогаются.
- `npx tsc --noEmit` — 0; `npm test` — все сьюты зелёные; `npm run test:coverage` —
  пороги 80/60 выполняются (конфигурация `vitest.config.ts` не меняется).
- В vitest `?url` резолвится в dev-путь `/src/assets/audio/click.mp3`, а не в
  хешированный `assets/click-<hash>.mp3`. Поэтому тест сравнивает вызовы с
  импортированным `AUDIO_URLS`, а не с литералом и не с хешем.

**Критерий:** `npx tsc --noEmit` 0; `npm test` зелёный; в тесте аудио нет строки
`'audio/`; coverage-пороги зелёные.

---

## ✅ Приёмочные критерии 1.8.4

| # | Критерий | Проверка |
|---|---|---|
| 1 | `vite.config.ts` есть, плагин подключён | `test -f vite.config.ts && grep -q "plugin-react" vite.config.ts` |
| 2 | `build` = tsc + vite build | `node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).scripts.build"` |
| 3 | `npm run build` создаёт `dist` | `rm -rf dist && npm run build && test -f dist/index.html` |
| 4 | Один module-скрипт, ни одного `js/*.ts` | `grep -c "<script" dist/index.html` = 1; `find dist -name '*.ts'` пусто |
| 5 | Один CSS в `assets` | `ls dist/assets/*.css \| wc -l` = 1 |
| 6 | Три mp3 в `assets` | `ls dist/assets/*.mp3 \| wc -l` = 3 |
| 7 | Нет `dist/js`, `dist/audio`, `dist/css` | `test ! -d dist/js -a ! -d dist/audio -a ! -d dist/css` |
| 8 | `base` относительный | `grep -q "base: './'" vite.config.ts`; `grep -c '"/assets/' dist/index.html` = 0 |
| 9 | `vite preview` + headless: 15 тренажёров, полный раунд | `node scripts/verify-dist.mjs` → 0 |
| 10 | Нет 404 и console-ошибок | вывод скрипта, проверки 9–10 |
| 11 | Dev не сломан | `npm run dev` → карта, 15 тренажёров |
| 12 | `tsc`, тесты, покрытие | `npx tsc --noEmit && npm test && npm run test:coverage` |

**Definition of Done:** пункты 1–12 выполнены; `dist` воспроизводим с нуля
(`rm -rf dist && npm run build`); проверка headless автоматизирована скриптом;
`dist/` и `coverage/` не закоммичены.

---

## 🚫 Что не входит

- Любые изменения поведения игры, разметки, классов, текстов, `CONFIG`, `Stats` v3,
  ключей `ml_stats`/`ml_session_lock`, CSS-правил и порядка каскада.
- Перенос `css/` в `src/assets/css` и переписывание `@import`-партиалов.
- Дублирование mp3 в `public/` или ручное копирование ассетов в `dist`.
- Чистка «мусорных» зависимостей `package.json` (транзитивные `jest-*`, `babel-*`,
  `istanbul-*` в `dependencies`). Это отдельная задача; в 1.8.4 удаляется только
  мёртвый `jest.config.js`.
- PWA/Service Worker, манифест, офлайн-кэш.
- CI, GitHub Actions, публикация на хостинг (только проверка `vite preview`).
- Playwright/E2E-каталог: проверка dist — smoke-скрипт на CDP, а не новый фреймворк.
- 100% покрытие и тесты ради покрытия.
- Смена `sourcemap: true` на `false` «ради размера» или `'hidden'` без согласования.

---

## ⚠️ Решения и риски

| # | Решение | Обоснование |
|---|---|---|
| D17 | `base: './'`, а не `'/'` | Выбор владельца: универсально для корня и подпапки (GitHub Pages project page). Следствие: в `dist/index.html` пути `./assets/…`, поэтому критерий «`/assets/index-*.js`» уточнён на относительный |
| D18 | Аудио через `?url`, а не `public/` | Билд падает, если файла нет; имена хешируются и кешируются; не нужен `import.meta.env.BASE_URL`; один источник правды |
| D19 | `"type": "module"` + удаление `jest.config.js` | Vite 8 предупреждает о CJS-конфиге и сломает его в native-загрузчике; plugin-react 6 — ESM-only; Jest в проекте не используется |
| D20 | `assetsInlineLimit: 0` | `click.mp3` = 4222 B при пороге 4096 B: без нуля звук может инлайниться в JS как `data:` и «исчезнуть» из `assets/` |
| D21 | `sourcemap: true` остаётся | Требование задания; игра офлайн, исходники не секретны. Цена — `.map` в `dist`, на работу не влияет |
| D22 | CSS остаётся в `css/` | Vite резолвит путь из `src/main.tsx`; перенос ничего не даёт и рискует каскадом |
| D23 | Тест аудио правится | Контракт `new Audio(URL)` изменился; проверки не ослабляются, литералы путей заменяются сравнением с `AUDIO_URLS` |
| D24 | Проверка — скрипт `verify-dist.mjs` на CDP | Новых зависимостей нет; Node 26 даёт `WebSocket`; Chromium 152 в системе; Playwright не тянем |
| D25 | `#resultScreen`, а не `#resultsScreen` | Фактический id из `App.tsx`; проверка цепляется к нему |
| D26 | Старт игры — клик по `.map-trainer--current`, затем `.diff-btn` | В модалке нет отдельной кнопки «Начать»: `chooseDifficulty` + `game.start` в `App.tsx` |
| D27 | «Полный раунд» = 10 верных ответов | `CONFIG.TOTAL_QUESTIONS = 10`; 3 ошибки завершили бы игру раньше и не проверили экран результатов |

### Риски и меры

| Риск | Мера |
|---|---|
| `@vitejs/plugin-react@6` требует optional-peer `oxc-transform-react` | Плагин ставится как devDependency; при ошибке резолва — установить optional-peer, а не откатываться на плагин 5 (он не поддерживает Vite 8) |
| Относительный `base` и `crossorigin` на `file://` | Приложение проверяется только через HTTP (`vite preview`), не открытием файла |
| Headless-клик и аудио-политика браузера | `AudioService` глотает `play()`-reject; отсутствие звука — не ошибка консоли и не блокер |
| Расширения Chrome в CDP | `--disable-extensions`, временный `--user-data-dir`, фильтр таргетов `type === 'page'` |
| `dist` остаётся от прошлой сборки | Проверка всегда начинается с `rm -rf dist` |
| `type: module` ломает сторонние CJS-скрипты | В репозитории таких нет; проверка — `npm run build`, `npm test`, `npm run dev` |
| Хеши в именах ассетов | Нигде не хардкодятся: проверка ищет по glob `assets/*.mp3`, а не по точному имени |

---

## 🧭 Этапы

| Этап | Содержание | Критерий выхода |
|---|---|---|
| 1 | `@vitejs/plugin-react`, `vite.config.ts`, `"type": "module"`, удаление `jest.config.js` | `npx vite build` без предупреждений, `dist` создаётся |
| 2 | Перенос mp3 (`git mv`), `audio-urls.ts`, правка `AudioService`, правка сьюта аудио | `tsc` 0, `npm test` зелёный, `dist/assets` с 3 mp3 |
| 3 | Скрипты `package.json`, `index.html`-инварианты, инвентарь `dist` | `npm run build` → полный контракт TR-56 |
| 4 | `scripts/verify-dist.mjs`, preview + headless | скрипт 0, 15 тренажёров, 10/10 |
| 5 | Dev-smoke, coverage, финальный аудит `base` | пункты 1–12 приёмки |

---

## 📌 Инварианты

| Область | Инвариант |
|---|---|
| Поведение | Игра, разметка, тексты, `CONFIG`, `Stats` v3, ключи хранилища не меняются |
| Сборка | `npm run build` всегда создаёт `dist`; ошибка типов останавливает сборку |
| Разметка | `index.html` — `#root` + один module-скрипт; CSS и mp3 не упоминаются в HTML |
| CSS | 6 импортов в `main.tsx` в порядке base → buttons → screens → game → results → map |
| Аудио | Только `AUDIO_URLS` из `?url`; строковых путей `audio/...` нет |
| base | `'./'` в `vite.config.ts`; в коде нет абсолютных `/assets`/`/src` |
| dist | Один JS, один CSS, три mp3 в `assets/`; никаких `.ts`, `js/`, `audio/`, `css/` |
| Проверка | `vite preview` + headless Chromium: 15 тренажёров, полный раунд, 0 404, 0 ошибок |
| Тесты | `tsc` 0, все сьюты зелёные, пороги покрытия 80/60 не понижены |
| Git | `dist/` и `coverage/` не коммитятся; `git add -A` запрещён |
