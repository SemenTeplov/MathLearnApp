# План — MathLingo

**Версия:** 1.8.2  
**Статус:** Этап 17 «ES-модули» (SPEC 1.8.2 — «Этап 2» миграции) — ✅ выполнено  
**Базовая линия 1.8.1:** `npx tsc --noEmit` — **0 ошибок**, `npm test` — **156/156 в 12 сьютах** (проверено 03.11.2026), `js/` — 19 classic-файлов (13 `.ts` + 6 `.js`), `src/` — 20 файлов  
**Создан на основе:** RULES 1.8.2 (`rules_v_1_8_2.md`: A52–A58, T44–T49, Z24–Z26) и SPEC 1.8.2 (`spec_v1_8_2.md`: TR-28…TR-41)  
**Предыдущая версия плана:** 1.8.1 (`plans/PLAN_v1_8_1.md` — архив)  
**Тип изменения:** архитектурная миграция — 19 классических скриптов и глобалы → один граф ES-модулей со слоями `core`/`data`/`services`/`app`. Поведение, разметка, CSS, тексты, `CONFIG`, `Stats` и ключи хранилища **не меняются**.

---

## ⚠️ Решения, на которых стоит план

| # | Решение | Следствие |
|---|---------|-----------|
| 1 | **Сначала структура, потом тесты** (A57/TR-39). Тесты на этапе 2 не трогаются и остаются **красными**; их переписывание на `import` — этап 3 | Ни один тестовый файл не меняется; «красный» прогон — ожидаемый результат, а не повод править тесты |
| 2 | **Порядок слоёв:** `core` → `data` → `services` → `ui/types` → `app`+`main` → `tsconfig`+`index.html` → удаление `js/` → smoke → документация | После каждого шага `tsc --noEmit` = 0; удаление `js/` — отдельный последний шаг, чтобы тесты падали только в конце |
| 3 | **`src/types.ts` удаляется только после смены `tsconfig`** (D18), а не в порядке таблицы TR-28 | Пока `js/` входит в программу `tsc`, глобальные типы нужны классическим файлам. Удаление раньше дало бы сотни TS2304 |
| 4 | **`src/config.ts` удаляется вместе с потребителями** на шаге 17.5 (TR-32) | `GameScreen`, `useGame`, `useMap` переходят на `import { CONFIG } from '../core/config'`; `config` в нижнем регистре исчезает |
| 5 | **`SessionService`/`SessionRepository` удаляются на 17.6**, после `bootstrap` (TR-36) | Пока `bootstrap.ts` жив, удаление сломало бы рантайм; `init(new SessionRepository())` — единственная ссылка |
| 6 | **`StatsService` — класс** (T45/D5): `_repo` приходит в конструктор, `init()` удалён | `createServices()` делает `new StatsService(new LocalStorageRepository(CONFIG.STORAGE_PREFIX + 'stats'))` |
| 7 | **`AudioService` — класс вместо IIFE** (T45): `_sounds`, `_isReady`, `try/catch`, `console.warn` сохраняются; `AudioKind` переезжает сюда | `useAudio.ts` удаляется (D4 спеки): импортёров нет, `AudioKind` нужен сервису |
| 8 | **`ErrorHandler.handle/init` → `handleError`/`initGlobalErrorHandlers`** (T45/D6) | Явные функции вместо объекта-глобала; `main.tsx` вызывает `initGlobalErrorHandlers()` |
| 9 | **Единственный composition root** (A54/TR-33): `createServices()` вызывается ровно один раз в `src/main.tsx`; `App({ services })`; хуки получают `services` первым аргументом | Сервисы не создаются в компонентах/хуках, не хранятся в модульных переменных, методы не деструктурируются (`this`) |
| 10 | **Клики в `App`** идут через проп: `services.audio.play('click')` (интерпретация A53: запрещён **импорт** значений из `data`/`services`, но T46 передаёт `services` в `App`) | Альтернатива «перенести клики в хуки» записана в вопросах владельцу; компоненты сервисов не получают в любом случае |
| 11 | **`CONFIG` — только импортом** (A55/TR-32); `ZONES`/`MAPS` — внутренние `const` | `src/config.ts` и реэкспорты удалены; `grep` по `config.` в `src/` пуст |
| 12 | **Типы — обычные модули** (A56/TR-31): домен в `src/core/types.ts`, view-модели в `src/ui/types.ts`, геометрия — в домене | `declare global` исчезает; из-за `verbatimModuleSyntax` все типовые импорты — `import type` |
| 13 | **Тесты на 1.8.2 — красные по расписанию** (D22): 9 сьютов / **113** тестов упадут (ENOENT на `./js/…`), 3 сьюта / **43** теста останутся зелёными (они дублируют логику в себе) | Красный список фиксируется в отчёте этапа; `allowJs: true` сохраняется до этапа 3 |
| 14 | **Ветка `refactor/es-modules`**, атомарные коммиты по слоям, **без мержа** до зелёного этапа 3 (A58/TR-40) | `git add -A` запрещён (Z26): в дереве уже есть чужие правки `SPEC.md`/`RULES.md` |

---

## 🎯 Цель

Один граф модулей вместо 19 `<script>`-тегов и глобальных переменных:

- каждый файл `src/` — модуль с явными `import`/`export`, `CONFIG` — только импортом;
- `index.html` — `#root` + **один** `<script type="module" src="/src/main.tsx">`;
- `js/` удалён целиком; мёртвый код (`SessionService`, `SessionRepository`, `src/config.ts`, `src/bootstrap.ts`, `src/types.ts`, `src/hooks/useAudio.ts`, корневой `main.tsx`) удалён;
- `npx tsc --noEmit` — **0 ошибок**; `npm run dev` — работает, консоль без ошибок;
- поведение, разметка, CSS (21 файл), тексты, `CONFIG`, `Stats` v3 и ключи `ml_stats`/`ml_session_lock` — **1:1**;
- `npm test` — **красный** (9 сьютов / 113 тестов), и это записано в отчёте: тесты переписываются на `import` на этапе 3.

Никаких новых фич, зависимостей, Context/Zustand, `@vitejs/plugin-react`, правок CSS и «заодно» починки тестов.

---

## 📐 Что именно меняет 1.8.2

| Источник | Требование | Следствие для плана |
|----------|-----------|---------------------|
| **TR-28** | Перенос 19 файлов по таблице «было → стало»; `js/` удаляется целиком | Шаг 17.1–17.2 (перенос), 17.6 (удаление `js/`) |
| **TR-29** | Явные `export`/`import`; никаких `window`/`globalThis`; типы — только `import type` | Шаги 17.1–17.5; проверка `grep` на 17.7/17.9 |
| **TR-30** | Шесть `.js` → `.ts`: `map-catalog`, `stats-schema`, `player-rules`, `player-state`, `audio-service`, `map-layout` | 17.1 (`core`) и 17.3 (`services`); JSDoc → сигнатуры |
| **TR-31** | `declare global` → обычные экспорты; `core/types.ts` + `ui/types.ts`; геометрия в домене | 17.1 (`core/types.ts`), 17.4 (`ui/types.ts`), 17.5 (удаление `src/types.ts`) |
| **TR-32** | `src/config.ts` удалён; `GameScreen`/`useGame`/`useMap` — на `CONFIG` | 17.5 |
| **TR-33** | `createServices()` + `src/main.tsx`; `App({ services })`; хуки первым аргументом | 17.5 (`app/types.ts`, `createServices.ts`, `src/main.tsx`, `App`, хуки) |
| **TR-34** | `index.html` — только `#root` + один module-скрипт; CSS импортами | 17.5b |
| **TR-35** | `tsconfig.json` по шаблону T47 (`Bundler`, `verbatimModuleSyntax`, `isolatedModules`, `types: ["vite/client"]`, `allowJs: true`) | 17.5b |
| **TR-36** | Мёртвый код: `SessionService`, `SessionRepository`, `bootstrap`, `config`, корневой `types`, `useAudio`, корневой `main` | 17.5 (src-обвязка) + 17.6 (`js/`) |
| **TR-37** | Матрица слоёв: `core ← data ← services ← app`; `components` без `data`/`services`/`hooks` | 17.1–17.5; проверка на 17.7 |
| **TR-38** | Контракты `config`, `errors`, `error-handler`, `StatsService`, `AudioService`; публичные имена T44 | «Контракты модулей» ниже |
| **TR-39** | `test/**` не меняется; тесты красные; `allowJs: true` до этапа 3 | 17.6–17.7 (red-list) |
| **TR-40** | Ветка `refactor/es-modules` от `a6f6ffa`; атомарные коммиты; без мержа | 17.0, 17.9 |
| **TR-41** | Проверки `tsc`/`dev`/`grep` + ручной smoke | 17.7, 17.9 |

---

## ✅ Что НЕ меняется

| Область | Факт |
|---------|------|
| Поведение игры | 10 вопросов, 3 жизни, `+10` за верный ответ, пороги `CONFIG.RATINGS`, «Игра окончена» при `lives <= 0` |
| `CONFIG` | `TOTAL_QUESTIONS 10`, `MAX_LIVES 3`, `START_DIFFICULTY 'easy'`, `POINTS_BASE 10`, `RATINGS` (100/70/40/0), `GAMEOVER`, `VERSION 3`, `STORAGE_PREFIX 'ml_'`, `DEFAULT_MAP 'math'`, 3 зоны по 5 тренажёров — **значения те же** |
| `Stats` / Storage | ключ `ml_stats`, `Stats` v3, миграции `1 → 2 → 3`, `switchMap` сбрасывает позицию в `−1` |
| Разметка и CSS | 21 файл `css/**` — **0 правок**; те же `id` (`#root`, `#mapScreen`, `#gameScreen`, `#resultScreen`), классы, тексты, эмодзи; inline `style="display: contents"` у `#root` |
| Звук | `audio/click.mp3`, `win.mp3`, `lose.mp3`; ошибки глотаются, `console.warn` сохраняется |
| Зависимости | `package.json`: React 19.3.1, Vite 8.3.5, TypeScript 5.9.3, vitest 5.0.5 — **без новых пакетов** |
| `test/**` | 0 правок: ни удаления, ни `skip`, ни ослаблений (A57/Z25) |
| `jest.config.js` | не трогаем — вне области (SPEC, «Что не входит») |

---

## 📎 Исходное состояние (проверено 03.11.2026)

| Проверка | Факт | Вывод |
|----------|------|-------|
| `npx tsc --noEmit` | **0 ошибок** | Исходная точка зелёная |
| `npm test` | **156/156** в **12** сьютах, ~6.6 с | Базовая линия; после 1.8.2 — красная (9/113) |
| `js/` | **19** файлов: 13 `.ts` + 6 `.js`; каталоги `errors`, `model`, `storage`, `service`, `logic` | Переносятся **17**, удаляются **2** (`session-service.ts`, `session-repository.ts`); каталог `js/` исчезает |
| `src/` | **20** файлов: `App.tsx`, `bootstrap.ts`, `config.ts`, `types.ts`, 10 компонентов, 6 хуков | Станет 38: `App.tsx`, `main.tsx`, `app/`×2, `core/`×13, `data/`×4, `services/`×1, `ui/`×1, `components/`×10, `hooks/`×5 |
| Глобалы в `src/` | **73** обращения к **14** идентификаторам (`AudioService` 19, `config` 17, `StatsService` 11, `PlayerRules` 5, `PlayerState` 4, `MapLayout` 4, `GameRules` 3, `SessionModel` 2, `ProblemGenerator` 2, `CONFIG` 2, `SessionService` 1, `Scoring` 1, `MapCatalog` 1, `ErrorHandler` 1) | Всё это — работа 17.1–17.5 |
| `index.html` | 19 `<script src="js/…">` + 1 `<script type="module" src="/main.tsx">`; 6 `<link rel="stylesheet">` | Переписывается на 17.5b |
| `tsconfig.json` | `moduleResolution: "Node"`, `types: []`, `include: ["js", "src", "*.tsx"]`, `allowJs: true` | Переписывается по T47 на 17.5b |
| `main.tsx` (корень) | 26 строк: `bootstrap()` → `createRoot(<App/>)` | Переезжает в `src/main.tsx` (D7) |
| `src/bootstrap.ts` | `AudioService.preload()`, `StatsService.init(repo)`, `SessionService.init(new SessionRepository())`, `ErrorHandler.init()` | Становится `src/app/createServices.ts` |
| `src/config.ts` | `export const config: Config = CONFIG` (7 строк) | Удаляется (TR-32) |
| `src/types.ts` | 171 строка: `declare global` + все доменные и view-типы | Делится на `core/types.ts` + `ui/types.ts` |
| `src/hooks/useMap.ts` | **200 строк** — ровно лимит GIGACODE | После импортов ≈207; шапку сокращаем (D25) |
| `src/hooks/useAudio.ts` | 22 строки, **ни одного импортёра** | Удаляется (D4) |
| Тестовый харнесс | `test/ts-source.js` (`readSource`), `test/setup.js` (`global.CONFIG`, мок `Audio`) | Не меняется; 9 сьютов после 1.8.2 упадут |
| `package.json` | `dev: vite`, `typecheck: tsc --noEmit`, `test: vitest run`; `build` = `typecheck` | Не меняется |
| `vite.config.ts` | **отсутствует** | `include` в T47 его «не находит» — это норма (см. D21) |
| `jest.config.js` | присутствует, не используется | Вне области (SPEC) |
| Git | ветка `fix/fix_statstic`, `HEAD a6f6ffa` («fix(1.8.1)»); `SPEC.md`/`RULES.md` modified, 1.8.2-доки untracked | Ветка создаётся от `a6f6ffa`; чужие правки не коммитим |
| `.gigacode/tasks/TASKS.md` | версия 1.8.1, этапы 0–16 ✅ | Синхронизировать на 17 (17.8); архив — `TASKS_v1_8_1.md` |

### Чего не хватает после 1.8.1

1. **Графа модулей** — связи держатся на порядке `<script>` и глобалах.
2. **Слоёв** `core`/`data`/`services` — домен и React перемешаны в `src/`.
3. **Composition root** — `bootstrap()` вызывает глобальные объекты, `StatsService.init(repo)`.
4. **Типов как модулей** — `declare global` + `src/config.ts`-реэкспорт.
5. **Одного входа** — `index.html` с 19 скриптами и `<link>`; `vite build` не работает.
6. **Тестов на импортах** — 9 сьютов читают `js/…` через `eval`; это этап 3.
7. **Документации 1.8.2** — README/GIGACODE/TASKS/SPEC всё ещё про классические скрипты.

---

## 🏗️ Архитектура (целевая)

```
index.html ─── #root (display: contents) + <script type="module" src="/src/main.tsx">
                    │
src/main.tsx ─── CSS-импорты → createServices() → audio.preload → error handlers → render
                    │
              App({ services }) ─── компоненты (только props)
                    │
              хуки(services, …) ─── useGame / useMap / useResults / useMapSelection / useSessionLock

Направление импортов:  core  ←  data  ←  services  ←  app
                       (домен)                          (composition root)
```

| Слой | Содержимое | Может импортировать | Запрещено |
|---|---|---|---|
| `core` | `config`, `types`, `errors`, `error-handler`, `session-model`, `map-catalog`, `stats-schema`, `game-rules`, `generator`, `scoring`, `player-rules`, `player-state`, `map-layout` | `core`, стандартную библиотеку | `data`, `services`, `ui`, `app`, React, DOM, `localStorage` (исключение — `window.addEventListener` в `error-handler.ts`) |
| `data` | `repository`, `local-repository`, `memory-repository`, `stats-service` | `core`, `data` | `services`, `ui`, `app`, React |
| `services` | `audio-service` | `services`, при необходимости `core/types` | `data`, `ui`, `app`, React |
| `ui/types` | view-модели | `core/types` | всё остальное |
| `app` | `createServices`, `types` (`Services`) | `core`, `data`, `services` | `components`, `hooks` |
| `App.tsx` | оболочка: экраны, навигация, модалки | `components`, `hooks`, `core`, `ui/types`, **тип** `Services` | значения из `data`/`services`, `createServices` |
| `hooks` | `useGame`, `useMap`, `useResults`, `useMapSelection`, `useSessionLock` | `core`, `data`, `services`, `ui/types`, **тип** `Services` | создание сервисов, `components` |
| `components` | 10 компонентов, разметка 1:1 | `core`, `ui/types`, другие компоненты, React | `data`, `services`, `app`, `hooks` |

**Поток данных 1.8.2 (пример 8/2):** `App` → `useGame(services, deps)` → `SessionModel` (core) + `ProblemGenerator` (core) → `services.audio.play('click')`; конец раунда → `useResults(services, …)` → `GameRules.getRating` (core) → `services.stats.updateAfterRound(80)` → `services.audio.play('win')` → `ResultsScreen` (props).

---

## 🧩 Контракты модулей

### `src/core/config.ts`

```ts
import type { Config, GameMap, Zone } from './types';

const ZONES: Zone[] = [
    { id: 'addition', title: 'Сложение', color: '#4CAF50', trainersCount: 5 },
    { id: 'subtraction', title: 'Вычитание', color: '#2196F3', trainersCount: 5 },
    { id: 'multiplication', title: 'Умножение', color: '#FF9800', trainersCount: 5 }
];

const MAPS: GameMap[] = [{ id: 'math', title: 'Математика', zones: ZONES }];

export const CONFIG: Config = { /* значения 1.8.1, включая ZONES, MAPS */ };
```

### `src/core/types.ts` / `src/ui/types.ts`

- `core`: `Difficulty`, `Problem`, `GameResult`, `MapData`, `Stats`, `SessionState`, `ErrorInfo`, `Rating`, `Zone`, `GameMap`, `Config`, `Point`, `TrainerPoint`, `MapBand`, `MapGeometry` — каждый `export interface` / `export type`, без `declare global`.
- `ui`: `MapViewData`, `MapModalTarget`, `ResultsView`, `GameSessionView`, `GameFeedbackView`; импорт домена — `import type { … } from '../core/types'`.
- `SessionState` сохраняется, даже если не используется: часть доменного контракта раунда.

### `src/core/errors.ts` и `src/core/error-handler.ts`

```ts
export class StorageError extends Error { /* name = 'StorageError' */ }
export class CorruptedDataError extends StorageError {}
export class StorageUnavailableError extends StorageError {}
export class QuotaExceededError extends StorageError {}
export class SessionError extends Error {}

// error-handler.ts
import type { ErrorInfo } from './types';

export function handleError(error: Error, context: string): ErrorInfo; // 1:1 с ErrorHandler.handle
export function initGlobalErrorHandlers(): void;                        // 1:1 с ErrorHandler.init
```

### `src/core/session-model.ts`, `game-rules.ts`, `generator.ts`, `scoring.ts`, `map-catalog.ts`, `stats-schema.ts`, `player-rules.ts`, `player-state.ts`, `map-layout.ts`

- Классы/объекты сохраняют API 1.8.1: `SessionModel` (поля `_lives`, `_roundScore`, `_correct`, `_wrong`, `_currentQuestionIndex`, `_difficulty`, `_completed`; геттеры/сеттеры, `recordCorrect`, `recordIncorrect`, `advanceQuestion`, `reset`, `getResults`), `ProblemGenerator`, `PlayerState`.
- `GameRules.shouldEndGame(session: SessionModel)` — тип `SessionModel` импортируется через `import type` (цикла нет).
- `StatsSchema.migrate(data: unknown): Stats`; внутри — `Record<string, unknown> & Partial<Stats>` и `typeof`-сужения, **без `any`**; семантика миграций `1 → 2 → 3` и `ensureMaps` 1:1.
- `PlayerRules`: `export type PlayerAction = 'play' | 'move' | 'ignore'`; `normalizeIndex(index: number | null | undefined, total: number)` — поведение с `null`/`NaN`/отрицательным `total` сохраняется.
- `MapLayout`: сигнатуры `buildLayout(zones: Zone[], width: number): MapGeometry`, `getPlayerPoint(trainers: TrainerPoint[], index: number): Point | null`, `buildRoadPath(trainers: Point[]): string`; округление и фолбэк ширины — без изменений.

### `src/data/*`

```ts
export class Repository { save(data: unknown): void; load(): unknown; clear(): void; } // тела бросают Not implemented
export class LocalStorageRepository extends Repository { constructor(key: string); /* 1:1 */ }
export class MemoryRepository extends Repository {}

// stats-service.ts
import type { Repository } from './repository';
import type { MapData, Stats } from '../core/types';

export class StatsService {
    constructor(repo: Repository);
    load(): Stats; save(stats: Stats): void;
    getCurrentMap(): string; getTotalScore(): number;
    updateAfterRound(roundScore: number): void;
    getTrainerIndex(): number; saveTrainerIndex(index: number): void;
    switchMap(mapId: string): boolean; reset(): void;
}
```

`init()` отсутствует; `_repo` не бывает `null`; `try/catch` и `handleError` — 1:1 с 1.8.1.

### `src/services/audio-service.ts`

```ts
export type AudioKind = 'click' | 'win' | 'lose';

export class AudioService {
    _sounds: Map<string, HTMLAudioElement>;
    _isReady: boolean;
    preload(): void;          // те же имена, new Audio('audio/' + name + '.mp3')
    play(kind: AudioKind): void; // cloneNode().play().catch(() => {})
}
```

### `src/app/types.ts`, `src/app/createServices.ts`, `src/main.tsx`

```ts
// app/types.ts
export interface Services { audio: AudioService; stats: StatsService; }

// app/createServices.ts
export function createServices(): Services {
    const stats = new StatsService(new LocalStorageRepository(CONFIG.STORAGE_PREFIX + 'stats'));
    return { audio: new AudioService(), stats };
}
```

`src/main.tsx`:

1. CSS-импорты в прежнем порядке: `base`, `buttons`, `screens`, `game`, `results`, `map`;
2. `const services = createServices();`
3. `services.audio.preload();`
4. `initGlobalErrorHandlers();`
5. проверка `#root` → `createRoot(...).render(<StrictMode><App services={services} /></StrictMode>)`.

### `App.tsx` и хуки

| Хук | Сигнатура 1.8.2 |
|---|---|
| `useMap` | `useMap(services: Services): UseMap` |
| `useResults` | `useResults(services: Services, onRoundFinished: (ok: boolean) => void): UseResults` |
| `useGame` | `useGame(services: Services, deps: UseGameDeps): UseGame` |
| `useMapSelection` | `useMapSelection(services: Services, onMapChanged: () => void): UseMapSelection` |
| `useSessionLock` | без изменений: `useSessionLock(showError: ShowError): void` |

`App({ services }: AppProps)`, `AppProps { services: Services }`. Компоненты сервисов не получают. Вызовы — только через экземпляр: `services.stats.load()`, `services.audio.play('click')` (не деструктурировать).

---

## 🗺️ Карта переноса

| Было | Стало | Действие |
|---|---|---|
| `js/model/config.ts` | `src/core/config.ts` | перенос; `export const CONFIG: Config`, `ZONES`/`MAPS` — внутренние |
| `js/model/session-model.ts` | `src/core/session-model.ts` | перенос; `export class SessionModel` |
| `js/model/map-catalog.js` | `src/core/map-catalog.ts` | `.js → .ts`; `export const MapCatalog` |
| `js/model/stats-schema.js` | `src/core/stats-schema.ts` | `.js → .ts`; `export const StatsSchema` |
| `js/logic/game-rules.ts` | `src/core/game-rules.ts` | перенос; `export const GameRules` |
| `js/logic/generator.ts` | `src/core/generator.ts` | перенос; `export class ProblemGenerator` |
| `js/logic/scoring.ts` | `src/core/scoring.ts` | перенос; `export const Scoring` |
| `js/logic/player-rules.js` | `src/core/player-rules.ts` | `.js → .ts`; `PlayerRules`, `export type PlayerAction` |
| `js/logic/player-state.js` | `src/core/player-state.ts` | `.js → .ts`; `export class PlayerState` |
| `js/logic/map-layout.js` | `src/core/map-layout.ts` | `.js → .ts`; `export const MapLayout` |
| `js/errors/custom-errors.ts` | `src/core/errors.ts` | перенос; 5 классов с `export` |
| `js/errors/error-handler.ts` | `src/core/error-handler.ts` | `handleError`, `initGlobalErrorHandlers` |
| `js/storage/repository.ts` | `src/data/repository.ts` | перенос; `export class Repository` |
| `js/storage/local-repository.ts` | `src/data/local-repository.ts` | перенос |
| `js/storage/memory-repository.ts` | `src/data/memory-repository.ts` | перенос; **остаётся** (D8) |
| `js/storage/session-repository.ts` | — | **удалить** (17.6) |
| `js/service/stats-service.ts` | `src/data/stats-service.ts` | перенос; **класс**, `init()` удалён |
| `js/service/session-service.ts` | — | **удалить** (17.6) |
| `js/service/audio-service.js` | `src/services/audio-service.ts` | `.js → .ts`; **класс**, `AudioKind` |
| `src/types.ts` | `src/core/types.ts` + `src/ui/types.ts` | разделить, убрать `declare global` |
| `src/config.ts` | — | **удалить** (17.5) |
| `src/bootstrap.ts` | `src/app/createServices.ts` | переписать в `createServices()` |
| `main.tsx` (корень) | `src/main.tsx` | перенос + CSS + порядок инициализации |
| `src/hooks/useAudio.ts` | — | **удалить** (D4) |

### Импорты по модулям

| Модуль | Значения (`import`) | Типы (`import type`) |
|---|---|---|
| `core/config.ts` | — | `Config`, `GameMap`, `Zone` (`./types`) |
| `core/session-model.ts` | `CONFIG` | `Difficulty`, `GameResult` |
| `core/map-catalog.ts` | `CONFIG` | `GameMap` |
| `core/stats-schema.ts` | `CONFIG`, `CorruptedDataError`, `MapCatalog` | `Stats`, `MapData` |
| `core/game-rules.ts` | `CONFIG` | `GameResult`, `Rating`, `SessionModel` |
| `core/generator.ts` | — | `Difficulty`, `Problem` |
| `core/scoring.ts` | `CONFIG` | — |
| `core/player-rules.ts` | — | — (экспортирует `PlayerAction`) |
| `core/player-state.ts` | — | — |
| `core/map-layout.ts` | — | `Zone`, `Point`, `TrainerPoint`, `MapGeometry` |
| `core/error-handler.ts` | `errors` | `ErrorInfo` |
| `data/local-repository.ts` | `Repository`, `errors` | — |
| `data/memory-repository.ts` | `Repository` | — |
| `data/stats-service.ts` | `StatsSchema`, `MapCatalog`, `handleError`, `errors` | `Repository`, `Stats`, `MapData` |
| `services/audio-service.ts` | — | — |
| `ui/types.ts` | — | доменные типы из `../core/types` |
| `app/types.ts` | — | `AudioService`, `StatsService` |
| `app/createServices.ts` | `CONFIG`, `LocalStorageRepository`, `StatsService`, `AudioService` | `Services` |
| `components/*` | `PlayerRules`, `CONFIG` (только `GameScreen`, `MapScreen`) | пропсы: доменные и view-типы |
| `hooks/*` | модули `core`; сервисы — через `services` | `Services`, доменные и view-типы |
| `App.tsx` | хуки, компоненты | `Services`, `Difficulty`, `GameResult` |

---

## 🚀 Этап 17: ES-модули (SPEC 1.8.2 = «Этап 2»)

Порядок жёсткий: **слой → `tsc` 0 → коммит**, затем один вход, удаление `js/`, smoke, документация. `test/**` не трогаем ни на одном шаге.

| Шаг | Что делается | Файлы | Метка |
|-----|--------------|-------|-------|
| 17.0 | ветка, baseline, копии | — | `baseline 1.8.1` |
| 17.1 | `src/core` (13 модулей, 6 `.js → .ts`) | `src/core/**` | `core` |
| 17.2 | `src/data` (4 модуля, `StatsService` — класс) | `src/data/**` | `data` |
| 17.3 | `src/services` (`AudioService` — класс) | `src/services/audio-service.ts` | `services` |
| 17.4 | view-типы | `src/ui/types.ts` | `types-ui` |
| 17.5 | composition root + оболочка + `tsconfig` + `index.html` | `src/app/**`, `src/main.tsx`, `App.tsx`, хуки, компоненты, `tsconfig.json`, `index.html` | `app`, `build` |
| 17.6 | удаление `js/` и мёртвого кода | `js/**`, `session-*` | `remove-js` |
| 17.7 | красный список + smoke + отчёт | `/tmp/ml-1.8.2-*.txt` | `red-list`, `smoke` |
| 17.8 | документация | README, test/README, GIGACODE, SPEC, TASKS | `docs 1.8.2` |
| 17.9 | финальный аудит | — | `final-audit` |

### 17.0. Подготовка

- `git status --short` — зафиксировать: `SPEC.md`/`RULES.md` modified, `spec_v1_8_2.md`/`rules_v_1_8_2.md`/`PLAN_v1_8_1.md` untracked. **Не коммитить чужие правки** (Z26: никакого `git add -A`).
- `git switch -c refactor/es-modules` — от `HEAD` (`a6f6ffa`).
- Baseline в `/tmp/ml-1.8.2-baseline.txt`: `npx tsc --noEmit` (0), `npm test` (156/12), `git rev-parse HEAD`, `git branch --show-current`.
- Копии для откатов: `/tmp/ml-1.8.2-backup/{js,src,index.html,tsconfig.json,main.tsx}`.
- Прогноз красного списка: **9 сьютов / 113 тестов** (`config` 6, `map-catalog` 9, `session-model` 15, `stats-schema` 16, `player-rules` 13, `player-state` 7, `map-layout` 18, `audio-service` 5, `stats-service` 24); зелёными останутся **3 / 43** (`scoring` 8, `game-rules` 12, `generator` 23) — они дублируют логику у себя.

**Критерий:** ветка `refactor/es-modules`; baseline-файл и копии есть; `tsc` 0. **Охватывает:** A58, TR-40, Z26.

### 17.1. Слой `core` (TR-28, TR-29, TR-30, TR-31, TR-37)

Создать 13 модулей: `types`, `config`, `errors`, `error-handler`, `session-model`, `map-catalog`, `stats-schema`, `game-rules`, `generator`, `scoring`, `player-rules`, `player-state`, `map-layout`.

- Все `const`/`class`/`function` — с `export`; всё используемое — импортом (никаких глобалов).
- Шесть `.js` типизировать по таблице TR-30; JSDoc-аннотации заменить сигнатурами, краевые случаи (`undefined`, `NaN`, пустые массивы, фолбэки) сохранить 1:1.
- `CONFIG` — `export const`; `ZONES`/`MAPS` — внутренние `const`.
- `src/types.ts` пока **остаётся** (глобальные типы нужны ещё не перенесённому `js/`); модули его не используют.

**Проверка:** `npx tsc --noEmit` → 0; `grep -R "window\.\|localStorage\|from 'react'" src/core` — только `window.addEventListener` в `error-handler.ts`; `grep -R "declare global" src/core` — пусто.

**Критерий:** 13 модулей компилируются по отдельности; ни одного `window.X =`, `global.`, `declare global`; `CONFIG` только импортом. **Охватывает:** TR-28/29/30/31, A52/A53/A55/A56, T44.

### 17.2. Слой `data` (TR-28, TR-36, TR-38)

Создать `repository.ts`, `local-repository.ts`, `memory-repository.ts`, `stats-service.ts`.

- `StatsService` — **класс**; `constructor(repo: Repository)`; `init()` удалён; `_repo` не `null`; `load/save/...` 1:1, включая `try/catch` и `handleError`.
- `LocalStorageRepository` бросает `QuotaExceededError`/`StorageUnavailableError`/`CorruptedDataError` — как в 1.8.1.
- `MemoryRepository` остаётся (D8) — контракт и тестовый двойник этапа 3.
- `SessionService`/`SessionRepository` пока **не трогаем** (их удаление — 17.6, пока жив `bootstrap`).

**Проверка:** `npx tsc --noEmit` → 0; `grep -R "SessionService\|SessionRepository" src/data` — пусто; `grep -R "react" src/data` — пусто.

**Критерий:** в `data` нет React/`services`; `StatsService` создаётся только конструктором. **Охватывает:** TR-28/36/38, T44/T45, A53.

### 17.3. Слой `services` (TR-28, TR-30, TR-38)

Создать `src/services/audio-service.ts`: класс `AudioService` вместо IIFE, `AudioKind`, `_sounds`, `_isReady`, `preload`, `play`, `try/catch` + `console.warn` — 1:1.

**Проверка:** `npx tsc --noEmit` → 0; `grep -n "AudioKind" src/services/audio-service.ts` — есть; `grep -R "AudioService" src/services` — только объявление.

**Критерий:** класс, не глобал; ошибки звука глотаются. **Охватывает:** TR-30/38, T45, D4.

### 17.4. View-типы (TR-31)

Создать `src/ui/types.ts`: `MapViewData`, `MapModalTarget`, `ResultsView`, `GameSessionView`, `GameFeedbackView`; импорт домена — только `import type`.

**Проверка:** `npx tsc --noEmit` → 0; `grep -R "declare global" src/ui` — пусто.

**Критерий:** 5 view-типов, все `export`, домен — из `../core/types`. **Охватывает:** TR-31, A56.

### 17.5. Composition root, оболочка и один вход (TR-32…TR-35)

**17.5a — код (коммит `refactor(app)`):**

- `src/app/types.ts` (`Services`), `src/app/createServices.ts`.
- `src/main.tsx` — перенос корневого `main.tsx`: `createServices()`, `audio.preload()`, `initGlobalErrorHandlers()`, `#root`, `render(<App services={services} />)`. CSS-импорты добавляются на 17.5b (до `types: ["vite/client"]` они не типизируются).
- `App.tsx`: `App({ services }: AppProps)`; `useMap(services)`, `useResults(services, …)`, `useGame(services, …)`, `useMapSelection(services, …)`; клики — `services.audio.play('click')` (D20); типы — `import type`.
- Хуки: `services` первым аргументом; `config` → `CONFIG`; `StatsService`/`AudioService` → `services.stats`/`services.audio`; `readMapState(services)`.
- Компоненты: `GameScreen` — `CONFIG`; `MapScreen` — `PlayerRules` + типы; остальные — `import type` пропсов.
- Удалить `src/config.ts`, `src/bootstrap.ts`, `src/hooks/useAudio.ts`, корневой `main.tsx`.

**17.5b — сборка (коммит `refactor(build)`):**

- `tsconfig.json` по T47: `moduleResolution: "Bundler"`, `jsx: "react-jsx"`, `strict`, `noEmit`, `isolatedModules`, `verbatimModuleSyntax`, `types: ["vite/client"]`, `allowJs: true`, `include: ["src", "test", "vite.config.ts", "vitest.config.ts"]`.
- `src/main.tsx` — 6 CSS-импортов в прежнем порядке (`base`, `buttons`, `screens`, `game`, `results`, `map`).
- `index.html` по T48: `head` (`charset`/`viewport`/`title`), `#root` c `style="display: contents"`, один `<script type="module" src="/src/main.tsx">`; ни `<link>`, ни классических скриптов.
- Удалить `src/types.ts` (теперь компилируется только `src/`, глобалы не нужны).

**Проверка:** `npx tsc --noEmit` → 0; `grep -R "declare global" src` — пусто; `grep -REn "window\.[A-Za-z_$]+ *=" src` — пусто; `grep -R "global\." src` — пусто; `grep -R "from '.*config'" src` — только `core/config`; `grep -c '<script' index.html` → 1; `npm run dev` — приложение открывается, консоль чистая.

**Критерий:** один module-скрипт, `createServices()` один раз, `tsc` 0, dev работает; `js/` на диске ещё есть (index.html на него больше не ссылается). **Охватывает:** TR-32/33/34/35/36 (src-часть), A54/T46/T47/T48.

### 17.6. Удаление `js/` и мёртвого кода (TR-36, TR-39)

- `git rm -r js/` (включая `session-service.ts`, `session-repository.ts`).
- Проверить: `test ! -d js`; `grep -R "SessionService\|SessionRepository\|bootstrap" src test` — пусто (кроме истории в документации); `find src -name '*.js'` — пусто.
- `npx tsc --noEmit` → 0; `npm run dev` — работает (ничего из `js/` не импортируется).
- `npm test` → **красный**: 9 сьютов / 113 тестов (ENOENT на `./js/…`); 3 сьюта / 43 — зелёные.

**Критерий:** каталога `js/` нет; тесты красные ровно по прогнозу; `git diff --name-only` не содержит `test/**`. **Охватывает:** TR-28/36/39, A57, Z24/Z25.

### 17.7. Красный список и smoke (TR-39, TR-41)

1. `npx vitest run 2>&1 | tee /tmp/ml-1.8.2-red.txt` — зафиксировать **файл/причину** для каждого красного сьюта; сверить с прогнозом 17.0 (113/9 и 43/3). Если число другое — записать фактическое, не «подгонять».
2. `npx tsc --noEmit` → 0.
3. `npm run dev` — ручной smoke (ниже), консоль без ошибок и предупреждений Vite о неразрешённых импортах.
4. `localStorage.ml_stats` — `version: 3`, структура и суммы прежние; вторая вкладка — модалка «Игра уже запущена».

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Первый запуск | Карта «Математика», счёт 0, игрок перед первым тренажёром |
| 2 | Клик по дальнему / соседнему тренажёру | Дальний — игнор; соседний — движение 600 мс, затем модалка сложности |
| 3 | Выбор сложности | Игра: 10 вопросов, 3 жизни, прогресс, «+10» за верный ответ |
| 4 | 8 верных + 2 неверных | «🎉 Отлично!», «Правильных: 8», «Заработано: 80 ✓», звук `win` |
| 5 | 0 жизней | «💔 Игра окончена», звук `lose`, очки не начислены |
| 6 | «Играть снова» / «На карту» | Новый раунд / карта с обновлённым счётом; commit/revert позиции |
| 7 | 🌍 → другая карта → возврат | Текущая выделена, счёт и позиция по правилам 1.8.1 |
| 8 | F5 и вторая вкладка | Позиция/счёт на месте; вторая вкладка — «Игра уже запущена» |
| 9 | Консоль | Нет ошибок и предупреждений Vite |

**Критерий:** red-list и smoke записаны в `/tmp/ml-1.8.2-red.txt` (и в сводке отчёта); 9 сценариев зелёные. **Охватывает:** TR-39/41, A57, критерии 130–131.

### 17.8. Документация (обязательство агента)

- **`README.md`**: структура — вместо `js/` слои `src/core`/`data`/`services`/`app`; «Запуск»/«Тесты» — 156 тестов остаются, но 9 сьютов красные до этапа 3 (причина — `readSource('./js/…')`); статус-таблица — строка 1.8.2; убрать утверждения «классические слои/порядок скриптов»; smoke-чек-лист — 9 сценариев 1.8.2.
- **`test/README.md`**: «Как тесты читают исходники» — 9 сьютов читают `js/…` и падают после 1.8.2; разъяснение red-list и этапа 3; числа 156/12 не меняются.
- **`GIGACODE.md`**: обзор (ES-модули, один вход), структура (`src/core`, `data`, `services`, `app`, `ui`; `js/` нет), запуск/`tsconfig` (T47), стиль (типы — в `core/types`/`ui/types`, `import type`), архитектура (слои и matrix), раздел «Классические слои в React» и пример `index.html` с 19 скриптами — **удалить/переписать**, «Лимит файла» — без изменений.
- **`.gigacode/specs/SPEC.md`**: статус 1.8.2 → **Выполнено** (после 17.7).
- **`.gigacode/tasks/TASKS.md`**: архив `TASKS_v1_8_1.md`, версия 1.8.2, **этап 17** (17.0–17.9), red-list 113/9, `tsc` 0, ветка без мержа.
- **`.gigacode/plans/`**: `PLAN.md` — эта версия (1.8.2); `PLAN_v1_8_1.md` — архив (создан).

**Критерий:** числа и структура в README/test/README/GIGACODE совпадают с фактическим прогоном; SPEC/TASKS/PLAN — 1.8.2; архивы 1.8.1 на месте. **Охватывает:** SPEC «Что не входит» (док-синк — отдельный шаг), обязательство 10.

### 17.9. Финальный прогон и аудит

| # | Проверка | Ожидание |
|---|----------|----------|
| 1 | `npx tsc --noEmit` | 0 ошибок |
| 2 | `npm test` | 113/156 красных в 9 сьютах; 43/156 зелёных в 3; причины — ENOENT |
| 3 | `grep -R "declare global" src` | пусто |
| 4 | `grep -REn "window\.[A-Za-z_$]+ *=" src` | пусто |
| 5 | `grep -R "global\." src` | пусто |
| 6 | `grep -c '<script' index.html` | 1 |
| 7 | `test ! -d js && echo ok` | ok |
| 8 | `grep -R "SessionService\|SessionRepository\|bootstrap" src test` | пусто |
| 9 | `grep -R "localStorage" src/core src/components` | пусто |
| 10 | `grep -R "from '../config'\|from './config'" src` | только `core/config` |
| 11 | `wc -l src/hooks/useMap.ts` | ≤ 200 |
| 12 | `git diff --name-only` + `git status --short` | код: `src/**`, `index.html`, `tsconfig.json`, удалённый `js/**`; доки; **ничего** в `css/`, `audio/`, `test/`, `package*.json`, `jest.config.js` |
| 13 | `git branch --show-current` | `refactor/es-modules`; в `main`/`fix/fix_statstic` нет коммитов 1.8.2 |
| 14 | `npm run dev` | 9 сценариев 17.7 без регрессий |

**Критерий:** все пункты зелёные; 6–7 атомарных коммитов (`core`, `data`, `services`, `types-ui`, `app`, `build`, `remove-js`, `docs`); **мержа нет**. **Охватывает:** TR-40/41, A58, Z26.

---

## ✅ Критерии завершения (1.8.2, 119–135)

119. **Единый граф модулей** (A52/TR-28/TR-41): `test ! -d js`; `grep -c '<script' index.html` → `1`; `grep -R '<script src="js/'` пусто; в `src/` нет `.js`.
120. **Явные импорты** (A52/TR-29): `grep -R "declare global" src` пусто; `grep -REn "window\.[A-Za-z_$]+ *=" src` пусто; `grep -R "global\." src` пусто; `CONFIG` только из `core/config`; `config.` в `src/` не встречается.
121. **Типы** (A56/TR-31): `src/core/types.ts` + `src/ui/types.ts`; геометрия — в домене; `declare global` нет; все типовые импорты — `import type`; удаление любого импорта даёт ошибку `tsc`, а не «тихий» глобал.
122. **Шесть `.js → .ts`** (TR-30): `map-catalog`, `stats-schema`, `player-rules`, `player-state`, `audio-service`, `map-layout`; JSDoc заменён сигнатурами; `undefined`/`NaN`/фолбэки — 1:1.
123. **`core` без DOM/React/Storage** (A53/TR-37): `grep -R "localStorage\|react\|document\." src/core` пусто; исключение — `window.addEventListener` в `error-handler.ts`.
124. **Composition root** (A54/TR-33): `new StatsService`/`new LocalStorageRepository`/`new AudioService` — только в `src/app/createServices.ts`; `createServices()` вызывается один раз (`src/main.tsx`); `bootstrap()` нет.
125. **Сервисы через пропсы** (T46): `App({ services })`; `useMap(services)`, `useResults(services, cb)`, `useGame(services, deps)`, `useMapSelection(services, cb)`; компоненты сервисов не получают; методы не деструктурируются.
126. **Мёртвый код удалён** (TR-36): `SessionService`, `SessionRepository`, `src/config.ts`, `src/bootstrap.ts`, `src/types.ts`, `src/hooks/useAudio.ts`, корневой `main.tsx`; `grep -R "SessionService\|SessionRepository\|bootstrap" src test` пусто.
127. **`tsconfig`** (T47/TR-35): `moduleResolution: "Bundler"`, `verbatimModuleSyntax`, `isolatedModules`, `types: ["vite/client"]`, `allowJs: true`, `include: ["src", "test", ...]`; `npx tsc --noEmit` → 0.
128. **`index.html`** (T48/TR-34): `#root` с `display: contents`; один `<script type="module" src="/src/main.tsx">`; CSS только импортами в порядке `base` → `buttons` → `screens` → `game` → `results` → `map`; ни `<link>`, ни классических скриптов.
129. **Контракты и имена** (T44/T45/TR-38): публичные имена совпадают; `StatsService` — класс без `init()`; `AudioService` — класс с `AudioKind`; `handleError`/`initGlobalErrorHandlers`; `SessionModel`/`ProblemGenerator`/`PlayerState` — API 1.8.1.
130. **Поведение** (TR-41): 9 сценариев 17.7; 8/2 → 80 / «🎉 Отлично!» / «Правильных: 8»; 0/3 → «💔 Игра окончена»; карта 600 мс; модалки; вторая вкладка; `ml_stats` v3.
131. **Тесты** (A57/TR-39): `git diff --name-only` без `test/**`; 9 сьютов / 113 тестов красные (ENOENT), 3 сьюта / 43 зелёные; красный список зафиксирован; ничего не удалено, не заскиплено, не ослаблено.
132. **Инварианты** (SPEC): `CONFIG` (значения), `Stats` v3, ключи `ml_stats`/`ml_session_lock`, разметка/id/классы/тексты/эмодзи, 21 CSS-файл, звуки — без изменений; `package.json` без новых зависимостей.
133. **Локализация изменений** (TR-40/Z26): изменены только `src/**`, `index.html`, `tsconfig.json`, `js/**` (удалён), документация; `css/`, `audio/`, `test/`, `package.json`, `package-lock.json`, `jest.config.js` — 0 правок.
134. **Ветка и коммиты** (A58/TR-40): `refactor/es-modules` от `a6f6ffa`; атомарные коммиты по слоям; нет мержа в `main`/`fix/fix_statstic`; пуш — только по согласованию.
135. **Документация** (обязательство): README/test/README/GIGACODE/SPEC/TASKS/PLAN — 1.8.2; `PLAN_v1_8_1.md`, `TASKS_v1_8_1.md` — архивы; README фиксирует красный список и этап 3.

---

## 📏 Бюджет строк (лимит GIGACODE — 200)

| Файл | Сейчас | После | Как уложиться |
|---|---|---|---|
| `src/core/types.ts` | — (в `src/types.ts` 171) | **≈130** | домен + JSDoc, без view-моделей; `declare global` и `export {}` уходят |
| `src/ui/types.ts` | — | **≈45** | 5 view-моделей, один `import type` |
| `src/core/stats-schema.ts` | 145 | **≈160** | сигнатуры + `Record<string, unknown>` для миграций |
| `src/core/map-layout.ts` | 138 | **≈155** | типы методов, без изменения логики |
| `src/core/session-model.ts` | 105 | **≈112** | импорты и `export` |
| `src/core/generator.ts` | 139 | **≈142** | `export class`, типы |
| `src/data/stats-service.ts` | 105 | **≈115** | класс + импорты |
| `src/services/audio-service.ts` | 61 | **≈72** | класс вместо IIFE |
| `src/main.tsx` | 26 (корень) | **≈32** | CSS-импорты + `createServices` |
| `src/App.tsx` | 155 | **≈162** | пропсы + импорты типов |
| `src/hooks/useGame.ts` | 175 | **≈185** | `CONFIG`, `services`, типы |
| `src/hooks/useMap.ts` | 200 | **≈200** | **на границе:** сократить шапку на 2–3 строки и ужать импорты (D25) |
| `src/hooks/useResults.ts` | 44 | **≈52** | `services`, типы |
| `src/hooks/useMapSelection.ts` | 49 | **≈56** | `services`, `CONFIG` |
| компоненты (10) | 99–118 | **+1…4 строки** | `import type` / `CONFIG` |

Если `useMap.ts` выйдет за 200 — сначала сокращать шапку/комментарии, **не** выносить новые модули (структура фиксирована TR-28).

---

## 📂 Структура файлов (дельта)

```
index.html                                  # [ИЗМ] #root + один module-скрипт (T48)
tsconfig.json                               # [ИЗМ] T47: Bundler, vite/client, include src
src/
  main.tsx                                  # [NEW] CSS → createServices → preload → handlers → render
  App.tsx                                   # [ИЗМ] App({ services }), импорты типов
  app/
    createServices.ts                       # [NEW] единственная точка создания сервисов
    types.ts                                # [NEW] interface Services
  core/
    config.ts                               # [NEW] CONFIG (из js/model/config.ts)
    types.ts                                # [NEW] домен (из src/types.ts + geometry)
    errors.ts                               # [NEW] 5 исключений
    error-handler.ts                        # [NEW] handleError, initGlobalErrorHandlers
    session-model.ts                        # [NEW] class SessionModel
    map-catalog.ts                          # [NEW] .js → .ts
    stats-schema.ts                         # [NEW] .js → .ts
    game-rules.ts                           # [NEW]
    generator.ts                            # [NEW]
    scoring.ts                              # [NEW]
    player-rules.ts                         # [NEW] .js → .ts
    player-state.ts                         # [NEW] .js → .ts
    map-layout.ts                           # [NEW] .js → .ts
  data/
    repository.ts                           # [NEW]
    local-repository.ts                     # [NEW]
    memory-repository.ts                    # [NEW]
    stats-service.ts                        # [NEW] класс
  services/
    audio-service.ts                        # [NEW] класс, AudioKind
  ui/
    types.ts                                # [NEW] view-модели
  components/                               # [ИЗМ] import type; GameScreen → CONFIG
  hooks/                                    # [ИЗМ] services первым аргументом
    useSessionLock.ts                       # [без изм.]
    useAudio.ts                             # [УДАЛ]
  bootstrap.ts                              # [УДАЛ]
  config.ts                                 # [УДАЛ]
  types.ts                                  # [УДАЛ]
main.tsx (корень)                           # [УДАЛ] переехал в src/main.tsx
js/                                         # [УДАЛ] целиком (19 файлов)
test/                                       # [без изм.] (красный до этапа 3)
css/ audio/                                 # [без изм.] 21 + 3 файла
.gigacode/
  plans/PLAN.md                             # этот файл (1.8.2)
  plans/PLAN_v1_8_1.md                      # архив 1.8.1
  specs/SPEC.md                             # статус 1.8.2 — выполнено (17.8)
  specs/spec_v1_8_2.md                      # источник (не меняется)
  rulles/RULES.md, rules_v_1_8_2.md         # источник (не меняется)
  tasks/TASKS.md                            # версия 1.8.2, этап 17
  tasks/TASKS_v1_8_1.md                     # архив (17.8)
```

---

## 🚫 Запреты

### Z24 (миграция) — буквально

- Оставлять `declare global`, `window.*`-мосты, `globalThis.*`, `global.*` в `src/`.
- Подключать код тегами `<script>` (кроме одного module-скрипта) и `<link>` для CSS.
- Реэкспортировать `CONFIG` (`src/config.ts`) и использовать `config` в нижнем регистре.
- Создавать сервисы в хуках/компонентах, хранить их в модульных переменных, вызывать `init(repo)`, деструктурировать методы.
- Менять значения `CONFIG`, формат `Stats` v3, ключи `ml_stats`/`ml_session_lock`.
- Менять разметку, id, классы, тексты, CSS, звуки; добавлять зависимости (`@vitejs/plugin-react`, Context/Zustand).
- Переписывать тесты, включать `allowJs: false`, «чинить» `vite build`.
- Мержить ветку до зелёного `npm test` (этап 3).

### Z25 (тесты) — буквально

- Удалять, скипать, ослаблять тесты или менять `test/**`.
- Подгонять пути `readSource` под новую структуру в рамках этапа 2.
- Объявлять успех по «частично зелёному» прогону; скрывать красный список из отчёта.

### Z26 (git) — буквально

- Коммитить `node_modules`, `dist`, кэш Vite.
- Делать `git add -A` (в дереве есть посторонние изменения документации).
- Мержить `refactor/es-modules` в основную ветку.
- Переписывать историю (`rebase -i`, `reset --hard`) без согласования.

### Дополнительно для 1.8.2

- Оставлять `src/core` зависящим от React, DOM, `localStorage` (кроме `window.addEventListener` в `error-handler`).
- Импортировать `services`/`data` в компоненты; передавать сервисы пропсами в компоненты.
- Добавлять `any`, `var`, `@ts-ignore`, `@ts-expect-error` вместо типов.
- «Заодно» чинить `npm test`, `vite build`, `jest.config.js`, `package.json`.

---

## 📦 Вне области (SPEC 1.8.2)

- Переписывание тестов на `import`, `allowJs: false`, зелёный `npm test` — **этап 3**.
- Любое изменение поведения, разметки, CSS, текстов, констант, формата `Stats`, ключей хранилища.
- Новые фичи, глобальное состояние (Context/Zustand), `@vitejs/plugin-react`, Fast Refresh.
- `vite build` как критерий: если заработает — побочный эффект, правок под него нет.
- Удаление `jest.config.js`, чистка `package.json`, README/GIGACODE/TASKS — **до шага 17.8**.
- Слияние ветки в `main`/`fix/fix_statstic` (только после этапа 3).

---

## ⚠️ Отклонения/уточнения от буквы SPEC/RULES

| # | Требование | Уточнение | Как решаем |
|---|---|---|---|
| D18 | TR-28: `src/types.ts` → split | Пока `js/` в программе `tsc`, глобальные типы нужны классическим файлам | Split в 17.1/17.4, **удаление** `src/types.ts` — на 17.5b после `include: ["src", …]`; `tsc` доказывает отсутствие глобалов |
| D19 | TR-32: `src/config.ts` удалить | Удаление раньше сломало бы `GameScreen`/`useGame`/`useMap` | Удаляется на 17.5a вместе с их переходом на `CONFIG` |
| D20 | A53: `App` не импортирует значения `services` | T46 передаёт `services` в `App` пропсом; клики в `App` (`playAgain`, `backToMap`, `closeError`) нужно озвучивать | `services.audio.play('click')` через проп; **импорта** значений нет. Альтернатива — перенести клики в хуки (вопрос владельцу) |
| D21 | T47: `include: [..., "vite.config.ts"]` | Файла нет | Шаблон безвреден (SPEC TR-35); `tsc` не находит — не ошибка |
| D22 | TR-39: «старые сьюты упадут» | 3 из 12 сьютов (`scoring`, `game-rules`, `generator`) дублируют логику у себя и останутся зелёными | Красный список — 9 сьютов / **113** тестов, не «все 156»; фиксируем фактическое |
| D23 | TR-36: удалить `SessionService`/`SessionRepository` | Их вызывает `bootstrap.ts`, живой до 17.5 | Удаляются на 17.6 вместе с `js/`; до этого шага остаются нетронутыми |
| D24 | TR-29: побочные импорты только CSS | `src/main.tsx` — единственное место побочных импортов | В `main.tsx` только `import '../css/*.css'`; остальные импорты — с именами |
| D25 | GIGACODE: ≤ 200 строк | `useMap.ts` уже 200 | После импортов ≈207: сокращаем шапку на 2–3 строки и ужимаем импорты; файл не дробим |
| D26 | SPEC: документация — в конце | README/GIGACODE/TASKS описывают `js/` | Синхронизация — отдельный шаг 17.8, после smoke |
| D27 | TR-39: `test/setup.js` не менять | Он объявляет `global.CONFIG` и мок `Audio` | Остаётся как есть; новый код его глобалов не использует; этап 3 решит судьбу |
| D28 | D4 спеки: `useAudio.ts` удалить | `AudioKind` нужен `AudioService` | `AudioKind` объявляется в `services/audio-service.ts`; хук удаляется на 17.5a |
| D29 | A53: `components` не знают `data`/`services` | `MapScreen` использует `PlayerRules` | `PlayerRules` — `core`, разрешено (таблица A53); `GameScreen` — `CONFIG` из `core` |
| D30 | T45: `StatsService` — класс | `_repo` раньше был `null` + `init()` | `private`-подобное поле `_repo` в конструкторе; `init()` нет; поведение 1:1 |
| D31 | D6 спеки: `ErrorHandler` → функции | `handleError` бросает для неизвестных ошибок (как 1.8.1) | Сохраняем `throw error`; `StatsService` ловит `CorruptedDataError`/`StorageUnavailableError` |
| D32 | TR-40: коммиты по слоям | `tsconfig` без `main`/`index` не даёт зелёного `dev` | 17.5 = два коммита (`app` и `build`); промежуточный 17.5a не гарантирует `dev`, критерий шага — после 17.5b |
| D33 | SPEC: `SessionState` не используется | Часть доменного контракта раунда | Оставляем в `core/types.ts` (TR-31) |

---

## 🔗 Трассировка требований

| Требование | Где реализуется | Шаг | Критерии |
|---|---|---|---|
| TR-28. Перенос файлов | `src/core`, `src/data`, `src/services`, удаление `js/` | 17.1–17.6 | 119, 126 |
| TR-29. Явные импорты | все модули; `CONFIG` из `core/config` | 17.1–17.5 | 120 |
| TR-30. `.js → .ts` | 6 файлов | 17.1, 17.3 | 122 |
| TR-31. Типы | `core/types.ts`, `ui/types.ts` | 17.1, 17.4, 17.5b | 121 |
| TR-32. `src/config.ts` | удалён; `GameScreen`, `useGame`, `useMap` | 17.5a | 120, 126 |
| TR-33. Composition root | `src/app/*`, `src/main.tsx`, `App`, хуки | 17.5a | 124, 125 |
| TR-34. `index.html` | `index.html`, CSS в `src/main.tsx` | 17.5b | 128 |
| TR-35. `tsconfig` | `tsconfig.json` | 17.5b | 127 |
| TR-36. Мёртвый код | список удалений | 17.5a, 17.6 | 126 |
| TR-37. Слои | матрица импортов | 17.1–17.5 | 123 |
| TR-38. Контракты | `stats-service`, `audio-service`, `error-handler` | 17.2, 17.3 | 129 |
| TR-39. Тесты | `test/**` без изменений | 17.6, 17.7 | 131 |
| TR-40. Ветка | `refactor/es-modules`, коммиты | 17.0, 17.9 | 134 |
| TR-41. Проверки | команды + smoke | 17.7, 17.9 | 130, 133 |
| A52. ES-модули | все модули, `index.html` | весь этап | 119, 120 |
| A53. Слои | `core ← data ← services ← app` | 17.1–17.5 | 123, 125 |
| A54. Один root | `createServices()` | 17.5a | 124 |
| A55. `CONFIG` | `core/config.ts` | 17.1, 17.5a | 120 |
| A56. Типы-модули | `core/types`, `ui/types` | 17.1, 17.4 | 121 |
| A57. Тесты red | `test/**` не трогаем | 17.6, 17.7 | 131 |
| A58. Ветка | `refactor/es-modules` | 17.0, 17.9 | 134 |
| T44–T46. Структура/контракты/хуки | контракты выше | 17.1–17.5 | 124, 125, 129 |
| T47–T49. Сборка/вход/проверки | `tsconfig`, `index.html`, `main.tsx` | 17.5b, 17.7 | 127, 128, 130 |
| Z24–Z26. Запреты | раздел «Запреты» | весь этап | 119–135 |

---

## ⚠️ Риски и примечания

- **`verbatimModuleSyntax` (R1).** Смешение type/value-импортов даёт TS1484 на каждом шаге; после слоя — `tsc`, иначе ошибки накопятся. `import type` — для всех типов, включая `Repository` в конструкторе `StatsService`.
- **Потеря `this` (R2).** `services.stats.load()` — только через экземпляр; `const { load } = services.stats` запрещён (A54).
- **Циклы (R3).** `hooks → app → hooks` не возникает: `Services` — только тип в `app/types.ts`; `createServices` хуки не импортирует. `core/game-rules` → `core/session-model` — только `import type`.
- **Порядок CSS (R4).** Импорты в `src/main.tsx` строго `base`, `buttons`, `screens`, `game`, `results`, `map`; `map.css` сам собирает `map_items/**` через `@import` (Vite/postcss). Проверить карту/игру/результаты визуально.
- **Кэш Vite (R5).** После переезда `main.tsx` перезапустить `npm run dev`; при «старых путях» удалить `node_modules/.vite`.
- **Тесты «зеленеют» случайно (R6).** 3 сьюта зелёные, потому что дублируют логику; это **не** признак успеха этапа 2 — критерий только `tsc` 0 + red-list.
- **Соблазн «заодно» (R7).** Z24–Z26 прямо запрещают править тесты, `vite build`, `jest.config.js`, `package.json`.
- **`tsc` и `test/**` в программе (R8).** При `allowJs: true` JS-тесты входят в программу, но `checkJs` выключен — ошибок не дают; `test/setup.js` с `vi`/`global` не проверяется.
- **StrictMode (R9).** `createServices()` вызывается **вне** React (в `main.tsx`), двойного создания нет; хуки получают уже готовый экземпляр.
- **`#root` (R10).** `style="display: contents"` сохраняется: `.app` остаётся прямым flex-элементом `body`; иначе поедет раскладка.
- **`index.html` и Vite (R11).** `src="/src/main.tsx"` — корневой путь Vite; прямого открытия файла и `python -m http.server` нет (как и раньше).
- **Слои и `localStorage` (R12).** `localStorage` остаётся только в `data/local-repository.ts` и `hooks/useSessionLock.ts`; в `core`/`components` — `grep` пуст.
- **Документация (R13).** README/GIGACODE содержат десятки упоминаний `js/` и «порядка скриптов»; на 17.8 менять разделы целиком, а не отдельные строки, иначе останутся противоречия.
- **Лимит 200 строк (R14).** `useMap.ts` на границе; следить после импортов, не дробить файл.
- **Песочница.** `npm test`/`npm run dev` пишут `node_modules/.vite` вне сессионного workspace — при работе в песочнице может требоваться расширение доступа; это окружение, а не проект.

### Вопросы владельцу (если не согласовано)

1. **Клики в `App`:** оставить `services.audio.play('click')` через проп (D20) или перенести в хуки (`useResults`/`useMap` получают метод)? По умолчанию — проп.
2. **Коммиты:** 6–7 атомарных коммитов в `refactor/es-modules` — ок? Пуш — только по согласованию.
3. **`useMap.ts`:** допустимо сократить шапку/комментарии, чтобы остаться ≤ 200 строк?
4. **`TASKS.md`:** архив `TASKS_v1_8_1.md` + обновление на месте (как `PLAN_v1_8_1.md`)?

---

## ✅ Ожидаемый результат 1.8.2

- **Один граф модулей:** 19 classic-файлов и 14 глобалов заменены `src/core`/`data`/`services`/`app`; `index.html` — `#root` + один module-скрипт.
- **`CONFIG`** — только `import { CONFIG }`; `declare global`, `window.*`-мосты, `src/config.ts` — отсутствуют.
- **`createServices()`** — единственная точка создания; `App({ services })`, хуки первым аргументом; компоненты сервисов не знают.
- **`tsc --noEmit` — 0**; `npm run dev` — работает, консоль чистая; 9 smoke-сценариев зелёные.
- **Поведение 1:1:** 8/2 → 80/🎉/«Правильных: 8», 0/3 → 💔, карта 600 мс, `ml_stats` v3, CSS и разметка без правок.
- **Тесты:** 113/156 красные в 9 сьютах (ENOENT на `js/…`), 43/156 зелёные в 3; `test/**` не изменён; список зафиксирован — база для этапа 3.
- **Ветка `refactor/es-modules`** с атомарными коммитами, без мержа; документация и `TASKS` — 1.8.2, архивы 1.8.1 на месте.

---

## 📌 Краткая памятка агенту

✅ Ветка `refactor/es-modules` от `a6f6ffa`; `tsc` 0 после каждого слоя
✅ `core` → `data` → `services` → `ui/types` → `app`+`main` → `tsconfig`+`index` → удалить `js/` → smoke → доки
✅ `CONFIG` только `import { CONFIG } from '…/core/config'`; `config.` нет
✅ `StatsService`/`AudioService` — классы; `createServices()` один раз; хуки принимают `services` первым аргументом
✅ `handleError`/`initGlobalErrorHandlers` вместо `ErrorHandler`
✅ `src/core/types.ts` + `src/ui/types.ts`; все типовые импорты — `import type`
✅ `index.html` = `#root` + `<script type="module" src="/src/main.tsx">`; CSS — импорты в прежнем порядке
✅ `test/**` не трогать; 9 сьютов/113 тестов красные — это ожидаемо, зафиксировать
✅ CSS 21 файл, разметка, тексты, `CONFIG`, `Stats` — 0 правок

❌ `declare global`, `window.* =`, `global.`, `<script src="js/…">`, `<link>`
❌ `src/config.ts`, `bootstrap.ts`, `useAudio.ts`, `SessionService`, `SessionRepository`, корневой `main.tsx`
❌ сервисы в компонентах/хуках, module-level синглтоны, `init(repo)`, деструктуризация методов
❌ правки тестов, `allowJs: false`, `vite build`, `jest.config.js`, новые зависимости
❌ мерж до зелёного `npm test` (этап 3); `git add -A`
