# MathLingo 🧮

**Учи математику играя!**

Браузерная мини-игра для тренировки устного счёта. Главный экран — карта с зонами и
тренажёрами, сложность выбирается при клике на тренажёр. Есть жизни, объяснения решений,
оценка результата, общий счёт между сессиями и звуковое сопровождение. Код — один граф
ES-модулей на TypeScript: домен, данные, сервисы и React-слой связаны явными `import`.
Инструменты — Vite, vitest, ESLint и Prettier; проверки собраны в CI.

## Возможности

- 🗺️ **Карта** — главный экран на весь экран: три зоны (Сложение, Вычитание, Умножение) и по пять тренажёров в каждой с шагом 100px
- 🛣️ **Непрерывная дорога** — один S-образный SVG-путь через все зоны, зоны прокручиваются вертикально
- 🚶 **Игрок на карте** — персонаж ходит между соседними тренажёрами; модалка сложности открывается сразу по приходу, позиция сохраняется после игры
- 🌍 **Глобальная карта** — кнопка 🌍 в правом верхнем углу открывает список предметов; текущая карта выделена, выбор другой загружает её с начала
- 🎯 **3 уровня сложности** — «Легко», «Средне», «Сложно» выбираются в модалке при клике на тренажёр
- ➕ **Разнообразные задачи** — сложение, вычитание, умножение, деление, степени, проценты
- ❤️ **Жизни** — 3 ошибки, и раунд окончен
- 💬 **Объяснения** — после каждого ответа показывается решение
- 📊 **Экран результатов** — статистика и оценка
- 🏆 **Общий счёт** — сохраняется между сессиями (localStorage)
- 🔒 **Одна вкладка** — открытие второй вкладки показывает предупреждение
- 🔊 **Звуковое сопровождение** — клики, победа, поражение; ошибки звука не ломают игру

## Запуск

Весь код — ES-модули TypeScript/TSX (`.ts`/`.tsx`), точка входа — `src/main.tsx`.
Приложение запускается через Vite; прямое открытие `index.html` и `python3 -m http.server`
**не работают** (браузер не умеет `.ts` и голые импорты).

```bash
npm ci             # установка строго по package-lock.json (в разработке можно npm install)
npm run dev        # http://localhost:5173
```

Команды проверки (полный локальный критерий — в конце раздела):

```bash
npm run typecheck      # tsc --noEmit — 0 ошибок
npm test               # vitest: 261 тест в 28 сьютах
npm run test:coverage  # покрытие v8 по группам + пороги 80/60
npm run build          # tsc --noEmit && vite build → dist/
npm run preview        # собранный dist на http://localhost:4173
npm run lint           # ESLint 10 (flat config) — 0 ошибок
npm run format:check   # проверка стиля Prettier без записи
npm run format         # переформатировать код
npm run smoke          # 10 HTTP-проверок dist через vite preview
npm run smoke:browser  # smoke + 10 браузерных проверок dist (Chromium, CDP)
```

Полный локальный критерий (CI повторяет его без `format:check`):

```bash
npm ci && npm run typecheck && npm test && npm run build && npm run lint
npm run format:check
npm run smoke
```

> ✅ **1.9.0 — зависимости, линтер, CI и качество кода.** В `dependencies` остались только
> `react` и `react-dom`; ~200 транзитивов Jest удалены, `package-lock.json` пересобран с нуля
> (`lockfileVersion: 3`, 136 КБ). Настроены ESLint 10 (`typescript-eslint` +
> `eslint-plugin-react-hooks`) и Prettier 3; добавлены `.github/workflows/ci.yml` и
> `scripts/smoke.mjs`. Удалён мёртвый код (`MemoryRepository` переехал в `test/support/`,
> `Scoring.calculateRoundScore` теперь используется `SessionModel`), закрыт CSS-долг:
> подключён `game-header.css`, убран дубль `game-answers.css`, удалён `results-streak.css`.
> Поведение игры, разметка и значения стилей не менялись.

## Архитектура (1.9.0)

Один граф ES-модулей вместо 19 `<script>`-тегов и глобальных переменных:

- `index.html` — только `#root` (`display: contents`) и **один**
  `<script type="module" src="/src/main.tsx">`. CSS импортируется из `src/main.tsx`
  в прежнем порядке: `base`, `buttons`, `screens`, `game`, `results`, `map`.
- `src/core/` — домен (13 модулей): `config`, `types`, `errors`, `error-handler`,
  `session-model`, `map-catalog`, `stats-schema`, `game-rules`, `generator`, `scoring`,
  `player-rules`, `player-state`, `map-layout`. Без React, DOM и `localStorage`.
- `src/data/` — `Repository`, `LocalStorageRepository` и `StatsService(repo)`; единственное
  место, где используется `localStorage`. `MemoryRepository` — тестовый двойник — лежит в
  `test/support/memory-repository.ts` и в прод-бандл не попадает.
- `src/services/audio-service.ts` — класс `AudioService` и тип `AudioKind`;
  ошибки загрузки и воспроизведения глотаются.
- `src/ui/types.ts` — view-модели React-слоя; доменные типы — `src/core/types.ts`.
- `src/app/` — `Services` и `createServices()`: единственная точка создания сервисов.
- `src/main.tsx` — `createServices()` → `audio.preload()` → `initGlobalErrorHandlers()` →
  `createRoot(...).render(<StrictMode><App services={services}/></StrictMode>)`.
- `src/App.tsx` — каркас и навигация: экраны `#mapScreen`, `#gameScreen`, `#resultScreen`,
  модалки выбора карты/сложности/ошибок. Состояние — локальное (`useState` в хуках),
  без Context/Zustand/redux.
- `src/components/` — 10 презентационных компонентов; `src/hooks/` — 5 хуков
  (`useGame`, `useMap`, `useMapSelection`, `useResults`, `useSessionLock`). Сервисы
  приходят в хуки **первым аргументом** (`useMap(services)`), создаются один раз и не
  хранятся в модульных переменных; `useAudio` удалён.
- Глобальных переменных, `declare global`, `window.*`-мостов и `globalThis.*` нет:
  любой идентификатор доступен только через `import`.

Поведение, разметка, тексты, значения `CONFIG`, формат `Stats` v3 и ключи
`ml_stats` / `ml_session_lock` не изменились.

## Архитектурное решение: без глобального стора

**Решение (ADR-1, зафиксировано в 1.9.0):** в приложении **нет и не будет** глобального
состояния — Zustand, Redux, MobX, Jotai, Recoil, самописный Context-стор и
`window`/`globalThis`-мосты не используются.

| Аспект | Как решено |
|---|---|
| Сервисы | Один раз в `src/app/createServices.ts`; дальше — пропсом `services` в `App` и первым аргументом хука |
| Состояние экранов | `useState`/`useRef` внутри `src/hooks/`; в `App.tsx` — только `screen` и `error` |
| Производные значения | Считаются в хуке или домене (`PlayerRules`, `MapLayout`, `Scoring`), а не кэшируются глобально |
| Передача между экранами | Через существующие хуки и `services.stats` (данные), а не через общий стор |
| Компоненты | Презентационные: получают пропсы и колбэки, сервисы не создают |

Причина: приложение укладывается в 5 хуков и один composition root; глобальный стор добавил
бы синхронизацию и жизненный цикл, которых нет ни в требованиях, ни в поведении. Новый
глобальный стор возможен только через новую версию spec/rules.

## Статистика раунда (1.8.1)

Число правильных и неправильных ответов считается в модели раунда в момент ответа
(`recordCorrect` / `recordIncorrect`), а не выводится из номера вопроса. `getResults()`
отдаёт фактические `correct` / `wrong`, а `total = correct + wrong` — сколько вопросов
реально отвечено (неотвеченные вопросы ошибками не считаются). Оценка берёт точность
`correct / total`: 8 верных и 2 ошибки → 80% → «🎉 Отлично!» и «Правильных: 8»; 10/10 →
«🏆 Идеально!»; три ошибки → «💔 Игра окончена» с `total = 3`. `reset()` («Играть снова»)
обнуляет счётчики вместе с очками и жизнями. Очки за раунд считает
`Scoring.calculateRoundScore(correct)` — `SessionModel` вызывает его, а не дублирует формулу.

## Как играть

1. При запуске сразу открывается **карта** — отдельного меню нет.
2. Ведите **игрока** 🚶 по дороге: клик по **соседнему** тренажёру — плавное движение (600 мс),
   и как только игрок встал на новый тренажёр, **сразу открывается модалка** сложности.
   Клик по **текущему** — та же модалка (повторная игра), по **дальнему** — ничего (`not-allowed`).
   Пока модалка открыта, движение заблокировано.
3. Выберите сложность (**Легко / Средне / Сложно**) — начнётся раунд из 10 вопросов.
   Кнопка **«Отмена»** закрывает модалку и возвращает игрока на предыдущий тренажёр.
4. Решите пример и выберите правильный ответ из четырёх вариантов.
5. За правильный ответ начисляются очки, за неправильный теряется одна жизнь.
6. После 3 ошибок или 10 вопросов раунд заканчивается.
7. При успешном завершении (все 10 вопросов, жизни > 0) очки зачисляются в общий счёт.
   Позиция сохраняется после победы и провала на **новом** тренажёре: победа оставляет игрока,
   провал возвращает на предыдущий. На **текущем** провал и выход ✕ — тренировка: игрок
   остаётся на месте, позиция не перезаписывается; повторная победа очки приносит.
8. На экране результатов — **«Играть снова»** (та же сложность) или **«На карту»**
   с обновлённым счётом вверху.
9. Кнопка **🌍** в правом верхнем углу карты открывает **«Выбор карты»**. Сейчас доступна
   только «Математика»; переключение на другую карту начинает её с первого тренажёра,
   счёт каждой карты хранится отдельно и не сбрасывается. Выбор той же карты ничего не
   меняет, подтверждение не запрашивается. Текущая карта запоминается между сессиями.

Зоны на карте — только визуальные блоки, нажимать нужно на тренажёры (номера 1…5).
Карта занимает весь экран (с отступами 20px) и прокручивается вертикально; тренажёры
соединены одной непрерывной дорогой. Игрок стартует перед первым тренажёром; модалка
открывается сразу по приходу и блокирует движение. Отмена модалки, выход ✕ и повторная
игра позицию **не** сохраняют: запись в `ml_stats` происходит только после победы или
провала на новом тренажёре. Формат статистики — **версия 3**: `currentMap` + `maps`
(у каждой карты свои `totalScore` и `currentTrainerIndex`); записи версий 1 и 2
мигрируют пошагово (1 → 2 → 3) автоматически. Сложность между играми не сохраняется,
а тема тренажёра на генерацию задач пока не влияет.

## Оценка результата

| Правильных | Оценка      |
|-----------|-------------|
| 100%      | 🏆 Идеально |
| ≥ 70%     | 🎉 Отлично  |
| ≥ 40%     | 💪 Неплохо  |
| < 40%     | 📚 Тренировка |

Если потеряны все жизни, показывается «💔 Игра окончена» независимо от процента правильных ответов.

## Тесты

```bash
npm ci
npm test
npm run test:coverage
```

**261 тест в 28 сьютах** (vitest + jsdom): домен — `test/core/`, данные —
`test/data/` (`StatsService` через `test/support/memory-repository.ts`), сервисы —
`test/services/` (звук), UI — `test/components/` и `test/hooks/`
(`@testing-library/react` + `user-event` + `jest-dom`).

| Группа | Сьюты | Тесты | Что проверяет |
|---|---|---|---|
| `test/core/**` | 12 | 135 | домен: `CONFIG`, ошибки, `error-handler`, правила, генератор, карта, `SessionModel`, `StatsSchema` |
| `test/data/**` | 4 | 40 | `StatsService` через `MemoryRepository`; `LocalStorageRepository`, `Repository`, `MemoryRepository` |
| `test/services/**` | 1 | 9 | `AudioService`: preload, play, ошибки |
| `test/components/**` | 7 | 45 | RTL: `App`, `GameScreen`, `MapScreen`, `ResultsScreen`, `MapSelectionModal`, `Header`, `ErrorModal` |
| `test/hooks/**` | 4 | 32 | `renderHook`: `useGame`, `useMap`, `useResults`, `useSessionLock` |
| **Итого** | **28** | **261** | покрытие **96.83%** stmts / **88.74%** branches |

Пороги покрытия — `coverage.thresholds` в `vitest.config.ts`: **80%**
(`core`/`data`/`services`) и **60%** (`components`/`hooks`/`App.tsx`); пороги не
понижаются. Тестовый двойник `MemoryRepository` живёт в `test/support/` и в покрытие
`src/**` не входит. E2E (Playwright) в `npm test` не входит — backlog записан в
`test/README.md`. Подробности — `test/README.md` и `spec_v1_9_0.md`.

## Проверки и CI (1.9.0)

Пайплайн `.github/workflows/ci.yml` (Node 22, `cache: npm`) повторяет локальный критерий:

```
npm ci → npm run typecheck → npm test → npm run build → npm run lint → npm run smoke
```

- **ESLint 10** (flat config `eslint.config.js`): `@eslint/js` recommended,
  `typescript-eslint` recommended, `eslint-plugin-react-hooks` (`rules-of-hooks`,
  `exhaustive-deps`). `npm run lint` — 0 ошибок, `eslint-disable` в `src/` нет.
- **Prettier 3** (`.prettierrc.json`): 4 пробела, одинарные кавычки, `printWidth 120`,
  без trailing comma. `.prettierignore` исключает `dist/`, `coverage/`, `package-lock.json`
  и `*.md` — документация форматируется руками.
- **Smoke** (`scripts/smoke.mjs`): поднимает `vite preview` на 4173 и проверяет HTTP-контракт
  `dist` — `#root`, ровно один JS и один CSS, отсутствие `/src/`, `js/`, `audio/`, живые
  ассеты, три mp3. Только Node, без Playwright.
- **Браузерная проверка** (`npm run smoke:browser`): `scripts/smoke.mjs --browser` сам
  поднимает `vite preview` и дополнительно запускает `scripts/verify-dist.mjs` +
  `scripts/cdp.mjs` — 10 проверок в headless Chromium (карта и 15 тренажёров, модалка,
  игра, результаты, сеть без 4xx/5xx, чистая консоль).

Срез на **1.9.0**:

| Проверка | Команда | Результат |
|---|---|---|
| Установка | `npm ci` | ✅ 239 пакетов по lock |
| Типы | `npm run typecheck` | ✅ **0 ошибок** |
| Тесты | `npm test` | ✅ **261/261** в 28 сьютах |
| Покрытие | `npm run test:coverage` | ✅ **96.83%** stmts / **88.74%** branches, пороги 80/60 |
| Прод-сборка | `npm run build` | ✅ `dist/`: JS 245.58 КБ + `.map`, CSS 7.04 КБ, три mp3 |
| Линтер | `npm run lint` | ✅ **0 ошибок** |
| Формат | `npm run format:check` | ✅ все файлы соответствуют стилю |
| Smoke | `npm run smoke` | ✅ **10/10** HTTP-проверок |
| Браузер | `npm run smoke:browser` | ✅ **11/11** (HTTP + 10 браузерных) |
| Dev-сервер | `npm run dev` | ✅ `http://localhost:5173` |

## Структура проекта

```
index.html          # #root + один <script type="module" src="/src/main.tsx">
vite.config.ts      # react(), base: './', dist, sourcemap, assetsInlineLimit: 0
tsconfig.json       # strict, noEmit, allowJs: false, include src/test/конфиги
vitest.config.ts    # jsdom, setupFiles, coverage include + пороги 80/60
eslint.config.js    # flat config: typescript-eslint + react-hooks
.prettierrc.json    # 4 пробела, singleQuote, printWidth 120
.prettierignore     # dist, coverage, *.md, .gigacode
.github/
  workflows/ci.yml  # npm ci → typecheck → test → build → lint → smoke
scripts/
  smoke.mjs         # 10 HTTP-проверок dist через vite preview (без зависимостей)
  verify-dist.mjs   # 10 браузерных проверок dist в headless Chromium (CDP)
  cdp.mjs           # минимальный CDP-клиент и утилиты ожидания
src/
  main.tsx          # CSS-импорты → createServices → preload → handlers → render
  App.tsx           # Каркас: экраны, модалки, состояние навигации
  app/
    createServices.ts  # Composition root: StatsService + AudioService
    types.ts           # interface Services
  core/             # 13 модулей домена (без React/DOM/localStorage)
    config.ts types.ts errors.ts error-handler.ts session-model.ts map-catalog.ts
    stats-schema.ts game-rules.ts generator.ts scoring.ts player-rules.ts
    player-state.ts map-layout.ts
  data/
    repository.ts local-repository.ts stats-service.ts
  services/
    audio-service.ts  # AudioService: preload по AUDIO_URLS (ассеты через ?url)
  assets/audio/
    click.mp3 win.mp3 lose.mp3   # Звуки; URL вычисляет Vite (?url)
    audio-urls.ts                # AUDIO_URLS и AudioKind
  ui/
    types.ts          # View-модели (MapViewData, ResultsView, …)
  components/       # ResultsScreen, MapSelectionModal, GameScreen, MapScreen,
                    # Zone, Trainer, Player, Path, Header, ErrorModal
  hooks/            # useResults, useMapSelection, useGame, useMap, useSessionLock
css/                # 20 файлов
  base.css          # Базовые стили
  buttons.css       # Кнопки
  screens.css       # Каркас экранов
  map.css           # Карта: собирает map_items/ через @import
  game.css          # Игровой экран: game-header, game-question, game-answers, game-feedback
  results.css       # Результаты: results-icon, results-stats
  screen_items/     # Стили каркаса экранов
  map_items/        # Стили карты: экран, зоны, дорога, игрок, тренажёры, модалки, глобальная карта
  game_items/       # Шапка, вопрос, ответы, обратная связь
  result_items/     # Иконка и статистика результата
test/               # 28 сьютов / 261 тест: core, data, services, components, hooks
  support/          # memory-repository.ts — тестовый двойник Repository
```

TypeScript используется везде, включая все шесть бывших `.js`-файлов
(`map-catalog`, `stats-schema`, `player-rules`, `player-state`, `audio-service`,
`map-layout`). Доменные типы — только `src/core/types.ts`, view-модели — только
`src/ui/types.ts`; глобальных объявлений (`declare global`) нет.

## Технологии

- **HTML5** — разметка
- **CSS3** — стили, градиенты, адаптивность
- **TypeScript 5.9** — весь код: домен, данные, сервисы, UI и тесты
- **React 19.3.1 + @types/react** — все экраны и модалки (карта, игра, результаты, шапка)
- **ES-модули** — один граф импортов, один `<script type="module">`
- **Vite 8** — dev-сервер и production-сборка (`npm run build` → `dist/`)
- **vitest + jsdom** — тесты (домен, данные, сервисы, RTL для компонентов и хуков)
- **@testing-library/react + user-event + jest-dom** — компонентные и хуковые тесты
- **ESLint 10 + typescript-eslint + eslint-plugin-react-hooks** — статический анализ
- **Prettier 3** — единый стиль кода
- **GitHub Actions** — CI: установка, типы, тесты, сборка, линтер, smoke

## Документация процесса

Требования и планы лежат в `.gigacode/`: `rulles/RULES.md` (конституция),
`specs/SPEC.md` (поведение и требования), `plans/PLAN.md` (архитектура и шаги),
`tasks/TASKS.md` (задачи). Актуальная версия — **1.9.0**:
`spec_v1_9_0.md` (инструменты, зависимости, CI) и `rules_v_1_9_0.md`
(правила A72–A78, T63–T70, Z34–Z38).

## Лицензия

Проект распространяется без ограничений.
