# Тесты MathLingo

## Запуск

```bash
npm ci               # установка по package-lock.json
npm test             # vitest run: 35 сьютов, 316 тестов
npm run test:watch   # watch-режим
npm run test:coverage# покрытие (v8) по группам + html-отчёт в coverage/
npm run typecheck    # tsc --noEmit (src/ + test/, включая .tsx)
npm run lint         # ESLint 10: src/, test/, scripts/ и конфиги
npm run format:check # Prettier: стиль без записи
npm run build        # tsc --noEmit && vite build → dist/ (ассеты проверяются отдельно)
npm run smoke        # vite preview + 10 HTTP-проверок dist
npm run smoke:browser# smoke + 11 браузерных проверок dist (headless Chromium)
```

Раннер — **vitest** (не Jest), среда — `jsdom`. Конфигурация — `vitest.config.ts`:
`globals: true`, `setupFiles: ['./test/setup.ts']`, `coverage.provider: 'v8'`,
`coverage.include` по слоям `src/` и `thresholds` по группам (80/60).

`test/setup.ts` содержит только инфраструктуру: `import '@testing-library/jest-dom/vitest'`
(матчеры `toBeInTheDocument`/`toHaveClass`/`toHaveTextContent`), мок `Audio` и
безопасную заглушку `BroadcastChannel`. Доменных констант (`CONFIG`, `ZONES`, `MAPS`,
`RATINGS`, `GAMEOVER`) в `setup.ts` нет — тесты импортируют боевой `src/core/config`.

## 1.8.3 — тесты на реальных импортах

Этап 1.8.2 перевёл прод-код на ES-модули в `src/`, а тесты оставил на `readSource` +
`eval` со старыми путями `js/…`. После удаления `js/` прогон был красным:
**9 сьютов failed / 3 passed, 43 теста passed**, 113 тестов не запускались.

В 1.8.3 тесты переписаны:

| Было | Стало |
|---|---|
| `test/**/*.test.js` | `test/{core,data,services,components,hooks}/*.test.ts(x)` |
| `readSource()` + `eval` | `import` из `src/core` / `src/data` / `src/services` / `src/**` |
| `test/ts-source.js` | удалён |
| копия `CONFIG` в `test/setup.js` | `test/setup.ts` без `CONFIG`; `import { CONFIG }` |
| копии `GameRules` / `ProblemGenerator` / `Scoring` | настоящие модули |
| `StatsService.init(repo)` | `new StatsService(new MemoryRepository())` — двойник из `test/support/` |
| `allowJs: true` | `allowJs: false` |

Итог: **261 тест в 28 сьютах**, `npx tsc --noEmit` — **0**, `eval`/`readSource` — **0**,
`src/**` — **0 правок** (тесты подстраиваются под прод-API, а не наоборот).

Сьюты, которые проверяют именно реальный прод-код: `test/core/session-model.test.ts`
(15 тестов, `SessionModel`), `test/data/stats-service.test.ts` (26, `StatsService` через
`MemoryRepository`), `test/components/App.test.tsx` (15, интеграция на реальных хуках
и фейковом `Services`), `test/hooks/*` (41, `renderHook`).

## Контракт аудио-теста (1.8.4)

`test/services/audio-service.test.ts` проверяет `AudioService.preload()` сравнением с
`AUDIO_URLS` из `src/assets/audio/audio-urls.ts`:

```ts
expect(calls).toEqual([AUDIO_URLS.click, AUDIO_URLS.win, AUDIO_URLS.lose]);
```

Литералы `audio/…` и хеши файлов в тесте запрещены: в dev `?url` даёт путь к исходнику,
в prod — `assets/<name>-<hash>.mp3`. Тест проверяет контракт (три звука в порядке
`click`, `win`, `lose`), а не конкретные имена файлов; остальные 27 сьютов не менялись.

## Структура

```
test/
├── setup.ts                       # jest-dom + мок Audio + заглушка BroadcastChannel
├── support/
│   ├── memory-repository.ts       # тестовый двойник Repository (вне src/ и coverage)
│   ├── stats-fixtures.ts          # defaults/withEnglish/mapStats/read/failsOn, makeService
│   ├── generator-fixtures.ts      # таблица диапазонов генератора по сложностям
│   ├── app-drivers.ts             # шаги пользователя для App-сьютов (карта → раунд → ✕)
│   ├── app-setup.tsx              # renderApp/makeAppServices для App-сьютов
│   └── session-channel.ts         # управляемая заглушка BroadcastChannel (вторая вкладка)
├── core/                          # 12 файлов / 141 тест
│   ├── config.test.ts             # CONFIG: версия 3, каталог, зоны, константы (6)
│   ├── errors.test.ts             # цепочка наследования и name (3)
│   ├── error-handler.test.ts      # handleError, глобальные обработчики (8)
│   ├── game-rules.test.ts         # checkAnswer, shouldEndGame, getRating из CONFIG (16)
│   ├── generator.test.ts          # ProblemGenerator: диапазоны по таблице, 4 варианта (15)
│   ├── scoring.test.ts            # calculateRoundScore, isRoundSuccessful (8)
│   ├── player-rules.test.ts       # getAction, normalizeIndex (14)
│   ├── player-state.test.ts       # moveTo, revert, commitWin, restore (8)
│   ├── map-layout.test.ts         # шаг 100px, полосы, SVG-путь, точка (19)
│   ├── map-catalog.test.ts        # get / getDefault / has (9)
│   ├── session-model.test.ts      # счётчики, getResults, reset (15)
│   └── stats-schema.test.ts       # defaults, миграции 1→2→3, onStep, console.info (20)
├── data/                          # 6 файлов / 57 тестов
│   ├── stats-service.test.ts      # счёт/позиция, switchMap, reset/skip/memory (26)
│   ├── stats-service.migration.test.ts # write-back, лог, дедупликация, без репортёра (8)
│   ├── stats-service.cache.test.ts # кэш экземпляра, StrictMode, режим памяти (7)
│   ├── local-repository.test.ts   # round-trip, порча, квота, недоступность (8)
│   ├── repository.test.ts         # контракт «Not implemented» (3)
│   └── memory-repository.test.ts  # save/load/clear, сериализация (5)
├── app/
│   └── error-bus.test.ts          # очередь до подписки, доставка, отписка (5)
├── services/
│   └── audio-service.test.ts      # preload, play, ошибки (9)
├── components/                    # 10 файлов / 63 теста
│   ├── App.test.tsx               # карта → игра → результаты, шина ошибок, выход (15)
│   ├── App.map-freshness.test.tsx # «Играть снова» → ✕ → «Выйти» и «На карту»: счёт 100 (3)
│   ├── App.startup.test.tsx       # стартовая ошибка хранилища и очередь сообщений (5)
│   ├── ConfirmModal.test.tsx      # тексты, кнопки, оверлей (5)
│   ├── GameScreen.test.tsx        # вопрос, 4 ответа, feedback, «+10» (10)
│   ├── MapScreen.test.tsx         # 15 тренажёров, зоны, модалка, transitionend (9)
│   ├── ResultsScreen.test.tsx     # оценка, карточки, кнопки (4)
│   ├── MapSelectionModal.test.tsx # карты из props, selected, выбор (5)
│   ├── Header.test.tsx            # счёт 🏆 и кнопка 🌍 (4)
│   └── ErrorModal.test.tsx        # текст, «OK», оверлей (3)
└── hooks/                         # 5 файлов / 41 тест
    ├── useGame.test.tsx           # ответы, счёт, жизни, таймер, выход (10)
    ├── useMap.test.tsx            # движение, модалка, откат, запись (11)
    ├── useMap.save-failure.test.tsx # UI = хранилище при провале записи (2)
    ├── useResults.test.tsx        # оценка, «(не зачтено)», порядок записи (8)
    └── useSessionLock.test.tsx    # владелец/претендент, heartbeat, fallback (10)
```

## Как писать RTL-тесты

- **Запросы.** `getByRole` / `getByText` / `getByLabelText` — по умолчанию.
  `container.querySelectorAll` — только для контрактных CSS-классов, которых нет
  в ARIA (`map-trainer--current`, `feedback correct-fb`, `stat-card`).
- **События.** `user-event` (`userEvent.setup()`) — клики и ввод. `fireEvent` — только
  там, где `user-event` не выражает сценарий: `transitionend` игрока и клик по оверлею.
- **`transitionend`.** Движение игрока — CSS-transition 600 мс, поэтому «прибытие»
  эмулируется `fireEvent.transitionEnd(el, { propertyName: 'transform' })`; таймеры для
  этого не нужны.
- **Fake timers.** Только там, где таймеры есть в проде: 100 мс debounce `resize`
  в `useMap` и 1500 мс плашки `+10` в `useGame`. Обязательно `act(() => vi.advanceTimersByTime(n))`
  и `vi.useRealTimers()` в `afterEach`; `setTimeout`/`sleep` в тестах запрещены.
- **Фейковый `Services`.** Собирается в каждом сьюте из фикстур `test/support/`:
  `{ audio: { play: vi.fn() }, stats: new StatsService(repo, errors), errors: new ErrorBus() }`.
  `AudioService`/`StatsService` в тестах не создаются в module scope; для App-сьютов есть
  `renderApp()`/`makeAppServices()` из `test/support/app-setup.tsx`, шаги пользователя —
  в `test/support/app-drivers.ts`.
- **`BroadcastChannel`.** В `setup.ts` — безопасная заглушка (ничего не рассылает).
  Управляемая заглушка — `test/support/session-channel.ts` (`ControlledChannel`,
  `channels`, `sendFromOtherTab`): сьют сам «шлёт» `hello`/`busy` другой вкладки,
  ставит её через `vi.stubGlobal` в `beforeEach`, `vi.unstubAllGlobals()` — в `afterEach`.
- **Запрещено.** `eval`, `new Function`, `readSource`, `fs.readFileSync`, `require`,
  копии `CONFIG`/логики в тестах, `.only`/`.skip` без объяснения, снимки всего DOM,
  проверка приватных полей вместо публичного API.
- **Бюджет сьюта — 200 строк** (`wc -l`), проверяется локально и шагом CI. Превышение
  устраняется выносом фикстур/драйверов в `test/support/*.ts`, а не удалением сценариев
  и не дроблением сьюта. Новый сценарий, не влезающий в лимит, живёт отдельным сьютом —
  A91 читается как «основной сьют + **не более двух** дополнительных» (T90.1): четвёртый
  сьют к модулю вводится только новым правилом. Действующие исключения фиксируются здесь:
  для `App` — `App.map-freshness.test.tsx` (счёт на путях возврата, TR-85) и
  `App.startup.test.tsx` (стартовая ошибка хранилища и очередь сообщений, A86/A94);
  для `useMap` — `useMap.save-failure.test.tsx` (инвариант `UI === storage` при провале
  записи, A92/T86); для `StatsService` — `stats-service.migration.test.ts` (write-back
  миграции и лог, A89) и `stats-service.cache.test.ts` (кэш экземпляра, A95/T89).
  Сценарии в них не дублируют основные сьюты: успешные пути раунда остаются в
  `useMap.test.tsx`, счёт и позиция — в `stats-service.test.ts`; фикстуры — в
  `test/support/`.

## Покрытие (1.10.2)

`npm run test:coverage`, срез 1.10.2 — 35 сьютов, 316 тестов:

| Группа | Stmts | Branch | Funcs | Lines | Порог |
|---|---|---|---|---|---|
| `src/core/**` | 99.32 | 89.47 | 98.66 | 99.64 | 80 |
| `src/data/**` | 98.21 | 94.59 | 96.96 | 99.01 | 80 |
| `src/services/**` | 100 | 100 | 100 | 100 | 80 |
| `src/components/**` | 93.93 | 86.27 | 100 | 98.3 | 60 |
| `src/hooks/**` | 96.59 | 87.5 | 97.91 | 98.85 | 60 |
| `src/App.tsx` | 96.66 | 94.44 | 100 | 96.42 | 60 |
| **Итого** | **97.63** | **89.25** | **98.53** | **98.96** | — |

Baseline 1.8.3 (до этапа 18) — 46.3% statements / 41.39% branches, потому что в отчёт
попадали только загруженные модули. После `coverage.include` итог считается по всем
слоям. `src/core/types.ts` в отчёте — `0/0` (только типы, исполняемых инструкций нет);
это норма, модуль **не исключён** из `include` (D42).

Пороги (`vitest.config.ts`, `coverage.thresholds`) не понижаются: недостача добирается
сценариями. `src/app/**` (composition root) и `src/main.tsx` намеренно вне `include`.

## E2E — backlog

Playwright **не установлен**, в `npm test` E2E не входит. HTTP-smoke (`npm run smoke`):
`vite preview` + 10 проверок контракта `dist`, без браузера. Браузерные проверки —
`npm run smoke:browser` (`scripts/verify-dist.mjs`): 11 сценариев, включая вторую вкладку
(модалка у претендента, тишина у владельца). Когда появится Playwright — сценарии (7),
парные smoke-листу из корневого `README.md`:

1. Карта: 3 зоны, 15 тренажёров, игрок перед первым; клик по соседнему → 600 мс → модалка.
2. «Отмена»: индекс откатывается, статистика не пишется.
3. Раунд 8/2: «🎉 Отлично!», «Заработано: 80 ✓», `ml_stats.totalScore === 80`.
4. Провал (0 жизней): «💔 Игра окончена», «(не зачтено)», счёт не растёт.
5. «На карту» + F5: счёт и позиция сохранены, один `--current` тренажёр.
6. Вторая вкладка: «Игра уже запущена», консоль без ошибок приложения.
7. Смена карты: `−1` для новой карты и сохранённый счёт прежней.

Скрипт `npm run test:e2e` добавляется только вместе с установкой Playwright и
отдельным конфигом; в `npm test` он не входит.

## История

### 1.10.2 — синхронизация позиции, один звук, очередь сообщений, кэш статистики

`PlayerState.restore(index)` и синхронизация в `useMap.gameFinished` (A92/T86): при провале
`saveTrainerIndex` позиция берётся из хранилища, инвариант `UI === storage` проверяется в
новом сьюте `useMap.save-failure.test.tsx` (2 сценария — победа и проигрыш). Звук выхода
перенесён в `App.handleExitRequested` (A93/T87): `useGame.exit()` только сообщает о выходе,
два ✕ дают одну модалку и один `click` (`App.test.tsx` +1). Показ сообщений переведён на
очередь (A94/T88): `App.startup.test.tsx` +2 — «два `report()` → два показа» и «стартовая
ошибка хранилища + `busy`». `StatsService` кэширует статистику в экземпляре (A95/T89):
новый сьют `stats-service.cache.test.ts` (7) — одно чтение на геттеры и первый рендер
`StrictMode`, 0 чтений после записи, сброс кэша в режиме памяти, ошибка чтения не кэшируется.
`stats-service.migration.test.ts` +1 (сервис без репортёра), `player-state.test.ts` +1
(`restore`), `useMap.test.tsx` 12 → 11 (сценарий провала записи переехал в отдельный сьют).
Итог — **35 сьютов / 316 тестов**, coverage — **97.63 / 89.25** (пороги 80/60 зелёные).

### 1.10.1 — стартовая ошибка, выход через `ConfirmModal`, write-back миграции

Модуль `src/app/error-bus.ts` получил очередь сообщений до подписки (`test/app/error-bus.test.ts`, 5),
`StatsService` переведён на порт `ErrorReporter` из `core`. Добавлены `ConfirmModal.test.tsx` (5),
`App.startup.test.tsx` (3), `stats-service.migration.test.ts` (7); `App.test.tsx` +2 (выход),
`App.map-freshness.test.tsx` +1 (смена карты), `useMap.test.tsx` +1 (провал записи позиции),
`useGame.test.tsx` — тесты выхода без `confirm`, `stats-schema.test.ts` +1 (`onStep`),
`memory-repository.test.ts` 3 → 5 (сериализация), `Header.test.tsx` приведён к T52.
`App.test.tsx` переведён на общий `test/support/app-setup.tsx` и остаётся ≤ 200 строк.
Итог — **33 сьюта / 303 теста**, coverage — **97.57 / 89.19** (пороги 80/60 зелёные).

### 1.10.0 — бюджет сьютов и новые сценарии аудита

Фикстуры и драйверы вынесены в `test/support/`: `stats-fixtures.ts` (26 сценариев
`StatsService` + действия `reset`/`skip`/`memory`), `generator-fixtures.ts` (таблица
диапазонов вместо трёх длинных блоков), `app-drivers.ts` (шаги карта → раунд → ✕),
`session-channel.ts` (управляемая заглушка `BroadcastChannel`). `stats-service.test.ts`
317 → 199 строк (Prettier, `printWidth 120`), `generator.test.ts` 281 → 163, `session-model.test.ts` 213 → 195,
`App.test.tsx` 203 → 191; сценарии не удалялись. Новые сьюты/тесты: `App.map-freshness`
(2), шина ошибок и блокировка в `App` (2), «не зачтено» в `useResults` (3),
владелец/претендент/fallback/StrictMode в `useSessionLock` (10), порог `CONFIG.RATINGS`
(2), `console.info` миграций (2). Итог — **29 сьютов / 276 тестов**, coverage —
**97.36 / 88.79** (пороги 80/60 зелёные).

### 1.9.0 — тестовый двойник в `test/support`

`MemoryRepository` переехал из `src/data/memory-repository.ts` в
`test/support/memory-repository.ts`: в проде он не использовался, а в `coverage.include`
размывал `src/data/**`. Импорты обновлены в 5 сьютах. `SessionModel.recordCorrect` теперь
считает очки через `Scoring.calculateRoundScore` — число тестов не изменилось:
**28 сьютов / 261 тест**, coverage — **96.83 / 88.74** (пороги 80/60 зелёные).
`npm run lint` и `npm run format:check` добавлены в критерий.

### 1.8.4 — ассеты через `?url`

Изменился только `test/services/audio-service.test.ts`: ожидания — `AUDIO_URLS`
(9 тестов, без уменьшения числа проверок). `src/**` — только аудио
(`src/assets/audio/*`, `src/services/audio-service.ts`); остальные 27 сьютов / 252 теста —
0 правок. Итог — **28 сьютов / 261 тест**, `npx tsc --noEmit` — 0, coverage — **96.84/88.74**.

### 1.8.3 — этап 1: тесты на импортах

**158/158 в 12 сьютах.** 12 сьютов переведены на `.test.ts`, `eval`/`readSource`/
`test/ts-source.js` и копия `CONFIG` удалены, `allowJs: false`. Этап 18 добавил
RTL-сетап, 7 компонентных и 4 хуковых сьюта, 5 точечных юнит-сьютов `core`/`data`,
пороги покрытия 80/60 — итог **261 в 28 сьютах**.

### 1.8.2 — тесты красные по плану

Прод-код переехал в `src/`, тесты не менялись (TR-39/Z25). Сьюты читали `js/…`
через `readSource`/`eval`, поэтому 9 сьютов падали с `ENOENT`, а 43 теста
(`game-rules`, `generator`, `scoring`) оставались зелёными, потому что проверяли
копию логики. `allowJs: true`, `test/setup.js` с копией `CONFIG`, `test/ts-source.js`.

### 1.8.1 — статистика раунда

**156/156 в 12 сьютах.** Новый сьют `session-model` вызывал реальную модель через
`readSource` + `eval`; `CONFIG` брался из `setup.js`. На 1.8.0 сценарий 8/2 давал
`wrong = 10`, `total = 10` и «Идеально!» вместо 8/2/10 и «Отлично!». После фикса
`SessionModel` (`_correct`/`_wrong`, `total = correct + wrong`) — 156/156.

### 1.8.0 — миграция экранов на React

**141/141 в 11 сьютах.** Удалены 3 сьюта, читавшие `view/controller` через `eval`
(41 тест); UI-слой React тестами не покрывался (порт на `@testing-library/react` —
следующий этап). `map-layout` переехал из `js/view/` в `js/logic/` с правкой пути.

## Сквозная проверка 1.8.2

`npm run dev` + headless Chromium (CDP), 15 проверок / 9 сценариев — все зелёные
(карта, движение, модалки, раунд 8/2, провал, reload, вторая вкладка, миграция
`ml_stats` v2 → v3). Подробности — корневой `README.md`, § «Статус и smoke-тест».
