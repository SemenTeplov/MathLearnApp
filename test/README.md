# Тесты MathLingo

## Запуск

```bash
npm test           # vitest run: 156 тестов в 12 сьютах
npm run test:watch # watch-режим
npm run typecheck  # tsc --noEmit (исходники js/ и src/, включая .tsx)
```

Раннер — **vitest** (не Jest). Конфигурация — `vitest.config.ts`: `environment: 'jsdom'`,
`globals: true`, `setupFiles: ['./test/setup.js']`.

## Как тесты читают исходники

`test/ts-source.js` экспортирует `readSource(relPath)`: читает файл от корня проекта и для
`.ts` выполняет `typescript.transpileModule` (`target: ES2020`, `module: None`). Это нужно,
потому что тесты загружают код через классический `eval` в глобальную область, а не через
`import`. Четыре сьюта (`model/config`, `model/session-model`, `model/stats-schema`,
`service/stats-service`) используют `readSource`; остальные описывают проверяемую логику
прямо в тесте.

## Структура

```
test/
├── setup.js                          # Моки (Audio) и глобальный CONFIG (VERSION 3, MAPS, DEFAULT_MAP, min в оценках)
├── ts-source.js                      # readSource(): чтение и transpileModule для .ts
├── logic/
│   ├── scoring.test.js               # Расчёт очков (8 тестов)
│   ├── game-rules.test.js            # Правила игры (12 тестов)
│   ├── generator.test.js             # Генератор задач (23 теста)
│   ├── player-rules.test.js          # Правила кликов и индекса (13 тестов)
│   └── player-state.test.js          # Машина состояний позиции (7 тестов)
├── model/
│   ├── config.test.js                # Конфиг 1.5.0–1.6.0 и синхронизация с setup.js (6 тестов)
│   ├── map-catalog.test.js           # Каталог карт: get / getDefault / has (9 тестов)
│   ├── session-model.test.js         # Счётчики ответов, getResults, total, reset (15 тестов)
│   └── stats-schema.test.js          # Stats v3: defaults, миграции, ensureMaps (16 тестов)
├── service/
│   ├── audio-service.test.js         # Звуковой сервис (5 тестов)
│   └── stats-service.test.js         # Статистика по картам, switchMap, миграция (24 теста)
└── map/
    └── map-layout.test.js            # Геометрия карты, путь и точка игрока (18 тестов)
```

## Покрытие

| Модуль | Тестов | Что тестируется |
|--------|--------|-----------------|
| `logic/scoring.ts` | 8 | `calculateRoundScore`, `isRoundSuccessful` |
| `logic/game-rules.ts` | 12 | `checkAnswer`, `shouldEndGame`, `getRating` |
| `logic/generator.ts` | 23 | `constructor`, `setDifficulty`, `rnd`, `generate`, `easy`, `medium`, `hard`, `build` |
| `logic/player-rules.js` | 13 | `getAction`, `normalizeIndex`, константы |
| `logic/player-state.js` | 7 | `moveTo`, `isReplay`, `revert`, `commitWin`, цепочки ходов |
| `model/config.ts` | 6 | `VERSION: 3`, `DEFAULT_MAP`, `MAPS`, `MAPS[0].zones === ZONES`, `min` в оценках, неизменность остальных полей, паритет с `test/setup.js` |
| `model/map-catalog.js` | 9 | `get`, `getDefault`, `has`, неизвестный/`undefined` id → `math`, фолбэк на первую карту |
| `model/session-model.ts` | 15 | `recordCorrect`, `recordIncorrect`, `getResults` (`correct`/`wrong`/`total`), оценка `GameRules.getRating`, `reset()` |
| `model/stats-schema.js` | 16 | `emptyMap`, `defaults`, `entry`, `migrate` (1 → 3, 2 → 3, версия 9), `ensureMaps`, идемпотентность |
| `service/audio-service.js` | 5 | `preload`, `play`, обработка ошибок |
| `service/stats-service.ts` | 24 | дефолты v3, загрузка и миграции, счёт и позиция текущей карты, `switchMap` (та же / неизвестная / другая), `reset`, ошибки |
| `logic/map-layout.js` | 18 | шаг 100px, полосы зон, чередование X, `index` тренажёра, `buildRoadPath`, `getPlayerPoint` |
| **Итого** | **156** | |

## 1.8.1 — статистика раунда

- **156/156 в 12 сьютах.** Новый сьют `model/session-model.test.js` (15 тестов) вызывает
  реальную `SessionModel` через `readSource` + `eval`; `CONFIG` берётся из `test/setup.js`,
  логика модели в тест не скопирована.
- Первый прогон на 1.8.0 — **красный**: 14 из 15 тестов падали, сценарий 8/2 давал
  `wrong = 10` вместо 2 (`correct`/`wrong` собирались из индекса вопроса, `total` был всегда
  `TOTAL_QUESTIONS`). Зелёным оставался только тест `reset`, не проверяющий счётчики.
- После фикса `SessionModel` (`_correct`/`_wrong`, инкременты в `recordCorrect` /
  `recordIncorrect`, `reset()` обнуляет счётчики, `total = correct + wrong`) — **156/156**;
  изменены только `js/model/session-model.ts` и новый сьют, остальные 141 тест — без правок.
- Оценка (`GameRules.getRating`) и `CONFIG` не менялись: 8/2 → 80% → «Отлично!», 10/10 →
  «Идеально!», 0/3 при `lives = 0` → «Игра окончена».

## 1.8.0 — миграция экранов на React

- **141/141 в 11 сьютах.** Удалены три сьюта, которые читали удалённые `view/controller`
  через `eval`: `map/map-view.test.js` (13), `map/map-controller.test.js` (19),
  `map/global-map-controller.test.js` (9) — всего **41** тест. Решение согласовано с
  владельцем: UI-слой React тестами на этом этапе не покрывается (порт на
  `@testing-library/react` — Этап 5).
- **123 теста логики сохранены полностью** (generator, scoring, game-rules, player-rules,
  player-state, config, map-catalog, stats-schema, stats-service, audio-service).
- `map-layout` переехал из `js/view/` в `js/logic/` (чистая геометрия — не View); в
  `test/map/map-layout.test.js` изменён **только путь** — все 18 тестов те же.
- React-слой (`src/App.tsx`, `src/components/**`, `src/hooks/**`, `main.tsx`) проверяется
  `tsc --noEmit` (0 ошибок) и сквозным прогоном в браузере; юнит-тестов у него нет.

## Сквозная проверка 1.8.0

Прогон `npm run dev` в headless Chromium (CDP), 16 сценариев PLAN.md 1.8.0:

- карта: 3 зоны, 15 тренажёров, шаг 100px, один `svg.map-road` и один `path`, игрок 🚶,
  классы `--near/--far`, счёт 🏆; клик по соседнему → движение 600 мс → модалка по приходу;
- «Отмена» → откат без записи в `ml_stats`; дальний тренажёр → no-op; текущий → модалка;
- старт игры с выбранной сложностью; верный и неверный ответ (классы `correct`/`wrong`,
  feedback, «+10», жизни, счёт); «Продолжить» → счётчик и прогресс;
- победа → результаты (10/10, оценка, «Заработано … ✓», звук `win`), провал → «💔 Игра
  окончена»; «Играть снова» → новый раунд; ✕ → `confirm`, откат и сгорание очков;
- «На карту» → карта со счётом и позицией по правилам commit/revert; перезагрузка →
  позиция и счёт на месте; 🌍 → список карт, та же карта — no-op, «Закрыть»;
  смена карты → позиция `−1`, счёт прежней сохранён; resize → пересчёт геометрии;
  вторая вкладка → React-модалка «Игра уже запущена»; консоль без ошибок.
