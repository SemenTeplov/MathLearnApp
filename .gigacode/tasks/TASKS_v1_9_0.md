# TASKS.md — MathLingo

**Версия:** 1.9.0
**Основа:** PLAN.md 1.9.0, SPEC.md 1.9.0, RULES.md 1.9.0
**Предыдущая версия:** `TASKS_v1_8_4.md` (архив)

---

## 📖 Правила

- Задачи — **строго по порядку**; зависимость указана в каждой задаче.
- После задачи — проверить **критерий готовности** (одна строка).
- При обрыве — продолжать с **последней** незавершённой.
- Контрольная цифра — **261 тест в 28 сьютах**; после каждой задачи `npm test` зелёный.

**Статус:** этап 19 «Production-сборка и ассеты» ✅ (1.8.4), **этап 20 «Зависимости, линтер, CI
и качество кода»** — ✅ выполнено (1.9.0): задачи 20.1–20.8 закрыты.

> ℹ️ Итог 1.9.0: `dependencies` — только `react` и `react-dom`; `devDependencies` — 17 инструментов;
> lock пересобран с нуля (136 КБ, lockfileVersion 3, без Jest-транзитивов); ESLint 10 + Prettier 3
> настроены, `lint` и `format:check` — 0; `MemoryRepository` переехал в `test/support/`,
> `Scoring.calculateRoundScore` используется `SessionModel`; CSS — 20 файлов, `game-header.css`
> подключён, `results-streak.css` удалён; добавлены `.github/workflows/ci.yml` и `scripts/smoke.mjs`;
> `npm test` — **261/261**, coverage — **96.83 / 88.74**, `npm run smoke` — **10/10**.

---

## 📂 Структура (1.9.0)

```
package.json                  # deps: react, react-dom; 13 скриптов; engines.node >= 20.19
package-lock.json             # lockfileVersion 3, создан npm install с нуля
eslint.config.js              # flat config: js + typescript-eslint + react-hooks
.prettierrc.json              # 4 пробела, singleQuote, printWidth 120, без trailing comma
.prettierignore               # node_modules, dist, coverage, *.md, .gigacode, .idea
.github/workflows/ci.yml      # npm ci → typecheck → test → build → lint → smoke
scripts/smoke.mjs             # vite preview + 10 HTTP-проверок dist
scripts/verify-dist.mjs       # 10 браузерных проверок dist (остаётся)
src/data/                     # repository.ts, local-repository.ts, stats-service.ts
test/support/                 # memory-repository.ts — тестовый двойник
```

---

## 🧩 Задачи

### 20.1. `package.json`: только рантайм в `dependencies`

**Зависимость:** нет
**Файлы:** `package.json`, `package-lock.json`

- [x] 20.1.1. Переписать `package.json`: `type: module`, `private: true`, `version: 1.9.0`,
      `engines.node >= 20.19`; удалить `main`, `directories`, `keywords`, `author`.
- [x] 20.1.2. `dependencies` — `react ^19.3.1`, `react-dom ^19.3.1`; всё остальное — `devDependencies`.
- [x] 20.1.3. Добавить `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`,
      `globals`, `prettier`; убрать `jest-environment-jsdom`.
- [x] 20.1.4. Скрипты: `lint`, `lint:fix`, `format`, `format:check`, `smoke`, `smoke:browser`.
- [x] 20.1.5. Удалить `package-lock.json` и `node_modules/`, выполнить `npm install` с нуля.
- [x] 20.1.6. Проверить `npm ls --depth=0` (19 строк) и отсутствие `jest-*` в lock; `npm ci` — 0.

**Критерий:** `npm ls --depth=0` без `jest-*`; `npm ci` проходит.

---

### 20.2. ESLint: flat config и 0 ошибок

**Зависимость:** 20.1
**Файлы:** `eslint.config.js`, `src/App.tsx`, `src/data/repository.ts`, 4 теста

- [x] 20.2.1. `eslint.config.js`: `js.configs.recommended` + `tseslint.configs.recommended`.
- [x] 20.2.2. `rules-of-hooks` и `exhaustive-deps` — `error`; ignores `node_modules`, `dist`,
      `coverage`, `.idea`; globals `browser` для `src/**`/`test/**`, `node` для `scripts/**`/конфигов.
- [x] 20.2.3. `no-unused-vars` игнорирует `_`-параметры; `Repository.save(_data)`.
- [x] 20.2.4. `App.tsx`: деструктурировать `exitGame`, `reload`, `chooseDifficulty`, `show`, `start`,
      `open`; зависимости `useCallback` — сами методы.
- [x] 20.2.5. Удалить неиспользуемые `import type { AudioService }` из `App.test.tsx`,
      `useGame.test.tsx`, `useMap.test.tsx`, `useResults.test.tsx`.
- [x] 20.2.6. `npm run lint` — 0; в `src/**` нет `eslint-disable`.

**Критерий:** `npm run lint` завершается с кодом 0.

---

### 20.3. Prettier и единый стиль

**Зависимость:** 20.2
**Файлы:** `.prettierrc.json`, `.prettierignore`, весь код

- [x] 20.3.1. `.prettierrc.json`: `tabWidth 4`, `singleQuote`, `printWidth 120`,
      `trailingComma "none"`, `semi`, `arrowParens "always"`, `endOfLine "lf"`.
- [x] 20.3.2. `.prettierignore`: `node_modules/`, `dist/`, `coverage/`, `package-lock.json`, `*.md`,
      `.gigacode/`, `.idea/`.
- [x] 20.3.3. `npm run format` — 48 файлов; `format:check` чист.
- [x] 20.3.4. После форматирования: `typecheck` 0, `test` 261/261, `build` зелёный.

**Критерий:** `npm run format:check` — «All matched files use Prettier code style».

---

### 20.4. Мёртвый код

**Зависимость:** 20.3
**Файлы:** `src/core/session-model.ts`, `src/data/memory-repository.ts` (удалён),
`test/support/memory-repository.ts`, 5 тестов

- [x] 20.4.1. `grep` подтверждает отсутствие `useAudio`, `SessionService`, `SessionRepository`.
- [x] 20.4.2. Создать `test/support/memory-repository.ts`; удалить `src/data/memory-repository.ts`.
- [x] 20.4.3. Перевести импорты 5 тестов на `../support/memory-repository`.
- [x] 20.4.4. `SessionModel.recordCorrect` → `Scoring.calculateRoundScore(this._correct)`.
- [x] 20.4.5. `npm test` — 261/261; `npm run test:coverage` — пороги 80/60 зелёные.

**Критерий:** в `src/data/` нет `memory-repository.ts`; тесты зелёные.

---

### 20.5. CSS-долг

**Зависимость:** 20.4
**Файлы:** `css/game.css`, `css/results.css`, `css/result_items/results-streak.css` (удалён)

- [x] 20.5.1. `css/game.css`: `game-header` → `game-question` → `game-answers` → `game-feedback`.
- [x] 20.5.2. Убрать дубль `@import url('game_items/game-answers.css')`.
- [x] 20.5.3. `grep "streak"` по `src/**` пуст → удалить `results-streak.css` и его импорт.
- [x] 20.5.4. Собрать и проверить бандл: `.game-header` есть, `.streak-badge` нет; `css/` — 20 файлов.

**Критерий:** в `dist/assets/*.css` есть `.game-header`, нет `.streak-badge`.

---

### 20.6. Smoke-скрипт

**Зависимость:** 20.5
**Файлы:** `scripts/smoke.mjs`

- [x] 20.6.1. Запуск `vite preview --port 4173 --strictPort --host 127.0.0.1` через `spawn(process.execPath, …)`.
- [x] 20.6.2. Ожидание 200 (таймаут 30 с, `SMOKE_TIMEOUT`) и 10 проверок: `#root`, один JS, один CSS,
      нет `/src/`/`js/`/`audio/`, ассеты 200 и непустые, три mp3 в `dist/assets`.
- [x] 20.6.3. `SIGTERM` в `finally`; код выхода ≠ 0 при провале; `SMOKE_PORT` для переопределения порта.
- [x] 20.6.4. `npm run smoke` — 10/10; `npm run smoke:browser` (`--browser`) — 11/11: HTTP + CDP.

**Критерий:** `npm run smoke` — 10/10 проверок.

---

### 20.7. CI

**Зависимость:** 20.6
**Файлы:** `.github/workflows/ci.yml`

- [x] 20.7.1. Триггеры `push` (`main`, `dev`, `feature/**`) и `pull_request`.
- [x] 20.7.2. Шаги: `npm ci` → `typecheck` → `test` → `build` → `lint` → `smoke`; Node 22 + `cache: npm`.
- [x] 20.7.3. `permissions: contents: read`, `concurrency` с отменой, `timeout-minutes: 15`.
- [x] 20.7.4. Локально воспроизвести все шаги теми же командами.

**Критерий:** все шаги workflow локально зелёные.

---

### 20.8. Документация и версия

**Зависимость:** 20.7
**Файлы:** `README.md`, `GIGACODE.md`, `test/README.md`, `.gigacode/**`

- [x] 20.8.1. README: команды `npm ci`/`lint`/`format`/`smoke`, структура, CSS 20 файлов,
      тесты 28/261, покрытие 96.83/88.74, раздел «Архитектурное решение (1.9.0)».
- [x] 20.8.2. GIGACODE: структура, команды, раздел «Линтер, форматирование, CI», история 1.9.0,
      удалить «линтер не настроен».
- [x] 20.8.3. `test/README.md`: `test/support/memory-repository.ts`, команды проверки.
- [x] 20.8.4. `spec_v1_9_0.md`, `rules_v_1_9_0.md`, блоки 1.9.0 в `SPEC.md`/`RULES.md`.
- [x] 20.8.5. `PLAN.md`/`TASKS.md` 1.9.0; архивы `PLAN_v1_8_4.md`, `TASKS_v1_8_4.md`.

**Критерий:** документация не упоминает несуществующие файлы и команды.

---

### 20.9. Финальный критерий

**Зависимость:** 20.1–20.8

- [x] 20.9.1. `npm ci` — 0.
- [x] 20.9.2. `npm run typecheck` — 0.
- [x] 20.9.3. `npm test` — 261/261 в 28 сьютах.
- [x] 20.9.4. `npm run build` — `dist/` (JS + `.map`, CSS, три mp3).
- [x] 20.9.5. `npm run lint` — 0.
- [x] 20.9.6. `npm run format:check` — чисто.
- [x] 20.9.7. `npm run smoke` — 10/10.

**Критерий:** `npm ci && npm run typecheck && npm test && npm run build && npm run lint` — зелёные.

---

## 🗺️ Покрытие требований

| Требование | Задачи |
|---|---|
| TR-61 `package.json` | 20.1.1–20.1.4 |
| TR-62 lock и `npm ci` | 20.1.5–20.1.6, 20.9.1 |
| TR-63 ESLint | 20.2.1–20.2.6 |
| TR-64 Prettier | 20.3.1–20.3.4 |
| TR-65 мёртвый код | 20.4.1–20.4.5 |
| TR-66 CSS | 20.5.1–20.5.4 |
| TR-67 CI | 20.7.1–20.7.4 |
| TR-68 smoke | 20.6.1–20.6.4 |
| TR-69 документация | 20.8.1–20.8.5 |
| TR-70 архитектурное решение | 20.8.1–20.8.2 |

---

## 🔜 Backlog после 1.9.0

- Type-aware ESLint (`recommendedTypeChecked`) — отдельная версия, замер времени прогона.
- E2E на Playwright: 7 сценариев из `test/README.md`; только при согласии владельца на зависимость.
- `npm run test:watch` в CI не нужен; локальное удобство сохраняется.
- Карта покрытия по компонентам в README генерируется вручную — кандидат на скрипт.
