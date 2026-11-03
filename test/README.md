# Тесты MathLingo

## Запуск

```bash
npm test           # vitest run: 156 тестов в 12 сьютах
npm run test:watch # watch-режим
npm run typecheck  # tsc --noEmit (src/ + test/, включая .tsx)
```

Раннер — **vitest** (не Jest). Конфигурация — `vitest.config.ts`: `environment: 'jsdom'`,
`globals: true`, `setupFiles: ['./test/setup.js']`.

## 1.8.2 — тесты красные по плану

Этап 1.8.2 перевёл код с 19 классических `<script>` на ES-модули в `src/`, а тесты
**не менялись** (TR-39/Z25). Сьюты читают исходники по старым путям `./js/…` через
`readSource` + `eval`, поэтому фактический прогон такой:

| Группа | Сьюты | Тесты | Статус |
|---|---|---|---|
| `logic/scoring`, `logic/game-rules`, `logic/generator` | 3 | 43 | ✅ зелёные (логика продублирована в тесте) |
| `model/config`, `model/map-catalog`, `model/session-model`, `model/stats-schema`, `logic/player-rules`, `logic/player-state`, `map/map-layout`, `service/audio-service`, `service/stats-service` | 9 | 113 | ❌ красные: `ENOENT: no such file or directory, open './js/…'` |

Итог: **9 сьютов failed / 3 passed, 43 теста passed** (113 тестов не запускаются, потому
что падает загрузка модуля). Красный список — `/tmp/ml-1.8.2-red.txt`, полный отчёт —
`.gigacode/tasks/TASKS.md` (этап 17, 17.9).

Переписывание тестов на `import` и `allowJs: false` — **этап 3**; до него `npm test`
красный по плану, а `tsc --noEmit` — 0. `test/**`, `test/setup.js` и `test/ts-source.js`
в 1.8.2 не изменялись (`git diff --name-only` не содержит `test/**`).

## Как тесты читают исходники

`test/ts-source.js` экспортирует `readSource(relPath)`: читает файл от корня проекта и для
`.ts` выполняет `typescript.transpileModule` (`target: ES2020`, `module: None`). Это нужно,
потому что тесты загружают код через классический `eval` в глобальную область, а не через
`import`. Четыре сьюта (`model/config`, `model/session-model`, `model/stats-schema`,
`service/stats-service`) используют `readSource`; остальные читают файл напрямую через
`fs.readFileSync` или описывают проверяемую логику прямо в тесте. После 1.8.2 все эти
пути ведут в удалённый `js/` — отсюда красный прогон.

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

Пути в таблице — целевые (1.8.2); тесты пока читают старые `js/…` и красные.

| Модуль 1.8.2 | Тестов | Что тестируется |
|--------|--------|-----------------|
| `core/scoring.ts` | 8 | `calculateRoundScore`, `isRoundSuccessful` |
| `core/game-rules.ts` | 12 | `checkAnswer`, `shouldEndGame`, `getRating` |
| `core/generator.ts` | 23 | `constructor`, `setDifficulty`, `rnd`, `generate`, `easy`, `medium`, `hard`, `build` |
| `core/player-rules.ts` | 13 | `getAction`, `normalizeIndex`, константы |
| `core/player-state.ts` | 7 | `moveTo`, `isReplay`, `revert`, `commitWin`, цепочки ходов |
| `core/config.ts` | 6 | `VERSION: 3`, `DEFAULT_MAP`, `MAPS`, `MAPS[0].zones === ZONES`, `min` в оценках, неизменность остальных полей, паритет с `test/setup.js` |
| `core/map-catalog.ts` | 9 | `get`, `getDefault`, `has`, неизвестный/`undefined` id → `math`, фолбэк на первую карту |
| `core/session-model.ts` | 15 | `recordCorrect`, `recordIncorrect`, `getResults` (`correct`/`wrong`/`total`), оценка `GameRules.getRating`, `reset()` |
| `core/stats-schema.ts` | 16 | `emptyMap`, `defaults`, `entry`, `migrate` (1 → 3, 2 → 3, версия 9), `ensureMaps`, идемпотентность |
| `services/audio-service.ts` | 5 | `preload`, `play`, обработка ошибок |
| `data/stats-service.ts` | 24 | дефолты v3, загрузка и миграции, счёт и позиция текущей карты, `switchMap` (та же / неизвестная / другая), `reset`, ошибки |
| `core/map-layout.ts` | 18 | шаг 100px, полосы зон, чередование X, `index` тренажёра, `buildRoadPath`, `getPlayerPoint` |
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

## Сквозная проверка 1.8.2

`npm run dev` + headless Chromium (CDP), 15 проверок / 9 сценариев — все зелёные
(подробности и таблица — в корневом `README.md`, § «Статус и smoke-тест»):

- карта: 3 зоны, 15 тренажёров, счёт 0, игрок 🚶, CSS 52px, один вход `/src/main.tsx`;
- дальний клик — no-op, соседний — движение 600 мс и модалка по приходу;
- старт игры: 10 вопросов, 3 жизни; 8/2 → «Отлично!», «Правильных: 8», «80 ✓», `Stats` v3;
- 3 ошибки → «Игра окончена», очки не зачтены; «На карту» → счёт 80 и commit;
- 🌍: текущая карта выделена, та же карта — no-op; F5 — счёт и позиция на месте;
- вторая вкладка → модалка «Игра уже запущена»; консоль без ошибок приложения;
- миграция `ml_stats` v2 → v3: счёт 42 и позиция 3 читаются, запись становится v3 при
  следующем сохранении (`version: 3`, `totalScore: 142`, `currentTrainerIndex: 4`).

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
