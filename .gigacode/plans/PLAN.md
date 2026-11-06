# План — MathLingo

**Версия:** 1.9.0
**Статус:** Выполнено. Этап 20 «Зависимости, линтер, CI и качество кода» (SPEC 1.9.0)
**Базовая линия 1.9.0 (проверено перед началом работ):** `npm run typecheck` — **0**; `npm test` — **261/261 в 28 сьютах**; `npm run build` → `dist/` (JS 245.58 КБ, CSS 6.84 КБ, три mp3); ESLint/Prettier — **не настроены**; CI — **нет**; `dependencies` — **~200** пакетов, включая `jest-cli` и `babel-preset-jest`; `package-lock.json` — 238 КБ
**Создан на основе:** RULES 1.9.0 (`rules_v_1_9_0.md`: A72–A78, T63–T70, Z34–Z38) и SPEC 1.9.0 (`spec_v1_9_0.md`: TR-61…TR-70)
**Предыдущая версия плана:** 1.8.4 (`plans/PLAN_v1_8_4.md` — архив)
**Тип изменения:** **инструменты и гигиена репозитория**, а не поведение игры. `package.json` переписывается, добавляются ESLint/Prettier/CI/smoke, удаляется мёртвый код и CSS-долг. Поведение, разметка, тексты, значения стилей, `CONFIG`, `Stats` v3 и ключи хранилища **не меняются**.

---

## ⚠️ Решения, на которых стоит план

| # | Решение | Следствие |
|---|---------|-----------|
| 1 | **`dependencies` = только `react` + `react-dom`.** ~200 транзитивов Jest вычищаются вместе со старым lock | `npm ls --depth=0` показывает 19 записей; lock уменьшается с 238 КБ до ~136 КБ |
| 2 | **Установка строго с нуля:** `rm -rf node_modules package-lock.json` → `npm install` | Первая попытка «поверх» оставила битое дерево (`@babel/helper-validator-identifier` отсутствовал) — это и стало причиной чистой установки |
| 3 | **ESLint 10 + `typescript-eslint` 8 + `eslint-plugin-react-hooks` 7**, flat config | Peer-зависимости разрешаются без `--force`/`--legacy-peer-deps` |
| 4 | **Из `react-hooks` — только `rules-of-hooks` и `exhaustive-deps`** (оба `error`), без compiler-правил | Прогон зелёный без `eslint-disable`; compiler-правила — отдельная версия |
| 5 | **`exhaustive-deps` чинится деструктуризацией методов хуков** в `App.tsx` | Объекты хуков новые на каждый рендер; методы стабильны, `useGame` хранит обработчики в `depsRef` — поведение не меняется |
| 6 | **Prettier применяется один раз на весь код** (48 файлов), `.md` исключены | Дифф механический; после форматирования `typecheck`/`test`/`build`/`smoke` зелёные |
| 7 | **`MemoryRepository` переезжает в `test/support/`**, а не удаляется | Тестам нужен двойник; `src/**` и coverage не содержат тестового кода |
| 8 | **`Scoring.calculateRoundScore` используется** в `SessionModel.recordCorrect` | Убирает дубль `correct × POINTS_BASE`; `scoring.test.ts` остаётся осмысленным |
| 9 | **`game-header.css` подключается, `results-streak.css` удаляется** | CSS-бандл 7.04 КБ: шапка игры снова стилизована, мёртвый `.streak-badge` убран |
| 10 | **Smoke — `scripts/smoke.mjs` на `vite preview` + `fetch`**, без Playwright | Новых зависимостей нет; браузерные 10 проверок остаются в `verify-dist.mjs` |
| 11 | **CI повторяет локальный критерий**: `npm ci → typecheck → test → build → lint → smoke` | Нет «CI-специальных» скриптов; Node 22 LTS |
| 12 | **Ветка — текущая `feature/002`**; коммиты по шагам; пуш и мерж — по согласованию | `git add -A` запрещён (Z37) |

---

## 🎯 Цель

Привести зависимости, линтер, форматирование и CI в соответствие с реальным стеком
(Vite + React + vitest) и сделать локальную и CI-проверку одной и той же.

- `dependencies`: только `react`, `react-dom`; Jest-транзитивы отсутствуют в `package.json` и lock.
- `"type": "module"`, `private: true`, `engines.node >= 20.19`.
- ESLint 10 (flat) + `typescript-eslint` + `eslint-plugin-react-hooks`; `npm run lint` — 0.
- Prettier 3 + `.prettierrc.json` + `.prettierignore`; `format`, `format:check`.
- Мёртвый код: `useAudio`/`SessionService`/`SessionRepository` отсутствуют, `MemoryRepository` в тестах,
  `calculateRoundScore` используется.
- CSS: `game-header.css` подключён, дубль `game-answers.css` убран, `results-streak.css` удалён.
- CI: `npm ci → typecheck → test → build → lint → smoke`; smoke — `vite preview` + HTTP.
- README/GIGACODE/.gigacode соответствуют коду; архитектурное решение «без глобального стора» записано.

---

## 📉 Исходное состояние (baseline 1.9.0)

| Проверка | Команда | Было |
|---|---|---|
| Типы | `npm run typecheck` | 0 ошибок |
| Тесты | `npm test` | 261/261 в 28 сьютах |
| Покрытие | `npm run test:coverage` | 96.84 / 88.74, пороги 80/60 |
| Сборка | `npm run build` | `dist/`: JS 245.58 КБ, CSS 6.84 КБ, три mp3 |
| Линтер | `npm run lint` | **скрипта нет** |
| Форматирование | `npm run format` | **скрипта нет** |
| CI | `.github/workflows/ci.yml` | **файла нет** |
| Зависимости | `dependencies` | ~200 пакетов (Jest-транзитивы) |

---

## 🗺️ Шаги

### 20.1. `package.json` и установка с нуля

- Переписать `package.json` по T63: `dependencies` — `react`, `react-dom`; `devDependencies` — 17
  инструментов (включая `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`,
  `globals`, `prettier`); добавить скрипты `lint`, `lint:fix`, `format`, `format:check`, `smoke`,
  `smoke:browser`.
- Удалить `package-lock.json` и `node_modules/`, выполнить `npm install`.
- Проверить: `npm ls --depth=0`, отсутствие `jest-*`/`babel-preset-jest` в lock, `npm ci` на чистом дереве.

**Критерий:** `npm ls --depth=0` без `jest-*`; `npm ci` — 0 ошибок.

### 20.2. ESLint и Prettier

- `eslint.config.js`: js recommended + typescript-eslint recommended + `rules-of-hooks`/`exhaustive-deps`;
  ignores `node_modules`, `dist`, `coverage`, `.idea`; `_`-параметры не считаются неиспользуемыми.
- Исправить найденное: `App.tsx` — зависимости `useCallback` через деструктуризацию методов хуков;
  `src/data/repository.ts` — `save(_data)`; удалить неиспользуемые `import type { AudioService }` из 4 тестов.
- `.prettierrc.json`, `.prettierignore`; `npm run format`; `format:check` — чисто.

**Критерий:** `npm run lint` — 0 ошибок; `npm run format:check` — 0 файлов.

### 20.3. Мёртвый код

- `grep` подтверждает отсутствие `useAudio`, `SessionService`, `SessionRepository` в `src/**`.
- `test/support/memory-repository.ts`; удалить `src/data/memory-repository.ts`; 5 тестов перевести на новый путь.
- `SessionModel.recordCorrect` считает `roundScore` через `Scoring.calculateRoundScore(this._correct)`.
- `Repository.save(_data)` — параметр контракта.

**Критерий:** `npm test` — 261/261; в `src/data/` нет `memory-repository.ts`.

### 20.4. CSS-долг

- `css/game.css`: 4 импорта — `game-header`, `game-question`, `game-answers`, `game-feedback`;
  дубль `game-answers` убран.
- Удалить `css/result_items/results-streak.css` и его `@import` из `css/results.css`.
- Проверить бандл: `.game-header`/`.progress-fill`/`.lives` есть, `.streak-badge` нет.

**Критерий:** `css/` — 20 файлов; в `dist/assets/*.css` есть `.game-header`, нет `.streak-badge`.

### 20.5. CI и smoke

- `scripts/smoke.mjs`: `vite preview --port 4173 --strictPort`, ожидание 200, 10 HTTP-проверок,
  `SIGTERM` в `finally`, `SMOKE_PORT`.
- `.github/workflows/ci.yml`: checkout, setup-node 22 + `cache: npm`, шаги критерия, `permissions`,
  `concurrency`, `timeout-minutes: 15`.

**Критерий:** `npm run smoke` — 10/10.

### 20.6. Документация

- README: команды (`npm ci`, `lint`, `format`, `smoke`), структура, CSS 20 файлов, тесты 28/261,
  покрытие 96.83/88.74, раздел «Архитектурное решение».
- GIGACODE: структура, команды, раздел «Линтер, форматирование, CI», история 1.9.0.
- `test/README.md`: путь `test/support/memory-repository.ts`, команды `lint`/`format`/`smoke`.

**Критерий:** в документах нет несуществующих файлов и команд.

### 20.7. spec/rules/PLAN/TASKS 1.9.0

- Новые `spec_v1_9_0.md`, `rules_v_1_9_0.md`; блоки 1.9.0 в `SPEC.md`/`RULES.md` (включая историю).
- `PLAN.md` = 1.9.0; архив `PLAN_v1_8_4.md`; `TASKS.md` = 1.9.0; архив `TASKS_v1_8_4.md`.

**Критерий:** индексы версий и архивы на месте, ссылки рабочие.

### 20.8. Финальный прогон

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run lint
npm run format:check
npm run smoke
```

**Критерий:** все команды — код 0; тесты 261/261; smoke 10/10.

---

## ✅ Проверки и приёмка

| Проверка | Ожидание |
|---|---|
| `npm ci` | 0 ошибок, дерево из lock |
| `npm run typecheck` | 0 ошибок |
| `npm test` | 261/261 в 28 сьютах |
| `npm run build` | `dist/`: JS + `.map`, CSS 7.04 КБ, три mp3 |
| `npm run lint` | 0 ошибок, 0 предупреждений |
| `npm run format:check` | «All matched files use Prettier code style» |
| `npm run smoke` | 10/10 |
| `dependencies` | ровно 2 |
| CSS | 20 файлов; `.game-header` в бандле, `.streak-badge` нет |

---

## ⚠️ Риски и меры

- **Битое дерево после прерванной установки.** Мера: установка только с нуля; `npm ci` как проверка.
- **`exhaustive-deps` в `App.tsx`.** Мера: деструктуризация методов; `useGame` не зависит от
  идентичности обработчиков.
- **Массовый `format`.** Мера: прогон полного критерия после; `.md` в `.prettierignore`.
- **Smoke-порт.** Мера: `--strictPort` + `SMOKE_PORT`; сервер гасится в `finally`.
- **Удаление CSS-файла.** Мера: `grep` по `.tsx`/`.css` до удаления; проверка собранного бандла.

---

## 📌 Инварианты

- Поведение игры, разметка, тексты, значения стилей, `CONFIG`, `Stats` v3 и ключи хранилища не меняются.
- 261 тест — контрольная цифра на каждом шаге; пороги 80/60 не понижаются.
- `dependencies` — две записи; глобального стора нет.
- `dist/` и `coverage/` в git не попадают.
