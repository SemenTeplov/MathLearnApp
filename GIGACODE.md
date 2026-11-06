# Руководство по репозиторию

## Обзор проекта

**MathLingo** — браузерная игра для тренировки устного счёта. Весь код — один граф
**ES-модулей на TypeScript**: домен и данные (`src/core`, `src/data`), сервисы
(`src/services`), view-модели (`src/ui`), composition root (`src/app`) и экраны на
**React 19** (`src/components`, `src/hooks`, `src/App.tsx`). `index.html` содержит только
`#root` и один `<script type="module" src="/src/main.tsx">`; CSS импортируется из
`src/main.tsx`. Запуск — только через Vite (`npm run dev`), типы проверяются
`tsc --noEmit` (`npm run typecheck`), качество — ESLint 10 (`npm run lint`) и Prettier 3
(`npm run format:check`), критерий проверок повторяется в CI. Главный экран — карта с зонами
и тренажёрами.

## Структура проекта и организация модулей

```
index.html                  # #root (display: contents) + один module-скрипт
src/
  main.tsx                  # CSS → createServices → preload → handlers → createRoot.render
  App.tsx                   # Каркас: #mapScreen, .app, модалки, навигация, App({ services })
  app/
    createServices.ts       # Composition root: new StatsService(repo) + new AudioService()
    types.ts                # interface Services { audio, stats }
  core/                     # Домен: без React, DOM и localStorage (13 модулей)
    config.ts               # export const CONFIG; ZONES/MAPS — внутренние const
    types.ts                # Difficulty, Problem, GameResult, MapData, Stats, Config, Zone,
                            # GameMap, Rating, ErrorInfo, SessionState, Point, TrainerPoint,
                            # MapBand, MapGeometry
    errors.ts               # StorageError, CorruptedDataError, StorageUnavailableError,
                            # QuotaExceededError, SessionError
    error-handler.ts        # handleError(), initGlobalErrorHandlers()
    session-model.ts        # class SessionModel (lives, roundScore, correct/wrong, reset)
    map-catalog.ts          # MapCatalog: get / getDefault / has
    stats-schema.ts         # Stats v3: defaults, entry, migrate, ensureMaps
    game-rules.ts           # GameRules: checkAnswer, shouldEndGame, getRating
    generator.ts            # class ProblemGenerator (о зонах и тренажёрах не знает)
    scoring.ts              # Scoring: calculateRoundScore, isRoundSuccessful
    player-rules.ts         # PlayerRules, PlayerAction: getAction, normalizeIndex
    player-state.ts         # class PlayerState: moveTo, isReplay, revert, commitWin
    map-layout.ts           # Чистая геометрия: полосы, шаг 100px, SVG-путь, точка игрока
  data/                     # Сохранение: репозитории и StatsService
    repository.ts           # class Repository (контракт, не abstract)
    local-repository.ts     # LocalStorageRepository — единственное место с localStorage
    stats-service.ts        # class StatsService(repo): счёт/позиция, switchMap, миграции
  services/
    audio-service.ts        # class AudioService (preload по AUDIO_URLS), type AudioKind
  assets/
    audio/
      click.mp3 win.mp3 lose.mp3   # Звуки — ассеты Vite
      audio-urls.ts                # AUDIO_URLS: три import '?url'; AudioKind = keyof
  ui/
    types.ts                # MapViewData, MapModalTarget, ResultsView, GameSessionView,
                            # GameFeedbackView
  components/               # 10 презентационных компонентов
    ResultsScreen.tsx       # иконка, оценка, статистика, «Заработано», две кнопки
    MapSelectionModal.tsx   # список карт, выделение текущей, «Закрыть»
    GameScreen.tsx          # шапка, вопрос, 4 ответа, feedback, «Продолжить»
    MapScreen.tsx           # .map, зоны, SVG-дорога, тренажёры, игрок, модалка сложности
    Zone.tsx                # полоса зоны: --zone-color, подпись сбоку
    Trainer.tsx             # кнопка-тренажёр: data-*, классы --current/--near/--far
    Player.tsx              # игрок 🚶: transform + onTransitionEnd (600 мс)
    Path.tsx                # один <svg class="map-road"> и один <path>
    Header.tsx              # счёт 🏆 (sticky) и кнопка 🌍
    ErrorModal.tsx          # модалка ошибок на .modal-overlay.open / .modal / .btn
  hooks/                    # 5 хуков; сервисы — первым аргументом
    useMap.ts               # useMap(services): PlayerState, клики, движение, модалка, resize
    useGame.ts              # useGame(services, deps): SessionModel + ProblemGenerator в ref
    useResults.ts           # useResults(services, onFinished): оценка, очки, звук
    useMapSelection.ts      # useMapSelection(services, onChanged): список карт, switchMap
    useSessionLock.ts       # useSessionLock(showError): BroadcastChannel + hello
css/                        # 20 файлов; значения без изменений с 1.5.0, состав — 1.9.0 (A76)
  base.css                  # Сброс, типографика, контейнер приложения
  buttons.css               # Варианты кнопок
  screens.css / game.css / results.css  # Макеты экранов
  map.css                   # Карта — собирает map_items/ через @import
  screen_items/             # Каркас экранов (.screen, .active)
  map_items/                # Экран карты, зоны, дорога, игрок, тренажёры, модалки, глобальная карта
  game_items/               # Шапка, вопрос, ответы, обратная связь
  result_items/             # Иконка и статистика результата
vite.config.ts              # react(), base: './', outDir dist, sourcemap, assetsInlineLimit: 0
eslint.config.js            # flat config: @eslint/js + typescript-eslint + react-hooks
.prettierrc.json            # 4 пробела, singleQuote, printWidth 120, trailingComma none
.prettierignore             # dist, coverage, package-lock.json, *.md, .gigacode
.github/workflows/ci.yml    # npm ci → typecheck → test → build → lint → smoke
scripts/
  smoke.mjs                 # 10 HTTP-проверок dist через vite preview (без зависимостей)
  verify-dist.mjs           # 10 браузерных проверок dist (vite preview + headless Chromium)
  cdp.mjs                   # минимальный CDP-клиент, опрос DOM, запуск Chromium
test/                       # 28 сьютов / 261 тест (1.9.0 — зелёные, без eval)
  support/memory-repository.ts  # тестовый двойник Repository (вне src/ и coverage)
.gigacode/
  rulles/RULES.md           # Конституция проекта (актуальная версия)
  specs/SPEC.md             # Спецификация поведения (актуальная версия)
  plans/PLAN.md             # План реализации
  tasks/TASKS.md            # Пошаговый план задач
                            # архивы версий — *_vX_Y_Z.md (PLAN_v1_9_0, TASKS_v1_8_4, …)
```

**Порядок инициализации.** `src/main.tsx` импортирует шесть CSS-файлов в прежнем порядке
(`base`, `buttons`, `screens`, `game`, `results`, `map`), затем вызывает
`createServices()`, `services.audio.preload()` и `initGlobalErrorHandlers()`, проверяет
`#root` и монтирует `<StrictMode><App services={services}/></StrictMode>`. Никаких
классических `<script>` и глобальных переменных нет.

## Запуск, проверки, тесты и сборка

Прямое открытие `index.html` и `python3 -m http.server` не работают: браузер не умеет
`.ts`/`.tsx` и голые импорты.

```bash
npm ci               # установка строго по package-lock.json (разработка: npm install)
npm run dev          # http://localhost:5173 — режим разработки
npm run typecheck    # tsc --noEmit: 0 ошибок
npm run build        # tsc --noEmit && vite build: dist/ (один JS + .map, один CSS, 3 mp3)
npm run preview      # собранный dist на http://localhost:4173
npm run lint         # ESLint 10 (flat config): 0 ошибок
npm run lint:fix     # ESLint с автоисправлением
npm run format       # Prettier: переформатировать код
npm run format:check # Prettier: проверить стиль без записи
npm run smoke        # vite preview + 10 HTTP-проверок dist (Node, без зависимостей)
npm run smoke:browser# smoke + 10 браузерных проверок dist (Chromium, CDP)
npm test             # vitest run: 261 тест в 28 сьютах (1.9.0 — зелёные)
npm run test:watch   # vitest в watch-режиме
npm run test:coverage# coverage v8 по группам + пороги 80/60 + html в coverage/
```

**Проверки 1.9.0 (T70).** Полный локальный критерий; CI повторяет его без `format:check`:

```bash
npm ci && npm run typecheck && npm test && npm run build && npm run lint
npm run format:check
npm run smoke
```

`npm run smoke` запускает `vite preview` на 4173 (`--strictPort`, `SMOKE_PORT` для переопределения)
и проверяет HTTP-контракт `dist`: `#root`, ровно один JS и один CSS, отсутствие ссылок
`/src/`, `js/`, `audio/`, живые ассеты, три mp3 в `dist/assets`. Браузерные проверки
(карта, 15 тренажёров, полный раунд, сеть без 4xx/5xx, чистая консоль) остаются в
`scripts/verify-dist.mjs`; `npm run smoke:browser` сам поднимает `vite preview` и
добавляет их к HTTP-проверкам (итого 11/11).

**Сборка 1.8.4 (TR-51…TR-58, A65/A68/A71).** `"type": "module"`, `vite.config.ts`
(`react()`, `base: './'`, `outDir: 'dist'`, `sourcemap: true`, `assetsInlineLimit: 0`),
`jest.config.js` удалён, `@vitejs/plugin-react@6.2.1`. `npm run build` = `tsc --noEmit &&
vite build`. Контракт `dist`: `index.html` (один module-скрипт, один stylesheet, пути
`./assets/…`), `assets/index-*.js` + `.map`, `assets/index-*.css`, три `*.mp3`; каталогов
`js/`, `css/`, `audio/`, `src/` в `dist` нет. `base: './'` — единственная точка настройки
(в dev Vite приводит её к `/`), поэтому сборка работает и из подпапки (GitHub Pages).

**Зависимости 1.9.0 (A72/A73).** `"type": "module"`, `"private": true`, `version: 1.9.0`,
`engines.node >= 20.19`. В `dependencies` — только `react` и `react-dom`; все инструменты
(типы, Vite, vitest, jsdom, testing-library, ESLint, Prettier) — в `devDependencies`.
`jest-environment-jsdom` и ~200 транзитивов Jest удалены, `package-lock.json` пересобран
с нуля (`lockfileVersion: 3`). Ставится `npm ci`; lock коммитится, `node_modules/` — нет.

**`tsconfig.json` (T47):** `target: ESNext`, `module: ESNext`,
`moduleResolution: Bundler`, `jsx: react-jsx`, `strict`, `noEmit`, `esModuleInterop`,
`skipLibCheck`, `isolatedModules`, `verbatimModuleSyntax`, `types: ["vite/client"]`,
`allowJs: false`, `include: ["src", "test", "vite.config.ts", "vitest.config.ts"]`.

- `types: ["vite/client"]` нужен для `import '../css/*.css'`.
- `verbatimModuleSyntax` требует `import type` для всех типов (TS1484).
- `allowJs: false` — все тесты `.ts`/`.tsx`; `test/setup.ts` и `vitest.config.ts` тоже
  проверяются TypeScript.

**Тесты (A59–A64, T50–T55; раскладка 1.9.0 — T68).** **28 сьютов / 261 тест.** Структура зеркалит `src/`:

| Каталог | Сьюты | Тесты | Что проверяет |
|---|---|---|---|
| `test/core/` | 12 | 135 | домен: `CONFIG`, ошибки, `error-handler`, правила, генератор, карта, `SessionModel`, `StatsSchema` |
| `test/data/` | 4 | 40 | `StatsService` через `MemoryRepository` (`test/support/`); `LocalStorageRepository` (квота, порча), `Repository`, `MemoryRepository` |
| `test/services/` | 1 | 9 | `AudioService`: preload, play, ошибки |
| `test/components/` | 7 | 45 | RTL: `App` (интеграция), `GameScreen`, `MapScreen`, `ResultsScreen`, `MapSelectionModal`, `Header`, `ErrorModal` |
| `test/hooks/` | 4 | 32 | `renderHook`: `useGame`, `useMap`, `useResults`, `useSessionLock` |

- **Только импорты (A59, T50).** Запрещены `eval`, `new Function`, `readSource`,
  `fs.readFileSync`, `require`; `test/ts-source.js` удалён; `allowJs: false`.
- **Без копий логики (A60).** `CONFIG`, `GameRules`, `ProblemGenerator`, `Scoring`,
  `SessionModel` — только из `src/`; в `test/setup.ts` нет доменных констант.
  `StatsService` создаётся как `new StatsService(new MemoryRepository())`, где
  `MemoryRepository` — `test/support/memory-repository.ts` (в `src/` его нет, A75/T68).
- **RTL-правила (A62, A64).** `user-event` — для кликов; `fireEvent` — только
  `transitionend` и клик по оверлею; `renderHook` — только хуки, компоненты — только
  компонентные сьюты; fake timers — только 100 мс debounce `resize` и 1500 мс плашки
  `+10`; `BroadcastChannel` — управляемая заглушка через `vi.stubGlobal`.
  `container.querySelectorAll` допустим для контрактных CSS-классов, `document.querySelector` — нет.
- **Coverage (A63, T54).** `coverage.include` — `core`/`data`/`services`/`components`/`hooks`
  + `App.tsx`; `thresholds`: **80%** домен и **60%** UI (пороги не понижаются).
  Срез 1.9.0: **96.83%** statements / **88.74%** branches; `src/core/types.ts` — 0/0
  (только типы), из отчёта не исключается.
- **Аудио-тест (TR-60, A59).** `test/services/audio-service.test.ts` сравнивает вызовы с
  `AUDIO_URLS` (`toEqual([AUDIO_URLS.click, AUDIO_URLS.win, AUDIO_URLS.lose])`), а не с
  литералами `'audio/…'` и не с хешами: в dev и prod URL разные, число проверок не уменьшено.
- **`src/**` не правится ради тестов (Z28).** Тест подстраивается под прод-API; найденный дефект
  фиксируется в отчёте и выносится за пределы версии.
- **E2E (T50, D15).** Playwright не установлен, в `npm test` не входит; backlog
  7 сценариев — в `test/README.md`.

Подробности — `test/README.md` и `spec_v1_8_3.md`.

## Стиль кодирования и соглашения об именовании

- **Отступы:** 4 пробела (TypeScript, TSX и CSS).
- **Имена файлов:** kebab-case для слоёв (`game-rules.ts`, `map-layout.ts`); React-компоненты —
  PascalCase (`src/components/GameScreen.tsx`), хуки — `useXxx.ts`, точка входа — `main.tsx`.
- **Именование:** camelCase для переменных/функций, PascalCase для классов и типов
  (`ProblemGenerator`, `StatsService`).
- **Константы:** UPPER_SNAKE_CASE в `core/config.ts` (`TOTAL_QUESTIONS`, `POINTS_BASE`, `CONFIG`).
- **CSS-классы:** kebab-case, BEM-подобное именование (`.screen`, `.map-zone`, `.map-trainer`, `.diff-btn`).
- **Типы:** домен — только `src/core/types.ts`, view-модели — только `src/ui/types.ts`;
  `declare global` и дублирование интерфейсов в других файлах запрещены. Импорт типов —
  строго `import type { … } from '../core/types'` (или `../ui/types`).
- **Импорты:** каждый модуль импортирует всё, что использует; `CONFIG` — только из
  `core/config`; никаких `window.*`, `globalThis.*` и порядка загрузки скриптов.
- **Пропсы компонентов:** `ComponentNameProps`, функциональные компоненты, `key` в списках,
  `onClick` вместо `onclick`, без `any`, `var` и прямого DOM.
- **Хуки:** имя с `use`, без условных вызовов, зависимости в `useEffect`/`useCallback`,
  очистка таймеров, каналов и слушателей. `services` — **первый аргумент** хука.
- **Сервисы:** создаются один раз в `createServices()`, не создаются в компонентах/хуках и
  не хранятся в модульных переменных; методы вызываются через экземпляр
  (`services.stats.load()`), не деструктурируются — они используют `this`.
- **Комментарии:** блок `// === MODULE.TS — назначение ===` в начале каждого файла.
  Внутритекстовые комментарии объясняют *почему*, а не *что*.
- **Лимит файла:** не больше 200 строк в `src/` (включая `.tsx`).
- **Линтер:** `eslint.config.js` (flat config): `@eslint/js` recommended + `typescript-eslint`
  recommended + `eslint-plugin-react-hooks` (`rules-of-hooks`, `exhaustive-deps` в статусе
  `error`). Запуск — `npm run lint` (0 ошибок), автофикс — `npm run lint:fix`;
  `eslint-disable` в `src/` запрещён. Параметры контракта с префиксом `_` не считаются
  неиспользуемыми.
- **Форматтер:** Prettier 3, `.prettierrc.json` (4 пробела, `singleQuote`, `printWidth 120`,
  `trailingComma: none`, `endOfLine: lf`). `npm run format` пишет, `npm run format:check`
  проверяет; `.md` исключены через `.prettierignore` — таблицы документации не ломаются.
- **CI:** `.github/workflows/ci.yml` (Node 22, `cache: npm`) запускает
  `npm ci → typecheck → test → build → lint → smoke`. Отдельных «CI-скриптов» нет:
  workflow вызывает ровно команды из T70.

## Архитектура

Направление зависимостей — строго вниз, циклы запрещены:

| Слой | Может импортировать | Запрещено |
|---|---|---|
| `core` | `core`, стандартную библиотеку | `data`, `services`, `ui`, `app`, React, DOM-узлы, `localStorage` |
| `data` | `core`, `data` | `services`, `ui`, `app`, React |
| `services` | `services`, `core/types` | `data`, `ui`, `app`, React |
| `ui/types` | `core/types` | всё остальное |
| `app` | `core`, `data`, `services` | `components`, `hooks` |
| `App.tsx` | `components`, `hooks`, `core`, `ui/types`, тип `Services` | значения из `data`/`services`, `createServices` |
| `hooks` | `core`, `data`, `services`, `ui/types`, тип `Services` | создание сервисов, `components` |
| `components` | `core`, `ui/types`, другие `components`, React | `data`, `services`, `app`, `hooks` |

- **core:** только состояние и правила. `SessionModel` хранит счётчики ответов
  (`correct`/`wrong`, `total = correct + wrong`): они меняются в
  `recordCorrect`/`recordIncorrect` при ответе, а не вычисляются из индекса вопроса (1.8.1).
  `MapLayout` — чистая геометрия без DOM и `CONFIG`; `ErrorHandler` — две функции
  (`handleError`, `initGlobalErrorHandlers`) вместо объекта-глобала. Исключение по DOM:
  `initGlobalErrorHandlers()` вешает `window.addEventListener('error'|'unhandledrejection')`.
- **data:** единственная точка работы с хранилищем — `Repository` + реализации.
  `StatsService` — класс: репозиторий приходит в конструктор, `init()` нет; методы 1:1 с
  1.8.1, включая `try/catch` и `handleError`. `LocalStorageRepository` — единственное
  место, где используется `localStorage`.
- **services:** `AudioService` — класс с `_sounds`/`_isReady`; `preload()` и
  `play(kind)`; ошибки загрузки и воспроизведения глотаются (`console.warn`).
- **app:** `Services` (`audio`, `stats`) и `createServices()`; вызывается ровно один раз в
  `src/main.tsx`. `App` получает `services` пропсом, клики в оболочке идут через
  `services.audio.play('click')`.
- **ui:** только view-модели; доменные типы импортируются через `import type`.
- **React-слой:** `App.tsx` — композиция и навигация (`#mapScreen`, `.app` с
  `#gameScreen`/`#resultScreen`, модалки). Всё состояние экранов — `useState` в хуках
  (`useGame`, `useMap`, `useResults`, `useMapSelection`, `useSessionLock`), без
  Context/Zustand/redux. Компоненты презентационные: правила, Storage и `Stats` внутри
  них отсутствуют.
- **Движение игрока:** `useMap` меняет `PlayerState` и индекс в состоянии; `Player.tsx`
  получает новую точку, CSS `transition: transform 600ms` проигрывает переход, а
  `onTransitionEnd` (guard: `propertyName === 'transform'`, `target === currentTarget`)
  открывает модалку. Таймеров на приход нет (A47).

- **Решение A78 (1.9.0): глобального стора нет.** Zustand/Redux/MobX/Jotai/Recoil,
  самописный Context-стор и `window`/`globalThis`-мосты запрещены. Сервисы создаются один раз
  в `createServices()` и передаются явно; состояние экранов — `useState`/`useRef` в хуках;
  компоненты презентационные. Новый общий стейт — только через новую версию spec/rules.

## Карта, зоны и тренажёры

- **Карта — главный экран и на весь экран:** `#mapScreen` закреплён (`position: fixed`) с
  отступами 20px: `calc(100vw - 40px)` × `calc(100vh - 40px)`, при переполнении
  прокручивается вертикально. Карту рендерит `MapScreen` из `useMap.mapData`.
- **Зоны:** три зоны из `CONFIG.ZONES` (Сложение, Вычитание, Умножение); цвет берётся из
  `zone.color` и попадает в CSS-переменную `--zone-color` (inline-стиль `Zone.tsx`).
  Полосы позиционируются абсолютно и стыкуются без зазоров; высота — `trainersCount × 100px`.
- **Тренажёры:** `trainersCount` штук в зоне, пронумерованы 1…N, шаг **100px** между
  центрами (в том числе на границе зон); по X чередуются влево/вправо. Геометрия —
  `MapLayout.buildLayout()` без DOM; ширина полотна измеряется через `ref` на `.map` и
  пересчитывается после появления скроллбара.
- **Дорога:** один непрерывный SVG-путь на всю карту (`Path.tsx`: `svg.map-road` +
  `path.map-road-line`) с кубическими кривыми `C`; S-образная линия проходит через все зоны.
- **Resize и возврат на карту:** слушатель `resize` с debounce 100 мс пересчитывает ширину;
  `useMap.reload()` перечитывает `services.stats`/`MapCatalog` и создаёт новый `PlayerState`
  (вызывается при монтировании, «На карту», смене карты и показе карты).
- **Зоны некликабельны** — обработчик есть только у кнопок `.map-trainer` (`Trainer.tsx`).
- **Глобальная карта:** кнопка 🌍 в `<Header/>`, стили — `css/map_items/map-global.css`
  (`position: fixed`, верхний правый угол). Клик открывает `MapSelectionModal` со списком
  `CONFIG.MAPS`: текущая карта получает класс `selected`, «Закрыть» закрывает модалку.
  Выбор другой карты (`services.stats.switchMap`) сбрасывает позицию выбранной карты в `−1`,
  сохраняет счёт прежней и вызывает `map.reload()`; выбор той же карты — полный no-op без
  записи, звука и закрытия.
- **Модалка сложности:** рисуется внутри `MapScreen` (`.modal-overlay.open` → `.modal` →
  три `.diff-btn` → «Отмена»). Открывается **сразу** по приходе на новый тренажёр и по клику
  на текущий (повторная игра). Пока она открыта, движение заблокировано флагом
  `isModalOpen`. Выбор вызывает `useGame.start(difficulty)`, «Отмена» — закрывает модалку и
  делает откат на предыдущий тренажёр. Сложность не сохраняется и на карте не отображается.
- **Результаты:** `ResultsScreen` — «Играть снова» (`useGame.start()` с текущей сложностью)
  и «На карту» (`map.reload()` + переход). Общий счёт начисляется только при успешном раунде.
- **Игрок:** `.map-player` (🚶, 52px, `z-index: 3`, `pointer-events: none`) позиционируется
  через `transform`. Позиция — `maps[текущая карта].currentTrainerIndex` (плоский индекс
  0…14, старт `−1`). Соседние тренажёры получают `--near`, текущий `--current`, дальние
  `--far` (`cursor: not-allowed`) — классы считает `MapScreen` через `PlayerRules.getAction`.
  `PlayerState` ведёт текущую позицию и точку отката; «игра на текущем» — `isReplay()`.
- **Сохранение позиции:** `Stats.version = 3` (`currentMap` + `maps`; своя запись у каждой
  карты); миграции 1 → 2 → 3 пошаговые и идемпотентные. Позиция пишется **только** после
  победы и провала на **новом** тренажёре (`useMap.gameFinished`): победа закрепляет позицию
  (`commitWin`), провал откатывает назад (`revert`). Отмена модалки, выход ✕ и повторная
  игра позицию не перезаписывают (повторная победа лишь начисляет очки). Выход на новом
  тренажёре (`useMap.exitGame`) делает откат без сохранения. Ключ `ml_stats` не менялся.
- **Блокировка второй вкладки:** `useSessionLock` — `BroadcastChannel('mathlingo_session')` +
  `'hello'`; фолбэк без `BroadcastChannel` — ключ `ml_session_lock` в `localStorage`.
  Модалку «Игра уже запущена» показывает уже открытая вкладка (поведение 1.8.1).
- **Вне текущей области:** прогресс и блокировка тренажёров, звёзды, темы для генератора,
  дополнительные зоны, уникальный дизайн зон, анимации игрока и звук шагов, второй предмет
  в каталоге карт, глобальное состояние (Этап 4), переписывание тестов на `import` и
  `allowJs: false` (Этап 3), React-тесты (Этап 5).

## index.html и подключение

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

- Ни одного `<script src="js/…">` и ни одного `<link rel="stylesheet">`.
- CSS подключается импортами из `src/main.tsx` в порядке `base`, `buttons`, `screens`,
  `game`, `results`, `map`; Vite инлайнит `@import` из `css/map.css`, каскад не меняется.
- `style="display: contents"` у `#root` сохраняется: `.app` остаётся прямым flex-элементом
  `body`.
- `index.html` принадлежит Vite (A67): в `dist/index.html` появляются один `<script
  type="module" crossorigin src="./assets/…">` и `<link rel="stylesheet" href="./assets/…">`;
  руками собранный HTML не правится, `<link>`/`<script>` в исходный — не добавляются.

## Звуковое сопровождение

- Звуки лежат в `src/assets/audio/` (`click.mp3`, `win.mp3`, `lose.mp3`) и подключаются
  через `?url`: `AUDIO_URLS` в `src/assets/audio/audio-urls.ts`, `AudioKind = keyof typeof AUDIO_URLS`.
- `AudioService` (`src/services/audio-service.ts`) предзагружает звуки в `src/main.tsx`.
- Хуки и `App` вызывают `services.audio.play(kind)` на действия пользователя (кнопки карты,
  модалки, ответов, навигации, выход).
- Ошибки звука не ломают игру — логируются в `console.warn`, промис `play()` глушится.
- Поддерживаемые звуки: `click` (кнопки), `win` (победа), `lose` (поражение).
- `preload()` обходит `Object.keys(AUDIO_URLS)` и создаёт `new Audio(AUDIO_URLS[kind])`;
  в `dist` mp3 лежат в `assets/` с хешем в имени, поэтому звук играет и в собранной версии,
  а ссылок на mp3 в `dist/index.html` нет — URL вычисляет бандл.

## История миграции

- **1.7.0 — пилот:** `main.tsx`, `src/App.tsx` только для модалки ошибок; мост
  `window.showErrorModal`, старый `#errorOverlay` как fallback; `js/script.js`
  импортировался из `main.tsx`.
- **1.8.0 — переезд экранов:** результаты → выбор карты → игра → карта → шапка → каркас;
  каждый шаг удалял свой `view/*.js` и `controller/*.js` в том же изменении.
  Временный мост `window.mlBridge` жил с 15.1 по 15.15 и удалён вместе с последним
  legacy-вызывающим; `window.showErrorModal` снят на 15.17; `js/script.js` заменён
  `src/bootstrap.ts` на 15.18. Контроллеры стали хуками, View — компонентами,
  `map-layout.js` переехал в `logic/`.
- **1.8.1 — статистика раунда:** `SessionModel` получил `_correct`/`_wrong` и инкременты;
  `total = correct + wrong`; новый сьют `session-model.test.js`.
- **1.8.2 — ES-модули:** `js/` (19 classic-файлов) удалён; код переехал в `src/core`
  (13 модулей), `src/data` (4), `src/services` (1), `src/ui` и `src/app`; `src/bootstrap.ts`
  заменён `createServices()`, `src/config.ts` — импортом `CONFIG`, `src/types.ts` разделён
  на `core/types` + `ui/types`; `SessionService`/`SessionRepository` и `useAudio` удалены
  как мёртвый код; `index.html` — `#root` + один module-скрипт. Поведение, разметка, CSS,
  `CONFIG`, `Stats` v3 и ключи хранилища не изменились.
- **1.8.3 — тесты на импортах:** 12 сьютов переехали на `import` из `src/**`
  (`eval`/`readSource`/`test/ts-source.js` и копия `CONFIG` удалены, `allowJs: false`);
  затем добавлены RTL-сетап (`jest-dom`, заглушка `BroadcastChannel`), 7 компонентных
  и 4 хуковых сьюта, 5 точечных юнит-сьютов `core`/`data`, `coverage.include` и пороги
  80/60. `src/**`, CSS и `index.html` — без изменений; итог — 28 сьютов / 261 тест.
- **1.8.4 — production-сборка:** `@vitejs/plugin-react`, `vite.config.ts` (`base: './'`,
  `sourcemap`, `assetsInlineLimit: 0`), `"type": "module"`, удалён `jest.config.js`;
  `build` = `tsc --noEmit && vite build` → `dist/`; mp3 переехали в `src/assets/audio/`
  и подключаются через `?url`; `scripts/verify-dist.mjs` (+`cdp.mjs`) проверяет `dist`
  в `vite preview` + headless Chromium (10 проверок). Поведение, разметка, CSS, `CONFIG`,
  `Stats` v3 и ключи хранилища не менялись; `src/**` — только аудио.
- **1.9.0 — зависимости и качество:** `dependencies` сокращены до `react`/`react-dom`
  (удалены `jest-environment-jsdom` и ~200 транзитивов Jest), lock пересобран с нуля;
  добавлены ESLint 10 (flat) + Prettier 3, CI и `scripts/smoke.mjs`; `MemoryRepository`
  переехал в `test/support/`, `Scoring.calculateRoundScore` используется `SessionModel`;
  CSS: подключён `game-header.css`, убран дубль `game-answers.css`, удалён
  `results-streak.css`. Поведение, разметка и значения стилей не менялись.

## Коммиты и pull requests

- Используйте описательные сообщения коммитов: `feat: add division problems to medium difficulty`.
- Держите коммиты сфокусированными на одном изменении.
- Для PR: опишите изменение, перечислите затронутые файлы, укажите изменения конфигурации.
- Миграция 1.8.2 велась в ветке `refactor/es-modules`; мерж — только после зелёного
  `npm test` на этапе 3.
- С 1.9.0 мерж и пуш — только после зелёного CI: `npm ci → typecheck → test → build →
  lint → smoke`; локально — те же команды (T70).

## Добавление нового контента

- **Новая зона на карте:** добавьте объект в `ZONES` в `src/core/config.ts` (`id`, `title`,
  `color`, `trainersCount`) — карта отрисуется автоматически. Тема в генератор пока не
  передаётся.
- **Новая карта (предмет):** добавьте объект в `MAPS` в `src/core/config.ts` (`id`, `title`,
  `zones`) — он сразу появится в списке 🌍. Зоны читаются через `MapCatalog.get(...).zones`,
  поэтому вторая карта не требует правок в отрисовке; `Stats` v3 заведёт для неё запись
  автоматически.
- **Новые задачи:** добавьте логику в соответствующий метод `src/core/generator.ts`
  (`easy()`, `medium()`, `hard()`).
- **Новые типы:** домен — в `src/core/types.ts`, view-модели — в `src/ui/types.ts`; импорт
  только через `import type`, без `declare global`.
- **Новые элементы UI:** новый компонент в `src/components/` + стили в `css/`; обработчики —
  пропсами React, состояние и побочные эффекты — в хуке `src/hooks/`, а не в компоненте.
- **Новые сервисы/хранилища:** класс в `src/data/` или `src/services/`, создание — только в
  `src/app/createServices.ts`; тип `Services` дополните в `src/app/types.ts`.
- **Настройка сложности:** измените диапазоны в методах `generator.ts` или добавьте новые
  пороги в `CONFIG`.
- **Новые звуки:** добавьте MP3-файл в `src/assets/audio/`, импорт `?url` и ключ — в
  `AUDIO_URLS` (`src/assets/audio/audio-urls.ts`; `AudioKind` обновится сам), вызовите
  `services.audio.play(kind)` в хуке.
- **Тесты:** новый тест — `*.test.ts` в `test/core/`, `test/data/`, `test/services/`
  (React — `*.test.tsx` в `test/components/` или `test/hooks/`); исходники только через
  `import` из `src/**`; `eval`/`readSource` и копии логики запрещены. Тестовые двойники —
  только в `test/support/`.
- **После любого изменения:** `npm run lint && npm run format:check && npm test`; перед
  сдачей — полный критерий `npm ci && npm run typecheck && npm test && npm run build &&
  npm run lint && npm run smoke`.
