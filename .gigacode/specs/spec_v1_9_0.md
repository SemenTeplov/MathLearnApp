**Версия:** 1.9.0
**Статус:** Выполнено
**Тип документа:** Спецификация инструментов, зависимостей и качества кода (SDD)
**Предыдущая версия:** `spec_v1_8_4.md`
**Связанные документы:** `rules_v_1_9_0.md`, `PLAN_v1_9_0.md`, `TASKS.md`

> ⚠️ Это спецификация **инструментов и гигиены репозитория**, а не поведения игры.
> Поведение, разметка, тексты, `CONFIG`, формат `Stats` v3 и ключи `ml_stats`/`ml_session_lock`
> **не меняются**. Требования описывают, чем проект собирается, проверяется и сопровождается.

---

## 🎯 Цель 1.9.0

Привести `package.json` и качество кода в порядок после миграции на Vite/React и сделать
так, чтобы «зелёный» локальный прогон и CI означали одно и то же.

Целевое состояние:

1. В `dependencies` — только `react` и `react-dom`; Jest-транзитивы (≈200 пакетов),
   `jest-environment-jsdom` и мусорные поля `package.json` удалены.
2. `"type": "module"`, `version: 1.9.0`, `private: true`, `engines.node >= 20.19`.
3. Старый `package-lock.json` удалён; зависимости ставятся с нуля, `npm ci` воспроизводим.
4. ESLint 10 (flat config) + `typescript-eslint` + `eslint-plugin-react-hooks`; `npm run lint` — 0 ошибок.
5. Prettier 3 + `.prettierrc.json` + `.prettierignore`; `npm run format`, `npm run format:check`.
6. Мёртвый код удалён: `useAudio`, `SessionService`/`SessionRepository` отсутствуют,
   `Scoring.calculateRoundScore` используется `SessionModel`, `MemoryRepository` живёт в `test/support/`.
7. CSS-долг закрыт: `game-header.css` подключён, дубль `game-answers.css` убран,
   мёртвый `results-streak.css` удалён.
8. CI: `npm ci → typecheck → test → build → lint → smoke`.
9. Smoke — `vite preview` + HTTP-проверки (`scripts/smoke.mjs`), без Playwright и без новых зависимостей.
10. README, GIGACODE и `.gigacode/**` описывают **реальную** структуру и **реальные** команды.
11. Архитектурное решение зафиксировано: **без Zustand/глобального стора**; сервисы — через
    composition root; состояние экранов — в хуках.

**Критерий готовности:** `npm ci && npm run typecheck && npm test && npm run build && npm run lint`
и `npm run smoke` — зелёные; документация совпадает с кодом.

---

## 📉 Исходное состояние (baseline 1.9.0)

Проверено на ветке `feature/002` перед началом работ.

| Показатель | Фактическое значение |
|---|---|
| `dependencies` | **~200 пакетов**: `jest-cli`, `jest-config`, `babel-plugin-jest-hoist`, `babel-preset-jest`, `istanbul-*`, `yargs` и прочие транзитивы Jest |
| `devDependencies` | `@testing-library/*`, `@types/react*`, `@vitejs/plugin-react`, `@vitest/coverage-v8`, `jest-environment-jsdom`, `jsdom`, `typescript`, `vite`, `vitest` |
| `package.json` | 255 строк; поля `main`, `directories`, `keywords`, `author` — от старого CRA/Jest-шаблона |
| `package-lock.json` | 238 КБ, lockfileVersion 3, тянет Jest-транзитивы |
| `"type"` | `module` (сделано в 1.8.4) |
| `jest.config.js` | отсутствует (удалён в 1.8.4) |
| ESLint / Prettier | **не настроены**; в GIGACODE: «Линтер и форматирование не настроены» |
| CI | **отсутствует**; `.github/` нет |
| `npm run build` | `tsc --noEmit && vite build` → `dist/` (1.8.4) |
| Тесты | 28 сьютов / 261 тест; coverage 96.84 / 88.74 при порогах 80/60 |
| `src/data/memory-repository.ts` | существует, используется **только тестами** — мёртвый код в проде |
| `Scoring.calculateRoundScore` | существует, используется **только тестом**; `SessionModel.recordCorrect` дублирует `correct × POINTS_BASE` |
| `useAudio`, `SessionService`, `SessionRepository` | отсутствуют (удалены в 1.8.2) — проверено `grep` |
| CSS | 21 файл; `game.css` дважды импортирует `game-answers.css`; `game-header.css` не импортирован нигде; `results-streak.css` импортирован, но `.streak-badge` в разметке нет |
| CSS-бандл 1.8.4 | 6.84 КБ — без стилей шапки игры, зато с мёртвым `.streak-badge` |

### Что уже готово и не переделывается

- `"type": "module"`, `vite.config.ts` (`react()`, `base: './'`, `dist`, `sourcemap`, `assetsInlineLimit: 0`).
- `npm run build` = `tsc --noEmit && vite build`; `dist/` с одним JS + `.map`, одним CSS и тремя mp3.
- `scripts/verify-dist.mjs` + `scripts/cdp.mjs` — браузерная проверка `dist` (10 проверок).
- Разделение слоёв `core`/`data`/`services`/`ui`/`app`/`components`/`hooks` и `createServices()`.
- 28 сьютов / 261 тест и пороги покрытия 80/60 — **не меняются**.

---

## 🗂️ Целевая структура

```
package.json              # deps: react, react-dom; devDeps: инструменты; scripts: dev/build/preview/
                          # typecheck/test/test:watch/test:coverage/lint/lint:fix/format/format:check/smoke
package-lock.json         # lockfileVersion 3, создан npm install с нуля
eslint.config.js          # flat config: js + typescript-eslint recommended + react-hooks
.prettierrc.json          # 4 пробела, singleQuote, printWidth 120, без trailing comma
.prettierignore           # node_modules, dist, coverage, *.md, .gigacode, .idea
.github/workflows/ci.yml  # npm ci → typecheck → test → build → lint → smoke
scripts/
  smoke.mjs               # vite preview + HTTP-контракт dist, без зависимостей
  verify-dist.mjs         # 10 браузерных проверок dist (остаётся)
  cdp.mjs                 # CDP-клиент (остаётся)
src/data/                 # repository, local-repository, stats-service — без memory-repository
test/support/
  memory-repository.ts    # тестовый двойник Repository (не попадает в src и coverage)
```

---

## 📋 Требования

### TR-61. `package.json`: только рантайм в `dependencies`

- `dependencies` — ровно `react` и `react-dom`; других записей нет.
- Все инструменты (типы, сборка, тесты, линтер, форматтер) — в `devDependencies`.
- `jest-environment-jsdom`, `jest-*`, `babel-plugin-jest-*`, `babel-preset-jest`, `istanbul-*`,
  `create-jest` и прочие транзитивы Jest отсутствуют и в `package.json`, и в lock-файле.
- `"type": "module"`, `"private": true`, `"version": "1.9.0"`, `"engines": {"node": ">=20.19"}`.
- Поля `main`, `directories`, `keywords`, `author` удалены: приложение не публикуется в npm,
  а точка входа — `index.html` + `src/main.tsx`.
- `scripts` содержит ровно: `dev`, `build`, `preview`, `typecheck`, `test`, `test:watch`,
  `test:coverage`, `lint`, `lint:fix`, `format`, `format:check`, `smoke`, `smoke:browser`.

### TR-62. Lock-файл и установка с нуля

- Старый `package-lock.json` удалён до установки; новый создаётся `npm install`.
- `npm ci` на чистом клоне проходит без ошибок и не меняет `package.json`.
- `lockfileVersion` = 3; в lock нет Jest-транзитивов (`jest-cli`, `jest-config`, `babel-preset-jest`).
- `node_modules/` и lock не путаются: lock коммитится, `node_modules/` — в `.gitignore`.

### TR-63. ESLint: flat config с `typescript-eslint` и `eslint-plugin-react-hooks`

- Файл `eslint.config.js` (ESM), ESLint 10, flat config.
- Подключены: `@eslint/js` recommended, `typescript-eslint` recommended (без type-aware правил),
  `eslint-plugin-react-hooks` (`rules-of-hooks`, `exhaustive-deps`).
- `ignores`: `node_modules/`, `dist/`, `coverage/`, `.idea/`.
- Окружения: `browser` для `src/**` и `test/**`, `node` для `scripts/**` и конфигов.
- `no-unused-vars` не ругается на параметры контракта с префиксом `_`.
- `npm run lint` завершается с кодом 0 и **без** `eslint-disable` в `src/`.

### TR-64. Prettier: форматирование как команда

- `.prettierrc.json`: `tabWidth: 4`, `singleQuote: true`, `printWidth: 120`, `trailingComma: "none"`,
  `semi: true`, `arrowParens: "always"`, `endOfLine: "lf"` — совместимо с текущим стилем кода.
- `.prettierignore`: `node_modules/`, `dist/`, `coverage/`, `package-lock.json`, `*.md`, `.gigacode/`, `.idea/`.
  Документация пишется руками: Prettier ломает таблицы и переносы в `.md`.
- `npm run format` приводит код к стилю; `npm run format:check` — проверка без записи.
- После `npm run format` остаются зелёными `typecheck`, `test`, `build`, `lint`.
- ESLint не дублирует стилевые правила: форматирование — только у Prettier.

### TR-65. Мёртвый код

- `useAudio` отсутствует (удалён в 1.8.2; повторная проверка — `grep`).
- `SessionService` и `SessionRepository` отсутствуют (удалены в 1.8.2).
- `Scoring.calculateRoundScore` **используется**: `SessionModel.recordCorrect` пересчитывает
  `roundScore` через него, а не повторяет `correct × POINTS_BASE`. Тест `scoring.test.ts` остаётся.
- `MemoryRepository` живёт в `test/support/memory-repository.ts`; `src/data/memory-repository.ts` удалён.
  Все тесты импортируют `../support/memory-repository`.
- `MemoryRepository` не входит в `coverage.include` и в production-бандл.
- `Repository` остаётся в `src/data/` (контракт, который реализует `LocalStorageRepository`).

### TR-66. CSS-долг

- `css/game.css` импортирует ровно четыре партиала в порядке:
  `game-header` → `game-question` → `game-answers` → `game-feedback`.
- `game_items/game-header.css` подключён: в собранном CSS есть `.game-header`, `.progress-fill`,
  `.lives`, `.question-counter`.
- Дубля `@import url('game_items/game-answers.css')` нет: файл импортируется один раз.
- `result_items/results-streak.css` удалён: класса `.streak-badge` нет ни в одном компоненте.
- `css/results.css` импортирует два партиала: `results-icon`, `results-stats`.
- CSS-файлов в `css/` — 20 (было 21). Правило: файл существует, только если импортирован и его
  классы встречаются в разметке.

### TR-67. CI повторяет локальный критерий

- `.github/workflows/ci.yml`: `actions/checkout`, `actions/setup-node@v4` (Node 22, кэш npm).
- Шаги строго: `npm ci` → `npm run typecheck` → `npm test` → `npm run build` → `npm run lint` → `npm run smoke`.
- Триггеры: `push` в `main`, `dev`, `feature/**`; `pull_request`.
- `permissions: contents: read`; `concurrency` с отменой устаревших прогонов; `timeout-minutes: 15`.
- Отдельного «CI-only» скрипта нет: workflow вызывает ровно те команды, что и разработчик.

### TR-68. Smoke: `vite preview` + HTTP

- `scripts/smoke.mjs` — только Node (fetch, child_process), без Playwright и новых зависимостей.
- Поднимает `vite preview --port 4173 --strictPort`, ждёт 200, проверяет:
  `index.html` содержит `#root`; ровно один JS и один CSS; нет ссылок `/src/`, `js/`, `audio/`;
  все локальные ассеты отвечают 200 с непустым телом; в `dist/assets` три `.mp3`.
- Сервер гасится в `finally` даже при падении проверки; код выхода ≠ 0 при любом провале.
- `npm run smoke` работает локально; `npm run smoke:browser` (`smoke.mjs --browser`) сам
  поднимает `vite preview` и добавляет 10 браузерных проверок `verify-dist.mjs`.

### TR-69. Документация совпадает с кодом

- README: команды `npm ci`, `npm run lint`, `npm run format`, `npm run smoke`; структура без
  `src/data/memory-repository.ts`, с `test/support/`, `eslint.config.js`, `.github/workflows/ci.yml`;
  CSS — 20 файлов; тесты — 28/261; покрытие — 96.83/88.74.
- GIGACODE: блок структуры, команды, раздел про линтер/форматтер/CI, история 1.9.0.
- `.gigacode/`: `spec_v1_9_0.md`, `rules_v_1_9_0.md`, `PLAN.md` = 1.9.0, `TASKS.md` = 1.9.0,
  архивы `PLAN_v1_8_4.md`, `TASKS_v1_8_4.md`.
- Ни один документ не упоминает несуществующие команды или файлы.

### TR-70. Архитектурное решение зафиксировано

- Глобального стора нет: Zustand, Redux, MobX, Jotai, Recoil, а также самописный Context-стор запрещены.
- Сервисы создаются один раз в `createServices()` и передаются пропсом `services` / первым аргументом хука.
- Состояние экранов — `useState`/`useRef` внутри хуков `src/hooks/`; компоненты презентационные.
- Решение записано в `rules_v_1_9_0.md` (A78), README (раздел «Архитектурное решение») и GIGACODE.
- Новый глобальный стор нельзя добавить без новой версии spec/rules.

---

## ✅ Приёмочные критерии 1.9.0

1. `npm ci` — 0 ошибок на чистом клоне.
2. `npm run typecheck` — 0 ошибок.
3. `npm test` — **261/261** в 28 сьютах.
4. `npm run build` — создаёт `dist/` (JS + `.map`, CSS, 3 mp3).
5. `npm run lint` — 0 ошибок, 0 предупреждений.
6. `npm run format:check` — «All matched files use Prettier code style».
7. `npm run smoke` — 10/10 HTTP-проверок.
8. `dependencies` — только `react`, `react-dom`; Jest-транзитивов нет ни в `package.json`, ни в lock.
9. `src/` не содержит `memory-repository.ts`, `useAudio`, `SessionService`, `SessionRepository`;
   `calculateRoundScore` вызывается из `SessionModel`.
10. `css/` — 20 файлов; в собранном CSS есть `.game-header`, нет `.streak-badge`.
11. Документация и `.gigacode/**` соответствуют коду и командам.

---

## 🚫 Что не входит

- Изменение поведения игры, разметки, текстов, `CONFIG`, формата `Stats` v3 и ключей хранилища.
- Редизайн CSS и правка значений стилей: только удаление мёртвого и подключение забытого файла.
- E2E на Playwright и добавление браузерных зависимостей: smoke — HTTP, браузерная проверка — опционально.
- Type-aware правила ESLint (`recommendedTypeChecked`): медленно и не требуется для критерия.
- Prettier для Markdown: документация форматируется руками.
- Смена версий React/Vite/Vitest/TypeScript: версии сохраняются, если не конфликтуют с ESLint 10.
- Переписывание тестов и повышение порогов покрытия (кроме пути `MemoryRepository`).

---

## ⚠️ Решения и риски

| # | Решение | Следствие |
|---|---------|-----------|
| 1 | ESLint 10 + `typescript-eslint` 8 + `eslint-plugin-react-hooks` 7 (peer: `eslint ^10`) | Совместимость проверена по peer-зависимостям; `eslint.config.js` — ESM |
| 2 | Только `rules-of-hooks` + `exhaustive-deps` из `react-hooks`, без compiler-правил | Прогон зелёный без исключений; compiler-правила — отдельная версия |
| 3 | Prettier запускается один раз на весь код (48 файлов) | Дифф механический; после него `typecheck`/`test`/`build` зелёные |
| 4 | `*.md` в `.prettierignore` | Таблицы и переносы документации не ломаются |
| 5 | `MemoryRepository` переносится в `test/support/` | `src/` не содержит тестовых двойников; coverage не размывается |
| 6 | `calculateRoundScore` используется в `SessionModel`, а не удаляется | Одна формула очков; тест `scoring.test.ts` остаётся осмысленным |
| 7 | `game-header.css` подключается, `results-streak.css` удаляется | CSS-бандл растёт на ~0.2 КБ, но шапка игры снова стилизована |
| 8 | Smoke без Playwright | Нет новых зависимостей и браузерного флака; DOM-проверки остаются в `verify-dist.mjs` |
| 9 | CI на Node 22 (LTS) | Vite 8 требует Node ^20.19 || >=22.12; локально проверено на Node 26 |

### Риски и меры

- **`exhaustive-deps` в `App.tsx`.** Хуки возвращают новые объекты каждый рендер; зависимости —
  деструктурированные методы (`show`, `reload`, `start`). Мера: `useGame` хранит обработчики в
  `depsRef`, поэтому стабильность колбэков на поведение не влияет.
- **Массовый `format`.** Мера: прогон `typecheck` + `test` + `build` + `smoke` после форматирования;
  `.md` исключены.
- **Удаление `memory-repository` из `src/data`.** Мера: все 5 тестов переведены на `test/support/`;
  `tsconfig` включает `test`, поэтому путь проверяется типами.
- **Lock-файл.** Мера: `npm ci` в staging и на финальном шаге; сверка `npm ls --depth=0`.
- **Smoke-порт 4173.** Мера: `--strictPort` и переменная `SMOKE_PORT`; при занятом порте — явная ошибка.

---

## 🧭 Этапы

| Этап | Содержание | Критерий |
|---|---|---|
| 20.1 | `package.json` + удаление старого lock + `npm install` с нуля | `npm ls --depth=0` без jest |
| 20.2 | ESLint + Prettier | `lint` = 0, `format:check` — 0 |
| 20.3 | Мёртвый код: `MemoryRepository`, `calculateRoundScore` | `npm test` 261/261 |
| 20.4 | CSS-долг | в бандле `.game-header`, нет `.streak-badge` |
| 20.5 | CI + `scripts/smoke.mjs` | `npm run smoke` 10/10 |
| 20.6 | README, GIGACODE | документы = коду |
| 20.7 | spec/rules/PLAN/TASKS 1.9.0 | индексы и архивы на месте |
| 20.8 | Финальный прогон критерия | `npm ci && typecheck && test && build && lint` зелёные |

---

## 📌 Инварианты

- Поведение игры, разметка, тексты и CSS-значения не меняются.
- `CONFIG`, `Stats` v3, ключи `ml_stats` / `ml_session_lock` не меняются.
- 28 сьютов / 261 тест — контрольная цифра на каждом шаге.
- Пороги покрытия 80/60 не понижаются.
- Зависимостей в `dependencies` — две.
- Глобального стора нет.
