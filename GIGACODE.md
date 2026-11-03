# Руководство по репозиторию

## Обзор проекта

**MathLingo** — браузерная игра для тренировки устного счёта. Экраны (карта, игра,
результаты, шапка, модалки) написаны на **React 19**; слои Model, Storage, Service, Logic и
Errors остаются **классическими скриптами** (13 `.ts` + 6 `.js`) и подключаются тегами
`<script>` в `index.html`, а React-модуль `main.tsx` — единственная точка входа приложения.
Запуск — только через Vite (`npm run dev`), типы проверяются `tsc --noEmit`
(`npm run typecheck`). Главный экран — карта с зонами и тренажёрами.

## Структура проекта и организация модулей

```
index.html                  # Единственная точка входа (19 классических скриптов + #root + модуль)
main.tsx                    # bootstrap() → createRoot(<StrictMode><App /></StrictMode>)
src/
  App.tsx                   # Каркас: #mapScreen, .app, модалки, состояние навигации
  bootstrap.ts              # Инициализация слоёв до первого рендера (замена IIFE)
  config.ts                 # export const config: Config = CONFIG
  types.ts                  # Все типы (export {} + declare global) + view-модели; в index.html не подключается
  components/
    ResultsScreen.tsx       # TR-15: иконка, оценка, статистика, «Заработано», две кнопки
    MapSelectionModal.tsx   # TR-16: список карт, выделение текущей, «Закрыть»
    GameScreen.tsx          # TR-17: шапка, вопрос, 4 ответа, feedback, «Продолжить»
    MapScreen.tsx           # TR-18: .map, зоны, SVG-дорога, тренажёры, игрок, модалка сложности
    Zone.tsx                # Полоса зоны: цвет через --zone-color, подпись сбоку
    Trainer.tsx             # Кнопка-тренажёр: data-*, классы --current/--near/--far
    Player.tsx              # Игрок 🚶: transform + onTransitionEnd (600 мс)
    Path.tsx                # Один <svg class="map-road"> и один <path> с кривыми C
    Header.tsx              # Счёт 🏆 (sticky) и кнопка 🌍
    ErrorModal.tsx          # Модалка ошибок на .modal-overlay.open / .modal / .btn
  hooks/
    useResults.ts           # Оценка, успешность, позиция, очки, звук, строка «Заработано»
    useMapSelection.ts      # Открытие/закрытие списка карт, switchMap, no-op той же карты
    useGame.ts              # SessionModel + ProblemGenerator в ref, ответ/next/exit, «+10»
    useMap.ts               # PlayerState, клики, движение, модалка, resize, счёт
    useSessionLock.ts       # BroadcastChannel + hello, вторая вкладка → модалка
    useAudio.ts             # Типизированная обёртка AudioService.play
css/                        # 21 файл, без изменений с 1.5.0 (A46)
  base.css                  # Сброс, типографика, контейнер приложения
  buttons.css               # Варианты кнопок
  screens.css / game.css / results.css  # Макеты экранов
  map.css                   # Карта — собирает map_items/ через @import
  screen_items/             # Каркас экранов (.screen, .active)
  map_items/                # Экран карты, зоны, дорога, игрок, тренажёры, модалки, глобальная карта
  game_items/               # Стили игровых элементов
  result_items/             # Стили результатов
js/                         # Только слои: 19 файлов (13 .ts + 6 .js)
  model/
    config.ts               # CONFIG: ZONES, MAPS, DEFAULT_MAP, VERSION = 3, min в оценках
    session-model.ts        # Состояние раунда (lives, roundScore, currentQuestionIndex, difficulty, completed)
    map-catalog.js          # Каталог карт: get / getDefault / has
    stats-schema.js         # Схема Stats v3: defaults, emptyMap, entry, migrate, ensureMaps
  storage/
    repository.ts           # Базовый класс Repository (контракт, не abstract)
    local-repository.ts     # Реализация через localStorage
    memory-repository.ts    # Тестовая реализация в памяти
    session-repository.ts   # No-op для состояния раунда
  service/
    stats-service.ts        # Статистика по картам: счёт и позиция, switchMap, миграции
    session-service.ts      # Управление состоянием раунда
    audio-service.js        # Предзагрузка и воспроизведение звуков
  logic/
    generator.ts            # Класс ProblemGenerator (о зонах и тренажёрах не знает)
    scoring.ts              # Расчёт очков, проверка успешности раунда
    game-rules.ts           # Проверка ответов, условия завершения, оценки
    player-rules.js         # getAction (текущий/соседний/дальний), normalizeIndex
    player-state.js         # Машина состояний позиции: moveTo, isReplay, revert, commitWin
    map-layout.js           # Чистая геометрия: полосы, шаг 100px, SVG-путь, точка игрока
  errors/
    custom-errors.ts        # Кастомные исключения (StorageError, CorruptedDataError и др.)
    error-handler.ts        # Централизованная обработка ошибок
audio/
  click.mp3                 # Звук клика по кнопке
  win.mp3                   # Звук победы
  lose.mp3                  # Звук поражения
test/
  setup.js                  # Моки и общая настройка vitest (CONFIG v3)
  ts-source.js              # readSource(): чтение и transpileModule для .ts
  logic/                    # Тесты правил, генератора, очков, игрока
  model/                    # Тесты конфига, каталога карт и схемы Stats
  service/                  # Тесты звукового сервиса и статистики
  map/                      # Тесты геометрии карты (18)
.gigacode/
  rulles/RULES.md           # Конституция проекта (актуальная версия)
  specs/SPEC.md             # Спецификация поведения (актуальная версия)
  plans/PLAN.md             # План реализации
  tasks/TASKS.md            # Пошаговый план задач
```

**Порядок загрузки скриптов важен.** В `index.html` 19 классических файлов: Errors → Audio →
Model → Storage → Service → Logic, затем `<div id="root">` и `<script type="module"
src="/main.tsx">`. View/Controller и `js/script.js` удалены в 1.8.0; `main.tsx` вызывает
`bootstrap()`, который связывает `AudioService`, `StatsService`, `SessionService` и
`ErrorHandler`. `types.ts` и другие ES-модули в `index.html` не подключаются.

## Запуск, проверка типов и тесты

Скрипты остаются классическими (без ES-модулей), поэтому `types.ts` в `index.html` не
подключается: Vite в dev-режиме отдаёт `.ts` и `.tsx` и снимает типы на лету. Прямое
открытие `index.html` и `python3 -m http.server` не работают.

```bash
npm install
npm run dev          # http://localhost:5173 — единственный способ запуска
npm run typecheck    # tsc --noEmit: 0 ошибок
npm run build        # = typecheck (Vite не бандлит classic-скрипты)
npm test             # vitest run: 141 тест в 11 сьютах
npm run test:watch   # vitest в watch-режиме
```

Конфигурация — `tsconfig.json` (`strict`, `allowJs`, `noEmit`, `skipLibCheck`,
`types: []`, `include: ["js", "src", "*.tsx"]`), `package.json` (`react`/`react-dom` 19.3.1
в `dependencies`, `@types/react`/`@types/react-dom` в `devDependencies`) и
`vitest.config.ts` (jsdom, `globals`, `setupFiles: ['./test/setup.js']`). Тесты подключают
исходники через `test/ts-source.js`: `readSource()` читает файл и для `.ts` выполняет
`typescript.transpileModule` (ES2020, `module: None`), чтобы классический `eval` понимал
код. `test/setup.js` подменяет `Audio` и объявляет `global.CONFIG` (VERSION 3, `MAPS`,
`DEFAULT_MAP`, `min` в `RATINGS`/`GAMEOVER`). `jest.*` не осталось.

## Стиль кодирования и соглашения об именовании

- **Отступы:** 4 пробела (TypeScript, JavaScript, TSX и CSS).
- **Имена файлов:** kebab-case для слоёв (`game-rules.ts`, `map-trainer.css`); React-компоненты —
  PascalCase (`src/components/GameScreen.tsx`), хуки — `useXxx.ts`, точка входа — `main.tsx`.
- **Именование JS/TS:** camelCase для переменных/функций, PascalCase для классов (`ProblemGenerator`).
- **Константы:** UPPER_SNAKE_CASE в `config.ts` (`TOTAL_QUESTIONS`, `POINTS_BASE`, `ZONES`).
- **CSS-классы:** kebab-case, BEM-подобное именование (`.screen`, `.map-zone`, `.map-trainer`, `.diff-btn`).
- **Типы:** доменные интерфейсы и view-модели — только в `src/types.ts` (`export {}` +
  `declare global`); дублировать их в других файлах нельзя. Пропсы компонентов —
  `ComponentNameProps`, функциональные компоненты, `key` в списках, `onClick` вместо
  `onclick`, без `any`, `var` и прямого DOM.
- **Хуки:** только в компонентах, имя с `use`, без условных вызовов, с зависимостями в
  `useEffect`/`useCallback` и очисткой таймеров, каналов и слушателей.
- **Комментарии:** блок `// === MODULE.TS — назначение ===` в начале каждого файла.
  Внутритекстовые комментарии объясняют *почему*, а не *что*.
- **Лимит файла:** не больше 200 строк в `js/` и `src/` (включая `.tsx`).
- **Линтер и форматирование** не настроены — соблюдайте существующий стиль единообразно.

## Архитектура

Слои данных: Model (данные) → Storage (репозиторий) → Service (связка Model и Storage) →
Logic (правила); плюс инфраструктурные Errors и Audio. Поверх них — React-слой, который
читает классические глобалы (`CONFIG`, `StatsService`, `PlayerState`…).

- **Model:** только состояние — поля, геттеры, сеттеры, `reset()`. Не знает о React, Storage
  и React-хуках. DTO описаны в `src/types.ts`; зоны по умолчанию — `CONFIG.ZONES`,
  каталог предметов — `CONFIG.MAPS` (`MapCatalog`), формат сохранённого — `StatsSchema`.
- **Storage:** единственная точка работы с хранилищем — `Repository` + реализации
  (localStorage, memory, session). Сервисы связывают Model и Storage.
- **Logic:** генерация задач, расчёт очков, проверка ответов, оценка, правила игрока
  (`player-rules.js`) и машина состояний позиции (`player-state.js`), плюс чистая геометрия
  карты (`map-layout.js` — `buildLayout`, `buildRoadPath`, `getPlayerPoint`). DOM и Storage
  внутри нет; о зонах и тренажёрах генератор не знает и остаётся смешанным.
- **Service:** `StatsService` (счёт и позиция текущей карты, `switchMap`, миграции),
  `SessionService`, `AudioService` (предзагрузка/воспроизведение, ошибки игнорируются).
- **Errors:** `ErrorHandler` классифицирует исключения и возвращает `action` + `userMessage`.
- **React-слой (1.8.0):** `main.tsx` вызывает `bootstrap()` и монтирует `<App/>` в `#root`
  (`display: contents`). `src/App.tsx` — композиция и навигация: рендерит `#mapScreen`
  (`.screen`/`.active` из состояния) с `<Header/>` и `<MapScreen/>`, `.app` с
  `#gameScreen`/`#resultScreen`, модалки выбора карты и ошибок. Всё состояние экранов —
  `useState` в хуках (`useGame`, `useMap`, `useResults`, `useMapSelection`,
  `useSessionLock`), без Context/Zustand/redux. Компоненты презентационные: правила, Storage
  и `Stats` внутри них отсутствуют.
- **Движение игрока:** `useMap` меняет `PlayerState` и индекс в состоянии; `Player.tsx`
  получает новую точку, CSS `transition: transform 600ms` проигрывает переход, а
  `onTransitionEnd` (guard: `propertyName === 'transform'`, `target === currentTarget`)
  открывает модалку. Таймеров на приход нет (A47).
- **Классические слои в React:** импортируются **не** как ES-модули (иначе исчезнут
  глобалы) — только тегами `<script>` до модуля; `src/config.ts` даёт типизированный `config`.

## Карта, зоны и тренажёры

- **Карта — главный экран и на весь экран:** `#mapScreen` закреплён (`position: fixed`) с
  отступами 20px: `calc(100vw - 40px)` × `calc(100vh - 40px)`, при переполнении
  прокручивается вертикально. Карту рендерит `MapScreen` из `useMap.mapData`.
- **Зоны:** три зоны из `CONFIG.ZONES` (Сложение, Вычитание, Умножение); цвет берётся из
  `zone.color` и попадает в CSS-переменную `--zone-color` (inline-стиль `Zone.tsx`).
  Полосы позиционируются абсолютно и стыкуются без зазоров; высота — `trainersCount × 100px`.
- **Тренажёры:** `trainersCount` штук в зоне, пронумерованы 1…N, шаг **100px** между
  центрами (в том числе на границе зон); по X чередуются влево/вправо. Геометрия —
  `MapLayout.buildLayout()` без DOM; ширина полотна измеряется через `ref` на `.map` и
  пересчитывается после появления скроллбара.
- **Дорога:** один непрерывный SVG-путь на всю карту (`Path.tsx`: `svg.map-road` +
  `path.map-road-line`) с кубическими кривыми `C`; S-образная линия проходит через все зоны.
- **Resize и возврат на карту:** слушатель `resize` с debounce 100 мс пересчитывает ширину;
  `useMap.reload()` перечитывает `StatsService`/`MapCatalog` и создаёт новый `PlayerState`
  (вызывается при монтировании, «На карту», смене карты и показе карты).
- **Зоны некликабельны** — обработчик есть только у кнопок `.map-trainer` (`Trainer.tsx`).
- **Глобальная карта:** кнопка 🌍 в `<Header/>`, стили — `css/map_items/map-global.css`
  (`position: fixed`, верхний правый угол). Клик открывает `MapSelectionModal` со списком
  `CONFIG.MAPS`: текущая карта получает класс `selected`, «Закрыть» закрывает модалку.
  Выбор другой карты (`StatsService.switchMap`) сбрасывает позицию выбранной карты в `−1`,
  сохраняет счёт прежней и вызывает `map.reload()`; выбор той же карты — полный no-op без
  записи, звука и закрытия.
- **Модалка сложности:** рисуется внутри `MapScreen` (`.modal-overlay.open` → `.modal` →
  три `.diff-btn` → «Отмена»). Открывается **сразу** по приходе на новый тренажёр и по клику
  на текущий (повторная игра). Пока она открыта, движение заблокировано флагом
  `isModalOpen`. Выбор вызывает `useGame.start(difficulty)`, «Отмена» — закрывает модалку и
  делает откат на предыдущий тренажёр. Сложность не сохраняется и на карте не отображается.
- **Результаты:** `ResultsScreen` — «Играть снова» (`useGame.start()` с текущей сложностью)
  и «На карту» (`map.reload()` + переход). Общий счёт начисляется только при успешном раунде.
- **Игрок:** `.map-player` (🚶, 52px, `z-index: 3`, `pointer-events: none`) позиционируется
  через `transform`. Позиция — `maps[текущая карта].currentTrainerIndex` (плоский индекс
  0…14, старт `−1`). Соседние тренажёры получают `--near`, текущий `--current`, дальние
  `--far` (`cursor: not-allowed`) — классы считает `MapScreen` через `PlayerRules.getAction`.
  `PlayerState` ведёт текущую позицию и точку отката; «игра на текущем» — `isReplay()`.
- **Сохранение позиции:** `Stats.version = 3` (`currentMap` + `maps`; своя запись у каждой
  карты); миграции 1 → 2 → 3 пошаговые и идемпотентные. Позиция пишется **только** после
  победы и провала на **новом** тренажёре (`useMap.gameFinished`): победа закрепляет позицию
  (`commitWin`), провал откатывает назад (`revert`). Отмена модалки, выход ✕ и повторная
  игра позицию не перезаписывают (повторная победа лишь начисляет очки). Выход на новом
  тренажёре (`useMap.exitGame`) делает откат без сохранения. Ключ `ml_stats` не менялся.
- **Вне текущей области:** прогресс и блокировка тренажёров, звёзды, темы для генератора,
  дополнительные зоны, уникальный дизайн зон, анимации игрока и звук шагов, второй предмет
  в каталоге карт, глобальное состояние (Этап 4) и React-тесты (Этап 5).

## Порядок подключения в index.html

```html
<!-- Errors -->
<script src="js/errors/custom-errors.ts"></script>
<script src="js/errors/error-handler.ts"></script>

<!-- Audio -->
<script src="js/service/audio-service.js"></script>

<!-- Model (types.ts не подключается — это ES-модуль) -->
<script src="js/model/config.ts"></script>
<script src="js/model/map-catalog.js"></script>
<script src="js/model/stats-schema.js"></script>
<script src="js/model/session-model.ts"></script>

<!-- Storage -->
<script src="js/storage/repository.ts"></script>
<script src="js/storage/local-repository.ts"></script>
<script src="js/storage/memory-repository.ts"></script>
<script src="js/storage/session-repository.ts"></script>

<!-- Service -->
<script src="js/service/stats-service.ts"></script>
<script src="js/service/session-service.ts"></script>

<!-- Logic -->
<script src="js/logic/generator.ts"></script>
<script src="js/logic/scoring.ts"></script>
<script src="js/logic/game-rules.ts"></script>
<script src="js/logic/player-rules.js"></script>
<script src="js/logic/player-state.js"></script>
<script src="js/logic/map-layout.js"></script>

<!-- React: единственный вход приложения -->
<div id="root" style="display: contents"></div>
<script type="module" src="/main.tsx"></script>
```

В `<head>` подключаются шесть CSS-файлов (`base`, `buttons`, `screens`, `game`, `results`,
`map`), остальные собираются через `@import`. Порядок блоков не менять: Vite отдаёт `.ts`
с уже снятыми типами, но глобальные `class`/`const` должны быть объявлены до использования
модулем.

## Звуковое сопровождение

- Звуки хранятся в `audio/` как MP3-файлы.
- `AudioService` предзагружает звуки в `bootstrap()`.
- Хуки вызывают `AudioService.play(name)` на действия пользователя (кнопки карты, модалки,
  ответов, навигации, выход) — напрямую или через `useAudio`.
- Ошибки звука не ломают игру — логируются в `console.warn`.
- Поддерживаемые звуки: `click` (кнопки), `win` (победа), `lose` (поражение).

## История миграции на React

- **1.7.0 — пилот:** `main.tsx`, `src/App.tsx` только для модалки ошибок; мост
  `window.showErrorModal`, старый `#errorOverlay` как fallback; `js/script.js`
  импортировался из `main.tsx`.
- **1.8.0 — переезд экранов:** результаты → выбор карты → игра → карта → шапка → каркас;
  каждый шаг удалял свой `view/*.js` и `controller/*.js` в том же изменении.
  Временный мост `window.mlBridge` жил с 15.1 по 15.15 и удалён вместе с последним
  legacy-вызывающим; `window.showErrorModal` снят на 15.17; `js/script.js` заменён
  `src/bootstrap.ts` на 15.18. Контроллеры стали хуками, View — компонентами,
  `map-layout.js` переехал в `logic/`.

## Коммиты и pull requests

Формальные соглашения пока не enforced. Рекомендуемый подход:

- Используйте описательные сообщения коммитов: `feat: add division problems to medium difficulty`.
- Держите коммиты сфокусированными на одном изменении.
- Для PR: опишите изменение, перечислите затронутые файлы, укажите изменения конфигурации.

## Добавление нового контента

- **Новая зона на карте:** добавьте объект в `CONFIG.ZONES` (`id`, `title`, `color`,
  `trainersCount`) — карта отрисуется автоматически. Тема в генератор пока не передаётся.
- **Новая карта (предмет):** добавьте объект в `CONFIG.MAPS` (`id`, `title`, `zones`) — он
  сразу появится в списке 🌍. Зоны читаются через `MapCatalog.get(...).zones`, поэтому
  вторая карта не требует правок в отрисовке; `Stats` v3 заведёт для неё запись автоматически.
- **Новые задачи:** добавьте логику в соответствующий метод `logic/generator.ts`
  (`easy()`, `medium()`, `hard()`).
- **Новые типы:** доменные интерфейсы и view-модели — только в `src/types.ts` (глобально,
  через `declare global`); в классических `.ts` — без `import`/`export`.
- **Новые элементы UI:** новый компонент в `src/components/` + стили в `css/`; обработчики —
  пропсами React, состояние и побочные эффекты — в хуке `src/hooks/`, а не в компоненте.
- **Настройка сложности:** измените диапазоны в методах `generator.ts` или добавьте новые
  пороги в `CONFIG` (`config.ts`).
- **Новые звуки:** добавьте MP3-файл в `audio/`, зарегистрируйте имя в
  `AudioService.preload()`, вызовите `AudioService.play(name)` в хуке.
- **Тесты:** новый тест — файл `*.test.js` в `test/logic/`, `test/model/`, `test/service/`
  или `test/map/`; исходник подключается через `readSource()` из `test/ts-source.js`
  (понимает `.ts` и `.js`) либо проверяемая логика описывается прямо в тесте.
