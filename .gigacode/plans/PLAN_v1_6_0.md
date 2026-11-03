# План — MathLingo

**Версия:** 1.6.0  
**Статус:** Этап 13 «TypeScript без React» — 📝 план составлен, реализация не начата  
**Предыдущие этапы:** 1–12 (1.2.0–1.5.0) — ✅ реализованы; базовая линия 1.5.0 — **182 теста в 14 сьютах**  
**Создан на основе:** RULES.md 1.6.0 (`rules_v_1_6_0.md`) и SPEC.md 1.6.0 (`spec_v1_6_0.md`)  
**Предыдущая версия плана:** 1.5.0 (`rules_v_1_5_0.md`, `spec_v1_5_0.md`) — реализована  
**Тип изменения:** внутренний рефакторинг — **типизация существующего JS**. Поведение, UI, CSS, звук и Storage **не меняются**.

---

## ⚠️ Три решения владельца, на которых стоит план

| # | Решение | Следствие |
|---|---------|-----------|
| 1 | **Объём — файлы из TR-2/TR-3** (13) + `generator.ts` + `types.ts` = **15 `.ts`** | `map-catalog.js`, `stats-schema.js`, `player-rules.js`, `player-state.js`, `audio-service.js` **остаются `.js`** → A32 выполнен **частично** (14 из 19 файлов слоёв). Это осознанный долг, а не пропуск |
| 2 | **`types.ts` — ES-модуль с `export {}` + `declare global`** | Интерфейсы объявлены глобально и видны всем файлам; сам `types.ts` **не подключается** в `index.html` (иначе браузер упадёт на `export {}`) |
| 3 | **Тестовая база чинится в рамках 1.6.0** | `vitest.config.ts` получает `setupFiles`, тесты — `vi.*` вместо `jest.*`, eval-загрузка `.ts` — через TypeScript API. Новых тестов **не пишем** |

Без решения №2 буквальный `export` интерфейсов невозможен: приложение грузит **классические `<script>`** без модулей, а top-level `import/export` сделал бы файл модулем и лишил бы `CONFIG`, `StatsService` и остальные глобалы. Переход на ES-модули — это этап 2–3 (React), он запрещён Z15/A35 сейчас.

---

## 🎯 Цель

**Типизировать** существующий JS-код **без** изменения архитектуры, поведения и внешнего вида:

- **`js/model/types.ts`** — все интерфейсы проекта в одном файле (TR-1, A33);
- **14 файлов** Model / Logic / Storage / Service / Errors → `.ts` с реальными аннотациями (TR-2, TR-3, A32);
- **View, Controller и `script.js`** остаются `.js` и **не трогаются** (TR-4, A35, Z15);
- **`tsconfig.json`** — строгий режим, `allowJs`, `noEmit`; `npx tsc --noEmit` — **0 ошибок** (TR-5, A34, T26, T28);
- **игра работает как раньше** через `npm run dev` (TR-6).

Никаких React, новых фич, новых экранов, изменения логики и форматов данных.

---

## 📐 Что именно меняет 1.6.0

| Источник | Требование | Следствие для плана |
|----------|-----------|---------------------|
| **TR-1 / A33** | Один `types.ts` со всеми интерфейсами; 7 обязательных типов; без дублей с JSDoc | Новый `js/model/types.ts` (`export {}` + `declare global`): `Problem`, `GameResult`, `MapData`, `Stats`, `SessionState`, `ErrorInfo`, `Rating` + `Zone`, `GameMap`, `Config`, `Difficulty` |
| **TR-2** | «Простые» файлы → `.ts` | `model/config.ts`, `logic/scoring.ts`, `logic/game-rules.ts` |
| **TR-3** | «Сложные» файлы → `.ts` | `model/session-model.ts`, `model/game-model.ts`, `storage/*.ts` (4), `service/stats-service.ts`, `service/session-service.ts`, `errors/*.ts` (2) |
| **TR-4 / A35** | View и Controller — **`.js`**, не трогать | `js/view/**`, `js/controller/**`, `js/script.js` — **0 правок** (кроме строк подключения в `index.html`) |
| **TR-5 / T26** | `allowJs: true`, `strict: true`, `noEmit: true` | `tsconfig.json` уже содержит эти опции, но `include: ["src"]` — **программа пустая**; меняем на `["js"]` |
| **TR-6** | Игра работает как раньше | Запуск — **только `npm run dev`** (Vite отдаёт `.ts` как JS); прямое открытие `index.html` и `python3 -m http.server` больше не работают |
| **T27** | Все публичные функции/классы типизированы; `unknown` вместо `any` | Аннотации в сигнатурах; `any` — **0** (допустимо только с обоснованием в комментарии) |
| **T28** | `npx tsc --noEmit` перед коммитом | Скрипт `npm run typecheck`; проверка на каждом шаге этапа |
| **Z15 / Z16** | Не дублировать типы JSDoc + TS; `any` в публичных API запрещён | JSDoc остаётся **описанием** (T7), но без `@param {Type}` / `@returns {Type}` / `@type` — типы живут только в TS-сигнатурах |

---

## ✅ Что НЕ меняется

| Область | Факт |
|---------|------|
| Поведение и UI | 10 сквозных сценариев 1.5.0 (карта, 🌍, модалка сложности, откат, повторная игра, результаты, перезагрузка) — без изменений |
| View и Controller | `js/view/**` (9 файлов), `js/controller/**` (6 файлов), `js/script.js` — **не трогаются**; меняются только `src` в `index.html` |
| `js/view/map-view.js` | **199 строк** при лимите 200 → файл не меняется вообще |
| `js/controller/map-controller.js` | **198 строк** → не меняется |
| 5 файлов слоёв | `model/map-catalog.js` (47), `model/stats-schema.js` (145), `logic/player-rules.js` (48), `logic/player-state.js` (62), `service/audio-service.js` (61) — остаются `.js` (решение владельца) |
| CSS | Ни один файл `css/**` не меняется |
| Звук | `AudioService`, вызовы `play('click'/'win'/'lose')` — без изменений |
| Storage | Ключ `ml_stats`, `LocalStorageRepository`, `Repository` API, миграции `Stats` v1→v2→v3 — без изменений |
| Игровая логика | Пороги оценок, генератор, `PlayerRules`/`PlayerState`, сгорание очков — без изменений (типизация не рефакторит) |
| Формат данных | `Stats` v3, `CONFIG.MAPS`, `DEFAULT_MAP` — те же; единственное дополнение — `Rating.min` (см. «Данные») |
| Тесты | 182 теста в 14 сьютах — **тот же набор**, новых нет |
| Порядок скриптов | Errors → Audio → Model → Storage → Service → Logic → View → Controller → `script.js` — сохраняется |

---

## 📎 Исходное состояние (проверено перед составлением плана)

| Проверка | Факт | Вывод |
|----------|------|-------|
| `tsconfig.json` | 15 строк, все опции T26 на месте, но `"include": ["src"]`; каталога `src/` **нет** | Программа `tsc` **пустая** — «зелёная» проверка ничего не проверяет |
| `node_modules/typescript` | отсутствует; `package.json` не содержит `typescript` | T28 сейчас **невыполним**; `npm run build` падает на `tsc` |
| `package.json` | `vite` не в `devDependencies` (стоит транзитивно от `vitest`), `build: "tsc && vite build"` | Нужно закрепить `typescript` и `vite` явно |
| `npm test` | `vitest run`; `vitest.config.ts` **без** `setupFiles`; `test/setup.js` использует `jest.fn` | Фактически: **100 прошло / 53 упало**, 2 сьюта не стартуют (7 файлов красные) |
| `jest.config.js`, README, GIGACODE.md | описывают **Jest**, которого нет в зависимостях | Дрейф документации — исправляется в 13.9 |
| Объявленные тесты | **182** (`test(`/`it(`) в 14 файлах | Ориентир критерия 78: не меньше 182 |
| `js/` | **34 файла, 2543 строки**; максимум — `map-view.js` 199, `map-controller.js` 198 | Лимит 200 соблюдён и не должен нарушиться |
| Файлы к переводу (TR-2/TR-3) | **14 файлов, 874 строки** (+ `types.js` 64 → **938** вместе с типами) | Объём этапа: ~940 строк типизации |
| 5 файлов вне области | `map-catalog` 47, `stats-schema` 145, `player-rules` 48, `player-state` 62, `audio-service` 61 = **363 строки** | Остаются `.js`; `checkJs` не включаем |
| Vite dev и `.ts` | Проверено на Vite 8.3.5: `GET /a.ts` → `Content-Type: text/javascript`, тело **без типов** | Классический `<script src="*.ts">` работает в dev — загрузку модулей вводить не нужно |
| Vite build и `.ts` | Проверено: `vite build` пишет `<script src="/a.ts">` и **не эмитит** файл; предупреждение «can't be bundled without type="module"» | Прод-сборка classic-скриптов невозможна (как и до 1.6.0: `tsc` не установлен) |
| `tsc` 6.0.3 и T26 | `moduleResolution: "Node"` → **TS5107** (deprecated в TS 6) | Версию TypeScript фиксируем `~5.9`, иначе буквальный T26 не компилируется |
| `types.ts` как модуль | Проверено: `export {}` + `declare global` + соседние JS-глобалы (`StatsSchema` из `.js`) → `tsc --noEmit` = **0 ошибок** | Решение №2 работоспособно; конфликтов имён `Config`/`Zone`/`Stats`/`Rating`/`MapData`/`Problem` с `lib.dom` нет |
| Ремонт harness | Проверено на копии проекта: `setupFiles` → 177/182; `jest.`→`vi.` и `global.AudioService` → **182/182** | Критерий 78 достижим малой правкой (13.8) |

### Чего не хватает в 1.5.0

1. **TS-программа пустая** (`include: ["src"]`) — проверки типов фактически нет.
2. **TypeScript не установлен** — T28 невыполним, `npm run build` падает.
3. **Типы только в JSDoc** — `@typedef` в `model/types.js`; компилятор их не проверяет, дублирование невозможно запретить.
4. **Тестовая база красная** — `setupFiles` не подключён, тесты написаны под Jest API.
5. **Документация описывает Jest и «отсутствие сборки»** — расходится с `vitest` и `vite`.

---

## ⚠️ Отклонения от буквы SPEC/RULES и почему они вынужденные

| Требование | Почему буквально невозможно | Как решаем |
|-----------|------------------------------|-----------|
| **TR-1 / A33**: типы «экспортируются через `export`» | `export` делает файл модулем; глобалы (`CONFIG`, `StatsService`, `Repository`…) перестают быть видны остальным классическим скриптам → игра падает | `types.ts` — модуль (`export {}`) с `declare global`: формально внешний модуль, интерфейсы глобальны. Зафиксировано владельцем (решение №2) |
| **T26**: `"include": ["src"]` | В проекте нет `src/`; с этим значением `tsc` не видит ни одного файла (ложно-зелёный) | `"include": ["js"]`. Возврат к `src` — только вместе с переездом дерева (этап 2–3) |
| **T26**: `moduleResolution: "Node"` | В TypeScript 6 это ошибка **TS5107** | `typescript` фиксируется `~5.9.3`; при обновлении до 6.x — `"Bundler"` (отдельное решение) |
| **A32**: типизированы Model, Logic, Storage, Service, Errors | Буквальный список TR-2/TR-3 не содержит `map-catalog`, `stats-schema`, `player-rules`, `player-state`, `audio-service` | 14 файлов типизированы; 5 остаются `.js` — **долг**, вынесен в «Вне области» |
| **TR-2 / TR-3**: `logic/generator.js` | Файл назван в «Что типизируется» (Logic: `generator`, `scoring`, `game-rules`), но **отсутствует в обеих таблицах** TR-2/TR-3 — внутреннее противоречие SPEC | Считаем пропуском в таблицах: `generator.ts` типизируется (сложный файл, как TR-3). Иначе Logic был бы типизирован на 2 из 5 файлов |
| **TR-6**: игра работает | Браузер не исполняет TypeScript; `vite build` не бандлит classic-скрипты | Работает `npm run dev` (Vite транспилирует на лету); прод-сборка — этап 2–3 |
| **Z15**: нет дублирования JSDoc + TS | JSDoc-типы уже есть во всех файлах | JSDoc остаётся описанием, `@param {…}`/`@returns {…}`/`@type` **удаляются**; типы — только в TS-сигнатурах |
| **TR-1**: тип `MapData` | В коде 1.5.0 он называется `MapStats` | Переименовываем в `MapData` (2 JSDoc-ссылки в `stats-schema.js` + `types.ts`); `MapStats` не остаётся (Z16) |

---

## 🏗️ Архитектура — дельта к 1.5.0

Слои и имена файлов **сохраняются**; меняется расширение и появление типов. Пометки: **[TS]** — переименован в `.ts`, **[NEW]** — новый файл, **[.js]** — остаётся как есть.

```
index.html
  ├─ <script src="js/errors/custom-errors.ts">      [TS]  классический скрипт
  ├─ <script src="js/model/config.ts">              [TS]
  ├─ <script src="js/model/map-catalog.js">         [.js] вне области 1.6.0
  ├─ <script src="js/model/stats-schema.js">        [.js] вне области 1.6.0
  ├─ <script src="js/storage/repository.ts">        [TS]
  ├─ <script src="js/service/stats-service.ts">     [TS]
  ├─ <script src="js/logic/generator.ts">           [TS]
  ├─ <script src="js/view/map-view.js">             [.js] без изменений
  └─ <script src="js/script.js">                    [.js] без изменений
```

`js/model/types.ts` **[NEW]** в `index.html` **не подключается**: это единственный модуль проекта, он нужен только `tsc` (входит в программу через `include: ["js"]`).

### Слой Model

| Файл | Статус | Содержание |
|------|--------|-----------|
| `model/types.ts` | **[NEW]** | `export {}` + `declare global`: все интерфейсы и `Difficulty`; без кода, без подключения в HTML |
| `model/config.ts` | **[TS]** | `const ZONES: Zone[]`, `const MAPS: GameMap[]`, `const CONFIG: Config`; `RATINGS`/`GAMEOVER` получают `min` |
| `model/session-model.ts` | **[TS]** | `class SessionModel`: приватные поля, геттеры, сеттеры, `reset()`, `advanceQuestion()`, `recordCorrect()`, `recordIncorrect()`, `getResults(): GameResult` |
| `model/game-model.ts` | **[TS]** | `class GameModel`: `_totalScore`, `_version`, `toJSON()/fromJSON()` — **legacy v2**, не `Stats` v3 |
| `model/map-catalog.js` | **[.js]** | Без изменений кода (2 JSDoc-ссылки `MapStats` → `MapData`) |
| `model/stats-schema.js` | **[.js]** | Без изменений кода (2 JSDoc-ссылки `MapStats` → `MapData`) |

### Слой Logic

| Файл | Статус | Содержание |
|------|--------|-----------|
| `logic/generator.ts` | **[TS]** | `class ProblemGenerator`: `difficulty: Difficulty`, `setDifficulty`, `rnd`, `generate/easy/medium/hard`, `build(): Problem` |
| `logic/scoring.ts` | **[TS]** | `Scoring.calculateRoundScore(n: number): number`, `isRoundSuccessful(lives: number, completed: boolean): boolean` |
| `logic/game-rules.ts` | **[TS]** | `checkAnswer`, `shouldEndGame(session: SessionModel)`, `getRating(results: GameResult): Rating` |
| `logic/player-rules.js` | **[.js]** | Без изменений |
| `logic/player-state.js` | **[.js]** | Без изменений |

### Слой Storage / Service / Errors

| Файл | Статус | Содержание |
|------|--------|-----------|
| `storage/repository.ts` | **[TS]** | `class Repository`: `save(data: unknown): void`, `load(): unknown`, `clear(): void`; **не** `abstract` |
| `storage/local-repository.ts` | **[TS]** | `class LocalStorageRepository`: `_key`, `save/load/clear`, сужение `catch (e: unknown)` |
| `storage/memory-repository.ts` | **[TS]** | `class MemoryRepository`: `_data: unknown` |
| `storage/session-repository.ts` | **[TS]** | `class SessionRepository`: no-op-реализация |
| `service/stats-service.ts` | **[TS]** | `StatsService`: `_repo: Repository \| null`, `load(): Stats`, `getCurrentMap()`, `getTotalScore()`, `updateAfterRound()`, `getTrainerIndex()`, `saveTrainerIndex()`, `switchMap(): boolean`, `reset()` |
| `service/session-service.ts` | **[TS]** | `SessionService`: `init(repo: Repository)`, no-op `save/load/clear` |
| `service/audio-service.js` | **[.js]** | Без изменений |
| `errors/custom-errors.ts` | **[TS]** | 5 классов: `StorageError`, `CorruptedDataError`, `StorageUnavailableError`, `QuotaExceededError`, `SessionError` |
| `errors/error-handler.ts` | **[TS]** | `ErrorHandler.handle(error: Error, context: string): ErrorInfo`, `init(): void` |

### View / Controller — без изменений

`js/view/**` (9 файлов), `js/controller/**` (6 файлов), `js/script.js` — **остаются `.js`**, код не меняется; в `index.html` у них по-прежнему `.js`.

### Как типы попадают в «классические» файлы

`types.ts` объявляет интерфейсы в `declare global`, поэтому:

- `config.ts` видит `Zone`, `GameMap`, `Config` **без импорта**;
- `stats-service.ts` видит `Stats`/`MapData` без импорта;
- оставшиеся `.js`-файлы видят те же имена в JSDoc (`@returns {GameMap}`) — JSDoc-ссылки на глобальные типы не являются дублированием (Z16).

Импортов/экспортов в боевых файлах **нет ни одного** — только `export {}` в `types.ts`.

---

## 🔤 `types.ts` — состав

```ts
export {};

declare global {
    type Difficulty = 'easy' | 'medium' | 'hard';

    interface Problem { … }
    interface GameResult { … }
    interface MapData { … }
    interface Stats { … }
    interface SessionState { … }
    interface ErrorInfo { … }
    interface Rating { … }
    interface Zone { … }
    interface GameMap { … }
    interface Config { … }
}
```

| Тип | Поля | Откуда |
|-----|------|--------|
| `Problem` | `question: string`, `answer: number`, `options: number[]`, `explanation: string` | TR-1, генератор |
| `GameResult` | `correct: number`, `wrong: number`, `total: number`, `roundScore: number`, `lives: number`, `completed: boolean` | TR-1, `SessionModel.getResults()` |
| `MapData` | `totalScore: number`, `currentTrainerIndex: number` | TR-1 (в 1.5.0 — `MapStats`) |
| `Stats` | `version: number`, `currentMap: string`, `maps: Record<string, MapData>` | TR-1, `StatsSchema` |
| `SessionState` | `lives: number`, `roundScore: number`, `currentQuestionIndex: number`, `difficulty: Difficulty`, `completed: boolean` | TR-1 |
| `ErrorInfo` | `action: 'reset' \| 'skip' \| 'memory'`, `userMessage: string` | TR-1, `ErrorHandler` |
| `Rating` | `min: number`, `icon: string`, `title: string`, `subtitle: string` | TR-1, `CONFIG.RATINGS`, `GAMEOVER` |
| `Zone` | `id: string`, `title: string`, `color: string`, `trainersCount: number` | было в JSDoc |
| `GameMap` | `id: string`, `title: string`, `zones: Zone[]` | было в JSDoc |
| `Config` | `TOTAL_QUESTIONS`, `MAX_LIVES`, `POINTS_BASE`, `VERSION`: `number`; `START_DIFFICULTY: Difficulty`; `RATINGS: Rating[]`; `GAMEOVER: Rating`; `ZONES: Zone[]`; `MAPS: GameMap[]`; `DEFAULT_MAP: string`; `STORAGE_PREFIX: string` | `CONFIG` |
| `Difficulty` | `'easy' \| 'medium' \| 'hard'` | `CONFIG.START_DIFFICULTY`, модалка |

Все 7 обязательных типов TR-1 присутствуют. `MapStats` **не остаётся** — только `MapData`.

### Данные: единственное дополнение

`Rating` по TR-1 содержит `min`, которого в `CONFIG` не было. Добавляем **метаданные**, поведение не меняем:

| Объект | Было | Стало |
|--------|------|-------|
| `CONFIG.RATINGS` | `{ icon, title, subtitle }` ×4 | `+ min: 100 / 70 / 40 / 0` |
| `CONFIG.GAMEOVER` | `{ icon, title, subtitle }` | `+ min: 0` |
| `GameRules.getRating()` | пороги 100 / 70 / 40 **в коде** | **не меняется** — значения `min` совпадают с порогами и служат описанием |

`test/setup.js` дублирует `CONFIG` — там `min` добавляется синхронно, иначе падает parity-тест `config.test.js`.

---

## 🧩 Типизация по файлам

| Файл | Строк сейчас | → после | Что типизируем | Подводные камни |
|------|--------------|---------|----------------|-----------------|
| `model/types.ts` | — | **≈120** | 10 интерфейсов + `Difficulty` | `export {}` обязателен для `declare global`; файл **не** в `index.html` |
| `model/config.ts` | 48 | ≈48 | `ZONES: Zone[]`, `MAPS: GameMap[]`, `CONFIG: Config` | `min` в `RATINGS`/`GAMEOVER`; без `as const`, иначе строки станут литералами |
| `model/session-model.ts` | 102 | ≈100 | поля `number`, геттеры, `setDifficulty(Difficulty)`, `getResults(): GameResult` | `correct = currentQuestionIndex`, `wrong = correct` — **сохранить как есть** (не «чинить») |
| `model/game-model.ts` | 61 | ≈55 | `_totalScore: number`, `_version: number`; `toJSON(): { version; totalScore }` | JSDoc обещал `Stats`, но это **v2**; `Stats` v3 не подходит — свой inline-тип, файл не используется в `script.js` |
| `logic/generator.ts` | 154 | ≈160 | `difficulty: Difficulty`, все методы, `build(): Problem` | `let a, b, answer, question, explanation;` без инициализации — под `strict` потенциальный implicit `any`: если `tsc` пожалуется, объявить `let a: number` и т. п.; следить за лимитом 200 |
| `logic/scoring.ts` | 27 | 27 | `calculateRoundScore(n: number): number`, `isRoundSuccessful(lives: number, completed: boolean): boolean` | — |
| `logic/game-rules.ts` | 47 | ≈45 | `shouldEndGame(session: SessionModel)`, `getRating(): Rating` | `SessionModel` — глобальный класс из `session-model.ts`, годится как тип |
| `storage/repository.ts` | 35 | 33 | `save(data: unknown)`, `load(): unknown`, `clear(): void` | **не** `abstract`: иначе из прототипа исчезнут методы и `new Repository()` перестанет бросать `Not implemented` |
| `storage/local-repository.ts` | 57 | ≈60 | `_key`, `save/load/clear`, сужение `catch` | `catch (e)` — `unknown`: `e instanceof Error`, `(e as { code?: number }).code`; `JSON.parse` возвращает `any` → сразу в `unknown` |
| `storage/memory-repository.ts` | 35 | 33 | `_data: unknown = null` | — |
| `storage/session-repository.ts` | 30 | 28 | `save(_data: unknown): void`, `load(): null` | — |
| `service/stats-service.ts` | 126 | ≈120 | `_repo: Repository \| null`, `load(): Stats`, `switchMap(mapId: string): boolean` | `this._repo` может быть `null` → guard или `as Repository` с комментарием; результаты JS-функций `StatsSchema.entry()`/`MapCatalog.has()` аннотируем на месте (`const entry: MapData = …`), чтобы `any` не просачивался |
| `service/session-service.ts` | 40 | 38 | `_repo: Repository \| null`, no-op-методы | `_repo` не используется — не удалять (поведение/API) |
| `errors/custom-errors.ts` | 68 | ≈50 | 5 классов, `constructor(message: string)` | JSDoc-блоки сжимаются до одной строки описания |
| `errors/error-handler.ts` | 44 | 44 | `handle(error: Error, context: string): ErrorInfo`, `init(): void` | `event.error?.message` — `ErrorEvent.error` в lib.dom `any`, допустимо (не наш `any`) |

**Границы TS ↔ JS.** `stats-service.ts` вызывает `StatsSchema` и `MapCatalog`, которые остаются `.js`. `allowJs: true` и выключенный `checkJs` дают их вывод: параметры — `any`, возвраты — по телу. Лечим **на месте вызова**, без правок JS:

```ts
const entry: MapData = StatsSchema.entry(stats);   // типизированная граница
```

Когда 5 файлов будут типизированы (1.6.x), эти аннотации можно убрать.

---

## ⚙️ Конфигурация

### `tsconfig.json` (итог)

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "Node",
    "jsx": "react-jsx",
    "strict": true,
    "allowJs": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["js"]
}
```

- `jsx` остаётся из T26 — понадобится на этапе 2 (React), сейчас безвреден;
- `include: ["js"]` — вынужденное отклонение от T26 (нет `src/`);
- `typescript` крепится к `~5.9.3` из-за `moduleResolution: "Node"` (см. «Отклонения»).

### `package.json` (итог)

```json
"scripts": {
  "dev": "vite",
  "typecheck": "tsc --noEmit",
  "build": "npm run typecheck",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
},
"devDependencies": {
  "@vitest/coverage-v8": "^5.0.5",
  "jsdom": "^30.1.3",
  "typescript": "~5.9.3",
  "vite": "^8.3.5",
  "vitest": "^5.0.5"
}
```

- `dev`/`build` используют `vite` напрямую — он должен быть в `devDependencies`, а не только транзитивно;
- `build` = проверка типов: прод-бандл classic-скриптов Vite не умеет (проверено), вернётся на этапе 2–3 вместе с модулями/React. Текущий `build: "tsc && vite build"` и так падает;
- `jest-environment-jsdom` остаётся неиспользуемым хвостом; удаление — опционально (вне критериев).

---

## 🧪 Тесты — починка harness (13.8)

Новых тестов **нет**; правится обвязка, чтобы 182 существующих теста снова что-то проверяли.

| Шаг | Файл | Правка |
|-----|------|--------|
| 1 | `vitest.config.ts` | `setupFiles: ['./test/setup.js']` (сейчас отсутствует — отсюда 53 красных) |
| 2 | `test/setup.js` | `jest.fn` → `vi.fn` (4 шт.); в `CONFIG.RATINGS`/`GAMEOVER` добавить `min` (parity с боевым `CONFIG`) |
| 3 | `test/**/*.test.js` | `jest.` → `vi.` — **55 вхождений** в 5 файлах (`map-controller` 29, `global-map-controller` 9, `audio-service` 7, `stats-service` 6, `setup` 4) |
| 4 | `test/service/audio-service.test.js` | к `eval(...)` дописать `'\nglobal.AudioService = AudioService;'`: в ESM-строгом режиме `var` из `eval` не утекает, иначе 5 тестов падают на `AudioService is not defined` |
| 5 | `test/ts-source.js` **[NEW]** | `readSource(relPath)` — `fs.readFileSync` + `typescript.transpileModule` (`target: ES2020`, `module: None`), чтобы `eval` понимал `.ts` |
| 6 | `test/model/config.test.js`, `test/model/stats-schema.test.js`, `test/service/stats-service.test.js` | `fs.readFileSync('./js/...js')` → `readSource('./js/...ts')` у переименованных файлов; остальные пути (`map-catalog.js`, `stats-schema.js`) не меняются |

`test/ts-source.js` (≈15 строк):

```js
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');

function readSource(relPath) {
    const file = path.join(ROOT, relPath);
    const code = fs.readFileSync(file, 'utf8');
    if (!file.endsWith('.ts')) return code;
    return ts.transpileModule(code, {
        fileName: file,
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None }
    }).outputText;
}

module.exports = { readSource };
```

Почему не `import`: тесты загружают исходники через `eval` в глобальную область — импорт сделал бы файл модулем и лишил бы тест глобалов `CONFIG`, `StatsService` и т. д.

**Ожидание:** `npm test` → **182/182** (проверено на копии проекта с этими правками). `jest.config.js` остаётся мёртвым файлом — вне области.

---

## 🗺️ Этап 13: TypeScript без React (1.6.0)

Порядок жёсткий: 13.0 → 13.1 → (13.2…13.6) → 13.7 → 13.8 → 13.9. После каждого шага — `npm run typecheck` = 0 ошибок.

### 13.0. Инструменты и конфигурация

- `npm install -D typescript@~5.9.3 vite@^8.3.5`.
- `tsconfig.json`: `include: ["js"]` (остальные опции T26 не трогать).
- `package.json`: скрипт `typecheck`, `build` → `npm run typecheck`.
- Проверка: `npx tsc --version`, `npm run typecheck` → 0 ошибок на текущем чисто-JS коде (`allowJs` + `checkJs` off).

**Критерий:** `npm run typecheck` проходит, `include` указывает на `js`. **Охватывает:** TR-5, A34, T26.

### 13.1. `js/model/types.ts` [NEW]

- `export {}` + `declare global`: `Problem`, `GameResult`, `MapData`, `Stats`, `SessionState`, `ErrorInfo`, `Rating`, `Zone`, `GameMap`, `Config`, `Difficulty`.
- Удалить `js/model/types.js`; убрать `<script src="js/model/types.js">` из `index.html`.
- `js/model/stats-schema.js`: в двух JSDoc `MapStats` → `MapData` (код не меняется).
- В шапке файла — комментарий: «только типы; не подключать в index.html (ES-модуль)».

**Критерий:** `tsc` = 0; все 7 типов TR-1 на месте; `MapStats` не встречается. **Охватывает:** TR-1, A33, Z16.

### 13.2. Errors → `.ts`

- `errors/custom-errors.js` → `custom-errors.ts`; `errors/error-handler.js` → `error-handler.ts`.
- JSDoc: оставить описания, убрать `@param {string}`.
- `index.html`: два `src` → `.ts`.

**Критерий:** оба файла `.ts`, `tsc` = 0, классы/поведение прежние. **Охватывает:** TR-3, T27.

### 13.3. Storage → `.ts`

- `storage/repository.js`, `local-repository.js`, `memory-repository.js`, `session-repository.js` → `.ts`.
- `data: unknown` вместо `*`; сужение `catch`; `Repository` **не** `abstract`.
- `index.html`: четыре `src` → `.ts`.

**Критерий:** 4 файла `.ts`, `tsc` = 0, `localStorage`-поведение и ошибки не изменились. **Охватывает:** TR-3, T27.

### 13.4. Model → `.ts`

- `model/config.js` → `config.ts`: `Config`, `min` в `RATINGS`/`GAMEOVER`.
- `model/session-model.js` → `session-model.ts`; `model/game-model.js` → `game-model.ts` (inline-тип для legacy `toJSON`).
- `index.html`: три `src` → `.ts`.
- `test/setup.js`: `min` в `RATINGS`/`GAMEOVER` (parity до 13.8).

**Критерий:** 3 файла `.ts`, `tsc` = 0, `CONFIG` идентичен по значениям (кроме `min`). **Охватывает:** TR-2, TR-3, T27.

### 13.5. Logic → `.ts`

- `logic/generator.js` → `generator.ts` (уточнить типы локальных переменных там, где `tsc` потребует); `scoring.js` → `scoring.ts`; `game-rules.js` → `game-rules.ts`.
- `index.html`: три `src` → `.ts`.

**Критерий:** 3 файла `.ts`, `tsc` = 0, `generator.ts` ≤ 200 строк, задачи генерируются как раньше. **Охватывает:** TR-2, T27.

### 13.6. Service → `.ts`

- `service/stats-service.js` → `stats-service.ts`; `session-service.js` → `session-service.ts`.
- `_repo: Repository | null`; `load(): Stats`; `switchMap(mapId: string): boolean`; границы к JS-модулям (`StatsSchema`, `MapCatalog`) аннотированы на месте вызова.
- `index.html`: два `src` → `.ts`.

**Критерий:** 2 файла `.ts`, `tsc` = 0, `Stats` v3 и `switchMap` работают как в 1.5.0. **Охватывает:** TR-3, T27, T28.

### 13.7. `index.html` — консолидация подключений

- Сверить все 15 изменений: 14 `.ts` подключены, `types.js` удалён, у View/Controller/`script.js` — `.js`.
- Порядок блоков не менялся: Errors → Audio → Model → Storage → Service → Logic → View → Controller → `script.js`.
- `grep -n '\.js"' index.html` не должен показывать переименованные файлы.
- `npm run dev`: приложение стартует, консоль без ошибок, карта рисуется, 🌍 открывает модалку.

**Критерий:** все пути корректны, порядок сохранён, старт без ошибок. **Охватывает:** TR-6, A32, T26.

### 13.8. Тесты — harness и TS-loader

- Правки из раздела «Тесты — починка harness» (6 шагов).
- `npm test` → 182/182, 14 сьютов.

**Критерий:** 182/182, новых тестов нет. **Охватывает:** T28, критерий 78.

### 13.9. Финальная проверка и документация

- `npm run typecheck` → 0; `npm test` → 182/182.
- Ручной прогон 10 сценариев 1.5.0 (`npm run dev`): карта, счёт, позиция, 🌍, модалка выбора карты, no-op при той же карте, модалка сложности, отмена-откат, повторная игра, результаты, перезагрузка, `ml_stats` = v3.
- Проверить лимит 200 строк по `js/**/*.ts`; `map-view.js` = 199 и не изменён; `map-controller.js` = 198 и не изменён; CSS не изменён.
- `grep` на `any` в `js/**/*.ts` → 0 (или каждый случай с комментарием).
- Документация: `README.md`, `GIGACODE.md` (TS, Vite, 182 теста, `npm run dev` как единственный способ запуска, `typecheck`), `test/README.md` (vitest, `ts-source.js`), `TASKS.md` — этап 13 (рекомендация, вне этого плана).

**Критерий:** критерии 71–80 выполнены. **Охватывает:** TR-6, T28.

---

## ✅ Критерии завершения

### Сохраняются из 1.2.0–1.5.0 (1–70)

Архитектура, слои, JSDoc-описания, Repository, ошибки, write-ahead, вкладки, счёт, сгорание очков, карта (шаг 100px, одна дорога, 15 тренажёров), игрок (🚶 52px, 600 мс, блокировки), модалки, откат и повторная игра, глобальная карта и `Stats` v3, миграции 1 → 2 → 3. Критерий 69 в редакции 1.5.0 требовал ≥ 126 тестов; фактически 182 — число **не уменьшается**.

### TypeScript без React (1.6.0, 71–80)

71. `js/model/types.ts` создан: все **7** обязательных типов TR-1 (`Problem`, `GameResult`, `MapData`, `Stats`, `SessionState`, `ErrorInfo`, `Rating`) + `Zone`, `GameMap`, `Config`, `Difficulty`; `export {}` и `declare global`; `MapStats` нигде не осталось; файл **не** подключён в `index.html` (TR-1, A33, Z16).
72. **14 файлов** переименованы в `.ts` по списку TR-2/TR-3 плюс `generator.ts` (см. «Отклонения»); ни один файл `js/view/**`, `js/controller/**`, `js/script.js` не переименован и не изменён (TR-2, TR-3, TR-4, A35).
73. Все публичные функции, методы и поля классов типизированы: параметры и возвращаемые значения; `any` в публичных API отсутствует (`unknown`/`as { … }` с комментарием — допустимы) (T27, Z16).
74. `npx tsc --noEmit` — **0 ошибок**; `tsconfig.json`: `strict`, `allowJs`, `noEmit`, `skipLibCheck`, `include: ["js"]`; `typescript` закреплён `~5.9` (TR-5, A34, T26, T28).
75. JSDoc сохранён как описание публичных функций, но **без** `@param {Type}`, `@returns {Type}`, `@type` — типы только в TS-сигнатурах (T7, Z15, Z16).
76. `index.html` подключает 14 `.ts` вместо `.js`, `model/types.js` удалён; порядок Errors → Audio → Model → Storage → Service → Logic → View → Controller → `script.js` не изменён (TR-5, T26).
77. Игра работает через **`npm run dev`**: 10 сценариев 1.5.0 проходят, визуальных и поведенческих изменений нет, консоль без ошибок; прямое открытие `index.html` и `python3 -m http.server` не используются (TR-6).
78. `npm test` — **182/182** в 14 сьютах; `setupFiles` подключён; новых тестов нет; `jest.*` в тестах не осталось (T28).
79. Ни один файл `js/**` не больше **200 строк**; `map-view.js` = 199 и не изменён; `map-controller.js` = 198 и не изменён; CSS, звук, Storage и игровая логика не тронуты; `ml_stats` после перезагрузки — v3 (T2, Z15).
80. Документация синхронизирована: `README.md`, `GIGACODE.md`, `test/README.md` описывают TypeScript, Vite и vitest, 182 теста, `npm run dev`/`npm run typecheck`; `TASKS.md` — этап 13 (рекомендация).

---

## 📏 Бюджет 200 строк

| Файл | Сейчас | После 1.6.0 | Как уложиться |
|------|--------|-------------|----------------|
| `model/types.ts` | — | **≈120** | Только объявления + короткие комментарии-разделители |
| `logic/generator.ts` | 154 | **≈160** | Аннотации inline; локальные переменные — уточнить только там, где потребует `tsc` |
| `service/stats-service.ts` | 126 | **≈120** | JSDoc-типы убираются, аннотации в сигнатурах |
| `model/session-model.ts` | 102 | ≈100 | Однострочные JSDoc-описания |
| `errors/custom-errors.ts` | 68 | ≈50 | JSDoc-блоки конструкторов сжимаются до строки |
| `storage/local-repository.ts` | 57 | ≈60 | Сужение `catch` — 3 строки |
| `model/game-model.ts` | 61 | ≈55 | Inline-тип вместо JSDoc `Stats` |
| `config.ts`, `game-rules.ts`, `scoring.ts`, `repository.ts`, `memory-repository.ts`, `session-repository.ts`, `session-service.ts`, `error-handler.ts` | 48 / 47 / 27 / 35 / 35 / 30 / 40 / 44 | ≈ тех же | Только сигнатуры |
| `view/map-view.js` | **199** | **199** | **Не меняется** |
| `controller/map-controller.js` | **198** | **198** | **Не меняется** |
| `model/stats-schema.js` | 145 | 145 | Остаётся `.js`, меняются 2 слова в JSDoc |

Все `.ts` — с запасом до 200. Резерв: при переполнении `types.ts` `Config` можно описать через `Pick<…>`/`Omit<…>`; при переполнении `generator.ts` — вынести `build()`-хелперы в приватные методы (без изменения поведения).

---

## 📂 Структура файлов (дельта)

```
index.html                            # [ИЗМ] 14 src → .ts, types.js удалён
tsconfig.json                         # [ИЗМ] include: ["js"]
package.json                          # [ИЗМ] typescript, vite, typecheck, build
vitest.config.ts                      # [ИЗМ] setupFiles
js/
  model/
    types.ts                          # [NEW] все интерфейсы (export {} + declare global)
    types.js                          # [УДАЛ] заменён types.ts
    config.ts                         # [TS] Config, Rating.min
    session-model.ts                  # [TS]
    game-model.ts                     # [TS] legacy v2 inline-тип
    map-catalog.js                    # [.js] без изменений
    stats-schema.js                   # [.js] 2 JSDoc: MapStats → MapData
  logic/
    generator.ts                      # [TS]
    scoring.ts                        # [TS]
    game-rules.ts                     # [TS]
    player-rules.js                   # [.js] без изменений
    player-state.js                   # [.js] без изменений
  storage/
    repository.ts                     # [TS]
    local-repository.ts               # [TS]
    memory-repository.ts              # [TS]
    session-repository.ts             # [TS]
  service/
    stats-service.ts                  # [TS]
    session-service.ts                # [TS]
    audio-service.js                  # [.js] без изменений
  errors/
    custom-errors.ts                  # [TS]
    error-handler.ts                  # [TS]
  view/, controller/, script.js       # [.js] без изменений
test/
  ts-source.js                        # [NEW] transpile .ts для eval
  setup.js                            # [ИЗМ] vi.fn, Rating.min
  model/config.test.js                # [ИЗМ] readSource
  model/stats-schema.test.js          # [ИЗМ] readSource
  service/stats-service.test.js       # [ИЗМ] readSource
  service/audio-service.test.js       # [ИЗМ] vi.* + global.AudioService
  map/map-controller.test.js          # [ИЗМ] vi.*
  map/global-map-controller.test.js   # [ИЗМ] vi.*
.gigacode/
  plans/PLAN.md                       # этот файл (1.6.0)
  specs/SPEC.md, spec_v1_6_0.md
  rulles/RULES.md, rules_v_1_6_0.md
```

---

## 🚫 Запреты

### Z15 (Этап 1) — сохраняется полностью

- Добавлять **React** (этап 2+).
- Менять **архитектуру**: слои, имена, порядок загрузки, Repository API.
- Трогать **View** и **Controller** (`js/view/**`, `js/controller/**`, `js/script.js`).
- Добавлять **новые фичи** и новые тесты.
- Использовать **`any`** без необходимости.
- **Дублировать типы**: `@param {Type}` / `@returns {Type}` / `@type` рядом с TS-аннотацией.

### Z16 (типы) — сохраняется полностью

- `any` в публичных API без обоснования; неявные `any` (`noImplicitAny` через `strict`).
- Дублирование интерфейсов в разных файлах.
- Типы вне `types.ts`, кроме **локальных** (inline-тип `game-model.toJSON`, `let a: number` в генераторе).

### Дополнительно для 1.6.0

- Подключать `types.ts` в `index.html` (там `export {}` → SyntaxError).
- Добавлять `import`/`export` в боевые `.ts` (сломает классические скрипты).
- Включать `checkJs` в 1.6.0 (вскроет 5 нетипизированных файлов — отдельный шаг).
- Переименовывать/удалять 5 файлов вне области.
- Включать `abstract` у `Repository` (изменит поведение `new Repository()`).
- Менять `Stats`-формат, ключ `ml_stats`, пороги оценок, звук, CSS.

---

## 📦 Вне области (SPEC v1.6.0)

- **React** и любые компоненты/`.tsx` — этапы 2–3.
- **5 файлов слоёв**, оставшихся `.js`: `model/map-catalog.js`, `model/stats-schema.js`, `logic/player-rules.js`, `logic/player-state.js`, `service/audio-service.js` — долг, отдельный шаг 1.6.x.
- Переезд дерева в `src/` и приведение `include` к T26 буквально.
- **Прод-сборка** (`vite build` с classic-скриптами) — этап 2–3; сейчас `build` = `typecheck`.
- Перевод View/Controller на `.ts` и их замена на React.
- `checkJs`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` и прочие дополнительные флаги.
- Новые тесты, e2e, покрытие 80%+ для новых файлов.
- Переименование `GameModel`/удаление неиспользуемого кода, исправление старых неточностей (`wrong = correct` в `getResults`, `toJSON` v2, `getDefault()` без проверки на пустой каталог).
- Чистка `jest.config.js` и `jest-environment-jsdom`.
- Оптимизация производительности, рефакторинг ради рефакторинга.

---

## 🔗 Трассировка требований

| Требование | Где реализуется | Этап | Критерии |
|-----------|-----------------|------|----------|
| TR-1. `types.ts`, 7 типов | `js/model/types.ts` | 13.1 | 71 |
| TR-2. Простые файлы → `.ts` | `config.ts`, `scoring.ts`, `game-rules.ts` (+ `generator.ts`, см. «Отклонения») | 13.4, 13.5 | 72, 73 |
| TR-3. Сложные файлы → `.ts` | `session-model.ts`, `game-model.ts`, `storage/*.ts`, `stats-service.ts`, `session-service.ts`, `errors/*.ts` | 13.2, 13.3, 13.4, 13.6 | 72, 73 |
| TR-4. View/Controller — `.js` | `js/view/**`, `js/controller/**`, `script.js` | весь этап | 72, 79 |
| TR-5. `allowJs`, `strict`, `noEmit` | `tsconfig.json` | 13.0 | 74, 76 |
| TR-6. Игра работает | `index.html`, `npm run dev` | 13.7, 13.9 | 77 |
| A32. Постепенная миграция | 14 файлов по одному | 13.2–13.6 | 72 |
| A33. Типы в `types.ts` | `types.ts` | 13.1 | 71 |
| A34. Строгий режим | `tsconfig.json` | 13.0 | 74 |
| A35. View/Controller — JS | без правок | весь этап | 72, 79 |
| T26. Конфигурация TS | `tsconfig.json` (с `include: ["js"]`), `typescript ~5.9` | 13.0 | 74 |
| T27. Правила типизации | все `.ts` | 13.1–13.6 | 73, 75 |
| T28. `npx tsc --noEmit` | `typecheck`, 13.9 | 13.0, 13.9 | 74, 78 |
| Z15. Запреты этапа 1 | весь план | — | 71–77, 79 |
| Z16. Запреты в типах | `types.ts`, все `.ts` | 13.1–13.6 | 73, 75 |
| Критерий 78 (тесты) | `test/**`, `vitest.config.ts`, `ts-source.js` | 13.8 | 78 |

---

## ⚠️ Риски, примечания и открытые вопросы

- **Запуск только через `npm run dev`.** Браузер не исполняет `.ts`, а `python3 -m http.server` отдаёт `.ts` с неверным MIME. Прямое открытие `index.html` файлом перестаёт работать — это неизбежное следствие TR-2/TR-3, а не дефект. README/GIGACODE обновляются в 13.9.
- **Прод-сборка.** Vite не бандлит classic-скрипты (проверено): в `dist` попадёт `<script src="js/model/config.ts">` без самого файла. Поэтому `build` = `npm run typecheck`, а полноценный бандл — этап 2–3. До 1.6.0 `build` и так падал (`tsc` не установлен), так что регресса нет.
- **Частичная типизация слоёв.** 5 файлов остаются `.js`: A32 выполнен на 14 из 19 файлов. `stats-service.ts` вызывает `StatsSchema`/`MapCatalog` — их вывод даёт «мягкие» типы (параметры `any`), поэтому на границе стоят аннотации `const entry: MapData = …`. Это временная, но явная конструкция; при типизации 5 файлов её можно убрать.
- **`types.ts` — модуль.** Если кто-то добавит его в `index.html` по привычке («Model первый»), браузер упадёт на `export {}`. В шапке файла — предупреждение, в критерии 71 — прямой запрет.
- **Версия TypeScript.** `~5.9.3` закреплена из-за T26 (`moduleResolution: "Node"`). TS 6 даёт TS5107; при обновлении — `"moduleResolution": "Bundler"` и отдельное решение владельца.
- **`strict` вскроет старые неточности**, которые **не исправляем**: `GameModel.toJSON()` (формат v2, не `Stats` v3), `SessionModel.getResults()` (`wrong = correct`), `MapCatalog.getDefault()` (может вернуть `undefined` при пустом каталоге — инвариант каталога гарантирован `config.js`). Их фиксируем типами и комментариями, поведение не меняем.
- **`Rating.min`.** Добавляется только как метаданные (100/70/40/0); `GameRules.getRating()` продолжает работать по текущим порогам. `test/setup.js` дублирует `CONFIG` — `min` добавляется синхронно (parity-тест).
- **`Repository` без `abstract`.** Иначе методы исчезнут из прототипа и `new Repository()` перестанет бросать `Not implemented` — это изменение поведения, запрещённое Z15.
- **Тестовая база была красной до 1.6.0.** `test/setup.js` не подключался (`setupFiles` нет), тесты использовали `jest.*`. После 13.8 — 182/182 (проверено на копии проекта: `setupFiles` + `vi.*` + `global.AudioService`).
- **`test/setup.js` — копия `CONFIG`.** Любое изменение `CONFIG` (сейчас `min`) обязано попасть в оба места, иначе `config.test.js` падает на parity.
- **Тесты-«копии».** `test/logic/generator.test.js`, `scoring.test.js`, `game-rules.test.js` описывают функции **в тесте**, а не загружают боевые файлы, поэтому типизация этих модулей ими не проверяется. Это известное ограничение 1.5.0, не расширяем (новые тесты вне области).
- **`jest.config.js`** остаётся мёртвым файлом; `README.md`/`GIGACODE.md`/`test/README.md` приводятся к реальности в 13.9.
- **`npm test` в песочнице** может требовать writable `XDG_DATA_HOME` (vitest пишет токен в `~/.local/share/vitest`) — это окружение, а не проект.
- **Открытых вопросов нет**: три развилки (объём, `types.ts`, тесты) закрыты владельцем. Если позже понадобится буквальный T26 (`src/`) или ES-модули — это отдельный этап с переездом дерева и правкой View/Controller.

---

## ✅ Ожидаемый результат 1.6.0

- `js/model/types.ts` — единственный источник типов: 7 обязательных + `Zone`, `GameMap`, `Config`, `Difficulty`; без дублей в JSDoc.
- 14 файлов Model / Logic / Storage / Service / Errors — `.ts` с полными аннотациями; `any` — 0.
- `npx tsc --noEmit` — **0 ошибок**; `strict: true`, `allowJs: true`, `noEmit: true`.
- Игра запускается через `npm run dev` и работает как в 1.5.0: карта, 🌍, модалки, игра, результаты, перезагрузка, `ml_stats` = v3.
- `npm test` — **182/182** в 14 сьютах; harness починен, новых тестов нет.
- View, Controller и `script.js` не тронуты; `map-view.js` 199, `map-controller.js` 198; CSS, звук и Storage без изменений.
- 5 файлов слоёв остаются `.js` — зафиксированный долг для следующего шага.

---

## 📌 Краткая памятка агенту

✅ `types.ts` — `export {}` + `declare global`, **не** подключать в `index.html`
✅ 14 файлов: список TR-2/TR-3 + `generator.ts` → `.ts`, по одному шагу за раз
✅ `tsconfig.json`: `strict`, `allowJs`, `noEmit`, `skipLibCheck`, **`include: ["js"]`**
✅ `typescript` — `~5.9.3` (T26 `moduleResolution: "Node"` в TS 6 ломается)
✅ `typecheck` = `tsc --noEmit` перед каждым шагом; финал — 0 ошибок
✅ Типы — только в TS-сигнатурах; JSDoc остаётся описанием, без `@param {…}`
✅ `Repository` — не `abstract`; `catch (e)` — `unknown` + сужение
✅ `GameModel.toJSON()` — inline-тип v2, **не** `Stats` v3
✅ `MapStats` → `MapData`; `Rating.min` = 100/70/40/0 как метаданные
✅ Запуск — `npm run dev` (Vite); `file://` и `python3 -m http.server` больше не годятся
✅ Тесты: `setupFiles`, `jest.`→`vi.`, `ts-source.js`, `global.AudioService` → **182/182**
✅ `map-view.js` (199) и `map-controller.js` (198) — не трогать

❌ React, `.tsx`, новые компоненты
❌ `import`/`export` в боевых `.ts`
❌ Правки `js/view/**`, `js/controller/**`, `js/script.js`
❌ `any` в публичных API; `@param {Type}` рядом с TS-аннотацией
❌ `checkJs`, `abstract` у `Repository`, изменение `Stats`-формата и CSS
❌ Новые тесты и новые фичи
❌ Переименование 5 файлов вне области (долг 1.6.x)
