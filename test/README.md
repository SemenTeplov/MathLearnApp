# Тесты MathLingo

## Запуск

```bash
npm test             # vitest run: 12 сьютов, 158 тестов
npm run test:watch   # watch-режим
npm run test:coverage# покрытие (v8) + html-отчёт в coverage/
npm run typecheck    # tsc --noEmit (src/ + test/, включая .tsx)
```

Раннер — **vitest** (не Jest). Конфигурация — `vitest.config.ts`:
`environment: 'jsdom'`, `globals: true`, `setupFiles: ['./test/setup.ts']`.

## 1.8.3 — тесты на реальных импортах

Этап 1.8.2 перевёл прод-код на ES-модули в `src/`, а тесты оставил на `readSource` +
`eval` со старыми путями `js/…`. После удаления `js/` прогон был красным:
**9 сьютов failed / 3 passed, 43 теста passed**, 113 тестов не запускались.

В 1.8.3 тесты переписаны:

| Было | Стало |
|---|---|
| `test/**/*.test.js` | `test/{core,data,services}/*.test.ts` |
| `readSource()` + `eval` | `import` из `src/core` / `src/data` / `src/services` |
| `test/ts-source.js` | удалён |
| копия `CONFIG` в `test/setup.js` | `test/setup.ts` без `CONFIG`; `import { CONFIG }` |
| копии `GameRules` / `ProblemGenerator` / `Scoring` | настоящие модули |
| `StatsService.init(repo)` | `new StatsService(new MemoryRepository())` |
| `allowJs: true` | `allowJs: false` |

Итог: **158/158 в 12 сьютах**, `npx tsc --noEmit` — **0**, `eval`/`readSource` — **0**.
Сьют `test/core/session-model.test.ts` (15 тестов) проверяет реальную `SessionModel`;
`test/data/stats-service.test.ts` — реальный сервис через `MemoryRepository`.

## Структура

```
test/
├── setup.ts                       # мок Audio; CONFIG здесь нет
├── core/
│   ├── config.test.ts             # CONFIG: версия 3, каталог, зоны, константы (6)
│   ├── game-rules.test.ts         # checkAnswer, shouldEndGame, getRating (14)
│   ├── generator.test.ts          # ProblemGenerator: диапазоны, 4 варианта (15)
│   ├── scoring.test.ts            # calculateRoundScore, isRoundSuccessful (8)
│   ├── player-rules.test.ts       # getAction, normalizeIndex (14)
│   ├── player-state.test.ts       # moveTo, revert, commitWin (7)
│   ├── map-layout.test.ts         # шаг 100px, полосы, SVG-путь, точка (19)
│   ├── map-catalog.test.ts        # get / getDefault / has (9)
│   ├── session-model.test.ts      # счётчики, getResults, reset (15)
│   └── stats-schema.test.ts       # defaults, миграции 1→2→3 (17)
├── data/
│   └── stats-service.test.ts      # счёт/позиция, switchMap, ошибки (26)
└── services/
    └── audio-service.test.ts      # preload, play, обработка ошибок (8)
```

## Покрытие (baseline 1.8.3)

`npm run test:coverage` — 97.12% statements / 90.57% branches для **загруженных**
модулей. `coverage.include` пока не расширен на все файлы слоя, поэтому
`error-handler.ts`, `local-repository.ts` и `repository.ts` в отчёт не входят.

| Модуль | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| `core/config.ts` | 100 | 100 | 100 | 100 |
| `core/errors.ts` | 80 | 100 | 80 | 80 |
| `core/game-rules.ts` | 100 | 100 | 100 | 100 |
| `core/generator.ts` | 100 | 100 | 100 | 100 |
| `core/map-catalog.ts` | 100 | 83.33 | 100 | 100 |
| `core/map-layout.ts` | 100 | 88.88 | 100 | 100 |
| `core/player-rules.ts` | 100 | 100 | 100 | 100 |
| `core/player-state.ts` | 100 | 100 | 100 | 100 |
| `core/scoring.ts` | 100 | 100 | 100 | 100 |
| `core/session-model.ts` | 93.1 | 100 | 86.66 | 93.1 |
| `core/stats-schema.ts` | 97.91 | 80 | 100 | 100 |
| `data/memory-repository.ts` | 80 | 100 | 75 | 80 |
| `data/repository.ts` | 0 | 100 | 0 | 0 |
| `data/stats-service.ts` | 100 | 100 | 100 | 100 |
| `services/audio-service.ts` | 94.44 | 75 | 100 | 94.44 |
| **Итого** | **97.12** | **90.57** | **92.13** | **97.18** |

Целевые пороги 1.8.3: **80%** для `core`/`data`/`services`, **60–70%** для UI.
За 100% не гоняемся.

## Что дальше

- **React-тесты:** `@testing-library/react`, `@testing-library/user-event`,
  `@testing-library/jest-dom`; 7 компонентных сьютов (`App`, `GameScreen`, `MapScreen`,
  `ResultsScreen`, `MapSelectionModal`, `Header`, `ErrorModal`).
- **Хуки:** `renderHook` для `useGame`, `useMap`, `useResults`, `useSessionLock`
  (mock `BroadcastChannel`).
- **Coverage:** `include` на все `src/core|data|services|components|hooks` + `App.tsx`,
  пороги по группам; точечные тесты `error-handler`, `local-repository`, `repository`.
- **E2E (опционально/позже):** Playwright, 5–7 критических сценариев
  (движение, раунд, победа/провал, reload, вторая вкладка).

Подробности — `.gigacode/specs/spec_v1_8_3.md` и `.gigacode/rulles/rules_v_1_8_3.md`.

## История

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
