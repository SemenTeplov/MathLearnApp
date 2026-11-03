# План — MathLingo

**Версия:** 1.8.0  
**Статус:** Этап 15 «Миграция экранов на React» (SPEC 1.8.0 — «Этап 3») — ✅ реализован  
**Предыдущие этапы:** 1–14 (1.2.0–1.7.0) — ✅ реализованы; базовая линия 1.7.0: **`tsc --noEmit` — 0 ошибок, 182 теста в 14 сьютах, 15 `.ts` в `js/` + 3 `.tsx`**  
**Создан на основе:** RULES 1.8.0 (`rules_v_1_8_0.md`) и SPEC 1.8.0 (`spec_v1_8_0.md`)  
**Предыдущая версия плана:** 1.7.0 (`plans/PLAN_v1_7_0.md`) — реализована; 1.6.0 (`plans/PLAN_v1_6_0.md`) — архив  
**Тип изменения:** замена View/Controller на React-компоненты **по одному экрану**; CSS, игровая логика, Storage и `Stats` v3 **не меняются**.

---

## ⚠️ Решения, на которых стоит план

| # | Решение | Следствие |
|---|---------|-----------|
| 1 | **Экран мигрирует «порталом» в свой существующий контейнер.** До 15.6 React рисует **содержимое** экрана в тот же DOM-узел (`#resultScreen`, `#gameScreen`, `#mapRoot`), а класс `.active` по-прежнему переключает `ScreenView` | Верстка и CSS (A46) не меняются; каждый шаг изолирован (A41); удаление контейнеров и `ScreenView` — один раз, на 15.6 |
| 2 | **Модалки живут в дереве `App`, без порталов** | `.modal-overlay` — `position: fixed`, `z-index: 1000`, место в DOM не важно. Контейнеры `#difficultyModal` и `#mapSelectModal` убираются из HTML, классы и разметка внутри — те же |
| 3 | **Один временный мост `window.mlBridge`** (`Partial<MlBridge>`, тип в `src/types.ts`): старый JS вызывает React | Мост живёт с 15.1 по 15.5 и **удаляется вместе с последним legacy-вызывающим**; `window.showErrorModal` (мост 1.7.0) удаляется на 15.6 вместе с `ErrorView` (A40: «после Этапа 3 уберём `window`») |
| 4 | **Контроллер экрана превращается в хук** (SPEC 1.8.0: «удаляется или превращается в хук») | `results-controller` → `useResults`, `game-controller` → `useGame`, `map-controller` → `useMap`, `global-map-controller` → `useMapSelection`, `session-controller` → `useSessionLock`, `AudioService` → `useAudio`. View-файлы удаляются |
| 5 | **Model / Logic / Storage / Service / Errors остаются классическими глобалами** в `js/` (13 `.ts` + 6 `.js`) | React читает их как глобалы (вывод типов через `allowJs`), `src/config.ts` — типизированный ре-экспорт `CONFIG` для компонентов. Перевод слоёв в ES-модули — **не** Этап 3: импорт классического скрипта как модуля лишает его глобалов и ломает порядок инициализации и тесты |
| 6 | **`main.tsx` остаётся в корне** (A38/T32), хотя дерево T36 показывает его в `src/` | Рабочая точка входа `index.html` → `/main.tsx` не меняется; `types.ts` переезжает в `src/`, появляется `src/config.ts` (T36) |
| 7 | **Движение игрока — CSS `transition: transform 600ms` + `onTransitionEnd`** (A47), без `setTimeout`-на-приход и без `requestAnimationFrame` | `isMoving` снимается в обработчике `transitionend` (guard: `propertyName === 'transform'`, `target === currentTarget`), прибытие обрабатывает сохранённый в `ref` колбэк |
| 8 | **Тесты (согласовано с владельцем):** сьюты чистой логики остаются; `map-layout` переезжает в `js/logic/` и получает **только правку пути** (18 тестов). Три сьюта, читающие удаляемые `view/controller` (9 + 13 + 19 = **41**), удаляются вместе с файлами | **141/141 в 11 сьютах**. Сокращение объёма проверок UI-слоя осознанное: 123 теста логики сохраняются. Порт на React-тесты — вне Этапа 3 (Z19) |
| 9 | **Git — нет (решение владельца).** Репозиторий не создаём | Вместо коммитов после каждого экрана — **контрольная точка**: `md5sum`-снимок `js/`, `css/`, `index.html` + запись в `/tmp/ml-1.8.0-log.txt`; перед удалением файлов шага — их копия в `/tmp/ml-1.8.0-backup/<шаг>/`. Обязательство A43 «коммит» выполняется по духу — фиксацией состояния (D12) |
| 10 | **`#root` получает inline `display: contents`** на 15.6 | `body` — flex-контейнер, `.app` должен остаться его прямым flex-элементом, иначе карточка перестанет растягиваться до `max-width: 600px`. CSS-файлы не меняются (inline-стиль контейнера — разметка, не CSS) |
| 11 | **Мёртвый код убирается:** `GameModel` создаётся в `script.js` и нигде не используется → удаляется на 15.7; `.streak-badge` (ни один обработчик не добавляет `.show`) → удаляется из HTML на 15.6 | Z21 «не оставлять мёртвый код» |
| 12 | **Порядок жёсткий:** 15.1 → 15.2 → 15.3 → 15.4 → 15.5 → 15.6 → 15.7 | После **каждого** экрана: `npm run dev`, прогон сценариев, `tsc`, `npm test`, контрольная точка (A41–A43, D12) |

**Владелец подтвердил (29.10.2026):** тесты — сокращаем до 141/141 (№8); git — **не создаём** (№9); classic-теги слоёв остаются (D2).

---

## 🎯 Цель

Заменить **все** экраны на React, **не сломав** игру и не изменив ни пикселя оформления:

- **`src/components/`**: `ResultsScreen`, `MapSelectionModal`, `GameScreen`, `MapScreen` + `Zone`/`Trainer`/`Player`/`Path`, `Header`, существующий `ErrorModal` (TR-15…TR-19, T36/T37);
- **`src/hooks/`**: `useResults`, `useGame`, `useMap`, `useMapSelection`, `useSessionLock`, `useAudio` (T36/T38);
- **старые `view/*.js` (9), `controller/*.js` (6) и `js/script.js` — удалены**; в `js/` остаются только слои Model/Logic/Storage/Service/Errors (TR-21);
- **CSS (21 файл), `Stats` v3, ключ `ml_stats`, пороги оценок, генератор, движение 600 мс — без изменений** (A46, Z19);
- **`tsc --noEmit` — 0 ошибок; `npm test` — 141/141** (после неизбежного сокращения UI-сьютов, решение №8); **игра играется** через `npm run dev` после каждого шага (TR-22).

Никакого глобального состояния (Context/Zustand), оптимизаций, новых фич, новых тестов и правок CSS.

---

## 📐 Что именно меняет 1.8.0

| Источник | Требование | Следствие для плана |
|----------|-----------|---------------------|
| **TR-15** | `ResultsScreen.tsx`; пропсы `results`, `rating`, `onPlayAgain`, `onBackToMap`; иконка/оценка/статистика/заработано; две кнопки; полная типизация | Шаг 15.1: компонент + `useResults`; `results-view.js` и `results-controller.js` удаляются |
| **TR-16** | `MapSelectionModal.tsx`; пропсы `maps`, `currentMap`, `onSelect`, `onClose`; список, выделение текущей, «Закрыть» | Шаг 15.2: компонент + `useMapSelection`; `global-map-view.js` удаляется, `global-map-controller.js` сжимается до адаптера кнопки 🌍 |
| **TR-17** | `GameScreen.tsx`; состояние через `useState`/`useReducer`; пропсы `session`, `question`, `onAnswer`, `onNext`, `onExit`; вопрос, 4 ответа, жизни, счёт, feedback | Шаг 15.3: компонент + `useGame`; `game-view.js` и `game-controller.js` удаляются |
| **TR-18** | `MapScreen.tsx` + `Zone`, `Trainer`, `Player`, `Path`; состояние `currentTrainerIndex`, `isModalOpen`, `isMoving`; пропсы `stats`, `mapData`, `onTrainerClick`, `onSelectDifficulty`; зоны, тренажёры, игрок, SVG-дорога; движение CSS transitions | Шаг 15.4: пять компонентов + `useMap`; `map-view.js`, `map-player-view.js`, `map-controller.js` удаляются; `map-layout.js` переезжает в `js/logic/` (чистая геометрия) |
| **TR-19** | `Header.tsx`; пропсы `totalScore`, `onOpenMapSelection`; счёт 🏆 и 🌍 | Шаг 15.5: компонент; `global-map-controller.js` удаляется; мост `mlBridge` исчезает полностью |
| **TR-20** | Удалить экран приветствия; удалить/адаптировать `screen-view.js` и `app-controller.js` | Экран приветствия отсутствует с 1.5.0 (проверено) — шаг 15.6 фиксирует это и удаляет `app-controller.js`, `session-controller.js` (→ `useSessionLock`), `screen-view.js`, `error-view.js`, `dom.js` |
| **TR-21** | Все `view/*.js`, `controller/*.js`, `script.js` удалены; в `js/` только слои; `main.tsx` — единственная точка входа | Шаг 15.7: `src/bootstrap.ts` + чистый `main.tsx`; каталоги `view/` и `controller/` исчезают |
| **TR-22** | После всех изменений игра работает: карта, игра, результаты, глобальная карта, все сценарии | Шаги 15.6/15.8: сквозной прогон 16 сценариев |
| **A41–A43** | Один экран — одна задача; порядок фиксирован; старые файлы удаляются; фиксация после каждого | Таблица шагов и контрольных точек ниже; git нет — D12 |
| **A44** | Только функциональные компоненты, пропсы-интерфейсы, хуки | T37-контракты в разделе «Контракты» |
| **A45** | Локальное состояние; глобальное — позже (Этап 4); props drilling допустим | Состояние — в `App` + хуках; **никакого** Context/Zustand/redux |
| **A46** | CSS не меняется; классы и стили те же | md5-аудит 21 CSS-файла на 15.8; inline-стили переносятся как есть |
| **A47** | Движение — `transform: translate()` + `transition: 600ms` + `onTransitionEnd`; без `requestAnimationFrame` | `Player.tsx` + `useMap` |
| **T36** | Структура `src/`: components / hooks / types.ts / config.ts / main.tsx / App.tsx | Совпадает, кроме `main.tsx` (решение №6) |
| **T37** | Функциональные; `ComponentNameProps`; `export function`; JSX без `createElement`; `key` в списках | Проверка на 15.8 (`grep`) |
| **T38** | Хуки: только в компонентах, имя с `use`, без условных вызовов, зависимости в `useEffect` | Проверка на 15.8 |
| **T39** | `onClick` (не `onclick`), `stopPropagation`/`preventDefault` где нужно, без навешивания обработчиков на DOM напрямую | Все обработчики — пропсами React |
| **T40** | Один `<svg>` на карту, один `<path>`, кубические кривые `C`, `viewBox` под карту | `Path.tsx`; `MapLayout.buildRoadPath` не меняется |
| **Z19** | Запрещено: глобальное состояние, оптимизация, тесты, новые фичи, изменение CSS, изменение логики игры | Раздел «Запреты» |
| **Z20** | Запрещено: классовые компоненты, `any`, прямой DOM (кроме `ref`), бизнес-логика в компонентах, `var` | Компоненты — презентационные; логика — в хуках/слоях |
| **Z21** | Запрещено: два экрана одновременно, старый JS после миграции, правки CSS, новые фичи, мёртвый код | Пошаговое удаление и аудит |

---

## ✅ Что НЕ меняется

| Область | Факт |
|---------|------|
| CSS | 21 файл `css/**` — **0 правок**; все классы, `@import`-структура и inline-стили (`#roundEarnings`, сообщение `ErrorModal`) сохраняются |
| Игровая логика | Пороги оценок (100/70/40), 3 жизни, 10 вопросов, `POINTS_BASE = 10`, сгорание очков при выходе, условие завершения — те же вызовы `GameRules`/`Scoring` |
| Игрок | Старт `−1`, шаг 100px, соседний/текущий/дальний, `PlayerState` (`moveTo`/`isReplay`/`revert`/`commitWin`), `MOVE_MS = 600` |
| `Stats` | `version: 3`, `currentMap` + `maps`, ключ `ml_stats`, миграции 1 → 2 → 3, `switchMap` сбрасывает позицию |
| Storage / Service | `Repository`, `LocalStorageRepository`, `SessionRepository`, `StatsService`, `SessionService` — API и поведение |
| Звук | `AudioService.preload/play`; те же точки: клик по 🌍/«Закрыть»/карте/сложности/ответу/«Продолжить»/✕/«Играть снова»/«На карту»; `win`/`lose` на результатах |
| Модели | `SessionModel`, `ProblemGenerator`, `PlayerState`, `PlayerRules`, `MapLayout` — без изменения логики |
| Порядок classic-скриптов | Errors → Audio → Model → Storage → Service → Logic; React-модуль — после (ES-модуль отложен до разбора DOM) |
| Поведение экранов | Все сценарии 1.5.0–1.7.0: карта, счёт, позиция, 🌍, список карт, no-op, модалка сложности, отмена-откат, повторная игра, результаты, перезагрузка, блокировка второй вкладки, `ml_stats` = v3 |

---

## 📎 Исходное состояние (проверено 29.10.2026 перед составлением плана)

| Проверка | Факт | Вывод |
|----------|------|-------|
| `npx tsc --noEmit` | **0 ошибок** (15 `.ts` в `js/` + `main.tsx`, `src/App.tsx`, `src/components/ErrorModal.tsx`) | Исходная точка зелёная |
| `npm test` | **182/182** в **14** сьютах, ~7.8 с (vitest + jsdom) | Базовая линия; 59 тестов из них — карта (18 layout + 13 view + 19 controller + 9 global) |
| `package.json` | `react`/`react-dom` 19.3.1 в `dependencies`; `@types/react`/`@types/react-dom` ^19.3; `build` = `typecheck` | Новых зависимостей Этап 3 не требует |
| `tsconfig.json` | `jsx: react-jsx`, `strict`, `allowJs`, `noEmit`, `skipLibCheck`, `types: []`, `include: ["js", "src", "*.tsx"]` | `.tsx` уже в программе; менять не нужно |
| `index.html` | **161** строка; **35 активных** `<script>` = 14 `.ts` + 20 `.js` + 1 module; `js/script.js` закомментирован; 6 `<link>`; `#root` перед `</body>` | Гибрид 1.7.0 работает |
| `js/` | **36 файлов, 2461 строка**; 15 `.ts`, 21 `.js`; `view/` — 9, `controller/` — 6, `script.js` — 29 | Лимит 200 соблюдён: максимум `map-view.js` 199, `map-controller.js` 198 |
| `src/` | 3 файла: `main.tsx` (корень), `App.tsx`, `components/ErrorModal.tsx` | React-слой = только модалка ошибок |
| Контейнеры экранов | `#mapScreen` (fixed, вне `.app`) → `#totalScore`, `#globalMapBtn`, `#mapContainer`; `.app` → `#gameScreen`, `#resultScreen`; модалки `#difficultyModal`, `#mapSelectModal`; `#errorOverlay` | Портал-схема (решение №1) применима без правок CSS |
| CSS-геометрия | `.screen { display:none }` / `.screen.active { display:block; animation:fadeIn }`; `.map-player { transition: transform 600ms ease-in-out }`; `.modal-overlay.open { display:flex; z-index:1000 }` | `onTransitionEnd` (A47) опирается на существующий CSS |
| CSS-дефект | `game.css` дважды импортирует `game-answers.css` и **не** импортирует `game-header.css`; `.round-score`/`.score-badge` не описаны | **Не исправляем** (A46); классы переносятся как есть — внешний вид не меняется |
| Тесты карты | `map-view.test.js` (13), `map-controller.test.js` (19), `global-map-controller.test.js` (9) читают `view/controller` через `eval`; `map-layout.test.js` (18) — только `view/map-layout.js` | 41 тест неизбежно уходит вместе с файлами (решение №8) |
| Мёртвый код | `GameModel` создаётся в `script.js` и не используется; `SessionController.leave` не вызывается; `.streak-badge` никто не показывает | Убирается на 15.6/15.7 (Z21) |
| Git | `fatal: not a git repository` | Репозиторий **не создаём** (решение владельца) — контрольные суммы и журнал (решение №9, D12) |
| Экран приветствия | Отсутствует в `index.html`; `ScreenView` знает только `map`/`game`/`results` | TR-20 выполняется как «подтвердить + удалить `app-controller`/`screen-view`» |

### Чего не хватает после 1.7.0

1. **Все экраны — DOM-разметка + `view/*.js`**: карта, игра, результаты, шапка, модалки рисуются императивно.
2. **6 контроллеров владеют состоянием** (`PlayerState`, флаги движения/модалки, счётчики вопроса) — React не участвует.
3. **`window.showErrorModal` — единственный React-мост**, `ErrorView` и `#errorOverlay` живы как fallback.
4. **Экранные контейнеры и `.active` — зона `ScreenView`**, а не состояния React.
5. **`script.js` — точка инициализации**; без него приложение не стартует.

---

## 🏗️ Архитектура

### Середина миграции (15.1–15.5): React внутри существующих контейнеров

```
index.html
  ├─ 14 <script src="js/**/*.ts"> + до 20 <script src="js/**/*.js">   [слои; View/Controller-теги убывают]
  ├─ View/Controller-теги                                          [удаляются по одному]
  ├─ #mapScreen
  │    ├─ #headerRoot          ← портал <Header/>                  [с 15.5]
  │    └─ #mapRoot             ← портал <MapScreen/>               [с 15.4]
  ├─ .app
  │    ├─ #gameScreen          ← портал <GameScreen/>              [с 15.3]
  │    └─ #resultScreen        ← портал <ResultsScreen/>           [с 15.1]
  ├─ #root                     ← <App/>: модалки + ErrorModal
  └─ <script type="module" src="/main.tsx">
        └─ main.tsx → App
              ├─ screen state + .active через ScreenView           [до 15.6]
              ├─ useGame / useResults / useMap / useMapSelection / useAudio / useSessionLock
              ├─ window.mlBridge  → для legacy-вызывающих           [15.1–15.5]
              └─ createPortal(содержимое экрана, контейнер)
```

**Почему порталы, а не «весь React сразу»:** экраны игры и результатов живут внутри `.app` (белая карточка `max-width: 600px`, `overflow: hidden`), карта — в `#mapScreen` (`position: fixed`), модалки — fixed-оверлеи. Чтобы не менять CSS (A46) и сохранить `.screen`/`.active`, React дорисовывает содержимое **в те же узлы**, а видимостью по-прежнему управляет `ScreenView`. Один экран — один шаг, старый код рядом — ровно сценарий A41/A42.

### Конец миграции (после 15.7): чистый React-каркас

```
index.html
  ├─ 13 <script src="js/**/*.ts"> + 6 <script src="js/**/*.js">   (19 библиотек-слоёв)
  ├─ <div id="root" style="display: contents"></div>
  └─ <script type="module" src="/main.tsx">
        └─ main.tsx → bootstrap() → <App/>
              ├─ <div className="screen active" id="mapScreen"> <Header/> <MapScreen/> </div>
              ├─ <div className="app"> <GameScreen/> <ResultsScreen/> </div>
              ├─ <MapSelectionModal/> · <ErrorModal/> · модалка сложности (в MapScreen)
              └─ хуки: useGame, useResults, useMap, useMapSelection, useAudio, useSessionLock
```

`display: contents` у `#root` сохраняет `.app` прямым flex-элементом `body` (иначе ломается ширина карточки). `#mapScreen`/`.app` рендерятся из React с теми же `id`/`class`; `.active` вычисляется из состояния.

### Поток выполнения в середине миграции (пример 15.1)

1. `script.js` (импорт из `main.tsx`) инициализирует слои и `AppController.init()`; карта рисуется legacy-кодом.
2. `App` монтируется, публикует `window.mlBridge.showResults`.
3. Игра → `game-controller.onNext()` → `GameController` ловит конец раунда → `window.mlBridge.showResults(results)` → `useResults`:
   `GameRules.getRating` → `Scoring.isRoundSuccessful` → `MapController.onGameFinished` → `StatsService.updateAfterRound` (только победа) → `AudioService.play('win'|'lose')` → `setState`.
4. Обработчик моста делает `navigate('results')` — состояние React и `ScreenView.showScreen('results')`: `.active` переезжает на `#resultScreen`, React-содержимое отрисовано.
5. «Играть снова» → `AppController.onStartGame()` (legacy до 15.3); «На карту» → `AppController.showCurrentMap()` (legacy до 15.4).

---

## 🧩 Контракты

### `src/types.ts` (переезд `js/model/types.ts` + view-типы + мост)

```ts
export {};

declare global {
    /* ... существующие доменные типы (Difficulty, Problem, GameResult, MapData, Stats,
       SessionState, ErrorInfo, Rating, Zone, GameMap, Config) ... */

    // ── View-модели (только для React; не заменяют доменные типы) ──
    interface Point { x: number; y: number; }
    interface TrainerPoint extends Point {
        index: number;
        zoneId: string;
        number: number;
    }
    interface MapBand {
        id: string;
        title: string;
        color: string;
        top: number;
        height: number;
    }
    interface MapGeometry {
        width: number;
        height: number;
        bands: MapBand[];
        trainers: TrainerPoint[];
        roadPath: string;
    }
    interface MapViewData {
        zones: Zone[];
        geometry: MapGeometry;
        playerPoint: Point | null;
    }
    interface ResultsView {
        results: GameResult;
        rating: Rating;
        earnings: string;
    }
    interface GameSessionView {
        lives: number;
        roundScore: number;
        questionNumber: number;
        totalQuestions: number;
        progress: number;
        difficulty: Difficulty;
    }
    interface GameFeedbackView {
        isCorrect: boolean;
        title: string;
        message: string;
    }

    /** Временный мост 1.8.0 (удаляется по мере миграции, полностью — на 15.5). */
    interface MlBridge {
        showResults(results: GameResult): void;      // 15.1–15.2
        openMapSelection(): void;                    // 15.2–15.4
        closeMapSelection(): void;                   // 15.2–15.4
        selectMap(mapId: string): void;              // 15.2–15.4
        startGame(difficulty?: Difficulty): void;    // 15.3–15.4
    }

    interface Window {
        showErrorModal?: (title: string, message: string) => void; // до 15.6
        mlBridge?: Partial<MlBridge>;                              // до 15.5
    }
}
```

Правила: доменные типы не меняются; `MlBridge` — **временный** и удаляется целиком на 15.5; `Window.showErrorModal` — на 15.6; `any` не добавляется.

### `src/config.ts` (≈8 строк)

```ts
/** Типизированный доступ React-слоя к константам; сам CONFIG — классический глобал. */
export const config: Config = CONFIG;
```

### `src/App.tsx` (≈90 строк, растёт от 36)

```tsx
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ErrorModal } from './components/ErrorModal';
import { GameScreen } from './components/GameScreen';
import { Header } from './components/Header';
import { MapScreen } from './components/MapScreen';
import { MapSelectionModal } from './components/MapSelectionModal';
import { ResultsScreen } from './components/ResultsScreen';
import { useGame } from './hooks/useGame';
import { useMap } from './hooks/useMap';
import { useMapSelection } from './hooks/useMapSelection';
import { useResults } from './hooks/useResults';
import { useSessionLock } from './hooks/useSessionLock';

type ScreenName = 'map' | 'game' | 'results';

function ScreenPortal({ targetId, children }: { targetId: string; children: ReactNode }) {
    const target = document.getElementById(targetId); // 15.1–15.5; удаляется на 15.6
    return target ? createPortal(children, target) : null;
}

export function App() {
    const [screen, setScreen] = useState<ScreenName>('map');
    const [error, setError] = useState<{ title: string; message: string } | null>(null);
    const navigate = useCallback((name: ScreenName) => {
        setScreen(name);
        ScreenView.showScreen(name); // legacy-роутер до 15.6, затем строка удаляется
    }, []);
    // ... хуки, мост, модалки, рендер ...
}
```

Правила: `App` — композиция и навигация, без правил игры; всё состояние — `useState` в хуках (A45); `Context`/`Zustand` отсутствуют.

### Пропсы компонентов (T37: `ComponentNameProps`)

| Компонент | Пропсы |
|-----------|--------|
| `ResultsScreen` | `{ results: GameResult; rating: Rating; earnings: string; onPlayAgain(): void; onBackToMap(): void }` |
| `MapSelectionModal` | `{ maps: GameMap[]; currentMap: string; onSelect(mapId: string): void; onClose(): void }` |
| `GameScreen` | `{ session: GameSessionView; question: Problem; feedback: GameFeedbackView \| null; selectedIndex: number \| null; correctIndex: number \| null; floatingScore: number \| null; onAnswer(index: number): void; onNext(): void; onExit(): void }` |
| `MapScreen` | `{ stats: { totalScore: number; currentTrainerIndex: number }; mapData: MapViewData; isMoving: boolean; isModalOpen: boolean; modalTarget: { zoneTitle: string; trainerNumber: number } \| null; selectedDifficulty: Difficulty; onTrainerClick(zone: Zone \| undefined, trainerNumber: number, trainerIndex: number): void; onSelectDifficulty(difficulty: Difficulty): void; onCancel(): void; onPlayerArrived(): void }` |
| `Zone` | `{ band: MapBand; isFirst: boolean; isLast: boolean; titleSide: 'left' \| 'right' }` |
| `Trainer` | `{ trainer: TrainerPoint; action: 'play' \| 'move' \| 'ignore'; onSelect(index: number): void }` |
| `Player` | `{ point: Point \| null; isMoving: boolean; onArrived(): void }` |
| `Path` | `{ width: number; height: number; d: string }` |
| `Header` | `{ totalScore: number; onOpenMapSelection(): void }` |
| `ErrorModal` | без изменений (`title`, `message`, `onClose`) |

Разметка внутри компонентов — **та же**, что в удаляемых view: те же `id` (где нужны CSS/совместимости), те же классы, те же inline-стили. Списки (`zones`, `trainers`, `maps`, `options`) — всегда с `key`.

### Хуки (T38; имя с `use`, зависимости указаны)

| Хук | Возвращает / делает |
|-----|---------------------|
| `useAudio` | `{ play(kind: 'click' \| 'win' \| 'lose'): void }` — обёртка `AudioService.play` |
| `useResults` | `{ view: ResultsView \| null; show(results: GameResult): void }`; побочные эффекты в порядке 1.5.0: `onRoundFinished(isSuccessful)` → `StatsService.updateAfterRound` (победа) → `win`/`lose` → `earnings` |
| `useGame` | `{ session, question, feedback, selectedIndex, correctIndex, floatingScore, start(difficulty?), answer(index), next(), exit() }`; внутри — `SessionModel` + `ProblemGenerator` (`useRef`), таймер `+10` на 1.5 с с очисткой |
| `useMap` | `{ stats, mapData, isMoving, isModalOpen, modalTarget, selectedDifficulty, onTrainerClick, selectDifficulty, cancel, arrived, gameFinished(isSuccessful), exitGame(), reload() }`; внутри — `PlayerState`, debounce-resize 100 мс, чтение `StatsService`/`MapCatalog`/`MapLayout` |
| `useMapSelection` | `{ isOpen, maps, currentMap, open(), close(), select(mapId) }`; no-op для той же/неизвестной карты — без звука и закрытия (A31/Z14) |
| `useSessionLock` | эффект: `BroadcastChannel('mathlingo_session')` + fallback `ml_session_lock`; при второй вкладке — `showError('Игра уже запущена', 'Закройте другую вкладку с MathLingo.')`; cleanup закрывает канал |

### `src/bootstrap.ts` (15.7, ≈25 строк)

```ts
/** Замена IIFE из script.js: инициализация слоёв до первого рендера. */
export function bootstrap(): void {
    AudioService.preload();
    const repo = new LocalStorageRepository(CONFIG.STORAGE_PREFIX + 'stats');
    StatsService.init(repo);
    SessionService.init(new SessionRepository());
    ErrorHandler.init();
}
```

### `main.tsx` (15.7, ≈20 строк)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './src/App';
import { bootstrap } from './src/bootstrap';

bootstrap();

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('#root not found in index.html');
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
```

Импорт `./js/script.js` удаляется; классические слои уже выполнились как `<script>` до отложенного модуля.

### `index.html` — дельты по шагам

| Шаг | Что меняется |
|-----|--------------|
| 15.1 | −2 тега (`results-view`, `results-controller`); `#resultScreen` → пустой контейнер `<div class="screen" id="resultScreen"></div>` |
| 15.2 | −1 тег (`global-map-view`); разметка `#mapSelectModal` удаляется (модалка — в `App`) |
| 15.3 | −2 тега (`game-view`, `game-controller`); `#gameScreen` → пустой контейнер |
| 15.4 | −3 тега (`map-view`, `map-player-view`, `map-controller`); `map-layout.js` переносится в блок Logic; `#mapContainer` → `<div id="mapRoot"></div>`; разметка `#difficultyModal` удаляется |
| 15.5 | −1 тег (`global-map-controller`); `#totalScore` и `#globalMapBtn` → `<div id="headerRoot"></div>` перед `#mapRoot` |
| 15.6 | Удаляются обёртки `#mapScreen`/`.app`/экранов, `#errorOverlay`, `.streak-badge`, комментарий `script.js`; `#root` получает `style="display: contents"` |
| 15.7 | HTML не меняется (остаются 19 classic-тегов слоёв + модуль) |

---

## 🚀 Этап 15: миграция (SPEC 1.8.0 = «Этап 3»)

Порядок жёсткий (A42). После **каждого** шага: `npx tsc --noEmit` → 0, `npm test` → зелёный, `npm run dev` → прогон, **контрольная точка** — `md5sum`-снимок + запись в `/tmp/ml-1.8.0-log.txt` (git нет — D12).

| Шаг | Экран | Удаляются | Фиксация (метка) |
|-----|-------|-----------|------------------|
| 15.0 | подготовка | — | `baseline 1.7.0` |
| 15.1 (SPEC 3.1) | результаты | `results-view.js`, `results-controller.js` | `results` |
| 15.2 (3.2) | модалка выбора карты | `global-map-view.js`, сьют (9) | `map-select` |
| 15.3 (3.3) | игра | `game-view.js`, `game-controller.js` | `game` |
| 15.4 (3.4) | карта | `map-view.js`, `map-player-view.js`, `map-controller.js`, 2 сьюта (32) | `map` |
| 15.5 (3.5) | шапка | `global-map-controller.js`, `window.mlBridge` | `header` |
| 15.6 (3.6) | каркас / приветствие | `app-controller.js`, `session-controller.js`, `screen-view.js`, `error-view.js`, `dom.js` | `app-shell` |
| 15.7 (3.6) | старый вход | `script.js`, `js/view/`, `js/controller/`, `game-model.ts` | `legacy-entry` |
| 15.8 (TR-22) | прогон | — | `final-run` |
| 15.9 | документация | — | `docs 1.8.0` |

### 15.0. Подготовка

- **Контрольная точка вместо git** (D12): `find js css index.html -type f -exec md5sum {} + | sort > /tmp/ml-1.8.0-base.txt`; обнулить журнал `/tmp/ml-1.8.0-log.txt` записью `15.0 baseline`; создать `/tmp/ml-1.8.0-backup/` для копий удаляемых файлов.
- `js/model/types.ts` → **`src/types.ts`** (только перемещение; `declare global` и `export {}` сохраняются). Добавить view-типы, `MlBridge`, расширить `Window` (см. контракты). `js/model/types.ts` удалить; в `index.html` файл не подключался — рантайм не затронут.
- Новый `src/config.ts` (`export const config: Config = CONFIG`).
- Эталон «не тронуто»: `md5sum` по `js/view`, `js/controller`, `css` → `/tmp/ml-guard-1.8.0.txt`.

**Критерий:** созданы `ml-1.8.0-base.txt`, `ml-guard-1.8.0.txt`, журнал содержит `15.0`; `tsc` — 0; `npm test` — 182/182; `types.ts` живёт в `src/`. **Охватывает:** T36 (частично), A43 (инфраструктура фиксации, D12), решение №6.

### 15.1. Экран результатов (TR-15)

**Создать:**

- `src/components/ResultsScreen.tsx` (≈55) — разметка 1:1: `.result-icon`, `h1`, `.subtitle`, `.stats` (две `.stat-card`), блок заработанного с inline-стилем `text-align:center;color:#888;margin-bottom:15px`, кнопки `.btn.btn-primary` «Играть снова» и `.btn.btn-secondary` «На карту»; props-интерфейс `ResultsScreenProps`.
- `src/hooks/useResults.ts` (≈50) — `show(results)` повторяет `ResultsController.show` **в том же порядке**: `rating = GameRules.getRating`; `isSuccessful = Scoring.isRoundSuccessful(lives, completed)`; `onRoundFinished(isSuccessful)`; при победе `StatsService.updateAfterRound(roundScore)`; `AudioService.play('win'|'lose')`; `earnings = 'Заработано: N ✓'` / `'Заработано: N (не зачтено)'`; `setView`.
- `src/hooks/useAudio.ts` (≈15).

**Изменить:**

- `src/App.tsx` — `useResults`, портал `<ResultsScreen/>` в `#resultScreen` при `view !== null`, публикация/снятие `window.mlBridge.showResults` в эффекте (обработчик моста: `results.show(r)` + `navigate('results')`); `onPlayAgain` → `AppController.onStartGame()` (до 15.3), `onBackToMap` → `AppController.showCurrentMap() + navigate('map')` (legacy `showCurrentMap` тоже зовёт `ScreenView` — повторный вызов идемпотентен).
- `js/controller/game-controller.js` — в конце раунда вместо `ResultsController.show(this._sessionModel)`:
  `window.mlBridge?.showResults(this._sessionModel.getResults());`
- `js/controller/app-controller.js` — убрать `ResultsController.init()` из `init()` (иначе вызов удалённого объекта валит старт).
- `index.html` — см. дельту 15.1.

**Удалить:** `js/view/results-view.js`, `js/controller/results-controller.js` (и их теги).

**Проверка:** победа (10 верных) и провал (3 жизни): иконка/заголовок/подзаголовок, `statCorrect`, `statScore`, «Заработано … ✓/не зачтено», звуки, позиция игрока закреплена/откачена, `ml_stats` обновлён; «Играть снова» и «На карту» работают; `tsc` 0; **182/182**.

**Критерий:** выполнены условия TR-15; старых файлов нет; экран — React; игра играется. **Охватывает:** TR-15, A41–A44, A46, Z19–Z21.

### 15.2. Модалка выбора карты (TR-16)

**Создать:**

- `src/components/MapSelectionModal.tsx` (≈45) — `null` при закрытии, иначе `.modal-overlay open` → `.modal` → `h2` «Выбор карты» → `.map-select-list` → кнопки `.map-select-item` (+`selected` у текущей) → `.btn.btn-secondary` «Закрыть»; `stopPropagation` на `.modal` не нужен (клик по фону не закрывает — как в 1.5.0).
- `src/hooks/useMapSelection.ts` (≈50) — `open()`: `click` + снимок `{ maps: CONFIG.MAPS, currentMap: StatsService.getCurrentMap() }`; `close()`: `click`; `select(id)`: `if (!StatsService.switchMap(id)) return;` → `click` → закрыть → `onMapChanged()` (до 15.4 — `AppController.showCurrentMap()`).

**Изменить:**

- `src/App.tsx` — рендер `<MapSelectionModal/>` при `isOpen`; мост `openMapSelection`/`closeMapSelection`/`selectMap`.
- `js/controller/global-map-controller.js` — **сжать до адаптера** (≈20 строк): `init()` навешивает только клик на `#globalMapBtn` → `window.mlBridge?.openMapSelection()`. Методы `open/close/onSelect` и работа со списком удаляются. Файл живёт до 15.5, потому что кнопка 🌍 ещё не React.
- `index.html` — дельта 15.2.

**Удалить:** `js/view/global-map-view.js`; `test/map/global-map-controller.test.js` (9 — решение №8).

**Проверка:** 🌍 открывает список карт каталога, текущая выделена; «Закрыть» закрывает; выбор той же карты — **полный no-op** (без звука, без закрытия, без записи); выбор другой — `switchMap`, позиция новой карты `−1`, карта перерисована legacy-путём; `tsc` 0; **173/173** в 13 сьютах.

**Критерий:** TR-16 выполнен; модалка — React; выбор карты сбрасывает позицию. **Охватывает:** TR-16, A41–A44, Z14/A31 (сохранение поведения).

### 15.3. Экран игры (TR-17)

**Создать:**

- `src/components/GameScreen.tsx` (≈120) — `.game-header` (`#exitBtn`-аналог `.close-btn` → `onExit`; `.progress-bar`/`.progress-fill`; `.round-score`; `.question-counter`; `.lives`; `.score-badge`), `.question`, `.answers` с 4 `.answer-btn` (`key`, `data-index`, классы `correct`/`wrong`, `disabled` после ответа), `.feedback` (`correct-fb`/`wrong-fb` + `show`) и кнопка «Продолжить`. Разметка/классы — как в `game-view.js`.
- `src/hooks/useGame.ts` (≈130) — `SessionModel` и `ProblemGenerator` в `useRef`; `start(difficulty?)` = `reset` + `setDifficulty` + `generator.setDifficulty` + состояние экрана игры (навигацию `navigate('game')` делает `App`) + счёт 0/жизни/`1/10`/прогресс 10 % + первый вопрос; `answer(index)` = `click`, проверка `GameRules.checkAnswer`, `recordCorrect/Incorrect`, всплывающее `+10` на 1.5 с (таймер очищается), разметка ответов, `feedback` (тексты 1:1), жизни, счёт; `next()` = `click`, `advanceQuestion`, `GameRules.shouldEndGame` → `setCompleted(true)` → `onRoundFinished(results)`, иначе следующий вопрос + счётчик/прогресс + скрытие feedback; `exit()` = `click` + `confirm('Выйти из игры? Заработано N очков сгорят.')` → `onExitToMap()`.

**Изменить:**

- `src/App.tsx` — `useGame`, портал `<GameScreen/>` в `#gameScreen` при `screen === 'game'`; мост `startGame` (обработчик: `game.start(diff)` + `navigate('game')`); `onRoundFinished` → `results.show`; `onExitToMap` → legacy `MapController.onExitGame()` + `AppController.showCurrentMap()` + `navigate('map')` (до 15.4).
- `js/controller/app-controller.js` — `onStartGame` сжимается до адаптера: `window.mlBridge?.startGame(difficulty);` (рендер и модель из него уходят); `onExit` и поле `_sessionModel` удаляются (подтверждение выхода и откат — в `useGame`); `init()` больше не привязывает `#nextBtn`/`#exitBtn` (✕ теперь в `GameScreen`) и не зовёт `GameView`.
- `js/script.js` — убрать `sessionModel`/`generator`, `GameController.setDeps`; `AppController.init()` без зависимостей (модель теперь в `useGame`).
- `index.html` — дельта 15.3.

**Удалить:** `js/view/game-view.js`, `js/controller/game-controller.js`; мост `showResults` (вызывающих не осталось — результаты теперь зовёт `useGame`).

**Проверка:** старт с карты и «Играть снова»; верный/неверный ответ (классы, feedback, `+10`, жизни, счёт); «Продолжить» (счётчик, прогресс, скрытие feedback); победа на 10-м вопросе и провал на 0 жизнях → результаты; ✕ → `confirm`, откат/сохранение как раньше, выход на карту; звуки; `tsc` 0; **173/173**.

**Критерий:** TR-17 выполнен; `useState`-состояние; старые файлы удалены; игра играется. **Охватывает:** TR-17, A44/A45, Z20.

### 15.4. Карта предмета (TR-18)

**Создать:**

- `src/components/MapScreen.tsx` (≈90) — `.map` с `ref` для замера ширины и `style={{ height }}`; `.map-zone` × 3, `svg.map-road` + `path.map-road-line`, `.map-trainer` × 15, `.map-player`; модалка сложности (`.modal-overlay open` → `.modal` → `h2` с `zoneTitle · Тренажёр N` → три `.diff-btn` (+`selected`) → `.btn.btn-secondary` «Отмена»).
- `src/components/Zone.tsx` (≈30), `Trainer.tsx` (≈30), `Player.tsx` (≈25), `Path.tsx` (≈20) — 1:1 с `_buildZone`/`_buildTrainer`/`MapPlayerView`/`_buildRoad`.
- `src/hooks/useMap.ts` (≈160) — `PlayerState` + `reload()` (`MapCatalog.get` → зоны → `PlayerRules.normalizeIndex(StatsService.getTrainerIndex(), total)` → счёт); клик: `PlayerRules.getAction` → `ignore` (без звука) / `play` (модалка) / `move` (`click`, `moveTo`, `isMoving`, `arrived` в `ref`); прибытие — `onTransitionEnd` (`propertyName === 'transform'`, `target === currentTarget`), затем модалка; отмена — закрыть + `revert` (без модалки, `arrived = null`); `gameFinished(ok)` — реплей не пишет, победа `commitWin` + `saveTrainerIndex`, провал `revert` + `saveTrainerIndex`; `exitGame()` — реплей не двигает, иначе `revert`; resize — слушатель + debounce 100 мс; `totalScore` в состоянии (обновляется в `gameFinished`/`reload`).

**Изменить:**

- `src/App.tsx` — `useMap` (до `useResults`), портал `<MapScreen/>` в `#mapRoot`; `useResults` переключается на `map.gameFinished` и `map.reload() + navigate('map')`; `onSelectDifficulty` → `game.start(diff)`; `useGame` exit → `map.exitGame() + navigate('map')`.
- `js/view/screen-view.js` — удалить `highlightDifficulty` (мёртв: подсветку ведёт `useMap`), оставить `showScreen`.
- `js/view/map-layout.js` → **`js/logic/map-layout.js`** (чистая геометрия; шапка файла и путь в `index.html`/тесте).
- `index.html` — дельта 15.4.
- `test/map/map-layout.test.js` — **только путь** `./js/view/map-layout.js` → `./js/logic/map-layout.js`.

**Удалить:** `js/view/map-view.js`, `js/view/map-player-view.js`, `js/controller/map-controller.js`; `test/map/map-view.test.js` (13), `test/map/map-controller.test.js` (19). `app-controller.js` теряет `showCurrentMap`/`onStartGame`/`onExit`, **включая вызов `this.showCurrentMap()` из `init()`** (иначе старт упадёт на удалённых `MapController`/`MapView`); остаётся `init()` для 🌍/сессии/ошибок до 15.6.

**Проверка:** карта 15 тренажёров, шаг 100px, один SVG-путь с `C`, игрок 52px/🚶; клик текущий → модалка повторной игры; соседний → движение 600 мс (CSS transition) → модалка; дальний → ничего; «Отмена» → откат без модалки; выбор сложности → игра; победа/провал → позиция и `ml_stats`; ✕ → откат; resize (debounce) перестраивает карту; скроллбар пересчитывает ширину; `tsc` 0; **141/141** в 11 сьютах.

**Критерий:** TR-18/T40 выполнены; подкомпоненты созданы; движение — CSS transition + `onTransitionEnd`; старые файлы удалены. **Охватывает:** TR-18, A44–A47, T37–T40, Z20.

### 15.5. Шапка (TR-19)

**Создать:** `src/components/Header.tsx` (≈30) — `.total-score` («🏆 N») и `.global-map-btn` 🌍 → `onOpenMapSelection`.

**Изменить:** `src/App.tsx` — портал `<Header/>` в `#headerRoot`; `totalScore` из `useMap`; `openMapSelection` → `click` + `useMapSelection.open()`; **удалить `window.mlBridge` и `MlBridge`** (вызывающих больше нет); `js/controller/app-controller.js` — убрать `GlobalMapController.init()` из `init()`; `index.html` — дельта 15.5.

**Удалить:** `js/controller/global-map-controller.js`.

**Проверка:** счёт на карте совпадает с `StatsService`, обновляется после раунда; 🌍 открывает/закрывает модалку; смена карты перерисовывает карту и счёт; `tsc` 0; **141/141**.

**Критерий:** TR-19 выполнен; временный мост исчез. **Охватывает:** TR-19, A40 (частично), A42.

### 15.6. Каркас приложения и удаление приветствия (TR-20)

**Создать:** `src/hooks/useSessionLock.ts` (≈45) — `BroadcastChannel('mathlingo_session')`, `hello`, при сообщении один раз `showError(...)`, cleanup закрывает канал; fallback — `ml_session_lock` в `localStorage`.

**Изменить:**

- `src/App.tsx` — рендерить **весь каркас** сам: `#mapScreen` (`.screen`/`.active` из `screen`) + `<Header/>` + `<MapScreen/>`; `.app` → `<GameScreen/>` + `<ResultsScreen/>`; модалки и `ErrorModal` — рядом; `ScreenView.showScreen` из `navigate` **убрать**; `useSessionLock(showError)`; `window.showErrorModal` и `Window.showErrorModal` **удалить** (модалка ошибок теперь только React-state).
- `index.html` — дельта 15.6 (`#root` + `display: contents`; удалены обёртки экранов, `#errorOverlay`, `.streak-badge`, комментарий `script.js`).
- `js/script.js` — удалить мост `ErrorView` (monkey-patch уходит) и вызов `AppController.init()`; оставить `try { AudioService.preload(); … StatsService.init; SessionService.init; ErrorHandler.init(); }`.

**Удалить:** `js/controller/app-controller.js`, `js/controller/session-controller.js` (заменён `useSessionLock`), `js/view/screen-view.js`, `js/view/error-view.js`, `js/view/dom.js` (последние потребители `$`/`$$`); разметка `#errorOverlay`.

**Проверка:** карта — главный экран (приветствия нет); все переходы карта/игра/результаты — через состояние; вторая вкладка → **React**-«Игра уже запущена» (старый `#errorOverlay` не существует); окно/ширина карточки как раньше (600px, центрирование); `tsc` 0; **141/141**.

**Критерий:** TR-20 выполнен; welcome отсутствует; карта — главный экран; каркас — React. **Охватывает:** TR-20, A40 (финал), A45.

### 15.7. Удаление старого входа (TR-21)

**Создать:** `src/bootstrap.ts`; `main.tsx` — без `import './js/script.js'`, с `bootstrap()` до `createRoot`.

**Удалить:** `js/script.js`, каталоги `js/view/` и `js/controller/` (пустые), `js/model/game-model.ts` (мёртв — решение №11).

**Итог `js/`:** `errors/` (2), `service/` (3: audio `.js`, stats `.ts`, session `.ts`), `storage/` (4 `.ts`), `model/` (4: config, map-catalog, stats-schema, session-model), `logic/` (6: generator, scoring, game-rules, player-rules, player-state, map-layout) — **всего 19 файлов, 13 `.ts` + 6 `.js`**.

**Отклонение:** 19 classic-тегов слоёв остаются в `index.html` — импорт классического скрипта как ES-модуля лишает его глобалов (см. «Отклонения» D2). `main.tsx` — единственный **вход приложения** (нет `script.js`, нет контроллеров, нет `ScreenView`).

**Проверка:** `grep -rn "script.js\|ScreenView\|AppController\|ResultsController\|GameController\|MapController\|ErrorView" js/ src/ index.html` → пусто; `tsc` 0; **141/141**; игра работает без `script.js`.

**Критерий:** TR-21 выполнен (с оговоркой D2); `main.tsx` — точка входа. **Охватывает:** TR-21, Z21.

### 15.8. Сквозной прогон и аудит (TR-22)

1. `npm run dev` → консоль без ошибок. **16 сценариев:**
   - карта после старта — 3 зоны, 15 тренажёров, игрок на сохранённой позиции из `ml_stats`;
   - счёт 🏆 совпадает с `StatsService.getTotalScore()`;
   - клик по текущему тренажёру → модалка повторной игры;
   - клик по соседнему → движение 600 мс → модалка сразу по приходе;
   - клик по дальнему → no-op (без звука);
   - «Отмена» в модалке → игрок откатился, позиция не сохранена;
   - старт игры с выбранной сложностью;
   - верный ответ → `correct`, feedback, `+10`, счёт;
   - неверный ответ → `wrong`, «Правильный ответ: N…», жизнь −1;
   - «Продолжить» → новый вопрос, счётчик/прогресс;
   - победа (10 вопросов) → результаты, оценка, звук `win`;
   - провал (0 жизней) → результаты, звук `lose`;
   - «Играть снова» → новый раунд с той же сложностью;
   - «На карту» → карта, счёт и позиция по правилам commit/revert;
   - 🌍 → список → другая карта (позиция `−1`) → возврат на прежнюю (позиция сохранена);
   - перезагрузка страницы (позиция/счёт на месте) и вторая вкладка (React-модалка).
2. `npx tsc --noEmit` → 0; `npm test` → 141/141/11.
3. `md5sum -c /tmp/ml-guard-1.8.0.txt` (пути карты/контроллеров удалены — сверять только `css/`) → CSS не изменён.
4. `wc -l` по всем `src/**` — ≤ 200; `grep -n "any\|var \|React.createElement\|onclick=" src/` → 0.
5. `grep -n "key=" src/components/*.tsx` — все списки с `key`; `grep -n "createPortal"` — только `ScreenPortal` в `App.tsx`.
6. Контрольные точки на месте: `/tmp/ml-1.8.0-log.txt` содержит 8 записей (15.0–15.7), снимки `ml-1.8.0-<метка>.txt` созданы, копии удалённых файлов — в `/tmp/ml-1.8.0-backup/`.

**Критерий:** TR-22; все сценарии зелёные. **Охватывает:** TR-22, Z19–Z21.

### 15.9. Документация

- `README.md`: технологии (React 19, 10 компонентов, 6 хуков), структура (`src/components`, `src/hooks`, `src/bootstrap.ts`), вход (`main.tsx`, `#root`), тесты (141/141 в 11 сьютах, почему меньше), «Запуск» без изменений, «Карта» — React.
- `GIGACODE.md`: структура (без `view/controller`, `src/` полный), архитектура (React-слой + классические слои, `bootstrap`), «Порядок подключения» (19 тегов + модуль), «Карта/игра/результаты» — компоненты и хуки, `MapLayout` в `logic/`, история мостов 1.7.0 → 1.8.0 (оба удалены).
- `test/README.md`: 11 сьютов/141 тест; три сьюта удалены вместе с `view/controller` (обоснование), `map-layout` переехал в `js/logic/`.
- `.gigacode/specs/SPEC.md`: статус 1.8.0 → **Выполнено**; `.gigacode/plans/PLAN_v1_7_0.md` — архив (уже создан).
- Финальный чек-лист критериев 91–106.

**Критерий:** документация соответствует коду; критерии 91–106 закрыты. **Охватывает:** TR-22, обязательства агента.

---

## ✅ Критерии завершения

### Сохраняются из 1.2.0–1.7.0 (1–90)

Архитектура слоёв, JSDoc, `Repository`, ошибки, write-ahead, блокировка вкладок, счёт и сгорание очков, карта (100px, одна дорога, 15 тренажёров), игрок (🚶 52px, 600 мс, блокировки), модалки карты/сложности, откат и повторная игра, глобальная карта, `Stats` v3, миграции 1 → 2 → 3, типизация, поведение и UI. **Критерий 89 (182 теста) заменяется критерием 104: сокращение UI-сьютов согласовано и зафиксировано.**

### Миграция экранов (1.8.0, 91–106)

91. **`ResultsScreen`** (TR-15): функциональный компонент; `ResultsScreenProps` (`results`, `rating`, `earnings`, `onPlayAgain`, `onBackToMap`); иконка/оценка/статистика/«Заработано»; кнопки «Играть снова»/«На карту»; `results-view.js` и `results-controller.js` удалены; звук `win`/`lose`, `StatsService.updateAfterRound`, `MapController`-commit/revert сохранены.
92. **`MapSelectionModal`** (TR-16): `maps`, `currentMap`, `onSelect`, `onClose`; список с `selected`; «Закрыть»; выбор карты сбрасывает позицию (`switchMap`), та же карта — no-op; `global-map-view.js` удалён.
93. **`GameScreen`** (TR-17): состояние через `useState` (в `useGame`); `session`, `question`, `onAnswer`, `onNext`, `onExit`; вопрос/4 ответа/жизни/счёт/feedback/прогресс/счётчик; `game-view.js` и `game-controller.js` удалены; игра играется.
94. **`MapScreen` + `Zone`/`Trainer`/`Player`/`Path`** (TR-18, T40): зоны, один `<svg>` и один `<path>` с `C`, тренажёры, игрок; `currentTrainerIndex`/`isModalOpen`/`isMoving`; `stats`, `mapData`, `onTrainerClick`, `onSelectDifficulty`; движение — CSS transition 600 мс + `onTransitionEnd` (A47); `map-view.js`, `map-player-view.js`, `map-controller.js` удалены; `map-layout.js` — в `js/logic/`.
95. **`Header`** (TR-19): `totalScore`, `onOpenMapSelection`; 🏆 и 🌍; клик открывает модалку; счёт актуален.
96. **Экран приветствия удалён; карта — главный экран** (TR-20): `app-controller.js`, `session-controller.js`, `screen-view.js`, `error-view.js`, `dom.js` удалены; переходы — состояние `App`; `.active` — из состояния, не из `ScreenView`.
97. **Старые файлы удалены** (TR-21): нет `js/view/**`, `js/controller/**`, `js/script.js`; в `js/` только model/logic/storage/service/errors (19 файлов); `main.tsx` — единственный вход приложения (оговорка D2 — 19 classic-тегов слоёв).
98. **Игра работает** (TR-22): 16 сценариев 15.8; консоль без ошибок; `ml_stats` = v3; карта/игра/результаты/глобальная карта/вторая вкладка.
99. **Компоненты по T37/A44**: функциональные, `export function`, `ComponentNameProps`, `key` в списках, `onClick`, без `React.createElement`, без `any`/`var`, без бизнес-логики (Z20).
100. **Хуки по T38**: в `src/hooks/`, имена с `use`, без условных вызовов, зависимости в эффектах, очистка таймеров/каналов/слушателей.
101. **Состояние локальное** (A45): `useState`/`useReducer` + props drilling; **нет** Context/Zustand/redux/глобального стора; состояние экранов не живёт в `window`.
102. **CSS не изменён** (A46): 21 файл `css/**` — md5 совпадает; все классы, `@import`, inline-стили (`roundEarnings`, сообщение `ErrorModal`) те же; внешний вид 1:1.
103. **Игровая логика не изменена** (Z19): пороги 100/70/40, 3 жизни, 10 вопросов, 10 очков, сгорание, генератор, `Stats` v3 / `ml_stats`, миграции, `PlayerRules`/`PlayerState`.
104. **`tsc` 0 + тесты:** `npx tsc --noEmit` — 0; `npm test` — **141/141 в 11 сьютах**; новых тестов нет; `jest.*` нет; удаление 41 UI-теста зафиксировано (решение №8).
105. **Дисциплина миграции** (A41–A43): строгий порядок; один экран за шаг; после каждого — игра играется и контрольная точка (D12); старый JS не сосуществует с новым дольше одного шага.
106. **Документация синхронизирована:** `README.md`, `GIGACODE.md`, `test/README.md`, `SPEC.md` (статус), `plans/PLAN.md` = 1.8.0, `plans/PLAN_v1_7_0.md` — архив.

---

## 📏 Бюджет 200 строк

| Файл | Сейчас | После 1.8.0 | Как уложиться |
|------|--------|-------------|----------------|
| `main.tsx` | 22 | **≈20** | без импорта `script.js`, `bootstrap()` |
| `src/App.tsx` | 36 | **≈90** | композиция + `ScreenPortal` |
| `src/components/ResultsScreen.tsx` | — | **≈55** | одна разметка, два колбэка |
| `src/components/MapSelectionModal.tsx` | — | **≈45** | `null`/список |
| `src/components/GameScreen.tsx` | — | **≈120** | шапка + вопрос + ответы + feedback |
| `src/components/MapScreen.tsx` | — | **≈90** | карта + модалка сложности |
| `src/components/Zone.tsx` / `Trainer.tsx` / `Player.tsx` / `Path.tsx` | — | **30 / 30 / 25 / 20** | по одному элементу |
| `src/components/Header.tsx` | — | **≈30** | счёт + 🌍 |
| `src/components/ErrorModal.tsx` | 33 | **33** | не меняется |
| `src/hooks/useGame.ts` | — | **≈130** | ответ/next/exit + `+10` |
| `src/hooks/useMap.ts` | — | **≈160** | клик/движение/модалка/resize/статы |
| `src/hooks/useResults.ts` | — | **≈50** | порядок побочных эффектов |
| `src/hooks/useMapSelection.ts` | — | **≈50** | open/close/select |
| `src/hooks/useSessionLock.ts` | — | **≈45** | канал + fallback |
| `src/hooks/useAudio.ts` | — | **≈15** | обёртка |
| `src/bootstrap.ts` | — | **≈25** | init 1:1 из `script.js` |
| `src/types.ts` | 107 | **≈160** | + view-типы и мост (мост потом уходит) |
| `src/config.ts` | — | **≈8** | ре-экспорт |
| `js/script.js` | 29 | **удалён** | 15.7 |
| `js/view/**` (9) | 679 | **удалены** | по шагам |
| `js/controller/**` (6) | 538 | **удалены** | по шагам |

Если `useMap.ts` подойдёт к 200 — вынести чистые вычисления раскладки в `map-layout.js` (уже там) или разбить обработчик resize в `useMapResize` (**не** дублируя логику).

---

## 📂 Структура файлов (дельта и итог)

```
index.html                       # [ИЗМ] без view/controller-тегов, #root display: contents
main.tsx                         # [ИЗМ] bootstrap() + createRoot, без script.js
src/
  App.tsx                        # [ИЗМ] каркас, состояние, порталы, модалки
  bootstrap.ts                   # [NEW] init слоёв
  config.ts                      # [NEW] export const config: Config = CONFIG
  types.ts                       # [ПЕРЕЕЗД из js/model/types.ts] + view-типы, MlBridge (временный)
  components/
    ResultsScreen.tsx            # [NEW] TR-15
    MapSelectionModal.tsx        # [NEW] TR-16
    GameScreen.tsx               # [NEW] TR-17
    MapScreen.tsx                # [NEW] TR-18
    Zone.tsx Trainer.tsx Player.tsx Path.tsx  # [NEW] TR-18
    Header.tsx                   # [NEW] TR-19
    ErrorModal.tsx               # [без изм.]
  hooks/
    useResults.ts useGame.ts useMap.ts useMapSelection.ts useSessionLock.ts useAudio.ts  # [NEW]
js/
  model/    config.ts session-model.ts map-catalog.js stats-schema.js   # [game-model.ts удалён]
  storage/  repository.ts local-repository.ts memory-repository.ts session-repository.ts
  service/  stats-service.ts session-service.ts audio-service.js
  logic/    generator.ts scoring.ts game-rules.ts player-rules.js player-state.js map-layout.js  # [map-layout переехал]
  errors/   custom-errors.ts error-handler.ts
  view/     — УДАЛЁН
  controller/ — УДАЛЁН
  script.js — УДАЛЁН
css/** (21 файл)                  # [без изм.]
test/** (11 сьютов, 141)          # [ИЗМ] −3 сьюта, путь map-layout
README.md GIGACODE.md test/README.md  # [ИЗМ] документация 1.8.0
.gigacode/
  plans/PLAN.md                   # этот файл (1.8.0)
  plans/PLAN_v1_7_0.md            # архив 1.7.0
  specs/SPEC.md, spec_v1_8_0.md
  rulles/RULES.md, rules_v_1_8_0.md
```

---

## 🚫 Запреты

### Z19 (Этап 3) — буквально

- **Глобальное** состояние (Context/Zustand/redux) — позже, Этап 4.
- **Оптимизация** (`memo`, `useMemo` «для скорости», ленивые чанки) — позже.
- **Тесты** (новые; порт на React) — позже. Разрешены только: удаление сьютов удалённых файлов и правка **пути** к `map-layout`.
- **Новые фичи**: анимации, тосты, `Escape`/`aria-modal`/фокус-ловушки, порталы сверх `ScreenPortal`, прогресс тренажёров, звук шагов.
- **Изменение CSS**: классы, `@import`, значения, inline-стили — как есть.
- **Изменение логики игры**: пороги, очки, жизни, генератор, `Stats`, `ml_stats`, правила игрока.

### Z20 (компоненты)

- Классовые компоненты; `any` без необходимости; `var`.
- Прямой DOM (`document.*`, `innerHTML`, `classList`, `addEventListener`) — кроме: `getElementById('root')` в `main.tsx`, `getElementById(targetId)` в `ScreenPortal` (до 15.6), `ref` на `.map`/`.map-player` для замера/перехода.
- Бизнес-логика (правила, Storage, Stats) в компонентах — только в хуках и слоях.
- Дублирование типов: доменные — только в `src/types.ts`.

### Z21 (миграция)

- Мигрировать **два** экрана одновременно.
- Оставлять старый `view/*.js`/`controller/*.js` после шага.
- Менять CSS «заодно», добавлять фичи, забывать мёртвый код (`GameModel`, `.streak-badge`).
- Оставлять **два** входа (`script.js` + `main.tsx`) после 15.7.

### Дополнительно для 1.8.0

- Импортировать классические слои как ES-модули (исчезнут глобалы) — только через `<script>`-теги.
- `checkJs`, перевод `moduleResolution`, обновление TypeScript/React на этом этапе.
- Менять `build` на `vite build` (не бандлит classic-скрипты).
- Вызывать `ScreenView`/`AppController` из компонентов **после** 15.6.
- Оставлять `window.mlBridge`/`window.showErrorModal` после соответствующих шагов.
- Класть компоненты/хуки в `js/` (там лимит 200 и классические скрипты).

---

## 📦 Вне области (SPEC v1.8.0)

- **Этап 4** — глобальное состояние (Context/Zustand), `useStats.ts`.
- **Этап 5** — оптимизация, тесты React, перевод слоёв на ES-модули, чистка `game.css` (двойной импорт, отсутствующий `game-header.css`), удаление осиротевшего `results-streak.css`.
- Новые фичи и контент: второй предмет, прогресс/звёзды, темы генератора, анимации игрока.
- Прод-сборка (`vite build`) и переезд дерева в `src/`.
- Порт 41 удалённого UI-теста на React-тесты (`@testing-library/react`) — отдельная задача.
- Удаление `jest.config.js`/`jest-environment-jsdom` и прочий техдолг.

---

## ⚠️ Отклонения от буквы SPEC/RULES и почему они вынужденные

| # | Требование | Почему буквально не выходит | Как решаем |
|---|-----------|------------------------------|-----------|
| D1 | **T36**: `main.tsx` в `src/` | **A38/T32** требуют корень; смена пути ломает рабочую `<script type="module" src="/main.tsx">` | Оставляем в корне; остальная структура T36 соблюдена |
| D2 | **TR-21**: «`main.tsx` — единственная точка входа» + «в `js/` только слои» | Классические слои объявляют **глобалы** (`CONFIG`, `SessionModel`, `StatsService`…). Импорт как ES-модуля делает их модульными — приложение падает. Перевод на `import/export` — это ~19 файлов и слом `eval`-тестов, т.е. отдельный этап | Слои остаются 19 classic-тегами; `main.tsx` — единственный **вход приложения** (нет `script.js`, контроллеров и `ScreenView`). Отдельно зафиксировано для Этапа 5 |
| D3 | **TR-18**: состояние `currentTrainerIndex`/`isModalOpen`/`isMoving` — в `MapScreen` | **Z20** запрещает бизнес-логику в компонентах; движение/откат/сохранение позиции — логика | Состояние — в `useMap`, `MapScreen` получает read-only значения и колбэки |
| D4 | **TR-15**: пропсы `results`, `rating`, `onPlayAgain`, `onBackToMap` | Строка «Заработано … ✓/не зачтено» зависит от `isSuccessful`, которого нет в `results` (там `lives`/`completed`, а расчёт — логика `Scoring`) | Добавлен презентационный проп `earnings: string`; расчёт — в `useResults` (прежний код `ResultsController.show`) |
| D5 | **TR-17**: пропс `session` | Если передать `SessionModel`, рендер зависит от мутабельного класса без уведомления React | Передаётся снимок `GameSessionView`; модель остаётся в `useGame` |
| D6 | **TR-20**: «удалить экран приветствия» | Экрана нет с 1.5.0 (проверено: `welcome-screen` отсутствует, `ScreenView` знает 3 экрана) | Шаг 15.6 фиксирует «уже удалён» и удаляет оставшиеся `app-controller`/`screen-view` |
| D7 | **A47**: `onTransitionEnd` | В 1.5.0 прибытие ждал `setTimeout(MOVE_MS)`; переход может не сработать, если элемент скрыт (`display:none`) в момент смены точки | Прибытие — `onTransitionEnd` (`transform`, `target === currentTarget`), `arrived` хранится в `ref`; `reset`/`reload` обнуляют его. Страховочный таймер добавляем только если ручной прогон покажет залипание — как защиту, не как фичу |
| D8 | **Порталы** не описаны в SPEC | Без порталов нельзя сохранить `.app`-обёртку, `.screen`/`.active` и CSS без правок | `ScreenPortal` в `App.tsx` (≈8 строк), удаляется на 15.6 вместе с контейнерами |
| D9 | **A46**: CSS не меняется | `#root` — новый промежуточный flex-элемент, `.app` перестанет растягиваться | `style="display: contents"` на `#root` (inline-разметка, не CSS-файл) |
| D10 | «Все тесты остаются» (критерий 1.7.0) | 41 тест читает удаляемые `view/controller` через `eval`; без файлов они не существуют | Сьюты удаляются вместе с файлами; 123 теста логики + 18 `map-layout` = **141** (решение №8) |
| D11 | **A40**: «после Этапа 3 уберём `window`» | Мост нужен **внутри** этапа, пока часть экранов legacy | Мост снимается **до** конца этапа: `mlBridge` — на 15.5, `showErrorModal` — на 15.6; на 15.7 `window`-API не остаётся |
| D12 | **A43**: «Git-коммит после каждого экрана» | В проекте нет репозитория, владелец решил его **не создавать** | Контрольная точка: `md5sum`-снимок `js/`, `css/`, `index.html` + запись в `/tmp/ml-1.8.0-log.txt`; перед удалением — копия файлов в `/tmp/ml-1.8.0-backup/<метка>/`. Фиксация состояния вместо коммита |

---

## 🔗 Трассировка требований

| Требование | Где реализуется | Шаг | Критерии |
|-----------|-----------------|-----|----------|
| TR-15. Результаты | `ResultsScreen.tsx`, `useResults.ts` | 15.1 | 91 |
| TR-16. Модалка карт | `MapSelectionModal.tsx`, `useMapSelection.ts` | 15.2 | 92 |
| TR-17. Игра | `GameScreen.tsx`, `useGame.ts` | 15.3 | 93 |
| TR-18. Карта | `MapScreen.tsx`, `Zone/Trainer/Player/Path.tsx`, `useMap.ts` | 15.4 | 94 |
| TR-19. Шапка | `Header.tsx` | 15.5 | 95 |
| TR-20. Приветствие | `App.tsx`, удаление `app-controller`/`screen-view` | 15.6 | 96 |
| TR-21. Чистка | `bootstrap.ts`, `main.tsx`, удаление `script.js` | 15.7 | 97 |
| TR-22. Игра работает | 16 сценариев | 15.8 | 98 |
| T36. Структура `src/` | components / hooks / types / config / App | 15.1–15.7 | 91–97 |
| T37. Компоненты | все `*.tsx` | 15.1–15.6 | 99 |
| T38. Хуки | `src/hooks/**` | 15.1–15.6 | 100 |
| T39. Обработчики | `onClick`/`stopPropagation` | 15.1–15.6 | 99 |
| T40. SVG-дорога | `Path.tsx`, `map-layout.js` | 15.4 | 94 |
| A41. По одному | таблица шагов | 15.0–15.7 | 105 |
| A42. Порядок | 15.1 → 15.5 | — | 105 |
| A43. Удаление + фиксация | каждый шаг | 15.1–15.7 | 105 |
| A44. Функциональные | все компоненты | 15.1–15.6 | 99 |
| A45. Локальное состояние | `App` + хуки | 15.1–15.7 | 101 |
| A46. CSS | md5-аудит | 15.8 | 102 |
| A47. Движение | `Player.tsx`, `useMap.ts` | 15.4 | 94 |
| Z19. Запреты этапа 3 | раздел «Запреты» | весь этап | 102, 103 |
| Z20. Запреты в компонентах | `*.tsx`, аудит | 15.8 | 99, 101 |
| Z21. Запреты миграции | удаления и фиксации | 15.1–15.7 | 97, 105 |
| Мост 1.7.0 (`showErrorModal`) | снят | 15.6 | 96 |
| Мёртвый код | `GameModel`, `.streak-badge` | 15.6, 15.7 | 97 |

---

## ⚠️ Риски и примечания

- **Тесты (согласовано, №8).** Удаление 3 UI-сьютов (41 тест) утверждено владельцем, итог — **141/141**. На 15.9 зафиксировать причину в `test/README.md`, чтобы сокращение не выглядело потерей покрытия логики.
- **Git отсутствует (решение владельца, №9/D12).** Нет `git diff` и отката: «не тронуто» проверяется `md5sum`, откат шага — копией файлов в `/tmp/ml-1.8.0-backup/<метка>/` (делается **перед** удалением). Удаления и правки всё равно атомарны по шагам.
- **Порядок инициализации.** Мост `window.mlBridge` публикуется в эффекте `App` **после** монтирования, а `script.js` выполняет `AppController.init()` **до** рендера. Поэтому legacy-код не должен вызывать мост из `init()` (в 15.1–15.5 там только `showCurrentMap`/сессия); единственные вызовы — из пользовательских действий. Проверять на 15.1.
- **`StrictMode`.** В dev эффекты срабатывают дважды: мост снимается/ставится (идемпотентно), `useSessionLock` создаёт канал дважды (второй `hello` — безвреден, но проверить вторую вкладку), таймер `+10` очищается в cleanup. Не убирать `StrictMode` ради «чистоты».
- **`onTransitionEnd`.** Может не прийти, если `#mapScreen` в этот момент `display:none` (например, переход в игру во время анимации) или если transform не изменился. `arrived` живёт в `ref` и обнуляется в `reset/reload`; после ручного прогона 15.4 проверить сценарии «движение → сразу 🌍 → выбор карты» и «движение → ✕». Если залипание воспроизводится — добавить **страховочный** таймер `MOVE_MS + 200`, это не фича, а защита от залипания (решение фиксировать в журнале).
- **Ширина карты.** `MapLayout.buildLayout` измеряет `clientWidth`; в React — `ref` на `.map` + `useLayoutEffect` + повторный замер после появления скроллбара (как в 1.5.0). На первом рендере возможен кадр с `FALLBACK_WIDTH = 600` — так было и раньше.
- **Модалки и stacking.** Модалка сложности рендерится внутри `#mapScreen` (`z-index: 1` создаёт stacking context); оверлей `position: fixed; z-index: 1000` остаётся выше `.app`. Если появится перекрытие — перенести модалку в `App` (без правок CSS), это не меняет критерии.
- **Инлайн-стили.** `#roundEarnings` (`text-align`, `color`, `margin-bottom`) и сообщение `ErrorModal` (`color`, `marginBottom`) переносятся инлайн — иначе визуал изменится (A46).
- **Звук.** Каждый шаг проверять клики: 🌍, «Закрыть», карта, сложность, ответ, «Продолжить», ✕, «Играть снова», «На карту», OK ошибки; `win`/`lose` — только на результатах.
- **`confirm()` в выходе** остаётся блокирующим, как в 1.5.0; текст «Выйти из игры? Заработано N очков сгорят.» не меняется.
- **Две модели.** После 15.3 `SessionModel`/`ProblemGenerator` создаются в `useGame`, а `script.js` их больше не создаёт — иначе возможен рассинхрон позиции/счёта. Проверить, что `GameModel` не мешает (он мёртв и удаляется на 15.7).
- **Чтение Storage.** `useMap.reload()` читает `StatsService` по требованию (монтирование, возврат на карту, смена карты), а не в каждом рендере — иначе лишние `load()`/миграции.
- **`display: contents`.** Если браузер/стили дадут неожиданный результат, альтернатива — оставить `.app` прямым ребёнком `body`, а React-каркас рендерить в него порталом (без правок CSS); тогда порталы остаются навсегда, но верстка гарантирована. Проверить на 15.6 в реальном браузере.
- **`game.css`-дефект** (двойной импорт `game-answers`, отсутствует `game-header`) сохраняется: `.round-score`/`.score-badge` остаются без стилей. Это **не** регрессия 1.8.0 — так было до миграции.
- **`js/model/types.ts` → `src/types.ts`.** `tsconfig.include` уже покрывает `src`; тесты файл не читают; `GIGACODE.md`/`README.md` обновляются на 15.9.
- **Типы `MapLayout`.** JSDoc возвращает `Object[]`/`{…}`, а view-типы (`MapGeometry`, `TrainerPoint`) — строгие. Если `tsc` не примет неявные типы, уточнить JSDoc в `map-layout.js` (без изменения логики) или объявить API `MapLayout` в `src/types.ts`; `as any` не использовать. Это же касается `PlayerState`/`PlayerRules` (JSDoc уже описывает параметры).
- **`test/README.md` временно рассинхронизирован** после 15.2/15.4 (в нём ещё 14 сьютов/182) — приводится в порядок на 15.9; тесты от этого не зависят.
- **Песочница.** `npm run dev` и `npm install` пишут вне сессионного workspace — при работе в песочнице может требоваться расширение доступа; это окружение, а не проект.

### Согласовано с владельцем (29.10.2026)

1. **Тесты:** удалить 3 UI-сьюта вместе с `view/controller` → **141/141** в 11 сьютах (№8).
2. **Git:** репозиторий **не создаём**; вместо коммитов — контрольные точки `md5sum` + журнал (№9, D12).
3. **TR-21:** 19 classic-тегов слоёв **остаются** в `index.html`; `main.tsx` — единственный вход приложения (D2).

---

## ✅ Ожидаемый результат 1.8.0

- **Все экраны — React**: `ResultsScreen`, `MapSelectionModal`, `GameScreen`, `MapScreen` (+`Zone`/`Trainer`/`Player`/`Path`), `Header`, `ErrorModal`; состояние — в `App` и хуках, без глобального стора.
- **Старый JS удалён**: 9 `view/*.js`, 6 `controller/*.js`, `js/script.js`; в `js/` — только слои; `main.tsx` + `bootstrap.ts` — единственный вход приложения.
- **Поведение 1:1**: карта (100px, одна SVG-дорога, игрок 🚶 600 мс), модалки сложности/карт, победа/провал, откат/повтор, глобальная карта, блокировка вкладок, `Stats` v3, `ml_stats`.
- **CSS — 0 правок** (21 файл, md5); **логика игры — 0 изменений**.
- **`tsc --noEmit` — 0**; **`npm test` — 141/141** в 11 сьютах; **16 сценариев** проходят в `npm run dev`.
- Заложена база Этапа 4 (глобальное состояние) и Этапа 5 (оптимизация, тесты, ES-модули).

---

## 📌 Краткая памятка агенту

✅ Порядок: результаты → модалка карт → игра → карта → шапка → каркас → чистка
✅ Один экран за шаг: старый `view`/`controller` удаляется **в том же шаге**, контрольная точка после каждого (git нет — D12)
✅ React рисует содержимое в существующий контейнер (портал) до 15.6; `.active` — `ScreenView` до 15.6
✅ Временный мост — `window.mlBridge` (тип `MlBridge`), исчезает на 15.5; `window.showErrorModal` — на 15.6
✅ Контроллеры → хуки: `useResults`, `useGame`, `useMap`, `useMapSelection`, `useSessionLock`, `useAudio`
✅ Слои Model/Logic/Storage/Service/Errors — классические глобалы, не трогать API
✅ CSS, классы, inline-стили — как есть; `Stats` v3, `ml_stats`, пороги, жизни, генератор — как есть
✅ Движение игрока — CSS transition 600 мс + `onTransitionEnd` (A47), без rAF и setTimeout-на-приход
✅ Функциональные компоненты, `ComponentNameProps`, `key` в списках, `onClick`, без `any`/`var`
✅ Проверка после каждого шага: `npx tsc --noEmit` → 0, `npm test` → зелёный, `npm run dev` → сценарии, контрольная точка (`md5sum` + журнал)
✅ Итог: `js/view` и `js/controller` пусты/удалены, `script.js` удалён, `tsc` 0, 141/141, 16 сценариев

❌ Два экрана одновременно; старый JS после шага; мёртвый код
❌ Context/Zustand/redux, глобальное состояние, `useStats` (Этап 4)
❌ Правки `css/**`, логики игры, `Stats`-формата, ключа `ml_stats`
❌ Новые фичи (анимации, `Escape`, фокус-ловушки, тосты), новые тесты, `vite build`
❌ `any`, `var`, прямой DOM в компонентах (кроме `#root`, `ref`, `ScreenPortal` до 15.6)
❌ `script.js` + `main.tsx` одновременно; `window.mlBridge`/`showErrorModal` после своих шагов
