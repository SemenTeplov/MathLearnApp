## 🏛️ Архитектурные принципы — дополнения (1.8.3)

### A59. Тесты импортируют прод-код, а не его копию

**Правило:** любой тест проверяет модуль из `src/`, импортированный через `import`.

**Правила:**

- запрещены `eval`, `new Function`, `readSource`, `fs.readFileSync`, `require`
  и любые способы «прочитать исходник и выполнить его»;
- запрещено объявлять в тесте копии классов и функций прод-кода
  (`class ProblemGenerator`, `const calculateRoundScore`, `const shouldEndGame`,
  `const getRating` и т.п.);
- `CONFIG`, `GameRules`, `ProblemGenerator`, `Scoring`, `SessionModel` и остальные
  сущности берутся только из `src/core`, `src/data`, `src/services`;
- типы — через `import type` из `src/core/types` / `src/ui/types`;
- тестовый фреймворк импортируется явно: `import { describe, expect, test, vi } from 'vitest'`.

**Причина:** 43 «зелёных» теста 1.8.2 проверяли копию логики и не замечали поломку
прод-кода; `eval`-загрузка скрывала ошибки импортов и типов.

### A60. Зеркальная структура тестов

**Правило:** каталог теста повторяет слой прод-кода.

```
src/core/**      → test/core/**      (*.test.ts)
src/data/**      → test/data/**      (*.test.ts)
src/services/**  → test/services/**  (*.test.ts)
src/components/**→ test/components/**(*.test.tsx)
src/hooks/**     → test/hooks/**     (*.test.tsx)
src/App.tsx      → test/components/App.test.tsx
```

**Правила:**

- один сьют — один модуль; имя файла совпадает с именем модуля;
- `.test.ts` — не-React; `.test.tsx` — компоненты и хуки с JSX;
- общие моки — только `test/setup.ts`; копий `CONFIG` и доменных данных там нет;
- тесты не импортируют друг друга и не делят изменяемое состояние между файлами.

**Причина:** после 1.8.2 тесты лежали в старых `logic/`, `model/`, `map/`, `service/`
и читали удалённый `js/`; зеркальная структура делает путь импорта очевидным.

### A61. `StatsService` — конструктор и `MemoryRepository`

**Правило:** в тестах `StatsService` создаётся только как
`new StatsService(new MemoryRepository())`.

**Правила:**

- глобального `StatsService.init(repo)` нет и быть не должно;
- подготовка данных — `repo.save(...)`, проверка — `repo.load()`;
- ошибки репозитория — через `vi.spyOn(repo, 'load' | 'save')`, а не подменой глобалов;
- `handleError` мокается один раз на файл через `vi.mock('…/core/error-handler', …)`;
- `LocalStorageRepository` в юнит-тестах не используется; для него — отдельный
  сьют `test/data/local-repository.test.ts` (этап покрытия).

**Причина:** `init(repo)` был скрытым глобальным состоянием, из-за которого тесты
влияли друг на друга; `MemoryRepository` — документированный тестовый двойник.

### A62. React-тесты — поведение, а не реализация

**Правило:** компонент проверяется через то, что видит и делает пользователь.

**Правила:**

- запросы — `getByRole`, `getByText`, `getByLabelText`; CSS-класс допустим только
  там, где он является контрактом (`--current`, `--near`, `--far`, `correct`, `wrong`);
- события — `@testing-library/user-event`; `fireEvent` — только если `user-event`
  не выражает сценарий;
- `act()` — по необходимости; `waitFor` — для асинхронных обновлений;
- снимки всего дерева запрещены; точечные `toMatchObject`/`toHaveClass` разрешены;
- компоненты получают фейковый `Services`; тест не создаёт реальные `AudioService`,
  `StatsService`, `localStorage` и `BroadcastChannel`, если они не предмет проверки;
- проверяется и отрицательный сценарий: неверный ответ, «Отмена», закрытие модалки,
  недоступная карта.

**Причина:** тесты, привязанные к структуре DOM, ломаются от любой правки разметки
и не ловят регрессии поведения.

### A63. Покрытие — порог, а не самоцель

**Правило:** покрытие `core`/`data`/`services` — не ниже 80%, UI — 60–70%.

**Правила:**

- пороги задаются в `vitest.config.ts` по группам (`thresholds` с glob-ключами);
- `coverage.include` перечисляет **все** модули слоя, а не только импортированные;
- 100% не требуется; непокрытые защитные `catch`, `console.warn` и редкие fallback
  допустимы, если порог группы выполнен;
- coverage не должен падать относительно baseline 1.8.3 (97.12% statements /
  90.57% branches для загруженных модулей);
- «покрытие ради покрытия» (тесты без `expect`) запрещено.

**Причина:** 100% на UI достигается только тестами разметки и хрупкими снимками;
80/60 — достаточный сигнал для домена и приемлемый для презентации.

### A64. Детерминизм и изоляция

**Правило:** тест не зависит от порядка запуска, времени, случайности и других тестов.

**Правила:**

- `Math.random` в тестах генератора — seeded PRNG или точечный `vi.spyOn`;
- таймеры — `vi.useFakeTimers()` + `vi.advanceTimersByTime`; после теста —
  `vi.useRealTimers()`;
- глобальные моки (`Audio`, `BroadcastChannel`) ставятся в `test/setup.ts` или
  в `beforeEach` конкретного сьюта;
- изменяемые `CONFIG.MAPS`/`CONFIG.DEFAULT_MAP` восстанавливаются в `finally`;
- `vi.restoreAllMocks()`/`vi.clearAllMocks()` — в `afterEach`/`beforeEach`;
- тесты не пишут в реальный `localStorage` и не открывают реальные каналы.

**Причина:** случайные падения и «зелёный только при полном прогоне» — худший вид
тестов; после миграции на модули изоляция стала дешёвой.

---

## 🔧 Технические ограничения — дополнения (1.8.3)

### T50. Структура и имена тестов

```
test/
├── setup.ts
├── core/*.test.ts
├── data/*.test.ts
├── services/*.test.ts
├── components/*.test.tsx
└── hooks/*.test.tsx
```

- `test/setup.ts` — только общие моки; `CONFIG` там запрещён.
- `test/ts-source.js` удалён; `typescript` в тестах не используется.
- `tsconfig.json`: `allowJs: false`; `include` содержит `test`.
- `vitest.config.ts`: `globals: true`, `environment: 'jsdom'`,
  `setupFiles: ['./test/setup.ts']`.

### T51. Контракты тестовых двойников

```ts
// test/data/stats-service.test.ts
const repo = new MemoryRepository();
const service = new StatsService(repo);

// test/components/*.test.tsx
const services: Services = {
    audio: { preload: vi.fn(), play: vi.fn() } as unknown as AudioService,
    stats: {
        load: vi.fn(), save: vi.fn(), getCurrentMap: vi.fn(),
        getTotalScore: vi.fn(), updateAfterRound: vi.fn(),
        getTrainerIndex: vi.fn(), saveTrainerIndex: vi.fn(),
        switchMap: vi.fn(), reset: vi.fn()
    } as unknown as StatsService
};
```

- Фейковый `Services` типизируется через `import type { Services } from '../../src/app/types'`.
- Методы-`vi.fn()` возвращают значения, нужные сценарию; неиспользуемые —
  безопасные заглушки.
- Для `useSessionLock` — класс-заглушка `BroadcastChannel` с `postMessage`, `close`,
  `onmessage`; проверяется и fallback `ml_session_lock`.

### T52. React-тесты: обязательный минимум

| Файл | Обязательные проверки |
|---|---|
| `App.test.tsx` | карта; переход в игру; результаты; модалки (выбор карты, ошибка) |
| `GameScreen.test.tsx` | 4 ответа; `correct`/`wrong`; feedback; «Продолжить» |
| `MapScreen.test.tsx` | 15 тренажёров; `--current/--near/--far`; модалка; «Отмена» |
| `ResultsScreen.test.tsx` | счёт, «Правильных: N», оценка, две кнопки |
| `MapSelectionModal.test.tsx` | текущая карта; выбор; та же карта; закрытие |
| `Header.test.tsx` | счёт, жизни, кнопка карты |
| `ErrorModal.test.tsx` | текст, закрытие, колбэк |

```bash
npm i -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

В `test/setup.ts` — `import '@testing-library/jest-dom/vitest';`.

### T53. Тесты хуков

| Хук | Обязательные проверки |
|---|---|
| `useGame` | старт, верный/неверный, `next`, завершение, `exit`, звуки |
| `useMap` | движение 600 мс, модалка, отмена/revert, текущий/дальний, commit |
| `useResults` | победа/провал, `onRoundFinished`, «Играть снова», «На карту» |
| `useSessionLock` | `BroadcastChannel`, `hello`, вторая вкладка, fallback |

- `renderHook` из `@testing-library/react`.
- 600 мс — fake timers + `act`.
- Хуки получают `Services` первым аргументом; сервисы не создаются внутри.

### T54. Coverage-конфигурация

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

`include` обязателен: без него `error-handler.ts`, `local-repository.ts`,
`repository.ts` не попадают в отчёт, и 80% получается фиктивным.

### T55. Проверки

```bash
npx tsc --noEmit
npm test
npm run test:coverage

grep -RIn --include='*.ts' --include='*.tsx' "eval(\|readSource\|ts-source" test  # пусто
grep -RIn "global\.CONFIG\|setupZones\|setupMaps" test  # пусто
grep -RIn "require(" test                              # пусто
grep -RIn "class ProblemGenerator\|const calculateRoundScore" test  # пусто
grep -RIn "new StatsService(new MemoryRepository())" test  # есть
test -f test/core/session-model.test.ts                # есть
```

**Ожидание:** `tsc` — 0; `npm test` — зелёный; coverage-пороги — зелёные;
все grep-проверки выше — как указано.

---

## 🚫 Запреты — дополнения (1.8.3)

### Z27. Запрещено в тестах

- `eval`, `new Function`, `readSource`, `fs.readFileSync`, `require`;
- копировать прод-логику в тест вместо импорта;
- использовать `global.CONFIG` или собственную копию `CONFIG` в `setup.ts`;
- вызывать `StatsService.init(...)` и создавать сервисы в module scope;
- проверять приватные поля (`_lives`, `_sounds`, `_repo`) вместо публичного API;
- снимки всего DOM-дерева и тесты, завязанные на порядок Tailwind/CSS-классов;
- `setTimeout`/`sleep` в тестах вместо fake timers и `waitFor`;
- оставлять `test.only`, `describe.skip`, `it.skip` без объяснения в отчёте.

### Z28. Запрещено ради зелёного

- удалять, скипать или ослаблять существующие сценарии;
- менять `src/**` под тест (наоборот: тест подстраивается под прод-API);
- понижать пороги покрытия, чтобы пройти;
- объявлять успех по частичному прогону или по «покрытие потом»;
- добавлять E2E в обязательный `npm test`.

### Z29. Запрещено в git/CI

- коммитить `coverage/`, `node_modules`, `dist`, кэш Vite;
- делать `git add -A` (в дереве есть посторонние файлы документации);
- мержить ветку с красными тестами;
- переписывать историю (`rebase -i`, `reset --hard`) без согласования.

---

## ✅ Обязательства агента — дополнения (1.8.3)

1. Удалить `test/ts-source.js`, `eval`/`readSource`, копию `CONFIG` из `setup`.
2. Перевести 12 сьютов на `.test.ts` с импортами из `src/core`/`src/data`/`src/services`.
3. Заменить копии `GameRules`/`ProblemGenerator`/`Scoring` на настоящие модули.
4. Перевести `StatsService` на `new StatsService(new MemoryRepository())`.
5. Добавить `test/core/session-model.test.ts` на реальной модели.
6. Добавить `@testing-library/react`, `@testing-library/user-event`,
   `@testing-library/jest-dom`; написать 7 компонентных и 4 хуковых сьюта.
7. Настроить coverage `include` + пороги 80/60; не гнаться за 100%.
8. E2E — только по желанию/позже; в 1.8.3 не блокирует.
9. После каждого этапа — `npx tsc --noEmit` и `npm test`; coverage — перед сдачей.
10. Не менять поведение, разметку, CSS и `CONFIG`; не мержить с красными тестами.

---

## 📌 Краткая памятка агенту — дополнения

✅ Тесты импортируют `src/**`
✅ `test/core`, `test/data`, `test/services`, `test/components`, `test/hooks`
✅ Настоящие `GameRules`, `ProblemGenerator`, `Scoring`
✅ `StatsService` + `MemoryRepository`, без `init`
✅ RTL + `user-event` + `jest-dom`
✅ Coverage 80% core/data/services, 60–70% UI
✅ `allowJs: false`, `tsc` 0, `npm test` зелёный
✅ E2E — опционально

❌ `eval`, `readSource`, `fs.readFileSync`
❌ Копии логики и `global.CONFIG`
❌ `StatsService.init`, module-level сервисы
❌ Снимки всего DOM и `sleep`
❌ 100% покрытие любой ценой
❌ Правки `src/**` под тесты

---

## 🔄 История версий — дополнение

| Версия | Дата | Изменения |
|---|---|---|
| 1.8.0 | 2026 | Миграция всех экранов на React |
| 1.8.1 | 2026 | Счётчики `correct`/`wrong`, `total = отвечено` |
| 1.8.2 | 2026 | ES-модули, слои `core`/`data`/`services`, composition root |
| **1.8.3** | 2026 | Тесты на импортах: без `eval`/`readSource`/копий логики; RTL, хуки, coverage 80/60, E2E — опционально |
