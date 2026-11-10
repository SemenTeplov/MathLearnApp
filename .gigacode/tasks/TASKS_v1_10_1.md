# TASKS.md — MathLingo

> **Архив.** Снимок `TASKS.md` версии 1.10.1 на момент перехода к 1.10.2 (ветка `fix/1.10.2`,
> HEAD `5e2fe57`). Задачи 22.1–22.9 выполнены; файл сохранён как история предыдущей версии
> (T77/T90.5).

**Версия:** 1.10.1
**Основа:** PLAN.md 1.10.1 (этап 22), SPEC 1.10.1 (`TR-81…TR-88`), RULES 1.10.1 (`A86–A91`, `T79–T85`, `Z44–Z48`)
**Предыдущая версия:** `TASKS_v1_10_0.md` (архив, снимок HEAD `0fa9aa0`)
**Статус:** задачи 22.1–22.9 **выполнены** (ветка `feature/1.10`, база `0fa9aa0`); код 1.10.1 собран и проверен
**Базовая линия 1.10.1:** `typecheck` **0**, `lint` **0**, `format:check` **0**, **276 тестов в 29 сьютах** (перемерено), coverage **97.36 / 88.79** (по аудиту 1.10.0), `build` 247.51 КБ JS + 7.04 КБ CSS + три mp3, `smoke` **10/10**, `smoke:browser` **11/11**; бюджеты: `src` **200**, `test` **199**, `scripts` **247**, `css` **64**; `.idea/` — 0; `version` — **1.10.0**
**Факт выполнения:** **303 теста в 33 сьютах**; coverage **97.57 / 89.19**; `typecheck`/`lint`/`format:check` — **0**; `build` 248.80 КБ JS (+`map` 1.19 МБ) + 7.04 КБ CSS + три mp3; `smoke` **10/10**; `smoke:browser` **11/11**; бюджеты: `src` 200 (`useMap.ts`), `test` 199 (`stats-service.test.ts`), `scripts` 247 (`verify-dist.mjs`), `css` 64; `.idea/` — 0; `version` — **1.10.1**

---

## 📖 Правила

- Задачи — **строго по порядку**; зависимость указана в каждой задаче.
- После задачи — критерий готовности и `npm test` зелёный: **не меньше 276** тестов (факт 1.10.1 фиксируется в отчёте).
- Бюджет строк проверяется сразу, а не «потом»: `src`/`test` ≤ 200, `scripts` ≤ 250, `css` ≤ 200 (A84, Z42).
- `console.log` в `src/**` запрещён; диагностика — `console.info` / `console.warn` / `console.error` (A85).
- `alert()` / `confirm()` / `prompt()` в `src/**` запрещены — только `ErrorModal` и `ConfirmModal` (A88, Z46).
- `src/data/**` импортирует только `core`/`data`; `app/**` из `data/**` — запрещено (A87, Z45).
- При обрыве — продолжать с **последней** незавершённой задачей.
- `git add -A` не используется; `dist/` и `coverage/` не коммитятся.
- Новые зависимости, Playwright/Puppeteer, type-aware ESLint, Prettier для `.md` — не добавляются (Z48).

---

## 📂 Структура (1.10.1)

```
package.json                      # version 1.10.0 → 1.10.1 на выпуске (22.8.3)
.gigacode/plans/PLAN.md           # 1.10.1 — текущий план (этап 22)
.gigacode/plans/PLAN_v1_10_0.md   # архив 1.10.0 (создан)
.gigacode/tasks/TASKS.md          # этот файл, 1.10.1
.gigacode/tasks/TASKS_v1_10_0.md  # архив 1.10.0 (создан)
src/core/error-reporting.ts       # NEW: ErrorReporter + STORAGE_ERROR_TITLE (T79)
src/core/types.ts                 # − SessionState (N1/A75)
src/core/stats-schema.ts          # migrate(data, onStep?) (T81)
src/data/stats-service.ts         # порт вместо app; write-back миграции; Set ступеней лога
src/app/error-bus.ts              # реализует ErrorReporter; очередь недоставленных сообщений
src/App.tsx                       # returnToMap(); состояние подтверждения; ConfirmModal
src/components/ConfirmModal.tsx   # NEW: подтверждение выхода (T80)
src/hooks/useGame.ts              # onExitRequested(roundScore); без confirm()
src/hooks/useMap.ts               # проверка saveTrainerIndex, write-ahead позиция, ≤ 200 строк
test/app/error-bus.test.ts        # NEW: очередь, подписка/отписка
test/components/ConfirmModal.test.tsx  # NEW: тексты, кнопки, оверлей
test/components/App.startup.test.tsx   # NEW: стартовая ошибка хранилища (A91)
test/support/memory-repository.ts # сериализация save/load (T84.4)
test/{core,data,hooks,components}/*    # правки под новые контракты
.github/workflows/ci.yml          # grep-проверки без `|| true` (T66/A77)
scripts/smoke.mjs                 # комментарий «11 проверок» (D7)
README.md, GIGACODE.md, test/README.md # структура, A91, версия 1.10.1
```

---

## 🧩 Задачи

### 22.1. Порт `ErrorReporter` и буфер шины

**Требования:** TR-81, TR-82 · **Зависимость:** нет
**Файлы:** `src/core/error-reporting.ts` (NEW), `src/data/stats-service.ts`, `src/app/error-bus.ts`, `test/app/error-bus.test.ts` (NEW), `test/components/App.startup.test.tsx` (NEW), `test/data/stats-service.test.ts`, `test/support/stats-fixtures.ts`

- [x] 22.1.1. `src/core/error-reporting.ts` [NEW]: `export interface ErrorReporter { report(title: string, message: string): void }` и `export const STORAGE_ERROR_TITLE = 'Ошибка хранилища'`; файл без рантайм-логики, кроме константы (T79).
- [x] 22.1.2. `StatsService`: поле `_errors: ErrorReporter | null`; `STORAGE_ERROR_TITLE` импортируется из `core`; `grep -RIn "from '../app" src/data` — пусто (A53/A87/Z45).
- [x] 22.1.3. `ErrorBus` реализует порт: поле `_pending: Array<[string, string]>`; `report()` без подписчиков кладёт пару в очередь, с подписчиками — доставляет сразу; `subscribe()` сначала синхронно отдаёт очередь в порядке публикации и очищает её, затем регистрирует слушателя (A86/T79).
- [x] 22.1.4. Очередь — поле экземпляра: `window.*`, `globalThis.*`, модульных переменных нет (A78/Z44); два экземпляра шины не делят сообщения.
- [x] 22.1.5. `test/app/error-bus.test.ts` [NEW]: две публикации до подписки → подписчик получает обе по порядку, очередь пуста; вторая подписка ничего не получает; отписка снимает слушателя; `report()` после подписки доставляется сразу; очередь одного экземпляра не видна другому.
- [x] 22.1.6. `test/components/App.startup.test.tsx` [NEW]: реальный `StatsService` на репозитории, бросающем на **первом** `load()`, **без** ручного `errors.report(...)`:
  повреждённая запись (`version` новее `CONFIG.VERSION`) → модалка «Ошибка хранилища» + «Данные повреждены. Счёт сброшен.», счёт 0, карта активна, раунд стартует;
  недоступное хранилище → модалка + «Хранилище недоступно. Игра работает без сохранения.», `save` не бросает, игра идёт.
- [x] 22.1.7. `App.tsx`: порядок не меняется — чтение статистики остаётся в `useMap`, подписка в `useEffect`; доставку обеспечивает очередь. Тест на повторный монтаж (эмуляция `StrictMode`) не показывает модалку дважды.
- [x] 22.1.8. Дедупликация сохранена: тот же `action + userMessage` не публикуется повторно без успешной записи; другой текст — публикуется (тест в `stats-service.test.ts`).
- [x] 22.1.9. Правленые и новые сьюты ≤ 200 строк; `npm test` зелёный, число тестов не уменьшилось.

**Критерий:** тест «ошибка при старте» видит модалку без ручной публикации в шину; `grep -RIn "from '../app" src/data` пуст; `npm test` зелёный.

---

### 22.2. Подтверждение выхода — `ConfirmModal`

**Требования:** TR-83 · **Зависимость:** 22.1
**Файлы:** `src/components/ConfirmModal.tsx` (NEW), `src/hooks/useGame.ts`, `src/App.tsx`, `test/components/ConfirmModal.test.tsx` (NEW), `test/hooks/useGame.test.tsx`, `test/components/App.test.tsx`, `test/components/App.map-freshness.test.tsx`

- [x] 22.2.1. `ConfirmModal` [NEW]: props `{ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }`; разметка `.modal-overlay.open > .modal > h2 + p + .btn.btn-primary + .btn.btn-secondary`; клик по оверлею — `onCancel`, клик по `.modal` не закрывает (как `ErrorModal`, T33); новых CSS-правил и значений не вводится (T80).
- [x] 22.2.2. `UseGameDeps`: `onExitToMap` заменяется на `onExitRequested(roundScore: number)`; `exit()` = `audio.play('click')` + `onExitRequested(model.roundScore)`; раунд не завершается, `onRoundFinished` не вызывается; `confirm` удаляется (A88/Z46).
- [x] 22.2.3. `App`: состояние `const [exitConfirm, setExitConfirm] = useState<{ roundScore: number } | null>(null)`; ✕ → `setExitConfirm(prev => prev ?? { roundScore })` (повторный ✕ — no-op); «Остаться»/оверлей → `null`; «Выйти» → `null`, `exitGame()`, затем существующий путь возврата, который в 22.4 сводится к `returnToMap()`.
- [x] 22.2.4. Тексты фиксированы: «Выйти из игры?», «Заработано N очков сгорят.», «Выйти», «Остаться»; `N` — `roundScore` из модели; звук `click` на кнопках модалки играют обработчики `App`.
- [x] 22.2.5. `test/components/ConfirmModal.test.tsx` [NEW]: тексты и кнопки, `onConfirm`, `onCancel` по кнопке и по оверлею, клик внутри `.modal` не закрывает.
- [x] 22.2.6. `useGame.test.tsx`: оба «exit»-теста переписываются без `vi.spyOn(window, 'confirm')` — `exit()` вызывает `onExitRequested(roundScore)` один раз, играет `click`, раунд не завершается.
- [x] 22.2.7. `App.test.tsx`: выход из раунда через модалку — «Остаться» → экран игры активен, статистика не изменилась; «Выйти» → карта, счёт раунда не записан.
- [x] 22.2.8. `App.map-freshness.test.tsx`: `vi.stubGlobal('confirm', …)` удаляется; путь «победа → Играть снова → ✕ → Выйти» даёт `🏆 100`.
- [x] 22.2.9. `grep -RIn "confirm(\|alert(\|prompt(" src` — пусто; нативные диалоги в тестах не подменяются (Z46).

**Критерий:** модалка выхода покрыта тестами; нативных диалогов в `src/**` нет; `npm test` зелёный.

---

### 22.3. Миграция сохраняется, лог — один раз на ступень

**Требования:** TR-84 · **Зависимость:** нет (пересекается с 22.1 по `load()`)
**Файлы:** `src/core/stats-schema.ts`, `src/data/stats-service.ts`, `test/support/memory-repository.ts`, `test/data/memory-repository.test.ts`, `test/core/stats-schema.test.ts`, `test/data/stats-service.test.ts`

- [x] 22.3.1. `StatsSchema.migrate(data, onStep?: (from: number, to: number) => void)`; `onStep` вызывается на каждую выполненную ступень; по умолчанию `console.info('[StatsSchema] миграция', from, '→', to)`; без `onStep` поведение и сигнатура прежние (T81).
- [x] 22.3.2. `StatsService`: единый приватный `_read()` для `load()` и `_readOrDefaults()` — читает запись, мигрирует с колбэком экземпляра; если версия исходных данных меньше `CONFIG.VERSION` — `repo.save(migrated)` (write-back).
- [x] 22.3.3. Колбэк экземпляра хранит `Set<string>` ступеней (`from→to`) и не печатает ступень повторно, если write-back не удался (A89/Z47).
- [x] 22.3.4. Провал write-back: `handleError` + сообщение через порт, игра продолжается; `load()` возвращает мигрированные данные; ступень в логе не дублируется.
- [x] 22.3.5. Актуальная запись (`version = CONFIG.VERSION`): ни `save`, ни `console.info` (тест спаем).
- [x] 22.3.6. `MemoryRepository`: `save` копирует через `JSON.parse(JSON.stringify(data))`, `load` отдаёт копию; сьют: `toEqual` вместо `toBe`, мутация загруженного объекта не меняет сохранённый (T84.4).
- [x] 22.3.7. Тесты: сериализующий репозиторий + v1 → три `load()` дают ровно две строки лога (1→2, 2→3), после write-back следующий `load()` — ноль; v2 → одна строка; v3 → ноль; прямые тесты `migrate()` остаются зелёными.
- [x] 22.3.8. Проверить тесты, считающие вызовы `repo.save`: write-back добавляет запись только при загрузке устаревшей записи.

**Критерий:** лог ступени — ровно один раз на запись; write-back подтверждён сериализующим двойником; `grep -RIn "console\.log" src` пуст.

---

### 22.4. Единый путь возврата на карту

**Требования:** TR-85 · **Зависимость:** 22.2
**Файлы:** `src/App.tsx`, `test/components/App.test.tsx`, `test/components/App.map-freshness.test.tsx`

- [x] 22.4.1. `returnToMap = useCallback(() => { reloadMap(); navigate('map'); }, [reloadMap, navigate])`; порядок обязателен — чтение статистики до переключения экрана (A82/T82).
- [x] 22.4.2. ✕ → `exitGame(); returnToMap()`; «На карту» → `returnToMap()`; смена карты (`useMapSelection`) → `returnToMap()`; отдельных копий пары «reload + navigate» нет (`handleExitToMap`, `handleMapChanged` удаляются).
- [x] 22.4.3. Тест: победа → результаты → «Играть снова» → ✕ → «Выйти» → `🏆 100`; «На карту» → `🏆 100`; смена карты (English) → счёт последнего раунда виден.
- [x] 22.4.4. `App.tsx` укладывается в 200 строк: удаление двух копий обработчиков компенсирует состояние подтверждения и рендер модалки (сейчас 188).
- [x] 22.4.5. `App.map-freshness` расширяется путём смены карты; регресс 1.9.0/1.10.0 не допускается.

**Критерий:** все пути возврата дают одинаковый счёт; `wc -l src/App.tsx` ≤ 200.

---

### 22.5. Провал записи позиции откатывает отображение

**Требования:** TR-86 · **Зависимость:** 22.1, 22.3
**Файлы:** `src/hooks/useMap.ts`, `test/hooks/useMap.test.tsx`, `test/components/App.startup.test.tsx`

- [x] 22.5.1. `gameFinished`: целевой индекс вычисляется без мутации (`isSuccessful ? player.index : player.previous`), затем `const written = services.stats.saveTrainerIndex(target)` (A90/T83).
- [x] 22.5.2. При `true` — фиксация: победа → `player.commitWin()`, провал на новом → `player.revert()`; при `false` — `PlayerState` не меняется, отображаемый индекс остаётся прежним, счёт читается из хранилища.
- [x] 22.5.3. Повторная игра (`isReplay()`) — ранний выход без записи (A28/T23) сохраняется.
- [x] 22.5.4. `useMap.ts` остаётся ≤ 200 строк: правка компенсируется сокращением шапки/комментариев в том же файле; логика движения, модалки и `UseMap` не меняются.
- [x] 22.5.5. Тест: репозиторий бросает `QuotaExceededError` на `save` → индекс в UI прежний, `getTrainerIndex()` не изменился, счёт не «прыгнул», в шине есть сообщение; при успешной записи поведение 1.10.0 (победа закрепляет, провал откатывает).

**Критерий:** провал `saveTrainerIndex` не двигает игрока; `wc -l src/hooks/useMap.ts` ≤ 200; `npm test` зелёный.

---

### 22.6. Документы, мёртвый код и CI

**Требования:** TR-87 · **Зависимость:** 22.1–22.5 (документы описывают итоговый код)
**Файлы:** `src/core/types.ts`, `GIGACODE.md`, `README.md`, `test/README.md`, `test/components/Header.test.tsx`, `scripts/smoke.mjs`, `.github/workflows/ci.yml`, `.gigacode/tasks/TASKS.md`, `.gigacode/specs/SPEC.md`

- [x] 22.6.1. `SessionState` удалён из `src/core/types.ts`; `grep -RIn "SessionState" src` — пусто (N1/A75).
- [x] 22.6.2. GIGACODE: D1 — модалку «Игра уже запущена» видит **претендент**, владелец молчит; D2 — `Services` с `errors`; D3 — актуальный список «Вне текущей области» (гонка двух вкладок, разблокировка открытой вкладки, новая функциональность, зависимости — вместо переписывания тестов на `import`/`allowJs`/React-тестов); структура дополнена `src/core/error-reporting.ts` и `src/components/ConfirmModal.tsx`.
- [x] 22.6.3. `SPEC.md`: статус 1.10.0 → «Выполнено» (D5); `scripts/smoke.mjs:9`: комментарий «11 проверок» (D7); D4 закрыт ещё при переводе `TASKS.md` на 1.10.1 — в актуальном файле «12 проверок» нет.
- [x] 22.6.4. CI (N3/T84.3): grep-проверки оформляются как `if grep …; then echo "✗ …"; fail=1; fi`; добавляются `from '../app'` в `src/data`, `SessionState` в `src`, `confirm(`/`alert(`/`prompt(` в `src`; ни одного `|| true` не остаётся.
- [x] 22.6.5. `Header.test.tsx` (N5/T52): проверяются общий счёт `🏆` и кнопка `🌍`; жизни проверяет `GameScreen.test.tsx`; шапка сьюта соответствует T52.
- [x] 22.6.6. `test/README.md`: A91 — почему `App.map-freshness.test.tsx` и `App.startup.test.tsx` отдельные сьюты; структура `test/{core,data,services,components,hooks,app}` (`test/app/error-bus.test.ts` — мирроринг `src/app`); бюджет сьюта 200 строк; число проверок `smoke:browser`.
- [x] 22.6.7. `README.md`/`GIGACODE.md`: число тестов и сьютов, структура с новыми файлами, известное ограничение (гонка двух вкладок), версия 1.10.1.
- [x] 22.6.8. Документы не ссылаются на несуществующие файлы и команды (T69/T77).

**Критерий:** `grep` из TR-88 пуст; документы соответствуют дереву; `npm run lint` и `format:check` зелёные.

---

### 22.7. Бюджет строк и новые сьюты

**Требования:** TR-88 · **Зависимость:** 22.1–22.6
**Файлы:** `src/**/*.ts(x)`, `test/**/*.test.ts(x)`, `test/support/*.ts`, `scripts/*.mjs`, `css/**/*.css`

- [x] 22.7.1. `wc -l`: каждый `src`/`test`-файл ≤ 200, `scripts` ≤ 250, `css` ≤ 200; под наблюдением `App.tsx` (188 → ≤ 200), `useMap.ts` (200), `stats-service.ts` (165), `App.test.tsx` (191).
- [x] 22.7.2. Новые файлы (`error-bus.test.ts`, `ConfirmModal.test.tsx`, `App.startup.test.tsx`, `ConfirmModal.tsx`, `error-reporting.ts`) каждый ≤ 200; общие фикстуры — в `test/support/`.
- [x] 22.7.3. Сьюты не дробятся ради бюджета: при переполнении — фикстуры/хелперы в `test/support/` (A60/A91), сценарии не удаляются (Z42).
- [x] 22.7.4. `npm test` — не меньше 276 тестов; фактическое число и число сьютов фиксируются в отчёте.

**Критерий:** все лимиты соблюдены; число тестов не уменьшилось.

---

### 22.8. Архивы документов и версия 1.10.1

**Требования:** TR-87 · **Зависимость:** 22.6–22.7
**Файлы:** `.gigacode/plans/**`, `.gigacode/tasks/**`, `.gigacode/specs/SPEC.md`, `.gigacode/rulles/RULES.md`, `package.json`, `package-lock.json`, `README.md`, `GIGACODE.md`

- [x] 22.8.1. Архивы созданы: `plans/PLAN_v1_10_0.md` (снимок HEAD `0fa9aa0`) и `tasks/TASKS_v1_10_0.md`; версионированные `PLAN_v1_10_1.md`/`TASKS_v1_10_1.md` **не создаются** (T84.6, D6).
- [x] 22.8.2. `TASKS.md` переведён на 1.10.1 (задачи 22.x, покрытие TR-81…TR-88).
- [x] 22.8.3. `package.json` `version` → `1.10.1`; `package-lock.json` — `npm install --package-lock-only` (дерево не переустанавливается). Только после зелёного TR-88.
- [x] 22.8.4. `SPEC.md`/`RULES.md`: 1.10.1 в индексах и истории, статус 1.10.1 актуален; ссылки только на существующие файлы.
- [x] 22.8.5. Версия в `README.md`/`GIGACODE.md`/`test/README.md` — 1.10.1.

**Критерий:** `node -p "require('./package.json').version"` = `1.10.1`; архивы 1.10.0 на месте; версия совпадает во всех документах.

---

### 22.9. Финальный критерий TR-88

**Требования:** TR-88 · **Зависимость:** 22.1–22.8

- [x] 22.9.1. `npm ci` — 0.
- [x] 22.9.2. `npm run typecheck` — 0.
- [x] 22.9.3. `npm test` — не меньше 276 тестов (факт фиксируется).
- [x] 22.9.4. `npm run test:coverage` — не ниже 97.36 / 88.79, пороги 80/60 не понижены.
- [x] 22.9.5. `npm run build` — `dist/`: JS + `.map`, CSS ~7 КБ, три mp3.
- [x] 22.9.6. `npm run lint` — 0 ошибок, 0 предупреждений.
- [x] 22.9.7. `npm run format:check` — «All matched files use Prettier code style».
- [x] 22.9.8. `npm run smoke` — 10/10 HTTP.
- [x] 22.9.9. `npm run smoke:browser` — 11/11 (11 браузерных сценариев).
- [x] 22.9.10. Бюджет: `wc -l` по `src/**/*.ts(x)`, `test/**/*.test.ts(x)` (≤ 200), `scripts/*.mjs` (≤ 250), `css/**/*.css` (≤ 200).
- [x] 22.9.11. `git ls-files .idea | wc -l` = 0.
- [x] 22.9.12. `grep -RIn "confirm(\|alert(\|prompt(" src` — пусто; `grep -RIn "from '../app" src/data` — пусто; `grep -RIn "SessionState" src` — пусто.
- [x] 22.9.13. `grep -RIn ">= 100\|>= 70\|>= 40" src/core/game-rules.ts` — пусто; `grep -RIn "retry" src/core src/data src/hooks src/App.tsx` — пусто.
- [x] 22.9.14. `grep -RIn "console\.log" src` — пусто; `grep -RIn "|| true" .github/workflows/ci.yml` — пусто.
- [x] 22.9.15. Фактические числа (тесты, сьюты, покрытие, размеры файлов, проверки `dist`) записаны в отчёт и сверены с PLAN 1.10.1.

**Критерий:** порядок обязателен (`coverage` после тестов, `smoke` после `build`); все команды — код 0.

---

## 🗺️ Покрытие требований

| Требование | Задачи |
|---|---|
| TR-81 стартовая ошибка хранилища | 22.1.1–22.1.8 |
| TR-82 слой `data` без `app` | 22.1.1–22.1.2, 22.1.9 |
| TR-83 кастомное подтверждение выхода | 22.2.1–22.2.9 |
| TR-84 миграция и лог | 22.3.1–22.3.8 |
| TR-85 единый путь возврата на карту | 22.4.1–22.4.5 |
| TR-86 провал записи позиции | 22.5.1–22.5.5 |
| TR-87 документы, мёртвый код, CI | 22.6.1–22.6.8, 22.8.1–22.8.5 |
| TR-88 критерий проверок | 22.7.1–22.7.4, 22.9.1–22.9.15 |

---

## 🔜 Backlog после 1.10.1

- Гонка одновременного открытия двух вкладок (обе успели записать метку до `hello`) — tie-break не введён, ограничение описано в README/GIGACODE.
- Разблокировка уже открытой второй вкладки после закрытия владельца (сейчас гарантируется запуск только следующей вкладки).
- Type-aware ESLint (`recommendedTypeChecked`) — отдельная версия, с замером времени прогона.
- E2E на Playwright: 7 сценариев из `test/README.md`; только при согласии владельца на зависимость.
- `smoke:browser` в CI с установкой Chromium — после стабилизации сценария второй вкладки.
- Автоматизация бюджета строк отдельным скриптом (`scripts/check-lines.mjs`) вместо bash-цикла в CI.
- Вынести TTL/heartbeat блокировки сессии в константы модуля `useSessionLock` (значения `CONFIG` не трогаются).
