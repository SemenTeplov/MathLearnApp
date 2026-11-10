**Версия:** 1.8.2
**Статус:** Выполнено
**Тип документа:** Спецификация архитектурной миграции (SDD)
**Предыдущая версия:** `spec_v1_8_1.md`
**Ветка:** `refactor/es-modules` (от `a6f6ffa`; не мержить до зелёного этапа 3)

> ⚠️ Это единственная спека, которая описывает **структуру**, а не только поведение:
> цель этапа — перевести классические скрипты на ES-модули. Поведение игры при этом
> **не меняется** — оно зафиксировано разделом «Инварианты поведения».
> Для всех остальных этапов правило «SPEC — только ЧТО» сохраняет силу.

## 🎯 Этап 2. Главный этап: классические скрипты → ES-модули

### Цель

Один граф модулей вместо 19 `<script>`-тегов и глобальных переменных:

- каждый файл — модуль с явными `import`/`export`;
- `index.html` — только `#root` и **один** `<script type="module">`;
- `CONFIG` и остальные сущности доступны **только** через `import`;
- `tsc --noEmit` — **0 ошибок**; `npm run dev` — работает;
- тесты на этом этапе **могут быть красными** — их переписывают на `import` на этапе 3;
- поведение, разметка, CSS, ключи хранилища и формат `Stats` — **без изменений**.

### Исходное состояние (baseline 1.8.1)

| Показатель | Значение |
|---|---|
| Классические файлы в `js/` | 19 (13 `.ts` + 6 `.js`) |
| Подключение | 19 `<script>` в `index.html` + `main.tsx` в корне проекта |
| Глобалы | `CONFIG`, `StatsService`, `AudioService`, `SessionService`, `GameRules`, `Scoring`, `MapCatalog`, `StatsSchema`, `PlayerRules`, `PlayerState`, `MapLayout`, `SessionModel`, `ProblemGenerator`, `ErrorHandler`, классы `Repository` |
| Типы | `src/types.ts` через `declare global` (глобальные интерфейсы) |
| `tsc --noEmit` | 0 |
| Тесты | 156/156 в 12 сьютах (зелёные) |
| `vite build` | не работает (классические скрипты не бандлятся) |

### Целевая структура

```
index.html                     # только #root + один module-скрипт
src/
  main.tsx                     # CSS → createServices → preload → handlers → render
  App.tsx                      # App({ services })
  app/
    createServices.ts          # единственная точка создания сервисов
    types.ts                   # тип Services для хуков
  core/                        # домен: без DOM, Storage и React
    config.ts                  # CONFIG
    types.ts                   # доменные типы
    errors.ts                  # StorageError, CorruptedDataError, StorageUnavailableError,
                               # QuotaExceededError, SessionError
    error-handler.ts           # handleError(), initGlobalErrorHandlers()
    session-model.ts           # class SessionModel
    map-catalog.ts             # MapCatalog
    stats-schema.ts            # StatsSchema
    game-rules.ts              # GameRules
    generator.ts               # class ProblemGenerator
    scoring.ts                 # Scoring
    player-rules.ts            # PlayerRules, PlayerAction
    player-state.ts            # class PlayerState
    map-layout.ts              # MapLayout
  data/                        # сохранение: репозитории и StatsService
    repository.ts              # class Repository
    local-repository.ts        # class LocalStorageRepository
    memory-repository.ts       # class MemoryRepository
    stats-service.ts           # class StatsService(repo)
  services/
    audio-service.ts           # class AudioService, тип AudioKind
  ui/
    types.ts                   # view-модели
  components/                  # 10 компонентов, разметка 1:1
  hooks/                       # useGame, useMap, useMapSelection, useResults, useSessionLock
css/                           # 21 файл, 0 правок
audio/                         # 3 файла, 0 правок
test/                          # не меняется на этом этапе (может быть красным)
```

После переноса каталог `js/` удаляется целиком; пустых каталогов не остаётся.

### TR-28. Перенос файлов

| Было | Стало | Действие |
|---|---|---|
| `js/model/config.ts` | `src/core/config.ts` | перенос; `export const CONFIG: Config` |
| `js/model/session-model.ts` | `src/core/session-model.ts` | перенос; `export class SessionModel` |
| `js/model/map-catalog.js` | `src/core/map-catalog.ts` | `.js → .ts`; `export const MapCatalog` |
| `js/model/stats-schema.js` | `src/core/stats-schema.ts` | `.js → .ts`; `export const StatsSchema` |
| `js/logic/game-rules.ts` | `src/core/game-rules.ts` | перенос; `export const GameRules` |
| `js/logic/generator.ts` | `src/core/generator.ts` | перенос; `export class ProblemGenerator` |
| `js/logic/scoring.ts` | `src/core/scoring.ts` | перенос; `export const Scoring` |
| `js/logic/player-rules.js` | `src/core/player-rules.ts` | `.js → .ts`; `export const PlayerRules`, `export type PlayerAction` |
| `js/logic/player-state.js` | `src/core/player-state.ts` | `.js → .ts`; `export class PlayerState` |
| `js/logic/map-layout.js` | `src/core/map-layout.ts` | `.js → .ts`; `export const MapLayout` |
| `js/errors/custom-errors.ts` | `src/core/errors.ts` | перенос; 5 классов с `export` |
| `js/errors/error-handler.ts` | `src/core/error-handler.ts` | перенос; `export function handleError`, `initGlobalErrorHandlers` |
| `js/storage/repository.ts` | `src/data/repository.ts` | перенос; `export class Repository` |
| `js/storage/local-repository.ts` | `src/data/local-repository.ts` | перенос; `export class LocalStorageRepository` |
| `js/storage/memory-repository.ts` | `src/data/memory-repository.ts` | перенос; `export class MemoryRepository` |
| `js/storage/session-repository.ts` | — | **удалить** (мёртвый код, см. D1) |
| `js/service/stats-service.ts` | `src/data/stats-service.ts` | перенос; **класс** `StatsService(repo)` |
| `js/service/session-service.ts` | — | **удалить** (мёртвый код, см. D1) |
| `js/service/audio-service.js` | `src/services/audio-service.ts` | `.js → .ts`; **класс** `AudioService`, `AudioKind` |
| `src/types.ts` | `src/core/types.ts` + `src/ui/types.ts` | разделить, убрать `declare global` |
| `src/config.ts` | — | **удалить**; `CONFIG` импортируется из `src/core/config.ts` |
| `src/bootstrap.ts` | `src/app/createServices.ts` | переписать в `createServices()` |
| `main.tsx` (корень) | `src/main.tsx` | перенос + CSS-импорты + порядок инициализации |
| `src/hooks/useAudio.ts` | — | **удалить** (не импортируется ни одним модулем, см. D4) |

**Критерий готовности:** после переноса ни один файл не лежит в `js/`; `git status` не
показывает удалённых дублей; каждый модуль компилируется по отдельности.

---

### TR-29. Явные `export` и `import`

**Требование.** Каждый файл экспортирует свой публичный API и импортирует всё, что
использует. Никакой идентификатор не берётся из `window`, `globalThis` или порядка
загрузки скриптов.

- `CONFIG` — только `import { CONFIG } from './config'` (внутри `src/core/`) или
  `from '../core/config'` (из других слоёв). Реэкспортов и «типизированных копий» нет.
- Типы — только через `import type { … } from '../core/types'` (или `../ui/types`).
- Побочные импорты допустимы **только** для CSS в `src/main.tsx`.
- Циклов импортов нет: направление зависимостей — по A53 (RULES 1.8.2).
- JSDoc-аннотации заменяются сигнатурами TypeScript; семантика (включая краевые случаи
  `undefined`, `NaN`, пустых массивов и фолбэков) сохраняется 1:1.

**Критерий готовности:** `npx tsc --noEmit` — 0 (любое обращение к неимпортированному
`CONFIG` даёт TS2304); `grep -R "window\.\|global\." src` не находит мостов, кроме
`window.addEventListener` в `error-handler.ts` и `useMap.ts`.

---

### TR-30. Шесть `.js` → `.ts`

Переводу подлежат ровно шесть файлов: `map-catalog`, `stats-schema`, `player-rules`,
`player-state`, `audio-service`, `map-layout`.

| Файл | Что типизировать |
|---|---|
| `map-catalog.ts` | `get(id?: string): GameMap`, `getDefault(): GameMap`, `has(id: string): boolean`, `_all(): GameMap[]`; `CONFIG.MAPS` может быть не массивом — фолбэк сохранить |
| `stats-schema.ts` | `emptyMap(): MapData`, `defaults(): Stats`, `entry(stats: Stats): MapData`, `migrate(data: unknown): Stats`, `ensureMaps(stats: Stats): Stats`; `CorruptedDataError` для версии новее текущей |
| `player-rules.ts` | `export type PlayerAction = 'play' \| 'move' \| 'ignore'`; `getAction(currentIndex: number, targetIndex: number): PlayerAction`; `normalizeIndex(index: number \| null \| undefined, total: number): number` — поведение с `null`/`NaN`/отрицательным `total` сохранить |
| `player-state.ts` | `class PlayerState` с `_current: number`, `_previous: number`; `get index`, `get previous`, `moveTo`, `isReplay`, `revert`, `commitWin` |
| `audio-service.ts` | `export type AudioKind = 'click' \| 'win' \| 'lose'`; `class AudioService` с `_sounds: Map<string, HTMLAudioElement>`, `_isReady: boolean`, `preload(): void`, `play(kind: AudioKind): void`; IIFE заменяется классом, `try/catch` и `console.warn` сохраняются |
| `map-layout.ts` | константы и методы с типами `Zone[]`, `Point[]`, `MapGeometry`, `Point \| null`; округление и фолбэк ширины — без изменений |

**Критерий готовности:** в `src/` не осталось `.js`; `allowJs` нужен только для `test/*.js`
и на этом этапе остаётся `true` (см. D2).

---

### TR-31. Типы: `declare global` → обычные экспорты

`src/types.ts` удаляется. Типы делятся на два модуля.

**`src/core/types.ts` — домен (без React):**

`Difficulty`, `Problem`, `GameResult`, `MapData`, `Stats`, `SessionState`, `ErrorInfo`,
`Rating`, `Zone`, `GameMap`, `Config`, `Point`, `TrainerPoint`, `MapBand`, `MapGeometry`.

> Геометрия (`Point`, `TrainerPoint`, `MapBand`, `MapGeometry`) остаётся в домене, потому что
> её возвращает `MapLayout` из `src/core/`; это не UI-модель, а результат чистой функции.

**`src/ui/types.ts` — view-модели (только React):**

`MapViewData`, `MapModalTarget`, `ResultsView`, `GameSessionView`, `GameFeedbackView`.

- Каждый тип — `export interface` или `export type`; `declare global` **запрещён**.
- `src/ui/types.ts` импортирует доменные типы через `import type` из `../core/types`.
- `SessionState` сохраняется, даже если сейчас не используется: это часть доменного
  контракта состояния раунда.

**Критерий готовности:** `grep -R "declare global" src` — пусто; удаление любого импорта
типа даёт ошибку компиляции, а не «тихое» использование глобала.

---

### TR-32. Удаление `src/config.ts`

Файл `src/config.ts` (`export const config: Config = CONFIG`) удаляется. Все потребители
(`GameScreen.tsx`, `useGame.ts`, `useMap.ts`) переходят на:

```ts
import { CONFIG } from '../core/config';
```

и используют `CONFIG` (верхний регистр) вместо `config`. Значения констант не меняются.

**Критерий готовности:** `grep -R "from '.*config'" src` находит только импорты из
`src/core/config.ts`; файла `src/config.ts` нет; `config.` в `src/` не встречается.

---

### TR-33. Composition root: `createServices()` + `src/main.tsx`

`src/bootstrap.ts` удаляется. Сервисы создаются **один раз** в `src/app/createServices.ts`:

```ts
// src/app/types.ts
import type { AudioService } from '../services/audio-service';
import type { StatsService } from '../data/stats-service';

export interface Services {
    audio: AudioService;
    stats: StatsService;
}
```

```ts
// src/app/createServices.ts
import { CONFIG } from '../core/config';
import { LocalStorageRepository } from '../data/local-repository';
import { StatsService } from '../data/stats-service';
import { AudioService } from '../services/audio-service';
import type { Services } from './types';

export function createServices(): Services {
    const stats = new StatsService(new LocalStorageRepository(CONFIG.STORAGE_PREFIX + 'stats'));
    return { audio: new AudioService(), stats };
}
```

`src/main.tsx` (перенесён из корня):

1. импортирует CSS в прежнем порядке: `base`, `buttons`, `screens`, `game`, `results`, `map`;
2. `const services = createServices();`
3. `services.audio.preload();`
4. `initGlobalErrorHandlers();`
5. проверяет `#root` и вызывает `createRoot(...).render(<StrictMode><App services={services} /></StrictMode>)`.

`App` принимает `services` пропсом; хуки получают их **первым аргументом**:

| Хук | Сигнатура 1.8.2 |
|---|---|
| `useMap` | `useMap(services: Services): UseMap` |
| `useResults` | `useResults(services: Services, onRoundFinished: (ok: boolean) => void): UseResults` |
| `useGame` | `useGame(services: Services, deps: UseGameDeps): UseGame` |
| `useMapSelection` | `useMapSelection(services: Services, onMapChanged: () => void): UseMapSelection` |
| `useSessionLock` | без изменений: `useSessionLock(showError: ShowError): void` |

- Сервисы не создаются в компонентах и хуках и не хранятся в модульных переменных.
- Методы `StatsService`/`AudioService` вызываются через экземпляр (`services.stats.load()`),
  **не** деструктурируются — они используют `this`.
- `SessionService` и `SessionRepository` не заменяются ничем: состояние раунда по-прежнему
  не сохраняется (US-15), для этого достаточно отсутствия кода.

**Критерий готовности:** `AudioService`/`StatsService` не встречаются в коде как глобалы;
`createServices()` вызывается ровно один раз (`src/main.tsx`); в `src/bootstrap.ts` нет.

---

### TR-34. `index.html` — только точка монтирования и модуль

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

- Ни одного `<script src="js/…">`, ни одного классического скрипта.
- CSS подключается импортами из `src/main.tsx`; порядок прежний (см. TR-33), поэтому
  каскад не меняется. Vite инлайнит `@import` из `css/map.css` (postcss-import).
- `style="display: contents"` у `#root` сохраняется: `.app` остаётся прямым flex-элементом
  `body`.

**Критерий готовности:** `grep -c '<script' index.html` → `1`; `grep -R '<script src="js/'`
— пусто; в DevTools грузится `/src/main.tsx` и его модули.

---

### TR-35. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["vite/client"],
    "allowJs": true
  },
  "include": ["src", "test", "vite.config.ts", "vitest.config.ts"]
}
```

- `types: ["vite/client"]` нужен для `import '../css/*.css'` (объявления `*.css`).
- `allowJs: true` **сохраняется** до этапа 3: `test/*.test.js` ещё старые, а `test/setup.js` и
  `test/ts-source.js` остаются JavaScript. Проверено: `allowJs: false` не даёт ошибок `tsc`
  (JS-файлы просто выпадают из программы), поэтому флип — вопрос этапа 3, а не этого.
- `isolatedModules` и `verbatimModuleSyntax` включаются сразу: они ловят смешение
  type/value-импортов (TS1484) на этапе миграции.
- Файла `vite.config.ts` в проекте нет; шаблон в `include` его просто не находит.

**Критерий готовности:** `npx tsc --noEmit` — 0 при `allowJs: true`; правка `types` или
`moduleResolution` не требуется.

---

### TR-36. Мёртвый код

Удаляются:

| Что | Почему |
|---|---|
| `js/storage/session-repository.ts` | единственная ссылка — `bootstrap.ts`; no-op-хранилище ни на что не влияет |
| `js/service/session-service.ts` | то же; состояние раунда не сохраняется по US-15 |
| `src/bootstrap.ts` | заменён `createServices()` |
| `src/config.ts` | заменён импортом `CONFIG` |
| `src/types.ts` | разделён на `core/types.ts` + `ui/types.ts` |
| `src/hooks/useAudio.ts` | не импортируется ни одним модулем; `AudioKind` переезжает в `audio-service.ts` |
| `main.tsx` (корень) | переехал в `src/main.tsx` |

`MemoryRepository` **остаётся**: это документированная реализация контракта `Repository` и
тестовый двойник для этапа 3. `jest.config.js` не трогаем (вне области).

**Критерий готовности:** `test ! -d js`; `grep -R "SessionService\|SessionRepository\|bootstrap" src test` — пусто (кроме истории в документации).

---

### TR-37. Слои и направление зависимостей

| Слой | Может импортировать | Запрещено |
|---|---|---|
| `core` | `core` (types, config, errors), стандартную библиотеку | `data`, `services`, `ui`, `app`, React, DOM-узлы, `localStorage` |
| `data` | `core`, `data` | `services`, `ui`, `app`, React |
| `services` | `services`, при необходимости — `core/types` | `data`, `ui`, `app`, React |
| `ui/types` | `core/types` | всё остальное |
| `app` | `core`, `data`, `services` | `components`, `hooks` |
| `App.tsx` (оболочка) | `components`, `hooks`, `core`, `ui/types`, **тип** `Services` | значения из `data`/`services`, `createServices` |
| `hooks` | `core`, `data`, `services`, `ui/types`, **тип** `Services` | создание сервисов, `components` |
| `components` | `core`, `ui/types`, другие `components`, React | `data`, `services`, `app`, `hooks` |

Циклы запрещены. `core` не знает о React и `localStorage`; компоненты не знают о
`LocalStorageRepository`.

**Исключение:** `core/error-handler.ts` регистрирует `window.addEventListener('error'|'unhandledrejection')` —
это его назначение. DOM-узлы, `localStorage` и React в `core` запрещены и там.

**Критерий готовности:** `npx tsc --noEmit` — 0; визуальная проверка импортов по таблице;
`grep -R "localStorage" src/core src/components` — пусто.

---

### TR-38. Контракты модулей

```ts
// src/core/config.ts
export const CONFIG: Config;            // значения 1.8.1, ZONES/MAPS — внутренние const

// src/core/errors.ts
export class StorageError extends Error;
export class CorruptedDataError extends StorageError;
export class StorageUnavailableError extends StorageError;
export class QuotaExceededError extends StorageError;
export class SessionError extends Error;

// src/core/error-handler.ts
export function handleError(error: Error, context: string): ErrorInfo;
export function initGlobalErrorHandlers(): void;

// src/data/stats-service.ts
export class StatsService {
    constructor(repo: Repository);
    load(): Stats;
    save(stats: Stats): void;
    getCurrentMap(): string;
    getTotalScore(): number;
    updateAfterRound(roundScore: number): void;
    getTrainerIndex(): number;
    saveTrainerIndex(index: number): void;
    switchMap(mapId: string): boolean;
    reset(): void;
}

// src/services/audio-service.ts
export type AudioKind = 'click' | 'win' | 'lose';
export class AudioService {
    preload(): void;
    play(kind: AudioKind): void;
}
```

- `StatsService.init()` удаляется: репозиторий приходит в конструктор.
- `ErrorHandler.handle` → `handleError`, `ErrorHandler.init` → `initGlobalErrorHandlers`:
  модуль экспортирует функции, а не объект-глобал.
- `SessionModel`, `ProblemGenerator`, `PlayerState` сохраняют API 1.8.1 без изменений
  (поля, геттеры, сеттеры, сигнатуры).

**Критерий готовности:** публичные имена совпадают с таблицей; `this`-методы не теряют
контекст при вызове.

---

### TR-39. Тесты на этапе 2 — красные и неприкосновенные

- `test/**` **не меняется** на этом этапе: старые сьюты читают `js/…` через `readSource` +
  `eval` и после переноса упадут (ENOENT / отсутствие глобалов) — это ожидаемо.
- Запрещено удалять, скипать, ослаблять тесты или «подгонять» их под новую структуру.
- `test/setup.js` (мок `Audio`, `global.CONFIG`) остаётся как есть: он понадобится на
  этапе 3 для сравнения, но новый код его глобалов не использует.
- Красный список фиксируется в отчёте этапа (файл/причина), а не в этой спеке.
- Этап 3 переписывает тесты на `import`, после чего `allowJs: false` и `npm test` зелёный.

**Критерий готовности:** `git diff --name-only` не содержит `test/**`; `npm test` красный
или частично красный, и это записано в отчёте.

---

### TR-40. Ветка и коммиты

- Работа — в отдельной ветке `refactor/es-modules` от текущего `HEAD` (`a6f6ffa`).
- Коммиты атомарные, по шагам: `core`, `data`, `services`, `types`, `tsconfig + main`,
  `index.html`, `docs`.
- **Не мержить** в `fix/fix_statstic`/основную ветку, пока не переписаны тесты (этап 3) и
  `npm test` не станет зелёным.
- Ветка может оставаться локальной; push — только по согласованию с владельцем.

**Критерий готовности:** `git branch --show-current` → `refactor/es-modules`; в основной
ветке нет коммитов 1.8.2.

---

### TR-41. Проверки

```bash
npx tsc --noEmit                          # 0 ошибок
npm run dev                               # http://localhost:5173, консоль без ошибок

grep -R "declare global" src              # пусто
grep -REn "window\.[A-Za-z_$]+ *=" src    # пусто
grep -R "global\." src                    # пусто
grep -R "<script src=\"js/" index.html    # пусто
grep -R "from ['\"]\.\./js\|from ['\"]js/" src   # пусто
test ! -d js && echo "js/ удалён"         # js/ удалён
grep -R "allowJs" tsconfig.json           # true (до этапа 3)
```

`tsc` — главный страж: обращение к неимпортированному `CONFIG` или типу даёт TS2304/TS2552,
поэтому «0 ошибок» доказывает отсутствие глобалов, а не только синтаксис.

**Критерий готовности:** все команды выше дают указанный результат; ручной smoke —
раздел «Приёмочные сценарии».

---

### 📋 Инварианты поведения

| Область | Инвариант |
|---|---|
| `CONFIG` | `TOTAL_QUESTIONS: 10`, `MAX_LIVES: 3`, `START_DIFFICULTY: 'easy'`, `POINTS_BASE: 10`, `RATINGS` (100/70/40/0), `GAMEOVER`, `VERSION: 3`, `STORAGE_PREFIX: 'ml_'`, `DEFAULT_MAP: 'math'`, 3 зоны по 5 тренажёров |
| Хранилище | ключ `ml_stats`; `Stats` v3; миграции 1 → 2 → 3 идемпотентны; `switchMap` сбрасывает позицию новой карты в `−1` |
| Раунд | счётчики `correct`/`wrong`, `total = correct + wrong`, оценка по `CONFIG.RATINGS`, `lives <= 0` → «Игра окончена» |
| Карта | позиция `−1…14`, шаг 100px, движение 600 мс, commit/revert, смена карты |
| Сессия | `BroadcastChannel('mathlingo_session')` + `hello`, фолбэк `ml_session_lock` |
| UI | те же id (`#root`, `#mapScreen`, `#gameScreen`, `#resultScreen`), классы, тексты, эмодзи |
| CSS | 21 файл, 0 правок (порядок подключения сохранён) |
| Звук | `audio/click.mp3`, `win.mp3`, `lose.mp3`; ошибки глотаются |
| Зависимости | `package.json` без новых пакетов (React, Vite, vitest, TypeScript — те же) |

---

### ✅ Приёмочные сценарии (ручной smoke в `npm run dev`)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Первый запуск | Карта «Математика», счёт 0, игрок перед первым тренажёром |
| 2 | Клик по дальнему / соседнему тренажёру | Дальний — игнор; соседний — движение 600 мс, затем модалка сложности |
| 3 | Выбор сложности | Игра: 10 вопросов, 3 жизни, прогресс, «+10» за верный ответ |
| 4 | 8 верных + 2 неверных | «🎉 Отлично!», «Правильных: 8», «Заработано: 80 ✓», звук `win` |
| 5 | 0 жизней | «💔 Игра окончена», звук `lose`, очки не начислены |
| 6 | «Играть снова» / «На карту» | Новый раунд / карта с обновлённым счётом; позиция commit/revert |
| 7 | 🌍 → другая карта → возврат | Текущая выделена, счёт и позиция сохраняются по правилам 1.8.1 |
| 8 | F5 и вторая вкладка | Позиция/счёт на месте; вторая вкладка показывает модалку «Игра уже запущена» |
| 9 | Консоль | Нет ошибок и предупреждений Vite о неразрешённых импортах |

---

### 🚫 Что не входит

- Переписывание тестов, `allowJs: false`, зелёный `npm test` — этап 3.
- Изменение поведения, разметки, CSS, текстов, констант, формата `Stats` и ключей хранилища.
- Новые фичи, глобальное состояние (Context/Zustand), `@vitejs/plugin-react`, Fast Refresh.
- `vite build` как критерий: если он заработает после перехода на модули — это побочный
  эффект, дополнительных правок под него не делаем.
- Удаление `jest.config.js`, чистка `package.json`, обновление README/GIGACODE/TASKS
  (синхронизация документации — в конце реализации, отдельным шагом).

---

### ⚠️ Решения и риски

| # | Решение | Обоснование |
|---|---|---|
| D1 | `SessionService`/`SessionRepository` удаляются, хотя `spec_v1_6_0` упоминает их в структуре | Живых ссылок нет (только `bootstrap.ts`); US-15 требует «не сохранять раунд», а не наличия no-op-сервиса; структура файлов переопределена этой спекой |
| D2 | `allowJs` остаётся `true`, хотя в задании есть «убрать allowJs» | Проверено: `allowJs: false` не ломает `tsc` — `.js`-тесты просто выпадают из программы, пользы нет. Флип — этап 3, когда тесты станут `.ts` и `allowJs: false` начнёт что-то значить |
| D3 | CSS переносится в импорты `src/main.tsx`, а не остаётся `<link>` | `index.html` по требованию содержит только `#root` + модуль; Vite инлайнит `@import`; порядок сохранён |
| D4 | `useAudio.ts` удаляется | Ни одного импорта; `AudioKind` нужен `AudioService`, а не хуку |
| D5 | `StatsService` — класс, `init()` удалён | `createServices()` создаёт `new StatsService(repo)`; остальные методы и поведение 1:1 |
| D6 | `ErrorHandler.handle/init` → `handleError/initGlobalErrorHandlers` | Явные функции вместо объекта-глобала; имена совпадают с вызовом в `main.tsx` |
| D7 | `main.tsx` переезжает в `src/` | `include: ["src", ...]` и `src="/src/main.tsx"` иначе несовместимы |
| D8 | `MemoryRepository` остаётся | Реализация контракта `Repository` и тестовый двойник этапа 3 |
| D9 | Версия 1.8.2 | Поведение не меняется, внешнего API у приложения нет; по решению владельца — патч-версия, хотя структура и внутренний API меняются |

| # | Риск | Смягчение |
|---|---|---|
| R1 | `verbatimModuleSyntax` требует `import type` для типов | Прогонять `tsc` после каждого слоя; TS1484 укажет точное место |
| R2 | Потеря `this` при деструктуризации `stats`/`audio` | Вызовы только через экземпляр; правило T44 |
| R3 | Цикл `hooks → app → hooks` | `Services` — только тип в `app/types.ts`, `createServices` хуки не импортирует |
| R4 | Порядок CSS изменится | Импорты в `main.tsx` в прежнем порядке; проверить карту/игру/результаты |
| R5 | Vite закэширует старые пути | Перезапустить `npm run dev`, при необходимости удалить `node_modules/.vite` |
| R6 | Старые тесты «зеленеют» случайно | Не запускать их как критерий; отчёт фиксирует реальный красный список |
| R7 | Соблазн «заодно» поправить тесты/сборку | Z24–Z26 (RULES 1.8.2) прямо запрещают |

---

### 🔗 Трассировка

| Требование | Где реализуется |
|---|---|
| TR-28. Перенос | `src/core`, `src/data`, `src/services`, удаление `js/` |
| TR-29. Импорты | все модули; `CONFIG` из `core/config` |
| TR-30. `.js → .ts` | 6 файлов из таблицы |
| TR-31. Типы | `src/core/types.ts`, `src/ui/types.ts` |
| TR-32. `src/config.ts` | удалён; `GameScreen`, `useGame`, `useMap` |
| TR-33. Composition root | `src/app/*`, `src/main.tsx`, `App.tsx`, хуки |
| TR-34. `index.html` | `index.html`, `src/main.tsx` (CSS) |
| TR-35. `tsconfig` | `tsconfig.json` |
| TR-36. Мёртвый код | список удалений |
| TR-37. Слои | матрица импортов |
| TR-38. Контракты | `stats-service.ts`, `audio-service.ts`, `error-handler.ts` |
| TR-39. Тесты | `test/**` без изменений |
| TR-40. Ветка | `refactor/es-modules` |
| TR-41. Проверки | команды + smoke |

---

### ✅ Результат реализации

| Проверка | Факт |
|---|---|
| `npx tsc --noEmit` | 0 ошибок |
| `js/` | удалён целиком (19 файлов) |
| `index.html` | `#root` + 1 module-скрипт; CSS — импорты `src/main.tsx` |
| Глобалы | `declare global` / `window.*=` / `global.` в `src/` — 0 |
| `npm test` | 9 сьютов / **113** тестов красные (`ENOENT` на `./js/…`), **43/156** зелёных в 3 сьютах; `test/**` не менялся |
| `npm run dev` | работает, консоль без ошибок приложения |
| Smoke (headless Chromium) | 9 сценариев / 15 проверок — все зелёные |
| `npx vite build` | собирается (53 модуля) — побочный эффект; `audio/` в `dist` не копируется |
| Ветка | `refactor/es-modules`; без мержа |

### 🔄 История версий — дополнение

| Версия | Дата | Изменения |
|---|---|---|
| 1.8.0 | 2026 | Миграция всех экранов на React |
| 1.8.1 | 2026 | Фактические `correct`/`wrong` в результатах |
| **1.8.2** | 2026 | Классические скрипты → ES-модули: `src/core`, `src/data`, `src/services`, `createServices()`, один module-скрипт; поведение не меняется |
