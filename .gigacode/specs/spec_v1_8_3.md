**Версия:** 1.8.3
**Статус:** В работе (этап 1 — миграция сьютов — выполнен)
**Тип документа:** Спецификация тестовой миграции (SDD)
**Предыдущая версия:** `spec_v1_8_2.md`
**Связанные документы:** `rules_v_1_8_3.md`, `test/README.md`

> ⚠️ Это спецификация **тестов**, а не поведения игры. Поведение, разметка, CSS,
> ключи хранилища и формат `Stats` не меняются. Все требования ниже описывают,
> **как** проверять прод-код, а не **что** он делает.

---

## 🎯 Цель 1.8.3

Вернуть зелёный `npm test` после архитектурной миграции 1.8.2 и убрать «теневые»
тесты, которые проверяли копии логики и читали исходники через `eval`.

Целевое состояние:

1. **Ни одного** `eval` / `readSource` / `fs.readFileSync` в тестах.
2. Все сьюты — `.test.ts` и импортируют **прод-код** из `src/core`, `src/data`,
   `src/services` (позже — `src/components`, `src/hooks`, `src/App.tsx`).
3. `GameRules`, `ProblemGenerator`, `Scoring` тестируются настоящие, без копий.
4. `StatsService` создаётся через `new StatsService(new MemoryRepository())`;
   глобального `init(repo)` нет.
5. Есть React-тесты на компоненты и хуки (`@testing-library/react`).
6. Покрытие: **80%** для `core`/`data`/`services`, **60–70%** для UI.
   За 100% не гоняемся.
7. E2E (Playwright) — по желанию и позже, не блокирует 1.8.3.

**Критерий готовности:** ни одного `eval`/`readSource`; все тесты импортируют прод-код;
есть React-тесты; покрытие не падает относительно зафиксированного baseline.

---

## 📉 Исходное состояние (baseline 1.8.2)

| Показатель | Значение |
|---|---|
| Сьюты | 12 файлов `test/**/*.test.js` |
| Тесты | 156 заявлено; фактически **43 passed**, 113 не запускаются |
| Прогон | **9 failed / 3 passed** |
| Причина | `readSource('./js/…')` → `ENOENT`: каталог `js/` удалён в 1.8.2 |
| Дубли логики | 43 теста: `game-rules` (12), `generator` (23), `scoring` (8) |
| `CONFIG` в тестах | копия в `test/setup.js` + `global.CONFIG` |
| React-слой | тестов нет, только `tsc --noEmit` и ручной smoke |
| `allowJs` | `true` |
| `test/ts-source.js` | `readSource()` + `typescript.transpileModule` |

> 1.8.0 имел 11 сьютов; в 1.8.1 добавлен `session-model`, поэтому фактически
> переписываются **12** сьютов. Формулировка «11 сьютов» относится к baseline 1.8.0.

### Состояние после этапа 1 (факт)

| Показатель | Значение |
|---|---|
| Сьюты | **12** `.test.ts` в `test/core`, `test/data`, `test/services` |
| Тесты | **158 passed** |
| `npx tsc --noEmit` | **0** |
| `eval` / `readSource` / `ts-source.js` | **0** |
| `CONFIG` в `test/setup.ts` | **0**, тесты импортируют `src/core/config` |
| `allowJs` | **false** |
| Покрытие загруженных модулей | **97.12%** statements, **90.57%** branches |

---

## 🗂️ Целевая структура тестов

```
test/
├── setup.ts                      # только общие моки (Audio), без CONFIG
├── core/
│   ├── config.test.ts
│   ├── game-rules.test.ts
│   ├── generator.test.ts
│   ├── scoring.test.ts
│   ├── player-rules.test.ts
│   ├── player-state.test.ts
│   ├── map-layout.test.ts
│   ├── map-catalog.test.ts
│   ├── session-model.test.ts
│   └── stats-schema.test.ts
├── data/
│   └── stats-service.test.ts
├── services/
│   └── audio-service.test.ts
├── components/                   # этап 2 (RTL)
│   ├── App.test.tsx
│   ├── GameScreen.test.tsx
│   ├── MapScreen.test.tsx
│   ├── ResultsScreen.test.tsx
│   ├── MapSelectionModal.test.tsx
│   ├── Header.test.tsx
│   └── ErrorModal.test.tsx
└── hooks/                        # этап 3 (renderHook)
    ├── useGame.test.tsx
    ├── useMap.test.tsx
    ├── useResults.test.tsx
    └── useSessionLock.test.tsx
```

**Правила именования:** имя файла = имя модуля; `.test.ts` для не-React, `.test.tsx`
для компонентов и хуков с JSX; один сьют — один модуль.

---

## 📋 Требования

### TR-42. Удалить `eval`, `readSource` и копию `CONFIG`

- `test/ts-source.js` **удалён**; `typescript` в тестах больше не используется.
- В `test/**` запрещены `eval`, `new Function`, `fs.readFileSync`, `readSource`.
- `test/setup.js` заменён на `test/setup.ts`; в нём **нет** `CONFIG`, `ZONES`, `MAPS`,
  `RATINGS`, `GAMEOVER`.
- Тесты берут константы только через `import { CONFIG } from '../../src/core/config'`.
- `vitest.config.ts`: `setupFiles: ['./test/setup.ts']`.
- `tsconfig.json`: `allowJs: false`; тесты входят в `include`.

**Критерий:** `grep -RIn --include='*.ts' --include='*.tsx' "eval(\|readSource\|ts-source" test`
— пусто; `grep -RIn "global.CONFIG" test` — пусто; `test/setup.js` и `test/ts-source.js`
отсутствуют. Упоминания `readSource`/`eval` в исторических разделах `test/README.md`
не считаются нарушением.

### TR-43. Перевод 12 сьютов на `.test.ts` с импортами

| Было (1.8.2) | Стало (1.8.3) | Импорт прод-кода |
|---|---|---|
| `test/logic/game-rules.test.js` | `test/core/game-rules.test.ts` | `GameRules`, `SessionModel`, `CONFIG` |
| `test/logic/generator.test.js` | `test/core/generator.test.ts` | `ProblemGenerator` |
| `test/logic/scoring.test.js` | `test/core/scoring.test.ts` | `Scoring`, `CONFIG` |
| `test/logic/player-rules.test.js` | `test/core/player-rules.test.ts` | `PlayerRules` |
| `test/logic/player-state.test.js` | `test/core/player-state.test.ts` | `PlayerState` |
| `test/map/map-layout.test.js` | `test/core/map-layout.test.ts` | `MapLayout`, типы |
| `test/model/config.test.js` | `test/core/config.test.ts` | `CONFIG` |
| `test/model/map-catalog.test.js` | `test/core/map-catalog.test.ts` | `MapCatalog`, `CONFIG` |
| `test/model/session-model.test.js` | `test/core/session-model.test.ts` | `SessionModel`, `GameRules`, `CONFIG` |
| `test/model/stats-schema.test.js` | `test/core/stats-schema.test.ts` | `StatsSchema`, `CorruptedDataError`, `CONFIG` |
| `test/service/stats-service.test.js` | `test/data/stats-service.test.ts` | `StatsService`, `MemoryRepository` |
| `test/service/audio-service.test.js` | `test/services/audio-service.test.ts` | `AudioService` |

- Импорты только относительные: `../../src/core/...`, `../../src/data/...`,
  `../../src/services/...`.
- Типы — через `import type` (`verbatimModuleSyntax`).
- Никаких `require`, `module.exports`, `declare global` в тестах.
- Тестовый фреймворк импортируется явно: `import { describe, expect, test, vi } from 'vitest'`.

**Критерий:** все 12 файлов найдены по новым путям; `npx tsc --noEmit` — 0;
`npm test` — 12/12 сьютов зелёные.

### TR-44. Тестировать настоящие реализации

- `game-rules.test.ts` вызывает `GameRules.checkAnswer`, `GameRules.shouldEndGame`,
  `GameRules.getRating`; для `shouldEndGame` используется реальная `SessionModel`.
- `generator.test.ts` вызывает реальный `ProblemGenerator`; копия класса из теста удалена.
- `scoring.test.ts` вызывает реальный `Scoring`; копии `calculateRoundScore`
  и `isRoundSuccessful` удалены.
- `CONFIG.RATINGS`/`CONFIG.GAMEOVER` берутся из `src/core/config.ts`.
- Количество тестов может меняться, но **сценарии** сохраняются: 100/70/40/0%,
  game over, диапазоны генератора, 4 уникальных варианта, `total = correct + wrong`.

**Критерий:** в тестах нет объявлений `class ProblemGenerator`, `const calculateRoundScore`,
`const shouldEndGame`, `const getRating`; импорт — из `src/core`.

### TR-45. `StatsService` — только через конструктор и `MemoryRepository`

```ts
const repo = new MemoryRepository();
const service = new StatsService(repo);
repo.save({ version: 1, totalScore: 30 }); // подготовка данных
```

- `StatsService.init()` не существует и не вызывается.
- Для ошибок репозитория — `vi.spyOn(repo, 'load' | 'save')`, а не глобальные подмены.
- `handleError` мокается один раз на файл:
  `vi.mock('../../src/core/error-handler', ...)`.
- Проверяются: defaults v3, миграции 1 → 2 → 3, частичные данные, неизвестная карта,
  версия новее текущей, `CorruptedDataError`, `StorageUnavailableError`,
  `QuotaExceededError`, `switchMap` (та же/неизвестная/другая карта), `reset`,
  сохранение счёта и позиции по картам.

**Критерий:** в сьюте нет `makeRepo`, `StatsService.init`, `global.CONFIG`;
все тесты используют `MemoryRepository`.

### TR-46. `test/core/session-model.test.ts`

- Сьют на реальной `SessionModel` (не копия): `recordCorrect`, `recordIncorrect`,
  `getResults`, `reset`, `total = correct + wrong`.
- 15 сценариев 1.8.1 сохраняются: 8/2 → «Отлично!», 10/10 → «Идеально!»,
  0/3 при `lives = 0` → «Игра окончена», `total = 0` без деления на ноль.
- `CONFIG` — импорт, а не `setup.js`.
- Оценка проверяется через реальный `GameRules.getRating`.

**Критерий:** файл существует, 15 тестов зелёные, `readSource` отсутствует.

### TR-47. React-тесты (`@testing-library/react`)

**Зависимости (devDependencies):**

```bash
npm i -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

**Setup:** в `test/setup.ts` добавить `import '@testing-library/jest-dom/vitest';`.
Тесты рендерят компоненты с **фейковым** `Services`:

```ts
const services: Services = {
    audio: { preload: vi.fn(), play: vi.fn() } as unknown as AudioService,
    stats: { load: vi.fn(), save: vi.fn(), /* … */ } as unknown as StatsService
};
```

| Компонент | Что проверять |
|---|---|
| `App` | карта рендерится; клик по тренажёру открывает модалку; старт игры → `GameScreen`; завершение раунда → `ResultsScreen`; модалки выбора карты и ошибки |
| `GameScreen` | 4 варианта; верный ответ → `correct`, `+POINTS_BASE`, feedback; неверный → `wrong`, жизнь −1; кнопки блокируются; «Продолжить» вызывает `next` |
| `MapScreen` | 15 тренажёров; классы `--current`/`--near`/`--far`; модалка по приходу; «Отмена» → откат без записи |
| `ResultsScreen` | счёт, «Правильных: N», оценка, «Играть снова», «На карту» |
| `MapSelectionModal` | текущая карта выделена; выбор другой → `switchMap`; та же карта → no-op; «Закрыть» |
| `Header` | счёт, жизни (❤️/🖤), кнопка карты |
| `ErrorModal` | текст ошибки, закрытие, колбэк |

**Правила:**

- Запросы — по роли и тексту (`getByRole`, `getByText`), а не по CSS-классам,
  кроме случаев, где класс — часть контракта (`--current`, `correct`, `wrong`).
- События — `@testing-library/user-event`, не `fireEvent` без необходимости.
- Никаких снимков всего дерева; точечные `toMatchObject`/`toHaveClass`.
- `act()` — только там, где без него предупреждение; `waitFor` для таймеров.
- Тесты не зависят от `localStorage` и `BroadcastChannel`, если это не предмет теста.

**Критерий:** 7 файлов компонентов, все зелёные; в тестах нет `document.querySelector`
как основного способа поиска.

### TR-48. Тесты хуков (`renderHook`)

| Хук | Сценарии |
|---|---|
| `useGame` | старт; верный/неверный ответ; `next`; завершение; `exit`; звук `click`/`win`/`lose` |
| `useMap` | движение на соседний (600 мс); модалка; «Отмена» → revert; текущий → play; дальний → ignore; commit после победы |
| `useResults` | победа/провал; `onRoundFinished(ok)`; «Играть снова»; «На карту» |
| `useSessionLock` | mock `BroadcastChannel`; `hello`; вторая вкладка → `showError`; fallback `ml_session_lock` |

- `useSessionLock` мокает `BroadcastChannel` класса-заглушкой с `postMessage`,
  `close`, `onmessage`.
- Для 600 мс — `vi.useFakeTimers()` + `act(() => vi.advanceTimersByTime(600))`.
- Хуки получают `services` первым аргументом (контракт 1.8.2).
- `useGame`/`useResults` не создают сервисы сами.

**Критерий:** 4 файла хуков, все зелёные; `BroadcastChannel` замокан, а не удалён.

### TR-49. Покрытие: 80% / 60–70%, без погони за 100%

Целевая конфигурация `vitest.config.ts`:

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
        'src/core/**':     { statements: 80, branches: 80, functions: 80, lines: 80 },
        'src/data/**':     { statements: 80, branches: 80, functions: 80, lines: 80 },
        'src/services/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
        'src/components/**': { statements: 60, branches: 60, functions: 60, lines: 60 },
        'src/hooks/**':      { statements: 60, branches: 60, functions: 60, lines: 60 },
        'src/App.tsx':       { statements: 60, branches: 60, functions: 60, lines: 60 }
    }
}
```

- Порог 80% — для домена и данных; 60–70% — для UI, где много веток отображения.
- 100% не требуется: непокрытыми могут остаться защитные `catch`, `console.warn`,
  редкие ветки fallback. Они не должны ронять сборку.
- При добавлении `include` в отчёт попадут `error-handler.ts`, `local-repository.ts`,
  `repository.ts`; для них нужны точечные тесты, иначе порог 80% не выполнится.
- Coverage не должен **падать** относительно baseline: 97.12% statements / 90.57%
  branches для загруженных модулей (этап 1).

**Критерий:** `npm run test:coverage` проходит пороги; в отчёте нет модулей с 0%
без объяснения.

### TR-50. E2E (по желанию, позже)

Playwright — не блокирует 1.8.3. Когда появится, 5–7 сценариев:

1. Карта: 15 тренажёров, клик по соседнему → движение 600 мс → модалка.
2. «Отмена» → откат, позиция в `ml_stats` не изменилась.
3. Полный раунд: 8/2 → «Отлично!», счёт 80, `Stats` v3.
4. Провал: 3 ошибки → «Игра окончена», очки не начислены.
5. «На карту» → commit позиции; F5 → счёт и позиция на месте.
6. Вторая вкладка → «Игра уже запущена».
7. Смена карты → позиция `−1`, счёт прежней карты сохранён.

**Критерий:** E2E-каталог не входит в `npm test`; запускается отдельным скриптом
`npm run test:e2e`, когда будет добавлен.

---

## ✅ Приёмочные критерии 1.8.3

| # | Критерий | Проверка |
|---|---|---|
| 1 | Ни одного `eval`/`readSource` | `grep -RIn --include='*.ts' --include='*.tsx' "eval(\|readSource" test` |
| 2 | Все тесты импортируют прод-код | `grep -RIn "from '../../src/" test` |
| 3 | Нет копий `GameRules`/`ProblemGenerator`/`Scoring` | `grep -RIn "class ProblemGenerator\|const calculateRoundScore" test` |
| 4 | `StatsService` через `MemoryRepository` | `grep -RIn "new StatsService(new MemoryRepository())" test` |
| 5 | `test/core/session-model.test.ts` есть | `test -f test/core/session-model.test.ts` |
| 6 | Есть React-тесты | 7 файлов `test/components/**/*.test.tsx` |
| 7 | Есть тесты хуков | 4 файла `test/hooks/**/*.test.ts(x)` |
| 8 | Покрытие не ниже порогов | `npm run test:coverage` |
| 9 | `tsc` и `npm test` зелёные | `npx tsc --noEmit && npm test` |

**Definition of Done:** пункты 1–9 выполнены; React-тесты и пороги покрытия —
обязательны для 1.8.3; E2E — опционально.

---

## 🚫 Что не входит

- Изменение поведения игры, разметки, CSS, текстов, `CONFIG`, формата `Stats`,
  ключей `ml_stats`/`ml_session_lock`.
- Починка `vite build`, `@vitejs/plugin-react`, ассеты, `package.json`-чистка
  (этапы 4–5 плана миграции).
- 100% покрытие и тесты ради покрытия.
- E2E как блокер 1.8.3.
- Переписывание `src/` под тесты: наоборот, тесты подстраиваются под прод-API.

---

## ⚠️ Решения и риски

| # | Решение | Обоснование |
|---|---|---|
| D10 | Переписываются **12** сьютов, а не 11 | 1.8.0 — 11 сьютов; 1.8.1 добавил `session-model`, он тоже входит в миграцию |
| D11 | Число тестов может измениться (158 сейчас) | Важны сценарии и покрытие, а не точное число; ослаблять проверки запрещено |
| D12 | `hard`-задачи могут иметь отрицательный ответ (`a × b − c`) | Это текущее поведение `ProblemGenerator`; тест не должен требовать неотрицательности для всех `options`. Возможный баг фиксируется отдельно, в 1.8.3 поведение не меняется |
| D13 | React-тесты используют фейковый `Services` | Не зависеть от `localStorage`/`Audio`/`BroadcastChannel`; тестировать компонент, а не инфраструктуру |
| D14 | Coverage `include` расширяется на все модули | Иначе `error-handler`/`local-repository` выпадают из отчёта и 80% получается «на бумаге» |
| D15 | E2E отложен | По заданию — «по желанию/позже»; ручной smoke 1.8.2 остаётся страховкой |
| D16 | `allowJs: false` уже включён | Все тесты `.ts`/`.tsx`; `tsc` проверяет их, а не пропускает |

---

## 🧭 Этапы

| Этап | Содержание | Статус |
|---|---|---|
| 1 | Удаление `eval`/`readSource`/`CONFIG`-копии; 12 сьютов на `.test.ts`; реальные реализации; `StatsService` + `MemoryRepository`; `session-model`; `allowJs: false` | ✅ выполнено (158 тестов, `tsc` 0) |
| 2 | `@testing-library/*`; 7 компонентных сьютов | ⏳ план |
| 3 | 4 сьюта хуков (`renderHook`, fake timers, mock `BroadcastChannel`) | ⏳ план |
| 4 | Coverage `include` + пороги; добить `error-handler`, `local-repository`, `repository` | ⏳ план |
| 5 | E2E Playwright (опционально) | 💤 backlog |

---

## 📌 Инварианты

| Область | Инвариант |
|---|---|
| Прод-код | Не меняется ради тестов; публичные имена 1.8.2 сохраняются |
| Тесты | Импортируют `src/**`; не читают файлы и не используют `eval` |
| `CONFIG` | Единственный источник — `src/core/config.ts`; копий нет |
| `StatsService` | Только `new StatsService(repo)`; `init` отсутствует |
| Покрытие | core/data/services ≥ 80%, UI ≥ 60%; 100% не цель |
| Прогон | `npx tsc --noEmit` — 0; `npm test` — зелёный; coverage-пороги — зелёные |
