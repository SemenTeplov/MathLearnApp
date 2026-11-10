**Версия:** 1.9.0
**Статус:** Обязательно к исполнению
**Тип документа:** Дополнения к конституции (зависимости, линтер, CI, архитектурное решение)
**Предыдущая версия:** `rules_v_1_8_4.md`
**Связанные документы:** `spec_v1_9_0.md`, `PLAN_v1_9_0.md`, `TASKS.md`

> Эти правила дополняют базовую конституцию (`rules_v_1_0_0.md` … `rules_v_1_8_4.md`) и имеют
> тот же приоритет. При конфликте действует более новое правило.

---

## 🏛️ Архитектурные принципы — дополнения (1.9.0)

### A72. Одна зависимость — одно место

**Правило:** в `dependencies` лежит только то, что попадает в бандл и работает в браузере.

**Правила:**

- `dependencies` — ровно `react` и `react-dom`; всё остальное — `devDependencies`;
- библиотека для тестов, сборки или линтера не может быть рантайм-зависимостью;
- транзитивы инструментов не перечисляются в `package.json` руками: дерево строит npm;
- новая рантайм-зависимость добавляется только вместе с обоснованием в spec и правилом слоя;
- удаление зависимости подтверждается `grep` по `src/**` и `npm ls`.

**Причина:** в 1.8.4 `dependencies` содержали ~200 транзитивов Jest (`jest-cli`, `babel-preset-jest`,
`istanbul-*`): они не использовались в браузере, но попадали в аудит и в lock-файл.

### A73. Lock-файл — источник воспроизводимости

**Правило:** установка зависимостей воспроизводима по `package-lock.json`.

**Правила:**

- lock коммитится; `node_modules/`, `dist/`, `coverage/` — нет;
- CI ставит зависимости только `npm ci`, не `npm install`;
- lock меняется только командами npm; ручная правка запрещена;
- после смены зависимостей выполняется установка **с нуля**: старый `node_modules/` удаляется,
  иначе остаются «фантомные» пакеты;
- `npm ci` на чистом клоне — первая проверка любой версии.

**Причина:** старый lock был собран из Jest-эпохи и не соответствовал новому набору инструментов;
«npm install поверх» оставлял в дереве пакеты, которых нет в lock.

### A74. Линтер и форматтер — часть критерия готовности

**Правило:** `npm run lint` и `npm run format:check` — такие же обязательные проверки, как тесты.

**Правила:**

- ESLint (flat config) и Prettier настроены в репозитории, а не в IDE;
- `npm run lint` — 0 ошибок и 0 предупреждений; `eslint-disable` в `src/` запрещён;
- форматирование — только Prettier; стилевые правила ESLint не включаются;
- `npm run format` применяется до сдачи, `format:check` — в проверке;
- правило, которое ложно срабатывает на легитимном коде, меняется в конфиге с обоснованием,
  а не отключается комментарием в файле.

**Причина:** «линтер не настроен — соблюдайте стиль вручную» не проверяется автоматически и
не переживает смену автора.

### A75. Мёртвый код удаляется, а не комментируется

**Правило:** код, у которого нет вызывающего в проде, либо удаляется, либо переезжает в тесты.

**Правила:**

- экспорт без вызова в `src/**` — кандидат на удаление; исключение — публичный контракт слоя
  (`Repository`, `Repository`-подобные базы), покрытый тестом;
- тестовый двойник живёт в `test/support/`, а не в `src/`;
- если функция дублирует правило домена, она либо используется, либо удаляется — «висящий» метод
  с тестом запрещён;
- удаление подтверждается `grep` по `src/**` и `test/**`.

**Причина:** `MemoryRepository` и `calculateRoundScore` существовали только ради собственных тестов
и создавали ложное впечатление покрытого прод-кода.

### A76. CSS-файл существует, только если он подключён и используется

**Правило:** партиал CSS импортируется ровно один раз и содержит классы, которые есть в разметке.

**Правила:**

- `game.css`, `results.css`, `map.css`, `screens.css` — единственные агрегаторы `@import`;
- один партиал — один `@import`; дубль запрещён;
- класс без использования в компонентах удаляется вместе с файлом;
- подключение забытого партиала — исправление дефекта, а не «рефакторинг»: значения стилей
  не меняются;
- после правки CSS проверяется собранный бандл (`dist/assets/*.css`), а не только исходники.

**Причина:** `game-header.css` не был подключён (шапка игры оставалась без стилей), `game-answers.css`
импортировался дважды, а `results-streak.css` тянул мёртвый `.streak-badge` в прод.

### A77. CI повторяет локальный критерий

**Правило:** workflow запускает те же команды в том же порядке, что и разработчик.

**Правила:**

- шаги: `npm ci` → `typecheck` → `test` → `build` → `lint` → `smoke`;
- никаких «CI-специальных» скриптов, ослабленных флагов и `|| true`;
- кэш npm допустим, кэш `dist` — нет;
- падение любого шага останавливает пайплайн;
- smoke работает только по собранному `dist`, а не по dev-серверу.

**Причина:** зелёный CI, который не собирает и не проверяет артефакт, ничего не доказывает.

### A78. Без глобального стора: composition root + локальное состояние

**Правило:** глобального стора нет и не будет без новой версии spec/rules.

**Правила:**

- запрещены Zustand, Redux, MobX, Jotai, Recoil, а также самописный Context-стор и
  `window`/`globalThis`-мосты для состояния;
- сервисы создаются **один раз** в `src/app/createServices.ts` и передаются явно:
  пропсом `services` в `App` и **первым аргументом** в хук (`useMap(services)`);
- состояние экранов — `useState`/`useRef` в `src/hooks/`; компоненты презентационные и
  не создают сервисы;
- производные значения считаются в хуке/домене, а не кэшируются в глобальной переменной;
- новый «общий» стейт сначала обсуждается как изменение архитектуры, а не добавляется «по пути».

**Причина:** приложение укладывается в 5 хуков и один `createServices()`; глобальный стор добавил
бы синхронизацию, которой нет ни в требованиях, ни в поведении.

---

## 🔧 Технические ограничения — дополнения (1.9.0)

### T63. Контракт `package.json`

```json
{
  "type": "module",
  "private": true,
  "version": "1.9.0",
  "engines": { "node": ">=20.19" },
  "dependencies": { "react": "…", "react-dom": "…" },
  "devDependencies": {
    "@eslint/js": "…", "@testing-library/jest-dom": "…", "@testing-library/react": "…",
    "@testing-library/user-event": "…", "@types/react": "…", "@types/react-dom": "…",
    "@vitejs/plugin-react": "…", "@vitest/coverage-v8": "…", "eslint": "…",
    "eslint-plugin-react-hooks": "…", "globals": "…", "jsdom": "…", "prettier": "…",
    "typescript": "…", "typescript-eslint": "…", "vite": "…", "vitest": "…"
  }
}
```

- Обязательные скрипты: `dev`, `build`, `preview`, `typecheck`, `test`, `test:watch`,
  `test:coverage`, `lint`, `lint:fix`, `format`, `format:check`, `smoke`, `smoke:browser`.
- Запрещены пакеты `jest-*`, `babel-plugin-jest-*`, `babel-preset-jest`, `create-jest`,
  `jest-environment-jsdom`.
- Поля `main`, `directories`, `keywords`, `author` не нужны.

### T64. Контракт ESLint

- Файл `eslint.config.js`, ESM, flat config, ESLint 10.
- Базы: `js.configs.recommended` + `typescript-eslint` recommended (без type-aware).
- `eslint-plugin-react-hooks`: `rules-of-hooks` и `exhaustive-deps` в статусе `error`.
- `ignores`: `node_modules/**`, `dist/**`, `coverage/**`, `.idea/**`.
- Глобальные окружения: `browser` — `src/**`, `test/**`; `node` — `scripts/**`, конфиги.
- `@typescript-eslint/no-unused-vars` игнорирует имена с `_` (параметры контракта).

### T65. Контракт Prettier

- `.prettierrc.json`: `tabWidth: 4`, `singleQuote: true`, `printWidth: 120`,
  `trailingComma: "none"`, `semi: true`, `arrowParens: "always"`, `endOfLine: "lf"`.
- `.prettierignore`: `node_modules/`, `dist/`, `coverage/`, `package-lock.json`, `*.md`,
  `.gigacode/`, `.idea/`.
- `npm run format` пишет, `npm run format:check` только проверяет.

### T66. Контракт CI

- `.github/workflows/ci.yml`, Node 22 LTS, `cache: npm`.
- Шаги и порядок: `npm ci` → `npm run typecheck` → `npm test` → `npm run build` →
  `npm run lint` → `npm run smoke`.
- Триггеры: `push` (`main`, `dev`, `feature/**`) и `pull_request`.
- `permissions: contents: read`, `concurrency` с отменой, `timeout-minutes: 15`.
- Секретов и деплоя нет.

### T67. Контракт smoke

- `scripts/smoke.mjs` — только Node-встроенные модули (`fetch`, `child_process`, `fs`, `path`).
- Запускает `vite preview --port 4173 --strictPort --host 127.0.0.1`, ждёт 200 не дольше 30 с.
- Проверки: `#root`; один JS; один CSS; нет `/src/`, `js/`, `audio/`; ассеты 200 и непустые;
  три mp3 в `dist/assets`.
- `SIGTERM` серверу в `finally`; код выхода ≠ 0 при провале; порт переопределяется `SMOKE_PORT`.
- `scripts/verify-dist.mjs` остаётся для браузерных проверок (`npm run smoke:browser`).

### T68. Раскладка тестов

- `test/core`, `test/data`, `test/services`, `test/components`, `test/hooks` — как в 1.8.3.
- `test/support/` — тестовые двойники (`memory-repository.ts`), в `coverage.include` не входят.
- Импорт двойника: `import { MemoryRepository } from '../support/memory-repository'`.
- `test/setup.ts` содержит только инфраструктуру; доменных констант там нет.

### T69. Контракт документации

- README и GIGACODE содержат только существующие команды и файлы.
- Структура в документах совпадает с деревом репозитория (проверяется `tree`/`ls`).
- Числа тестов, сьютов и покрытия в документах совпадают с фактическим прогоном.
- Версии `.gigacode/**` соответствуют коду; архивы предыдущих версий не удаляются.

### T70. Проверки перед сдачей

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run lint
npm run format:check
npm run smoke
```

Порядок обязателен: smoke — после build. Каждая команда должна завершиться с кодом 0.

---

## 🚫 Запреты — дополнения (1.9.0)

### Z34. Запрещено в зависимостях

- Jest и его транзитивы в `dependencies` или `devDependencies` (`jest`, `jest-*`,
  `babel-plugin-jest-*`, `babel-preset-jest`, `create-jest`, `jest-environment-jsdom`);
- `jest.config.js` и любые Jest-конфиги;
- `@types/jest` и `jest`-глобали в `tsconfig`;
- рантайм-библиотеки в `dependencies` без использования в `src/**`;
- ручная правка `package-lock.json`;
- `npm install` без последующего `npm ci` на чистом дереве при смене зависимостей.

### Z35. Запрещено в CSS

- дублирующий `@import` одного партиала;
- CSS-файл, который никто не импортирует;
- партиал с классами, которых нет в разметке;
- изменение значений стилей под видом «наведения порядка»;
- правка только исходников без проверки собранного CSS.

### Z36. Запрещено в архитектуре состояния

- Zustand/Redux/MobX/Jotai/Recoil и самописный глобальный стор;
- `window.*`/`globalThis.*` как канал состояния;
- создание сервиса в компоненте или хуке (кроме `createServices()`);
- модульные переменные для хранения состояния приложения;
- передача `services` через Context вместо явного аргумента.

### Z37. Запрещено в git

- коммит `node_modules/`, `dist/`, `coverage/`, `*.log`, `.npm-cache/`;
- `git add -A` без просмотра списка;
- коммит с красными `lint`/`test`/`build`;
- изменение версий React/Vite/Vitest/TypeScript «заодно» с настройкой линтера.

### Z38. Запрещено в этом этапе

- менять поведение, разметку, тексты, `CONFIG`, `Stats` v3, ключи `ml_stats`/`ml_session_lock`;
- ослаблять тесты или понижать пороги покрытия;
- добавлять Playwright/Puppeteer для smoke;
- форматировать Markdown через Prettier;
- включать type-aware правила ESLint в этой версии.

---

## ✅ Обязательства агента — дополнения (1.9.0)

1. Переписать `package.json` по T63; удалить старый `package-lock.json` и `node_modules/`;
   выполнить `npm install` с нуля; проверить `npm ls --depth=0` и отсутствие `jest-*`.
2. Проверить, что `npm ci` проходит на чистом дереве и не меняет `package.json`.
3. Создать `eslint.config.js` по T64; добиться `npm run lint` = 0 без `eslint-disable`.
4. Создать `.prettierrc.json` и `.prettierignore` по T65; применить `npm run format` один раз;
   после форматирования прогнать `typecheck`, `test`, `build`.
5. Удалить `useAudio`/`SessionService`/`SessionRepository`, если они найдутся; перенести
   `MemoryRepository` в `test/support/`; использовать `Scoring.calculateRoundScore` в `SessionModel`.
6. Исправить CSS по TR-66 и проверить собранный бандл.
7. Добавить `.github/workflows/ci.yml` по T66 и `scripts/smoke.mjs` по T67.
8. Обновить README, GIGACODE, `SPEC.md`/`RULES.md`, `PLAN.md`, `TASKS.md`, создать
   `spec_v1_9_0.md` и `rules_v_1_9_0.md`; архивировать `PLAN_v1_8_4.md`/`TASKS_v1_8_4.md`.
9. Зафиксировать архитектурное решение A78 в README (раздел «Архитектурное решение») и GIGACODE.
10. Прогнать критерий T70 полностью и записать фактические числа в отчёт.

---

## 📌 Краткая памятка агенту — дополнения

✅ `dependencies` = `react`, `react-dom`
✅ `npm ci` из lock; lock коммитится
✅ `npm run lint` = 0, `npm run format:check` — чисто
✅ `npm run build` → `dist/`, затем `npm run smoke`
✅ CI = `ci → typecheck → test → build → lint → smoke`
✅ `MemoryRepository` в `test/support/`
✅ `Scoring.calculateRoundScore` используется `SessionModel`
✅ `game.css` — 4 импорта, `game-header.css` подключён
✅ состояние — хуки, сервисы — `createServices()`
✅ README/GIGACODE/.gigacode = код

❌ Jest, `jest-*`, `jest-environment-jsdom`, `jest.config.js`
❌ дубли `@import`, мёртвые CSS-файлы
❌ Zustand/Redux/MobX/Jotai/Recoil и Context-стор
❌ `eslint-disable` в `src/`
❌ Prettier для `.md`
❌ «зелёный» CI без build и smoke

---

## 🔄 История версий — дополнение

| Версия | Дата | Изменения |
|---|---|---|
| 1.8.2 | 2026 | ES-модули, слои `core`/`data`/`services`, composition root |
| 1.8.3 | 2026 | Тесты на импортах: без `eval`/`readSource`/копий логики; RTL, хуки, coverage 80/60 |
| 1.8.4 | 2026 | Настоящая сборка Vite: `plugin-react`, `base: './'`, ESM-конфиг, ассеты через `?url` |
| **1.9.0** | 2026 | Зависимости и качество: `dependencies` = React, ESLint/Prettier, CI, smoke, удаление мёртвого кода, CSS-долг, решение «без глобального стора» |
