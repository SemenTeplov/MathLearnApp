## 🏛️ Архитектурные принципы — дополнения (1.8.2)

### A52. ES-модули — единственный способ связи

**Правило:** весь код приложения — ES-модули с явными `import`/`export`.

**Правила:**

- `index.html` содержит **только** `#root` и **один** `<script type="module">`;
- запрещены `<script src="js/…">`, «порядок загрузки» как зависимость и hoisting-глобалы;
- запрещены `declare global`, `window.X = …`, `globalThis.X = …`, `global.X = …` в `src/`;
- `window.*` допустим только для API браузера (`addEventListener`, `BroadcastChannel`,
  `localStorage`) — не для передачи данных между модулями;
- CSS подключается импортами из `src/main.tsx`, а не `<link>` в HTML.

**Причина:** 19 скриптов и глобалы делали граф зависимостей неявным, ломали `vite build`
и требовали ручного порядка подключения.

### A53. Слои и направление зависимостей

**Правило:** `core` ← `data` ← `services` ← `app`; типы — вниз, вызовы — вниз.

**Правила:**

- `core` не импортирует `data`, `services`, `ui`, `app`, React и `localStorage`; допустимое
  исключение — `window.addEventListener` в `core/error-handler.ts` (глобальные обработчики);
- `data` не импортирует `services`, `ui`, `app`, React;
- `services` не импортирует `data`, `ui`, `app`, React;
- `ui/types` импортирует только `core/types`;
- `app` (composition root) импортирует `core`, `data`, `services` и **не** импортирует
  `components`/`hooks`;
- `App.tsx` (оболочка) импортирует `components`, `hooks`, `core`, `ui/types` и **тип**
  `Services`; значения из `data`/`services` и `createServices` — нельзя;
- `hooks` импортируют `core`, `data`, `services`, `ui/types` и **тип** `Services`;
- `components` импортируют `core`, `ui/types`, другие компоненты и React; **не** импортируют
  `data`, `services`, `app`, `hooks`;
- циклы импортов запрещены; один файл — один слой.

**Причина:** домен не должен зависеть от браузера и React; презентация — от способа хранения.

### A54. Единственный composition root

**Правило:** экземпляры сервисов создаются **один раз** в `createServices()`.

**Правила:**

- `src/app/createServices.ts` — единственное место `new StatsService(...)`,
  `new LocalStorageRepository(...)`, `new AudioService()`;
- хуки и компоненты **не создают** сервисы и не хранят их в модульных переменных;
- `main.tsx` вызывает `createServices()` ровно один раз и передаёт результат в `<App/>`;
- сервисы передаются явно: `App({ services })` → хук первым аргументом;
- ленивая инициализация (`init(repo)`) и module-level синглтоны запрещены;
- методы экземпляров не деструктурируются (`const { load } = stats` запрещено) — они
  используют `this`.

**Причина:** явные зависимости тестируемы и не превращаются в новый скрытый глобал.

### A55. `CONFIG` — только через `import`

**Правило:** единственный источник констант — `src/core/config.ts`.

**Правила:**

- `export const CONFIG: Config`; значения 1.8.1 не меняются;
- `ZONES` и `MAPS` — внутренние `const`, наружу отдаются через `CONFIG`;
- `src/config.ts` и любые реэкспорты `CONFIG` удалены;
- каждый потребитель пишет `import { CONFIG } from '…/core/config'`;
- `config` (нижний регистр) в коде больше не используется.

**Причина:** глобальный `CONFIG` был главным источником неявных зависимостей.

### A56. Типы — обычные модули

**Правило:** типы экспортируются, а не объявляются глобально.

**Правила:**

- `declare global` в `src/` запрещён;
- домен — `src/core/types.ts`; view-модели — `src/ui/types.ts`;
- геометрия карты (`Point`, `TrainerPoint`, `MapBand`, `MapGeometry`) — в домене, потому что
  её возвращает `MapLayout`;
- типовые импорты — только `import type` (требование `verbatimModuleSyntax`);
- типы не дублируются в компонентах и тестах.

**Причина:** глобальные интерфейсы скрывали связи и конфликтовали с `allowJs`.

### A57. Тесты на этапе 2 — красные и неприкосновенные

**Правило:** `test/**` на этом этапе не меняется.

**Правила:**

- старые сьюты читают `js/…` через `readSource` + `eval`; после переноса они падают —
  это **ожидаемый** результат, а не повод править тесты;
- запрещено удалять, скипать, ослаблять тесты и «подгонять» их под новую структуру;
- `test/setup.js` и `test/ts-source.js` остаются `.js` до этапа 3;
- `allowJs: true` сохраняется до этапа 3;
- реальный красный список фиксируется в отчёте этапа.

**Причина:** тесты — страховка поведения; переписывать их одновременно с миграцией значит
потерять проверку. Сначала структура (этап 2), потом тесты (этап 3).

### A58. Ветка и запрет мержа

**Правило:** миграция делается отдельной веткой и не мержится до зелёных тестов.

**Правила:**

- ветка `refactor/es-modules` от текущего `HEAD`;
- коммиты атомарные, по слоям/шагам;
- запрещён мерж в основную ветку до завершения этапа 3 (`npm test` зелёный);
- push — только по согласованию с владельцем.

---

## 🔧 Технические ограничения — дополнения (1.8.2)

### T44. Целевая структура и публичные имена

**Пути:** `src/core/*`, `src/data/*`, `src/services/*`, `src/ui/types.ts`,
`src/app/{createServices,types}.ts`, `src/main.tsx`. Каталог `js/` удаляется.

**Публичные имена (менять нельзя):**

`CONFIG`, `MapCatalog`, `StatsSchema`, `GameRules`, `Scoring`, `PlayerRules`,
`PlayerAction`, `MapLayout`, `SessionModel`, `ProblemGenerator`, `PlayerState`,
`Repository`, `LocalStorageRepository`, `MemoryRepository`, `StatsService`, `AudioService`,
`AudioKind`, `handleError`, `initGlobalErrorHandlers`, `createServices`, `Services`.

**Удаляются:** `SessionService`, `SessionRepository`, `src/config.ts`, `src/bootstrap.ts`,
`src/types.ts`, `src/hooks/useAudio.ts`, корневой `main.tsx`.

### T45. Контракты сервисов

```ts
// src/app/types.ts
export interface Services {
    audio: AudioService;
    stats: StatsService;
}

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

// src/core/error-handler.ts
export function handleError(error: Error, context: string): ErrorInfo;
export function initGlobalErrorHandlers(): void;
```

- `StatsService.init()` удалён; `_repo` приходит в конструктор и не бывает `null`.
- Поведение методов 1:1 с 1.8.1 (включая обработку ошибок и `try/catch`).
- `AudioService` — класс вместо IIFE; `_sounds`, `_isReady`, `try/catch`, `console.warn`
  сохраняются.

### T46. Сигнатуры хуков

| Хук | Сигнатура |
|---|---|
| `useMap` | `useMap(services: Services): UseMap` |
| `useResults` | `useResults(services: Services, onRoundFinished: (ok: boolean) => void): UseResults` |
| `useGame` | `useGame(services: Services, deps: UseGameDeps): UseGame` |
| `useMapSelection` | `useMapSelection(services: Services, onMapChanged: () => void): UseMapSelection` |
| `useSessionLock` | `useSessionLock(showError: ShowError): void` (без изменений) |

`App` — `App({ services }: AppProps)`. Компоненты сервисов не получают.

### T47. `tsconfig.json` 1.8.2

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

`allowJs: true` — временно, до этапа 3. `types: ["vite/client"]` обязателен для импорта CSS.
Отключение `allowJs` раньше этапа 3 запрещено (Z24).

### T48. `index.html` и `src/main.tsx`

**`index.html`:** `head` с `charset`/`viewport`/`title`; в `body` — `#root` с
`style="display: contents"` и один `<script type="module" src="/src/main.tsx">`. Ни `<link>`,
ни классических скриптов.

**Порядок в `src/main.tsx`:**

1. CSS-импорты: `base`, `buttons`, `screens`, `game`, `results`, `map` (порядок 1.8.1);
2. `const services = createServices();`
3. `services.audio.preload();`
4. `initGlobalErrorHandlers();`
5. проверка `#root` → `createRoot(...).render(<StrictMode><App services={services} /></StrictMode>)`.

### T49. Проверки

```bash
npx tsc --noEmit
npm run dev
grep -R "declare global" src
grep -REn "window\.[A-Za-z_$]+ *=" src
grep -R "global\." src
grep -R '<script src="js/' index.html
grep -R "from ['\"]\.\./js\|from ['\"]js/" src
test ! -d js
grep -R "allowJs" tsconfig.json
```

---

## 🚫 Запреты — дополнения (1.8.2)

### Z24. Запрещено при миграции

- оставлять `declare global`, `window.*`-мосты, `globalThis.*`, `global.*` в `src/`;
- подключать код тегами `<script>` (кроме одного module-скрипта) и `<link>` для CSS;
- реэкспортировать `CONFIG` (`src/config.ts`) и использовать `config` в нижнем регистре;
- создавать сервисы в хуках/компонентах, хранить их в модульных переменных, вызывать
  `init(repo)` или деструктурировать методы;
- менять значения `CONFIG`, формат `Stats` v3, ключи `ml_stats`/`ml_session_lock`;
- менять разметку, id, классы, тексты, CSS, звуки;
- добавлять зависимости (`@vitejs/plugin-react`, Context/Zustand и т.п.);
- переписывать тесты, включать `allowJs: false`, «чинить» `vite build`;
- мержить ветку до зелёного `npm test` (этап 3).

### Z25. Запрещено в тестах

- удалять, скипать, ослаблять тесты или менять `test/**`;
- подгонять пути `readSource` под новую структуру в рамках этапа 2;
- объявлять успех по «частично зелёному» прогону;
- скрывать красный список из отчёта.

### Z26. Запрещено в git

- коммитить `node_modules`, `dist`, кэш Vite;
- делать `git add -A` (в дереве есть посторонние изменения документации);
- мержить `refactor/es-modules` в основную ветку;
- переписывать историю (`rebase -i`, `reset --hard`) без согласования.

---

## ✅ Обязательства агента — дополнения (1.8.2)

1. Создать ветку `refactor/es-modules`; работать только в ней.
2. Перенести файлы по таблице TR-28; удалить мёртвый код (TR-36).
3. Добавить `export` и явные `import` во все модули; `CONFIG` — только импортом.
4. Перевести 6 `.js` в `.ts`; JSDoc заменить сигнатурами, семантику сохранить.
5. Убрать `declare global`, разделить типы на `core/types.ts` и `ui/types.ts`.
6. Сделать `createServices()` и новый `src/main.tsx`; провести сервисы через `App`/хуки.
7. Переписать `index.html` и `tsconfig.json` по T47/T48.
8. После каждого шага — `npx tsc --noEmit`; в конце — smoke-сценарии TR-41.
9. Не трогать `test/**`; зафиксировать красный список в отчёте.
10. Не мержить; сообщить владельцу о готовности к этапу 3.

---

## 📌 Краткая памятка агенту — дополнения

✅ Один граф модулей, явные `import`/`export`
✅ `src/core`, `src/data`, `src/services`, `src/app`
✅ `CONFIG` — только `import { CONFIG }`
✅ `createServices()` — единственная точка создания
✅ `index.html` = `#root` + один module-скрипт
✅ `tsc --noEmit` — 0
✅ Ветка `refactor/es-modules`, без мержа
✅ Тесты красные — это ожидаемо

❌ `declare global`, `window.*`-мосты
❌ `<script src="js/…">`, `<link>` для CSS
❌ `src/config.ts`, `config.*`
❌ `SessionService`, `SessionRepository`
❌ Правки `test/**`, `allowJs: false`
❌ Изменения поведения, CSS, разметки, `CONFIG`
❌ Мерж до зелёного этапа 3

---

## 🔄 История версий — дополнение

| Версия | Дата | Изменения |
|---|---|---|
| 1.8.0 | 2026 | Миграция всех экранов на React |
| 1.8.1 | 2026 | Счётчики `correct`/`wrong`, `total = отвечено` |
| **1.8.2** | 2026 | ES-модули, слои `core`/`data`/`services`, composition root, один module-скрипт |
