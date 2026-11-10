# План — MathLingo

**Версия:** 1.8.3  
**Статус:** Этап 18 «Тесты на импортах» (SPEC 1.8.3). Этап 1 — миграция 12 сьютов — ✅ выполнен; этапы 18.1–18.7 — план  
**Базовая линия 1.8.3 (проверено 04.11.2026):** `npx tsc --noEmit` — **0 ошибок**, `npm test` — **158/158 в 12 сьютах** (~5.6 с), покрытие загруженных модулей — **97.13%** statements / **90.58%** branches  
**Создан на основе:** RULES 1.8.3 (`rules_v_1_8_3.md`: A59–A64, T50–T55, Z27–Z29) и SPEC 1.8.3 (`spec_v1_8_3.md`: TR-42…TR-50)  
**Предыдущая версия плана:** 1.8.2 (`plans/PLAN_v1_8_2.md` — архив)  
**Тип изменения:** миграция **тестов**, а не поведения. Сьюты проверяют прод-код через `import`, а не через `eval`/`readSource` и копии логики; добавляются React-тесты (RTL) и пороги покрытия 80/60. Поведение, разметка, CSS, тексты, `CONFIG`, `Stats` v3 и ключи хранилища **не меняются**; `src/**` **не правится**.

---

## ⚠️ Решения, на которых стоит план

| # | Решение | Следствие |
|---|---------|-----------|
| 1 | **Этап 1 не переписывается.** Миграция 12 сьютов, удаление `eval`/`readSource`/копии `CONFIG`, `allowJs: false` уже сделаны и зелёные (158 тестов, `tsc` 0) | 18.0 — только фиксация этапа 1 в git; работа начинается с 18.1 |
| 2 | **Порядок:** зависимости и `setup` → компоненты → хуки → coverage и точечные тесты данных → E2E-заготовка → документация → аудит | Каждый шаг заканчивается `tsc` 0 + зелёным прогоном; coverage включается только после того, как UI-сьюты написаны |
| 3 | **`src/**` неприкосновенен** (Z28/TR-47): тест подстраивается под прод-API, а не наоборот | Если тест обнаруживает дефект (например, отрицательный ответ в `hard`, D12 спеки), он фиксируется в отчёте и выносится за пределы 1.8.3 |
| 4 | **Фейковый `Services` — в каждом сьюте** (T51), без общего `test/fixtures/`: A60 требует «общие моки — только `test/setup.ts`», «тесты не импортируют друг друга» | Дублирование ~10 строк на файл осознанно; при росте числа сьютов вопрос выносится владельцу |
| 5 | **Движение 600 мс в проде — CSS-transition + `onTransitionEnd`** (`Player.tsx`), а не `setTimeout` | Тест эмитит `transitionend` на `.map-player`; fake timers нужны только для 100 мс debounce `resize` и 1500 мс плашки `+10`. Уточнение буквы TR-48 |
| 6 | **Coverage сравнивается «как с чем»:** 97.12/90.57 — это 15 загруженных модулей; после расширения `include` агрегат падает до **46.3/41.39** | Порог «не падать» применяется к тому же набору модулей; агрегат с UI сравнивается с целевыми порогами 80/60, а не с 97% |
| 7 | **Пороги не понижаются** (A63/Z28): если UI-группа не добирает 60%, добавляются сценарии, а не исключения из отчёта | `coverage.include` фиксирует все модули слоя; «0% без объяснения» запрещён |
| 8 | **`App.test.tsx` — интеграционный:** реальные хуки + фейковые сервисы | До `ResultsScreen` тест доходит циклом «ответ → Продолжить» (≤ 10 итераций) — исход детерминирован без подмены хуков |
| 9 | **7 компонентных сьютов** по TR-47; `Path`/`Player`/`Trainer`/`Zone` отдельных сьютов не получают | Они покрываются через `MapScreen` (рендерит их все) — этого достаточно для порога 60% |
| 10 | **`@testing-library/*` — единственные новые зависимости**: `@testing-library/react@^16`, `@testing-library/user-event@^14`, `@testing-library/jest-dom@^6` | `npm i -D` не обновляет существующие пакеты; React 19 совместим с RTL 16 |
| 11 | **Coverage-конфиг живёт в `vitest.config.ts`**, `coverage/` — в `.gitignore` | В коммит попадают только конфиг и тесты, не HTML-отчёт |
| 12 | **Ветка — текущая `feature/001`**, коммиты по шагам; новая ветка не создаётся, пуш и мерж — по согласованию | Тестовая миграция не трогает прод-код, отдельная ветка не нужна; `git add -A` запрещён (Z29) |

---

## 🎯 Цель

Вернуть тестам роль страховки: они должны падать, когда ломается прод-код, и проходить, когда он цел.

- **Ноль** `eval` / `new Function` / `readSource` / `fs.readFileSync` / `require` в `test/**`.
- Все сьюты — `.test.ts`/`.test.tsx` и **импортируют** `src/core`, `src/data`, `src/services`, `src/components`, `src/hooks`.
- `GameRules`, `ProblemGenerator`, `Scoring`, `SessionModel` тестируются **настоящие**, без копий.
- `StatsService` — только `new StatsService(new MemoryRepository())`; `init(repo)` нет.
- **7** компонентных сьютов (RTL) + **4** хуковых (`renderHook`) + **5** точечных сьютов данных (`error-handler`, `errors`, `local-repository`, `repository`, `memory-repository`).
- Пороги покрытия по группам: `core`/`data`/`services` — **80%**, UI (`components`/`hooks`/`App.tsx`) — **60%**; без погони за 100%.
- `npx tsc --noEmit` — **0**; `npm test` — зелёный; `npm run test:coverage` — пороги зелёные; `src/**` — 0 правок.
- E2E (Playwright) — **по желанию и позже**, в 1.8.3 не блокирует.

---

## 📐 Что именно меняет 1.8.3

| Источник | Требование | Следствие для плана |
|---|---|---|
| **TR-42** | Удалены `eval`/`readSource`/копия `CONFIG`; `setup.ts` без `CONFIG`; `allowJs: false` | Этап 1 — ✅ выполнено (18.0 фиксирует) |
| **TR-43** | 12 сьютов `.test.ts` с импортами прод-кода, зеркальные каталоги | Этап 1 — ✅ выполнено; 18.4 добавляет новые сьюты в те же каталоги |
| **TR-44** | Настоящие `GameRules`/`ProblemGenerator`/`Scoring` | Этап 1 — ✅ выполнено; 18.4 добирает `error-handler` и `errors` |
| **TR-45** | `StatsService` только через конструктор + `MemoryRepository` | Этап 1 — ✅ выполнено; 18.4 добавляет `local-repository`/`repository` |
| **TR-46** | `test/core/session-model.test.ts` на реальной модели, 15 сценариев | Этап 1 — ✅ выполнено |
| **TR-47** | `@testing-library/*`; 7 компонентных сьютов; фейковый `Services` | 18.1 (зависимости/setup), 18.2 (сьюты) |
| **TR-48** | 4 хуковых сьюта, `renderHook`, fake timers, mock `BroadcastChannel` | 18.3 |
| **TR-49** | Coverage `include` + пороги 80/60; точечные тесты `error-handler`, `local-repository`, `repository` | 18.4 |
| **TR-50** | E2E Playwright — опционально, отдельный скрипт | 18.5 (только backlog, без установки) |
| **A59–A64** | Импорты вместо копий; зеркальная структура; конструктор + `MemoryRepository`; поведение вместо реализации; покрытие-порог; детерминизм | Все шаги 18.1–18.7 |
| **T50–T55** | Структура/имена тестов, контракты двойников, минимум RTL, coverage-конфиг, набор проверок | 18.1–18.4, 18.7 |
| **Z27–Z29** | Запреты в тестах, «запрещено ради зелёного», запреты в git/CI | Раздел «Запреты», критерий 149 |

---

## ✅ Что НЕ меняется

| Область | Факт |
|---------|------|
| `src/**` | **38 файлов, 0 правок**: ни `core`, ни `data`, ни `services`, ни `components`, ни `hooks`, ни `App.tsx`/`main.tsx` (Z28/TR-47) |
| Поведение игры | 10 вопросов, 3 жизни, `+10` за верный ответ, `RATINGS` (100/70/40/0), `GAMEOVER`, «Игра окончена» при `lives <= 0` |
| `CONFIG` / `Stats` | значения 1.8.2, `Stats` v3, миграции `1 → 2 → 3`, ключи `ml_stats`, `ml_session_lock` |
| Разметка и CSS | 21 файл `css/**`, `id` (`#root`, `#mapScreen`, `#gameScreen`, `#resultScreen`), классы, тексты, эмодзи — без изменений |
| Звук | `audio/click.mp3`, `win.mp3`, `lose.mp3`; ошибки по-прежнему глотаются |
| Существующие 12 сьютов | Сценарии сохраняются; удаление/`skip`/ослабление запрещено (Z28). Допустимо только **добавление** проверок (например, ветка `play` без `preload` в `audio-service`, 42-я строка) |
| `package.json` | Только **добавление** трёх `devDependencies`; `scripts` не меняются (`test:e2e` появится вместе с Playwright) |
| `index.html`, `jest.config.js` | Вне области — не трогаем |

---

## 📎 Исходное состояние (проверено 04.11.2026)

| Проверка | Факт | Вывод |
|---|---|---|
| `npx tsc --noEmit` | **0** | Исходная точка зелёная |
| `npm test` | **158/158** в **12** сьютах, ~5.6 с | `core` 124 (10 сьютов), `data` 26, `services` 8 |
| `test/` | `setup.ts` (только мок `Audio`), `core/`×10, `data/`×1, `services/`×1 | Зеркальная структура этапа 1 на месте |
| `test/setup.ts` | `vi.stubGlobal('Audio', …)`; **нет** `CONFIG`, **нет** `jest-dom`, `BroadcastChannel` не мокается | 18.1 добавляет `jest-dom` и заглушку канала |
| `tests: components/hooks` | **0 файлов** | Весь UI-слой (61+251+39 statements) не покрыт |
| `package.json` devDeps | `@vitest/coverage-v8`, `jsdom`, `typescript`, `vitest`, `vite`, `@types/react*` | Нет `@testing-library/react`, `user-event`, `jest-dom` |
| `vitest.config.ts` | `provider: 'v8'`, `reporter: ['text','json','html']`; **нет** `include`, **нет** `thresholds` | Покрытие считается только по загруженным модулям |
| Coverage (текущий конфиг) | 15 модулей: **97.13%** stmts / **90.58%** branches | Это «этап 1», а не весь `src/` |
| Coverage (целевой `include`) | всего **46.3%** / **41.39%**: `core` 93.58/82.35, `data` 67.69/50.0, `services` 94.44/75.0, `components` 0/61, `hooks` 0/251, `App.tsx` 0/39 | Реальная точка старта для 18.4 |
| Не покрыто в `core`/`data` | `error-handler.ts` 0/14, `local-repository.ts` 0/17, `repository.ts` 0/3, `errors.ts` 8/10, `memory-repository.ts` 4/5, `session-model.ts` 27/29 | Нужны точечные сьюты, иначе `data` остаётся 67.69% |
| `vitest` CLI | `npx vitest run --coverage --coverage.include=…` работает; запись отчёта вне `coverage/` нужна в песочнице | `coverage/` под `.gitignore` |
| Git | ветка `feature/001`; этап 1 **не закоммичен**: 7 `M` (`README`, `test/README`, `GIGACODE`, `SPEC`, `RULES`, `tsconfig`, `vitest.config`), 14 `D` (12 старых `.test.js`, `setup.js`, `ts-source.js`), 6 `??` (новые сьюты, `setup.ts`, `spec_v1_8_3.md`, `rules_v_1_8_3.md`) | 18.0 фиксирует этап 1 адресными `git add` |

### Чего не хватает после этапа 1

1. **React-тестов** — ни один компонент и ни один хук не проверяется.
2. **`@testing-library/*`** — зависимости не установлены, `setup.ts` без `jest-dom`.
3. **Заглушки `BroadcastChannel`** — `useSessionLock` в тестах опирается на реальный API jsdom.
4. **Coverage-политики** — нет `include`, нет `thresholds`, отчёт врёт «97%» про весь `src/`.
5. **Точечных сьютов данных** — `error-handler`, `local-repository`, `repository` не проверяются вовсе.
6. **Синхронизации документации** — README/test/README/GIGACODE описывают этап 1 как финал; SPEC 1.8.3 в статусе «В работе», TASKS без этапа 18.

---

## 🏗️ Архитектура тестов (целевая)

```
src/core/**        →  test/core/**        *.test.ts     (unit: чистый домен)
src/data/**        →  test/data/**        *.test.ts     (unit: репозитории, StatsService)
src/services/**    →  test/services/**    *.test.ts     (unit: AudioService)
src/components/**  →  test/components/**  *.test.tsx    (RTL: разметка + поведение по пропсам)
src/hooks/**       →  test/hooks/**       *.test.tsx    (renderHook: состояние и эффекты)
src/App.tsx        →  test/components/App.test.tsx      (интеграция: хуки + компоненты)
```

| Уровень | Что проверяет | Чем | Изоляция |
|---|---|---|---|
| Unit домена | Формулы, миграции, правила, геометрия | `import` из `src/core`, `src/data` | Без DOM; `MemoryRepository` вместо `localStorage` |
| Компонент | То, что видит пользователь: роли, тексты, контрактные классы (`correct`, `wrong`, `--current/--near/--far`, `selected`) | RTL + `user-event` | Только props; `Services` не передаётся в компоненты |
| Хук | Состояние, эффекты, таймеры, звук, статистика | `renderHook` + фейковый `Services` | Явные `services`-двойники, `BroadcastChannel` — заглушка |
| Интеграция (`App`) | Переходы экранов, модалки, полный раунд | Реальные хуки + фейковый `Services` | `CONFIG.MAPS` меняется в `try/finally` и восстанавливается |

**Правила именования** (A60/T50): имя файла = имя модуля; `.test.ts` — не-React; `.test.tsx` — компоненты и хуки с JSX; один сьют — один модуль; тесты не импортируют друг друга; общие моки — только `test/setup.ts`.

---

## 🧩 Контракты тестовых двойников

### Фейковый `Services` (в каждом сьюте, T51)

```ts
function makeServices(overrides: Record<string, unknown> = {}): Services {
    const stats = {
        load: vi.fn(), save: vi.fn(),
        getCurrentMap: vi.fn(() => 'math'),
        getTotalScore: vi.fn(() => 0),
        updateAfterRound: vi.fn(),
        getTrainerIndex: vi.fn(() => -1),
        saveTrainerIndex: vi.fn(),
        switchMap: vi.fn(() => true),
        reset: vi.fn(),
        ...overrides
    } as unknown as StatsService;

    const audio = { preload: vi.fn(), play: vi.fn() } as unknown as AudioService;
    return { audio, stats };
}
```

- Тип — `import type { Services } from '../../src/app/types'`.
- Значения по умолчанию дают «чистую» карту: `math`, счёт 0, игрок перед первым тренажёром (`-1`).
- Методы-`vi.fn()` возвращают то, что нужно сценарию; проверяется **вызов с аргументами** (`updateAfterRound(80)`, `switchMap('english')`, `saveTrainerIndex(0)`).

### `StatsService` в юнит-тестах (A61)

```ts
const repo = new MemoryRepository();
const service = new StatsService(repo);
repo.save({ version: 1, totalScore: 30 }); // подготовка
```

`init(repo)` не существует; ошибки репозитория — `vi.spyOn(repo, 'load' | 'save')`; `handleError` мокается один раз на файл через `vi.mock`.

### Таймеры и события (A64)

| Механизм | Как в тесте |
|---|---|
| Движение 600 мс | `fireEvent.transitionEnd(player, { propertyName: 'transform' })` — прод слушает `onTransitionEnd`, а не `setTimeout` |
| Debounce `resize` 100 мс | `vi.useFakeTimers()` → `act(() => vi.advanceTimersByTime(100))` → `vi.useRealTimers()` в `afterEach` |
| Плашка `+10` 1.5 с | fake timers + `act` до и после `advanceTimersByTime(1500)` |
| Выход из игры | `vi.spyOn(window, 'confirm').mockReturnValue(true \| false)` |
| Вторая вкладка | класс-заглушка `BroadcastChannel` с `postMessage`, `close`, `onmessage` |

В `setup.ts` — только безопасная заглушка канала (чтобы jsdom не открывал реальные каналы и не протекал `ml_session_lock`); сценарии 18.3 переопределяют её управляемой версией в своём файле.

### Поиск элементов (A62)

- `getByRole`, `getByText`, `getByLabelText` — основной способ.
- CSS-классы — только контрактные: `correct`, `wrong`, `map-trainer--current/--near/--far`, `selected`, `.active`.
- `document.querySelector` — не основной способ; допустим точечно для проверки класса у элемента, найденного по роли/тексту.

---

## 🚀 Этап 18: тесты на импортах (SPEC 1.8.3 = этапы 2–5 спеки)

Порядок жёсткий: **зависимости → компоненты → хуки → coverage → E2E-backlog → документация → аудит**. После каждого шага — `npx tsc --noEmit` = 0 и зелёный `npm test`; `npm run test:coverage` — на 18.4 и в аудите.

| Шаг | Что делается | Файлы | Метка коммита |
|---|---|---|---|
| 18.0 | фиксация этапа 1 | `test/**`, `tsconfig.json`, `vitest.config.ts`, доки 1.8.3 | `test(1.8.3): импорты` |
| 18.1 | `@testing-library/*`, `jest-dom`, заглушка `BroadcastChannel` | `package.json`, `package-lock.json`, `test/setup.ts` | `test(1.8.3): rtl-setup` |
| 18.2 | 7 компонентных сьютов | `test/components/**` | `test(1.8.3): components` |
| 18.3 | 4 хуковых сьюта | `test/hooks/**` | `test(1.8.3): hooks` |
| 18.4 | coverage `include` + пороги + точечные тесты `core`/`data` | `vitest.config.ts`, `test/core/error-handler.test.ts`, `test/data/*.test.ts` | `test(1.8.3): coverage` |
| 18.5 | E2E — только backlog, без установки | `TASKS.md`, `README.md` | `docs(1.8.3): e2e-backlog` |
| 18.6 | синхронизация документации | README, test/README, GIGACODE, SPEC, TASKS, plans | `docs 1.8.3` |
| 18.7 | финальный аудит | — | `final-audit` |

### 18.0. Фиксация этапа 1 (TR-42…TR-46)

- `git status --short` — зафиксировать: 7 `M`, 14 `D`, 6 `??`. **Никакого `git add -A`** (Z29): в дереве есть чужие правки `SPEC.md`/`RULES.md`.
- Адресно: `git add test tsconfig.json vitest.config.ts README.md GIGACODE.md .gigacode/specs/SPEC.md .gigacode/rulles/RULES.md`. `git add test` фиксирует и добавления, и удаления внутри каталога (Git ≥ 2.0); полный `git add -A` запрещён.
- `git add .gigacode/specs/spec_v1_8_3.md .gigacode/rulles/rules_v_1_8_3.md` (источники, если нужно закоммитить вместе с тестами).
- Коммит: `test(1.8.3): сьюты на импортах — этап 1`. Пуш — только по согласованию.

**Проверка:** `git status --short` — дерево чистое, кроме нового `PLAN.md`/архива; `npx tsc --noEmit` → 0; `npm test` → 158/12.

**Критерий:** этап 1 в истории одним коммитом; `git diff --name-only` не содержит `src/**`. **Охватывает:** TR-42–TR-46, Z29.

### 18.1. Зависимости и `setup` (TR-47/T50/T52)

```bash
npm i -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- `test/setup.ts`: добавить `import '@testing-library/jest-dom/vitest';` (даёт `toBeInTheDocument`, `toHaveClass`, `toHaveTextContent` и типы).
- Оставить мок `Audio`; **не** добавлять `CONFIG`, `ZONES`, `MAPS`, `RATINGS`, `GAMEOVER` (A59/Z27).
- Добавить заглушку `BroadcastChannel`:

```ts
class BroadcastChannelStub {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage = vi.fn();
    close = vi.fn();
    constructor(public name: string) {}
}
vi.stubGlobal('BroadcastChannel', BroadcastChannelStub);
```

- Если `tsc` не видит типов `jest-dom`, добавить в `tsconfig.types` ссылку на пакет **только после проверки** (вероятнее, augmentation из `setup.ts` достаточно, т.к. файл входит в `include`).

**Проверка:** `npm ls @testing-library/react @testing-library/user-event @testing-library/jest-dom` — установлены; `npx tsc --noEmit` → 0; `npm test` → по-прежнему 158/12 (изменения `setup` не ломают этап 1); `npx vitest run --coverage` запускается.

**Критерий:** три зависимости в `devDependencies`; `setup.ts` без доменных констант; канал замокан глобально. **Охватывает:** TR-47 (setup), T50, T51, A59, A64.

### 18.2. Компонентные сьюты (TR-47/T52, A62)

Семь файлов в `test/components/`. Все — на пропсах, без `Services`, кроме `App`.

#### `GameScreen.test.tsx` (~9)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Рендер вопроса | текст вопроса; 4 `role=button` с вариантами; счёт `🏆 0`; `1/10`; 3 ❤️ |
| 2 | Верный ответ (`correctIndex === selectedIndex`) | у кнопки класс `correct`, остальные без `wrong`; кнопки `disabled`; `onAnswer(index)` |
| 3 | Неверный ответ | у выбранной класс `wrong`, у правильной `correct` |
| 4 | Feedback верный | `.feedback` с классом `correct-fb show`, заголовок «✅ Правильно!», сообщение |
| 5 | Feedback неверный | `wrong-fb show`, «❌ Неправильно», «Правильный ответ: N.» |
| 6 | Нет ответа | `.feedback.hidden`; кнопки активны |
| 7 | «Продолжить» | `onNext` вызван один раз |
| 8 | «✕» | `onExit` вызван |
| 9 | Плашка `+10` | при `floatingScore = 10` виден `+10`, при `null` — `display: none` |

#### `MapScreen.test.tsx` (~8)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Карта | **15** кнопок `.map-trainer`; 3 зоны по 5; подписи «Сложение/Вычитание/Умножение» |
| 2 | Контрактные классы | при `currentTrainerIndex = 0`: `--current` у №1, `--near` у №2, `--far` у №3+ |
| 3 | Старт (`-1`) | `--near` у №1, `--far` у остальных, `--current` нет |
| 4 | Клик по тренажёру | `onTrainerClick(zone, number, index)` с аргументами из `data-zone`/`data-trainer`/`data-index` |
| 5 | Модалка открыта | заголовок «Сложение · Тренажёр 1» (зона + номер); 3 кнопки `data-diff`; «Отмена» |
| 6 | Выбор сложности | `onSelectDifficulty('easy' \| 'medium' \| 'hard')` |
| 7 | «Отмена» | `onCancel` вызван, модалки в DOM нет |
| 8 | Прибытие игрока | `transitionend` на `.map-player` при `isMoving` → `onPlayerArrived`; без `isMoving` — не вызывается |

#### `App.test.tsx` (~10, интеграционный)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Первый рендер | `#mapScreen.active`, 15 тренажёров, счёт `🏆 0` из `stats.getTotalScore` |
| 2 | Клик по соседнему | `isMoving`; `transitionend` → модалка сложности |
| 3 | Старт игры | выбор сложности → `#gameScreen.active`, вопрос и 4 ответа |
| 4 | Завершение раунда | цикл «ответ → Продолжить» ≤ 10 раз → `#resultScreen.active`, «Правильных», «Играть снова», «На карту» |
| 5 | Модалка выбора карты | клик по 🌍 → «Выбор карты», текущая карта с классом `selected` |
| 6 | Смена карты | вторая карта в `CONFIG.MAPS` (push/finally), `switchMap` → `true`: `switchMap('english')` вызван, модалка закрыта, `getCurrentMap` перечитан |
| 7 | Та же карта | `switchMap(false)` → модалка остаётся, `audio.play` не растёт |
| 8 | Модалка ошибки | управляемая заглушка `BroadcastChannel`: `onmessage` → «Игра уже запущена», «OK» закрывает |
| 9 | «На карту» с результатов | возврат на `#mapScreen.active` |
| 10 | Звук кликов | `audio.play('click')` на переходах (не в компонентах) |

> `App` рендерит **реальные** хуки: `useMap`, `useResults`, `useMapSelection`, `useSessionLock`, `useGame`. Поэтому сценарии 2–4 и 8 заодно дают покрытие хукам — но 18.3 всё равно нужен для адресных веток.

#### `ResultsScreen.test.tsx` (~4)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Победа 8/2 | `rating.icon` 🎉, «Отлично!», `8` и «Правильных» в первой карточке, `earnings` из props |
| 2 | Счёт и очки | `roundScore` в `.stat-value`, подпись «Очков» |
| 3 | «Играть снова» | `onPlayAgain` |
| 4 | «На карту» | `onBackToMap` |

#### `MapSelectionModal.test.tsx` (~5)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Список карт | «Математика», «Английский» (props, без `CONFIG`) |
| 2 | Текущая карта | класс `selected` у текущей, у остальных нет |
| 3 | Выбор другой | `onSelect('english')` |
| 4 | Та же карта | `onSelect('math')` вызван; no-op реализует `useMapSelection` — проверяется в `App.test.tsx` (сценарий 7) |
| 5 | «Закрыть» | `onClose` |

#### `Header.test.tsx` (~3)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Счёт | `🏆 80` для `totalScore = 80`; `🏆 0` для нуля |
| 2 | Состав `Header` | только `.total-score` и кнопка карты; жизней здесь нет (они в `GameScreen`) — фиксируем фактический контракт 1.8.2 |
| 3 | Кнопка карты | `aria-label="Выбор карты"`, клик → `onOpenMapSelection` |

> Уточнение: TR-47/T52 перечисляют «жизни (❤️/🖤)» для `Header`, но в 1.8.2 жизни рендерятся в `GameScreen` (`.lives`), а `Header` — счёт + 🌍. План следует **фактическому API** (`src/**` не меняется); жизни проверяются в `GameScreen`. Отклонение зафиксировано в D-таблице.

#### `ErrorModal.test.tsx` (~3)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Текст | заголовок и сообщение из props |
| 2 | «OK» | `onClose` |
| 3 | Клик по оверлею | `onClose`; клик по карточке — **не** закрывает |

**Проверка шага:** `npx vitest run test/components` — зелёные; `npx tsc --noEmit` → 0; `grep -c "fireEvent" test/components` — минимум (только `transitionend` и оверлей, где `user-event` не выражает сценарий); `grep -rn "document.querySelector" test/components` — 0 или с комментарием.

**Критерий:** 7 файлов, ≥ 40 тестов; покрытие `src/components/**` ≥ 60%; `Path`/`Player`/`Trainer`/`Zone` покрыты через `MapScreen`. **Охватывает:** TR-47, T52, A62, A64, Z27.

### 18.3. Хуковые сьюты (TR-48/T53)

Четыре файла в `test/hooks/`. `renderHook` из `@testing-library/react`, фейковый `Services`, реальные `core`-модули.

#### `useGame.test.tsx` (~10)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | `start('easy')` | вопрос есть, `lives 3`, `progress 10`, `questionNumber 1`, `roundScore 0` |
| 2 | Верный ответ | `roundScore +10`, `floatingScore 10`, `feedback.isCorrect`, `selectedIndex = correctIndex`, `audio.play('click')` |
| 3 | Неверный ответ | `lives 2`, `feedback.isCorrect false`, `floatingScore null` |
| 4 | Повторный `answer` | второй вызов игнорируется (`answeredRef`), счёт и жизни не меняются |
| 5 | `next` | `questionNumber 2`, `progress 20`, `feedback null`, `selectedIndex null`, новый вопрос |
| 6 | Раунд 10/10 | после 10-го `next` — `onRoundFinished` с `{ correct: 10, total: 10, roundScore: 100, lives: 3, completed: true }` |
| 7 | Провал 0/3 | три неверных + `next` → `onRoundFinished` с `{ correct: 0, wrong: 3, total: 3, lives: 0, completed: true }` |
| 8 | Плашка `+10` | fake timers: после 1500 мс `floatingScore null` |
| 9 | `exit` + confirm(true) | `onExitToMap` вызван, `audio.play('click')` |
| 10 | `exit` + confirm(false) | `onExitToMap` не вызван |

#### `useMap.test.tsx` (~10)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Старт | `stats` из сервиса, `mapData.geometry` из `MapLayout.buildLayout(zones, 600)` (в jsdom `clientWidth = 0` → `FALLBACK_WIDTH`) |
| 2 | Клик по текущему (`getTrainerIndex → 0`) | `isModalOpen`, `modalTarget` = `{ zoneTitle, trainerNumber }` |
| 3 | Клик по соседнему (из `-1` в `0`) | `isMoving true`, `currentTrainerIndex` сдвинулся, `audio.play('click')` |
| 4 | `arrived()` (после 3) | движение завершено (`isMoving false`), открылась модалка |
| 5 | Клик по дальнему | `ignore`: ни звука, ни движения, ни модалки |
| 6 | `cancel()` (после 3) | индекс откатился к `previous`, модалка закрыта, звук |
| 7 | `chooseDifficulty('hard')` | `selectedDifficulty = 'hard'`, модалка закрыта |
| 8 | `gameFinished(true)` (после перехода на соседний и прибытия) | `stats.saveTrainerIndex(commitWin())` — сохранён новый индекс, `totalScore` перечитан; повторный `gameFinished` — no-op (replay) |
| 9 | `gameFinished(false)` (после перехода) | `revert()` → `saveTrainerIndex(index)` — индекс отката, без победного закрепления |
| 10 | `exitGame()` (после перехода) | откат индекса без записи в статистику |

Дополнительно: 100 мс debounce `resize` — fake timers + `act`; `window.dispatchEvent(new Event('resize'))`.

#### `useResults.test.tsx` (~5)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Победа 8/2 | `view.rating` 🎉, `earnings: 'Заработано: 80 ✓'`, `onRoundFinished(true)` |
| 2 | Провал | `GAMEOVER` 💔, `earnings: '… (не зачтено)'`, `onRoundFinished(false)` |
| 3 | Победа → статистика | `stats.updateAfterRound(80)`, `audio.play('win')` |
| 4 | Провал → статистика | `updateAfterRound` **не** вызван, `audio.play('lose')` |
| 5 | Повторный `show` | `view` перезаписывается новыми данными, старые не утекают |

#### `useSessionLock.test.tsx` (~5)

| # | Сценарий | Ожидание |
|---|---|---|
| 1 | Монтаж | канал создаётся, `postMessage('hello')` |
| 2 | `onmessage` | `showError('Игра уже запущена', …)` один раз |
| 3 | Два сообщения | `showError` вызван один раз (`locked`) |
| 4 | Cleanup | `close()`, `localStorage.removeItem('ml_session_lock')` |
| 5 | Fallback | `new BroadcastChannel` бросает: свободный ключ → запись `ml_session_lock`; занятый → `showError` |

**Проверка шага:** `npx vitest run test/hooks` — зелёные; `npx tsc --noEmit` → 0; `grep -rn "sleep\|setTimeout(" test/hooks` — 0 (только `advanceTimersByTime`); `vi.useRealTimers()` в `afterEach`.

**Критерий:** 4 файла, ≥ 28 тестов; покрытие `src/hooks/**` ≥ 60% (ожидается 70+); `useGame`/`useResults` не создают сервисы. **Охватывает:** TR-48, T53, A61, A64, Z27.

### 18.4. Покрытие: `include`, пороги, точечные тесты (TR-49/T54, A63)

**18.4a — конфиг** (`vitest.config.ts`):

```ts
coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    include: [
        'src/core/**/*.ts',
        'src/data/**/*.ts',
        'src/services/**/*.ts',
        'src/components/**/*.tsx',
        'src/hooks/**/*.ts',
        'src/App.tsx'
    ],
    exclude: ['src/**/*.d.ts', 'src/main.tsx'],
    thresholds: {
        'src/core/**':        { statements: 80, branches: 80, functions: 80, lines: 80 },
        'src/data/**':        { statements: 80, branches: 80, functions: 80, lines: 80 },
        'src/services/**':    { statements: 80, branches: 80, functions: 80, lines: 80 },
        'src/components/**':  { statements: 60, branches: 60, functions: 60, lines: 60 },
        'src/hooks/**':       { statements: 60, branches: 60, functions: 60, lines: 60 },
        'src/App.tsx':        { statements: 60, branches: 60, functions: 60, lines: 60 }
    }
}
```

**18.4b — недостающие юнит-сьюты:**

| Файл | Сценарии | Закрывает |
|---|---|---|
| `test/core/error-handler.test.ts` (~6) | `handleError` для `CorruptedDataError`/`QuotaExceededError`/`StorageUnavailableError`/`SessionError` → `{ action, userMessage }`; неизвестная ошибка → `console.error` + `throw`; `initGlobalErrorHandlers` вешает `error` и `unhandledrejection` (`vi.spyOn(window, 'addEventListener')`) | `error-handler` 0/14 |
| `test/core/errors.test.ts` (~3) | `instanceof`-цепочка пяти классов, `name` каждого, `SessionError` — экземпляр `Error` (не `StorageError`) | `errors.ts` 8/10 → 10/10 (строки 40–41 — конструктор `SessionError`) |
| `test/data/local-repository.test.ts` (~8) | round-trip `save`/`load`; отсутствие ключа → `null`; `SyntaxError` → `CorruptedDataError`; `setItem` с `name: 'QuotaExceededError'`/`code: 22` → `QuotaExceededError`; прочий throw → `StorageUnavailableError`; `getItem` throw → `StorageUnavailableError`; `clear` | `local-repository` 0/17 |
| `test/data/repository.test.ts` (~3) | `save`/`load`/`clear` базового класса бросают `Not implemented` | `repository` 0/3 |
| `test/data/memory-repository.test.ts` (~3) | `save`/`load`, `load` до записи → `null`, `clear` | `memory-repository` 4/5 |

**18.4c — прогон и фиксация:**

```bash
npm run test:coverage 2>&1 | tee /tmp/ml-1.8.3-coverage.txt
```

Зафиксировать по группам: `core`, `data`, `services`, `components`, `hooks`, `App`, итог. Если группа ниже порога — **добавить сценарии**, не исключения и не снижение порога (Z28). `src/core/types.ts` попадёт в отчёт как 0% при 0 statements — это норма (типы не исполняются); пометить в отчёте, а не исключать.

**Ожидаемые значения после 18.4:**

| Группа | Сейчас | Ожидаемо | Чем добирается |
|---|---|---|---|
| `core` | 93.58 / 82.35 (277/296) | ≥ 95 | `error-handler` 14/14, `errors` 10/10, `session-model` +2 |
| `data` | 67.69 / 50.0 (44/65) | ≥ 80 (факт ~95–100) | `local-repository` 17, `repository` 3, `memory` +1 |
| `services` | 94.44 / 75.0 (17/18) | ≥ 90 | `audio-service` ветка `play` без `preload` |
| `components` | 0/61 | ≥ 60 | 7 сьютов (MapScreen тянет 4 компонента) |
| `hooks` | 0/251 | ≥ 60 | 4 сьюта + `App` |
| `App.tsx` | 0/39 | ≥ 60 | `App.test.tsx` |
| **Итого** | **46.3 / 41.39** | **≥ 70** (минимум по порогам — 516/730 ≈ 70.7%) | — |

**Критерий:** `npm run test:coverage` зелёный по всем порогам; ни одного модуля с 0% без объяснения; итог не ниже 70%. **Охватывает:** TR-49, T54, A63, D14 спеки.

### 18.5. E2E — backlog, не блокер (TR-50)

- Playwright **не устанавливается**; в `npm test` E2E не входит (Z28).
- Когда появится — 7 сценариев из TR-50: карта и 600 мс, «Отмена» без записи, 8/2 → 80, провал, «На карту» + F5, вторая вкладка, смена карты (`−1` и сохранённый счёт).
- Записать в `TASKS.md`/`README.md` как backlog 1.8.3 → 1.9; отдельный скрипт `npm run test:e2e` — только вместе с установкой.

**Критерий:** задокументировано; `package.json` без `@playwright/test`; `npm test` не изменился. **Охватывает:** TR-50, D15, Z28.

### 18.6. Документация

- **`README.md`**: числа — 158 + новые (≈ 253 в 28 сьютах), RTL-тесты, coverage по группам; убрать формулировки «следующие этапы 1.8.3»; smoke-раздел — без изменений.
- **`test/README.md`**: добавить `components/` и `hooks/` в структуру, раздел «Как писать RTL-тесты» (запросы, `user-event`, fake timers, `transitionend`), таблицу покрытия и порогов, baseline 46.3 → цель.
- **`GIGACODE.md`**: раздел «Тесты» — зеркальная структура, запрет `eval`/копий логики, RTL-правила, пороги 80/60; ссылки на A59–A64/T50–T55.
- **`.gigacode/specs/SPEC.md`**: статус 1.8.3 → **Выполнено** (после 18.4).
- **`.gigacode/tasks/TASKS.md`**: архив `TASKS_v1_8_2.md`; версия 1.8.3; этап 18 (18.0–18.7) со статусами; карта покрытия 1.8.3.
- **`.gigacode/plans/`**: `PLAN.md` — эта версия (1.8.3); `PLAN_v1_8_2.md` — архив.

**Критерий:** числа в README/test/README/GIGACODE совпадают с фактическим прогоном; SPEC/TASKS/PLAN — 1.8.3; архивы 1.8.2 на месте. **Охватывает:** обязательство 9/10, SPEC «Что не входит».

### 18.7. Финальный аудит

| # | Проверка | Ожидание |
|---|---|---|
| 1 | `npx tsc --noEmit` | 0 |
| 2 | `npm test` | все сьюты зелёные (28 файлов, ≈ 253 теста) |
| 3 | `npm run test:coverage` | пороги зелёные |
| 4 | `grep -RIn --include='*.ts' --include='*.tsx' "eval(\|readSource\|ts-source" test` | пусто |
| 5 | `grep -RIn "global\.CONFIG\|setupZones\|setupMaps" test` | пусто |
| 6 | `grep -RIn "require(" test` | пусто |
| 7 | `grep -RIn "class ProblemGenerator\|const calculateRoundScore\|const shouldEndGame\|const getRating" test` | пусто |
| 8 | `grep -RIn "new StatsService(new MemoryRepository())" test` | есть |
| 9 | `test -f test/core/session-model.test.ts` | есть |
| 10 | `ls test/components/*.test.tsx \| wc -l` | 7 |
| 11 | `ls test/hooks/*.test.tsx \| wc -l` | 4 |
| 12 | `grep -RIn "\.only(\|\.skip(" test` | пусто |
| 13 | `git diff --name-only` + `git status --short` | только `test/**`, `vitest.config.ts`, `package*.json`, доки; **`src/**` пусто**; `coverage/` не в индексе |
| 14 | `wc -l` новых файлов | каждый ≤ 200 (GIGACODE) |
| 15 | `grep -RIn "document.querySelector" test` | 0 или единичные с комментарием |

**Критерий:** все пункты зелёные; коммиты `test(1.8.3): …` по шагам + `docs 1.8.3`; мерж/пуш — по согласованию. **Охватывает:** TR-49/50, T55, A59–A64, Z27–Z29.

---

## ✅ Критерии завершения (1.8.3, 136–149)

136. **Ни одного `eval`/`readSource`** (A59/TR-42): grep по `test/**` пуст; `test/ts-source.js` отсутствует; `typescript` в тестах не используется.
137. **Все тесты импортируют прод-код** (A59/TR-43): каждый сьют содержит `from '../../src/…'`; ни `require`, ни `module.exports`, ни `declare global`.
138. **Нет копий логики** (TR-44): объявлений `class ProblemGenerator`, `const calculateRoundScore`, `const shouldEndGame`, `const getRating` в `test/**` нет.
139. **`StatsService` — конструктор** (A61/TR-45): только `new StatsService(new MemoryRepository())`; `StatsService.init` отсутствует; `handleError` — `vi.mock` один раз на файл.
140. **`session-model.test.ts`** (TR-46): 15 сценариев на реальной модели, оценки — через реальный `GameRules.getRating`.
141. **7 компонентных сьютов** (TR-47): `App`, `GameScreen`, `MapScreen`, `ResultsScreen`, `MapSelectionModal`, `Header`, `ErrorModal`; все зелёные; `jest-dom`-матчеры используются.
142. **4 хуковых сьюта** (TR-48): `useGame`, `useMap`, `useResults`, `useSessionLock`; `renderHook`; `BroadcastChannel` замокан, а не удалён.
143. **Coverage** (A63/TR-49): `include` покрывает все слои; пороги `core`/`data`/`services` = 80, UI = 60; прогон зелёный; итог ≥ 70%; 100% не требуется.
144. **`src/**` не изменён** (Z28/TR-47): `git diff --name-only` не содержит `src/`; ни один тест не требует правки прод-кода.
145. **Прогон** (TR-49/T55): `npx tsc --noEmit` — 0; `npm test` — зелёный (все сьюты); `npm run test:coverage` — зелёный.
146. **Существующие сценарии сохранены** (Z28): 12 сьютов этапа 1 не удалены и не ослаблены; допустимы только добавления; числа 158+ выросли, а не упали.
147. **Coverage не падает** относительно baseline 1.8.3 для того же набора модулей: `core`/`data`/`services` не ниже 93.58/67.69/94.44 stmts (цель — выше) и 82.35/50.0/75.0 branches.
148. **E2E не в `npm test`** (TR-50/Z28): Playwright не установлен, `npm test` не изменился; backlog записан.
149. **Git-дисциплина** (Z29): нет `git add -A`; `coverage/`, `node_modules`, `dist` не закоммичены; ветка `feature/001`; мерж/пуш — по согласованию.

---

## 📏 Бюджет строк (лимит GIGACODE — 200 строк на файл)

| Файл | Оценка | Как уложиться |
|---|---|---|
| `test/components/App.test.tsx` | ≈ 180 | Хелпер `answerUntilResults()` и локаторы в начале файла |
| `test/components/GameScreen.test.tsx` | ≈ 130 | `makeProps()` с дефолтами, точечные переопределения |
| `test/components/MapScreen.test.tsx` | ≈ 150 | `buildMapData()` через `MapLayout.buildLayout(CONFIG.ZONES, 600)` |
| `test/components/ResultsScreen.test.tsx` | ≈ 60 | Один `makeProps()` |
| `test/components/MapSelectionModal.test.tsx` | ≈ 60 | Локальный массив карт |
| `test/components/Header.test.tsx` | ≈ 40 | — |
| `test/components/ErrorModal.test.tsx` | ≈ 45 | — |
| `test/hooks/useGame.test.tsx` | ≈ 170 | `answers(n)` / `wrong(n)` хелперы |
| `test/hooks/useMap.test.tsx` | ≈ 180 | Фикстуры `zones`/`mapData`, `act`-хелперы |
| `test/hooks/useResults.test.tsx` | ≈ 90 | `makeResult()` |
| `test/hooks/useSessionLock.test.tsx` | ≈ 110 | Управляемая заглушка канала в `beforeEach` |
| `test/core/error-handler.test.ts` | ≈ 70 | Таблица ошибок → `test.each` |
| `test/core/errors.test.ts` | ≈ 40 | — |
| `test/data/local-repository.test.ts` | ≈ 120 | `withLocalStorage()`-хелпер, `test.each` для квоты |
| `test/data/repository.test.ts` | ≈ 35 | `test.each` по трём методам |
| `test/data/memory-repository.test.ts` | ≈ 40 | — |
| `test/services/audio-service.test.ts` | +≈ 15 | Дополнение: `play` без `preload` (ветка `_isReady`) |

Если файл выходит за 200 — сокращать фикстуры и дублирующиеся `expect`, **не** дробить сьют на два (A60: один сьют — один модуль) и не выносить общий мок в `setup.ts`.

---

## 📂 Структура файлов (дельта)

```
test/
├── setup.ts                                # [ИЗМ] + jest-dom, + заглушка BroadcastChannel
├── core/
│   ├── error-handler.test.ts               # [NEW] 14 statements
│   ├── errors.test.ts                      # [NEW] 2 пропущенных statements
│   └── … (10 сьютов этапа 1)               # [без изм.], допустимы добавления
├── data/
│   ├── local-repository.test.ts            # [NEW] 17 statements
│   ├── repository.test.ts                  # [NEW] 3 statements
│   ├── memory-repository.test.ts           # [NEW] 4/5 statements (1 пропущенный)
│   └── stats-service.test.ts               # [без изм.]
├── services/
│   └── audio-service.test.ts               # [без изм.], + ветка play без preload
├── components/                             # [NEW] 7 файлов, *.test.tsx
│   ├── App.test.tsx
│   ├── GameScreen.test.tsx
│   ├── MapScreen.test.tsx
│   ├── ResultsScreen.test.tsx
│   ├── MapSelectionModal.test.tsx
│   ├── Header.test.tsx
│   └── ErrorModal.test.tsx
└── hooks/                                  # [NEW] 4 файла, *.test.tsx
    ├── useGame.test.tsx
    ├── useMap.test.tsx
    ├── useResults.test.tsx
    └── useSessionLock.test.tsx

vitest.config.ts                            # [ИЗМ] coverage.include + thresholds
package.json / package-lock.json            # [ИЗМ] +3 devDependencies, scripts без изменений
README.md, test/README.md, GIGACODE.md      # [ИЗМ] числа, RTL, coverage
.gigacode/specs/SPEC.md                     # [ИЗМ] статус 1.8.3 — выполнено
.gigacode/specs/spec_v1_8_3.md              # источник (не меняется)
.gigacode/rulles/RULES.md                   # [ИЗМ] уже указывает на rules_v_1_8_3.md
.gigacode/rulles/rules_v_1_8_3.md           # источник (не меняется)
.gigacode/tasks/TASKS.md                    # [ИЗМ] версия 1.8.3, этап 18
.gigacode/tasks/TASKS_v1_8_2.md             # архив (18.6)
.gigacode/plans/PLAN.md                     # этот файл (1.8.3)
.gigacode/plans/PLAN_v1_8_2.md              # архив 1.8.2
src/**                                      # [без изм.] 38 файлов
css/ (21), audio/ (3), index.html           # [без изм.]
```

---

## 🚫 Запреты

### Z27 (тесты) — буквально

- `eval`, `new Function`, `readSource`, `fs.readFileSync`, `require`; копии прод-логики вместо импорта.
- `global.CONFIG` и собственная копия `CONFIG` в `test/setup.ts`.
- `StatsService.init(...)`; создание сервисов в module scope.
- Проверка приватных полей (`_lives`, `_sounds`, `_repo`) вместо публичного API.
- Снимки всего DOM-дерева; тесты, завязанные на порядок CSS/Tailwind-классов.
- `setTimeout`/`sleep` вместо fake timers и `waitFor`.
- `test.only`, `describe.skip`, `it.skip` без объяснения в отчёте.

### Z28 (ради зелёного) — буквально

- Удалять, скипать или ослаблять существующие сценарии.
- Менять `src/**` под тест (наоборот: тест подстраивается под прод-API).
- Понижать пороги покрытия, чтобы пройти.
- Объявлять успех по частичному прогону или по «покрытие потом».
- Добавлять E2E в обязательный `npm test`.

### Z29 (git/CI) — буквально

- Коммитить `coverage/`, `node_modules`, `dist`, кэш Vite.
- Делать `git add -A` (в дереве есть посторонние файлы документации).
- Мержить ветку с красными тестами.
- Переписывать историю (`rebase -i`, `reset --hard`) без согласования.

### Дополнительно для 1.8.3

- Импортировать компоненты в тесты хуков и наоборот; завязывать юнит-тест на разметку.
- Подменять `Math.random` «по месту», оставляя недетерминированный генератор в других сьютах.
- Оставлять открытые каналы/таймеры между тестами (`beforeEach`/`afterEach`).
- «Заодно» править `src/**`, `vite build`, `jest.config.js`, `package.json`-скрипты.
- Выносить общие фикстуры в `test/fixtures/` в обход A60 (вопрос владельцу, если понадобится).

---

## 📦 Вне области (SPEC 1.8.3)

- Поведение игры, разметка, CSS, тексты, `CONFIG`, формат `Stats`, ключи `ml_stats`/`ml_session_lock`.
- Починка `vite build`, `@vitejs/plugin-react`, ассеты, чистка `package.json` (этапы 4–5 плана 1.8.2).
- 100% покрытие и тесты ради покрытия.
- E2E как блокер 1.8.3; установка Playwright.
- Переписывание `src/**` под тесты.
- Изменение 12 сьютов этапа 1 сверх добавлений; понижение порогов.

---

## ⚠️ Отклонения/уточнения от буквы SPEC/RULES

| # | Требование | Уточнение | Как решаем |
|---|---|---|---|
| D34 | TR-48: «600 мс — fake timers + `advanceTimersByTime(600)`» | В проде движение завершает CSS-transition и `onTransitionEnd` (`Player.tsx`), а `MOVE_MS` — константа для геометрии/тестов домена | В хуке и компоненте эмитим `transitionend`; fake timers — для 100 мс debounce и 1500 мс плашки. Домен `PlayerRules.MOVE_MS` проверяется в `player-rules.test.ts` |
| D35 | T51: фейковый `Services` в каждом сьюте | 7 + 4 файла × ~10 строк дублирования | Дублируем; общий `test/fixtures/` не вводим — A60 «общие моки только в `setup.ts`». Вопрос владельцу при росте |
| D36 | TR-47/T52: `Header` проверяет жизни (❤️/🖤) | В 1.8.2 жизни рендерит `GameScreen` (`.lives`), `Header` — счёт + 🌍 | Следуем фактическому API: жизни — в `GameScreen.test.tsx`, `Header` — счёт и кнопка; `src/**` не правим |
| D37 | TR-49: «coverage не должен падать относительно baseline 97.12/90.57» | 97.12/90.57 — только 15 загруженных модулей; с `include` всех слоёв агрегат 46.3/41.39 | Сравниваем по сопоставимому набору: `core`/`data`/`services` не ниже текущих значений; агрегат — по порогам 80/60 и цели ≥ 70% |
| D38 | T54: `include` добавляет `error-handler`, `local-repository`, `repository` | Эти модули сейчас 0% (14 + 17 + 3 statements) | 18.4b — точечные сьюты до порогов; исключать нельзя |
| D39 | A60: «общие моки — только `test/setup.ts`» | `BroadcastChannel` нужен управляемым в `useSessionLock`, а также в `App` | В `setup.ts` — безопасная заглушка по умолчанию; сьюты переопределяют её `vi.stubGlobal` в своём файле (A64 разрешает) |
| D40 | TR-48: `useSessionLock` мокает `BroadcastChannel` | jsdom может предоставлять реальный канал; реальный `postMessage` между тестами непредсказуем | Глобальная заглушка в `setup.ts`; fallback-сценарий — класс, бросающий в конструкторе |
| D41 | TR-47: «снимки всего дерева запрещены; точечные `toMatchObject`/`toHaveClass`» | `App` — интеграционный, DOM большой | Проверяем контракт: `.active` у экрана, наличие ключевых ролей/текстов; без snapshot |
| D42 | SPEC: `test/core/types.ts` в `include` | Файл типовой, 0 statements | Попадает в отчёт как 0% при 0/0 — не влияет на группу; помечаем в отчёте |
| D43 | TR-49: порог `services` 80 | Сейчас `audio-service` 17/18 (75% branches) | Добавляем сценарий `play` без `preload` (ветвь `_isReady`); не понижаем порог |
| D44 | TR-47: «в тестах нет `document.querySelector` как основного способа поиска» | Для проверки класса у элемента, найденного по роли, `querySelector` иногда короче | Допускаем единичные вхождения с комментарием; основа — `getByRole`/`getByText`/`getByLabelText` |
| D45 | TR-50: E2E «5–7 сценариев» | Playwright не установлен, сценарии требуют `npm run dev` и браузера | Backlog в TASKS/README; `npm test` E2E не включает; установка — отдельной задачей |
| D46 | Z28: «не менять `src/**`» | Тест `hard`-генератора может выявить отрицательные ответы (D12 спеки) | Фиксируем наблюдение в отчёте; поведение не меняем, баг — отдельной задачей |

---

## 🔗 Трассировка требований

| Требование | Где реализуется | Шаг | Критерии |
|---|---|---|---|
| TR-42. Нет `eval`/`readSource`/`CONFIG`-копии | `test/**`, `setup.ts`, `tsconfig` | этап 1, 18.0 | 136, 145 |
| TR-43. 12 сьютов на `.test.ts` | `test/core`, `test/data`, `test/services` | этап 1, 18.0 | 137, 146 |
| TR-44. Настоящие реализации | те же сьюты, без копий | этап 1, 18.4b | 138 |
| TR-45. `StatsService` + `MemoryRepository` | `stats-service.test.ts`, новые сьюты данных | этап 1, 18.4b | 139 |
| TR-46. `session-model.test.ts` | `test/core/session-model.test.ts` | этап 1 | 140 |
| TR-47. React-тесты | `test/components/**`, `setup.ts`, `package.json` | 18.1, 18.2 | 141 |
| TR-48. Тесты хуков | `test/hooks/**` | 18.3 | 142 |
| TR-49. Покрытие 80/60 | `vitest.config.ts`, точечные сьюты | 18.4 | 143, 147 |
| TR-50. E2E опционально | TASKS/README backlog | 18.5 | 148 |
| A59. Импорты, не копии | все сьюты | 18.1–18.4 | 136–139 |
| A60. Зеркальная структура | `test/{core,data,services,components,hooks}` | 18.2–18.4 | 141, 142 |
| A61. Конструктор + `MemoryRepository` | `test/data/*` | 18.4b | 139 |
| A62. Поведение, не реализация | компонентные сьюты | 18.2 | 141 |
| A63. Покрытие-порог | `vitest.config.ts` | 18.4 | 143, 147 |
| A64. Детерминизм | таймеры, моки, `try/finally` | 18.2–18.4 | 142, 145 |
| T50–T55. Структура/двойники/проверки | контракты, аудит | 18.1–18.4, 18.7 | 136–149 |
| Z27–Z29. Запреты | раздел «Запреты» | все шаги | 149 |

---

## ⚠️ Риски и примечания

- **`clientWidth = 0` в jsdom (R1).** `useMap.measure()` читает `element.clientWidth` → 0 → остаётся `MapLayout.FALLBACK_WIDTH` (600). Это ожидаемо и детерминированно; пиксельные координаты не проверяем (контракт — классы `--current/--near/--far`).
- **CSS-transition в jsdom (R2).** Браузерных переходов нет: `transitionend` эмитится вручную. Тест, который «ждёт 600 мс», будет падать по таймауту — это антипаттерн, см. D34.
- **`user-event` + fake timers (R3).** При активных fake timers `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`; иначе промисы событий не разрешаются. Предпочтительно: fake timers — только в сьютах с таймерами, `user-event` — на реальных.
- **`act()` и предупреждения (R4).** Состояние хуков меняется из эффектов и промисов: `await waitFor(...)` для асинхронных обновлений; `act` — только где без него предупреждение.
- **React 19 + RTL 16 (R5).** `@testing-library/react@^16` требует `@testing-library/dom` (peer) — ставится транзитивно; `jest-dom@^6` — импорт `@testing-library/jest-dom/vitest`. Проверить `npm ls` после установки.
- **Заглушка `BroadcastChannel` (R6).** Реальный канал в jsdom может переносить `hello` между тестами и оставлять `ml_session_lock`; глобальная заглушка в `setup.ts` + `localStorage.clear()` в `beforeEach` там, где это важно.
- **`confirm` (R7).** `useGame.exit()` вызывает `window.confirm`; в jsdom он `undefined` → нужно `vi.spyOn(window, 'confirm')`. Без мока выход «не сработает» и тест будет ложно-зелёным.
- **Тяжёлый `App.test.tsx` (R8).** До результатов — до 10 циклов «ответ → Продолжить»; при генераторе на `Math.random` исход не важен (победа/провал/лимит вопросов), но цикл должен завершаться по лимиту итераций, а не по «ожиданию».
- **Пороги и glob-ключи (R9).** `thresholds` с `'src/core/**'` считает по группе; `src/app/**` намеренно вне `include` (это composition root), `types.ts` — 0/0. Убедиться, что `npx vitest run --coverage` не падает на пустых группах.
- **Песочница (R10).** Отчёт coverage пишется в `coverage/`; вне сессионного workspace это read-only — для замеров использовать `--coverage.reportsDirectory=<tmp>`. Это окружение, а не проект.
- **Соблазн «упростить» (R11).** Любая копия формулы в тесте («как считается рейтинг») — нарушение A59; ожидаемые значения берём из `CONFIG`/реального модуля либо фиксируем литералом **один раз** в `expect` (100/70/40/0).
- **Лимит 200 строк (R12).** Самые крупные — `App`, `useMap`, `useGame`; сокращать фикстуры, не дробить сьют (A60).
- **`allowJs: false` и типы `jest-dom` (R13).** Augmentation приходит из `setup.ts`; если `tsc` не видит `toHaveClass` — добавить `types` в `tsconfig` **после** проверки, не ослабляя `strict`.

### Вопросы владельцу (если не согласовано)

1. **Коммиты:** 18.0 — один коммит этапа 1, далее по шагам (`rtl-setup`, `components`, `hooks`, `coverage`, `docs`) — ок? Пуш/мерж — по согласованию.
2. **Общие фикстуры:** допустимо ли позже вынести `makeServices` в `test/fixtures/`, если дублирование начнёт мешать (сейчас — inline по A60)?
3. **E2E:** подтверждаем, что Playwright остаётся в backlog 1.9 и в 1.8.3 не устанавливается?
4. **`Header` и жизни:** подтверждаем следование фактическому API (жизни в `GameScreen`), без правки `src/**`?

---

## ✅ Ожидаемый результат 1.8.3

- **Тесты проверяют прод-код:** 28 сьютов (`12` + `5` данных + `7` компонентных + `4` хуковых), ≈ 253 теста, все зелёные; ни одного `eval`/`readSource`/копии логики.
- **UI под тестами:** 7 компонентных сьютов (RTL + `user-event` + `jest-dom`) и 4 хуковых (`renderHook`, fake timers, управляемый `BroadcastChannel`).
- **Покрытие:** `core` ≥ 80 (факт ~95+), `data` ≥ 80, `services` ≥ 80, `components`/`hooks`/`App` ≥ 60, итог ≥ 70%; `coverage.include` — все слои; 100% не цель.
- **`tsc --noEmit` — 0**, `npm test` — зелёный, `npm run test:coverage` — зелёный; `src/**` — **0 правок**.
- **Документация 1.8.3:** README/test/README/GIGACODE с новыми числами, SPEC — «Выполнено», TASKS — этап 18, PLAN — эта версия, `PLAN_v1_8_2.md` и `TASKS_v1_8_2.md` — архивы.
- **E2E** — backlog 1.9, не блокер; `npm test` E2E не включает.

---

## 📌 Краткая памятка агенту

✅ Этап 1 уже зелёный (158/12, `tsc` 0) — только коммит (18.0), не переписывать
✅ Порядок: `setup` → компоненты → хуки → coverage + точечные сьюты → backlog E2E → доки → аудит
✅ RTL: `getByRole`/`getByText`, `user-event`, `jest-dom`, точечные `toHaveClass`
✅ Хуки: `renderHook`, фейковый `Services` в файле, `BroadcastChannel` — заглушка
✅ Движение: `transitionend` на `.map-player`; timers — только 100 мс и 1500 мс
✅ Coverage: `include` все слои + пороги 80/60; `core`/`data`/`services` не ниже baseline
✅ `StatsService` — `new StatsService(new MemoryRepository())`; `handleError` — `vi.mock` один раз
✅ `tsc` 0 и `npm test` после каждого шага; `src/**` — 0 правок

❌ `eval`, `readSource`, `fs.readFileSync`, `require`, копии логики, `global.CONFIG`
❌ `StatsService.init`, сервисы в module scope, приватные поля в проверках
❌ Снимки всего DOM, `sleep`/`setTimeout` в тестах, `test.only`/`skip`
❌ Правки `src/**` ради тестов, понижение порогов, E2E в `npm test`
❌ `git add -A`, коммит `coverage/`, мерж с красными тестами
