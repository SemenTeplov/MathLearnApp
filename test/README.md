# Тесты MathLingo

## Запуск

```bash
npm ci               # установка по package-lock.json
npm test             # vitest run: 28 сьютов, 261 тест
npm run test:watch   # watch-режим
npm run test:coverage# покрытие (v8) по группам + html-отчёт в coverage/
npm run typecheck    # tsc --noEmit (src/ + test/, включая .tsx)
npm run lint         # ESLint 10: src/, test/, scripts/ и конфиги
npm run format:check # Prettier: стиль без записи
npm run build        # tsc --noEmit && vite build → dist/ (ассеты проверяются отдельно)
npm run smoke        # vite preview + 10 HTTP-проверок dist
npm run smoke:browser# smoke + 10 браузерных проверок dist (headless Chromium)
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
`MemoryRepository`), `test/components/App.test.tsx` (10, интеграция на реальных хуках
и фейковом `Services`), `test/hooks/*` (32, `renderHook`).

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
│   └── memory-repository.ts       # тестовый двойник Repository (вне src/ и coverage)
├── core/                          # 12 файлов / 135 тестов
│   ├── config.test.ts             # CONFIG: версия 3, каталог, зоны, константы (6)
│   ├── errors.test.ts             # цепочка наследования и name (3)
│   ├── error-handler.test.ts      # handleError, глобальные обработчики (8)
│   ├── game-rules.test.ts         # checkAnswer, shouldEndGame, getRating (14)
│   ├── generator.test.ts          # ProblemGenerator: диапазоны, 4 варианта (15)
│   ├── scoring.test.ts            # calculateRoundScore, isRoundSuccessful (8)
│   ├── player-rules.test.ts       # getAction, normalizeIndex (14)
│   ├── player-state.test.ts       # moveTo, revert, commitWin (7)
│   ├── map-layout.test.ts         # шаг 100px, полосы, SVG-путь, точка (19)
│   ├── map-catalog.test.ts        # get / getDefault / has (9)
│   ├── session-model.test.ts      # счётчики, getResults, reset (15)
│   └── stats-schema.test.ts       # defaults, миграции 1→2→3 (17)
├── data/                          # 4 файла / 40 тестов
│   ├── stats-service.test.ts      # счёт/позиция, switchMap, ошибки (26)
│   ├── local-repository.test.ts   # round-trip, порча, квота, недоступность (8)
│   ├── repository.test.ts         # контракт «Not implemented» (3)
│   └── memory-repository.test.ts  # save/load/clear в памяти (3)
├── services/
│   └── audio-service.test.ts      # preload, play, ошибки (9)
├── components/                    # 7 файлов / 45 тестов
│   ├── App.test.tsx               # интеграция: карта → игра → результаты (10)
│   ├── GameScreen.test.tsx        # вопрос, 4 ответа, feedback, «+10» (10)
│   ├── MapScreen.test.tsx         # 15 тренажёров, зоны, модалка, transitionend (9)
│   ├── ResultsScreen.test.tsx     # оценка, карточки, кнопки (4)
│   ├── MapSelectionModal.test.tsx # карты из props, selected, выбор (5)
│   ├── Header.test.tsx            # счёт и кнопка карты (4)
│   └── ErrorModal.test.tsx        # текст, «OK», оверлей (3)
└── hooks/                         # 4 файла / 32 теста
    ├── useGame.test.tsx           # ответы, счёт, жизни, таймер, выход (10)
    ├── useMap.test.tsx            # движение, модалка, откат, запись (11)
    ├── useResults.test.tsx        # оценка, статистика только за победу (5)
    └── useSessionLock.test.tsx    # канал, одно сообщение, fallback (6)
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
- **Фейковый `Services`.** Собирается в каждом сьюте (общего `test/fixtures/` нет):
  `{ audio: { play: vi.fn() }, stats: new StatsService(new MemoryRepository()) }`.
  `AudioService`/`StatsService` в тестах не создаются в module scope.
- **`BroadcastChannel`.** В `setup.ts` — безопасная заглушка (ничего не рассылает).
  Управляемую (с перехватом `onmessage`/`close`) сьют ставит сам через `vi.stubGlobal`
  в `beforeEach`, а `vi.unstubAllGlobals()` — в `afterEach`.
- **Запрещено.** `eval`, `new Function`, `readSource`, `fs.readFileSync`, `require`,
  копии `CONFIG`/логики в тестах, `.only`/`.skip` без объяснения, снимки всего DOM,
  проверка приватных полей вместо публичного API. Файл сьюта — не больше 200 строк.

## Покрытие (1.9.0)

`npm run test:coverage`, срез 1.9.0 — 28 сьютов, 261 тест:

| Группа | Stmts | Branch | Funcs | Lines | Порог |
|---|---|---|---|---|---|
| `src/core/**` | 99.32 | 90.44 | 98.61 | 99.63 | 80 |
| `src/data/**` | 100 | 100 | 100 | 100 | 80 |
| `src/services/**` | 100 | 100 | 100 | 100 | 80 |
| `src/components/**` | 93.44 | 87.75 | 100 | 98.14 | 60 |
| `src/hooks/**` | 95.21 | 81.92 | 97.61 | 98.23 | 60 |
| `src/App.tsx` | 88.37 | 100 | 83.33 | 88.37 | 60 |
| **Итого** | **96.83** | **88.74** | **97.68** | **98.37** | — |

Baseline 1.8.3 (до этапа 18) — 46.3% statements / 41.39% branches, потому что в отчёт
попадали только загруженные модули. После `coverage.include` итог считается по всем
слоям. `src/core/types.ts` в отчёте — `0/0` (только типы, исполняемых инструкций нет);
это норма, модуль **не исключён** из `include` (D42).

Пороги (`vitest.config.ts`, `coverage.thresholds`) не понижаются: недостача добирается
сценариями. `src/app/**` (composition root) и `src/main.tsx` намеренно вне `include`.

## E2E — backlog

Playwright **не установлен**, в `npm test` E2E не входит. В 1.9.0 добавлен HTTP-smoke
(`npm run smoke`): `vite preview` + 10 проверок контракта `dist`, без браузера. Браузерные
проверки — `npm run smoke:browser` (`scripts/verify-dist.mjs`). Когда появится Playwright —
сценарии (7), парные smoke-листу из корневого `README.md`:

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
