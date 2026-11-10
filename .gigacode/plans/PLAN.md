# План — MathLingo

**Версия:** 1.10.1
**Статус:** Этап 22 «Закрытие замечаний аудита 1.10.0» (SPEC 1.10.1) — **выполнено** (ветка `feature/1.10`, база `0fa9aa0`); факт — 303 теста в 33 сьютах, coverage 97.57 / 89.19, `smoke` 10/10, `smoke:browser` 11/11, `version` 1.10.1
**Базовая линия 1.10.1 (ветка `feature/1.10`, HEAD `0fa9aa0`):** `npm test` перемерен при планировании — **276 тестов в 29 сьютах**; `typecheck`/`lint`/`format:check` — **0**; по аудиту 1.10.0 — coverage **97.36 / 88.79**, `build` **247.51 КБ** JS + **7.04 КБ** CSS + три mp3, `smoke` **10/10**, `smoke:browser` **11/11**; бюджеты (`wc -l`, перемерены): `src` **200** (`useMap.ts`), `test` **199** (`stats-service.test.ts`), `scripts` **247** (`verify-dist.mjs`), `css` **64**; `.idea/` — **0** файлов в индексе; `version` — **1.10.0**
**Создан на основе:** RULES 1.10.1 (`rules_v1_10_1.md`: A86–A91, T79–T85, Z44–Z48) и SPEC 1.10.1 (`spec_v1_10_1.md`: TR-81…TR-88)
**Предыдущая версия плана:** 1.10.0 (`plans/PLAN_v1_10_0.md` — архив, снимок HEAD `0fa9aa0`)
**Тип изменения:** **patch по аудиту**, не новая функциональность. Меняется только то, что расходилось с уже действующими правилами: стартовая ошибка хранилища (A79/TR-71), обратная зависимость `data → app` (A53), нативный `confirm` (Z6/Z39), миграция и её лог (A85/TR-77), провал записи позиции (A80/Z7). `CONFIG` (значения), `Stats` v3, ключи `ml_stats`/`ml_session_lock`, карта, звук, значения CSS и тексты существующих подсказок **не меняются**.

---

## ⚠️ Решения, на которых стоит план

| # | Решение | Следствие |
|---|---------|-----------|
| 1 | **Порт `ErrorReporter` в `core`** (`src/core/error-reporting.ts`), `ErrorBus` остаётся адаптером в `app` и реализует порт структурно | `data → core`; обратной зависимости и цикла `app → data → app` нет; `StatsService` принимает `ErrorReporter \| null`, а не тип из `app` (A87/T79) |
| 2 | **Очередь недоставленных сообщений внутри шины:** `subscribe()` сначала синхронно отдаёт очередь в порядке публикации и очищает её, затем регистрирует слушателя | Стартовая ошибка доходит до игрока без перестановки хуков в `App` и без «второго канала»; повторная подписка (в т.ч. `StrictMode`) уже доставленное не повторяет (A86/Z44) |
| 3 | **Дедупликация 1.10.0 сохраняется:** пара `action + userMessage` не публикуется повторно, пока не было успешной записи или смены режима | Новая ошибка с другим текстом показывается всегда; повтор того же текста — только после успешной записи (A79) |
| 4 | **Write-back миграции:** `load()` сохраняет мигрированную запись только если версия исходных данных была меньше `CONFIG.VERSION` | Повторный `load()` v1/v2-записи не мигрирует и не пишет; загрузка актуальной записи не делает ни записи, ни лога (A89/TR-84) |
| 5 | **Лог миграции — колбэк `onStep(from, to)`**, по умолчанию `console.info`; `StatsService` помнит выведенные ступени в `Set<string>` экземпляра | Сигнатура `migrate(data)` остаётся совместимой; при провале write-back ступень не печатается повторно; `console.log` не появляется (A85) |
| 6 | **`MemoryRepository` сериализует данные** (глубокая копия через JSON в `save` и `load`), как `LocalStorageRepository` | Двойник перестаёт маскировать дефекты «того же объекта»; сьют двойника переводится с `toBe` на `toEqual` (T68/T84.4) |
| 7 | **Подтверждение выхода — `ConfirmModal`** (презентационный компонент), состояние подтверждения — локальное `App` (`{ roundScore } \| null`), без стора и без хука-обёртки | `useGame` получает `onExitRequested(roundScore)`, раунд не завершается и статистика не пишется; `confirm()` из `src/**` исчезает (A88/T80) |
| 8 | **Единственный `returnToMap()`** (T82): сначала `reloadMap()`, затем `navigate('map')`; ✕ → `exitGame(); returnToMap()` | Три копии «reload + navigate» сводятся к одной; «На карту», смена карты и ✕ дают одинаковый счёт (A82/T74) |
| 9 | **Позиция меняется только после успешной записи** (A90/T83): целевой индекс вычисляется из `PlayerState`, затем `saveTrainerIndex(target)`, и лишь при `true` состояние игрока фиксируется | Провал записи не «увозит» игрока вперёд; сообщение приходит через шину; после F5 расхождения нет |
| 10 | **Отмена выхода не имеет побочных эффектов:** «Остаться» и клик по оверлею только закрывают модалку | Счёт, позиция и статистика не меняются; повторный ✕ при открытой модалке не открывает вторую (TR-83) |
| 11 | **Звук `click` — на ✕ (в `exit()`) и на кнопках модалки** (обработчики `App`) | Одно нажатие — один звук; поведение звука 1.10.0 сохраняется (T80) |
| 12 | **Архивы 1.10.0 создаются при переходе на 1.10.1:** `PLAN_v1_10_0.md`, `TASKS_v1_10_0.md`; версионированные `PLAN_v1_10_1.md`/`TASKS_v1_10_1.md` **не создаются** | Снимок предыдущей версии сохраняется, дубля текущей нет; решение 17 плана 1.10.0 и T77-«`TASKS_v1_10_0.md` создаётся» больше не действуют (T84.6) |
| 13 | **`SessionState` удаляется** как неиспользуемый тип (A75); `Header.test.tsx` приводится к T52 (жизни проверяет `GameScreen.test.tsx`) | Мёртвого кода нет; буква правил совпадает с кодом (N1/N5) |
| 14 | **Второй сьют к модулю — исключение A91**, фиксируется в `test/README.md`: `App.map-freshness.test.tsx` остаётся, сценарии старта — в `App.startup.test.tsx` | `App.test.tsx` (191 строка) не переполняется; сценарии не дублируются, сьюты ≤ 200 (A60/A91) |
| 15 | **Тесты только добавляются:** не меньше 276; бюджеты 200/250/200 и пороги 80/60 не ослабляются | Новые файлы (`error-bus`, `ConfirmModal`, `App.startup`) укладываются в 200 строк; фикстуры — в `test/support/` (Z42/T85) |
| 16 | **Ветка — текущая `feature/1.10`**, коммиты по шагам; пуш и мерж — по согласованию; `git add -A` запрещён | В дереве незакоммиченные изменения документов (`SPEC.md`, `RULES.md`, `spec_v1_10_1.md`, `rules_v1_10_1.md`) — коммитятся явным списком файлов (Z37) |

---

## 🎯 Цель

Закрыть расхождения аудита 1.10.0, не добавляя возможностей игры:

- ошибка хранилища, возникшая **при старте**, снова доходит до игрока: модалка, применённые `reset`/`memory`/`skip` (TR-81).
- слой `data` перестаёт зависеть от `app`: порт `ErrorReporter` в `core`, циклов слоёв нет (TR-82).
- выход из раунда подтверждается **кастомной модалкой**; `alert`/`confirm`/`prompt` в `src/**` отсутствуют (TR-83).
- миграция сохраняется, лог пишется ровно один раз на ступень, тестовый двойник сериализует данные (TR-84).
- счёт на карте одинаков на всех путях возврата — один `returnToMap()` (TR-85).
- провал записи позиции не двигает игрока на карте (TR-86).
- документы, мёртвый код и CI приведены в соответствие с кодом и правилами (TR-87).
- полный критерий TR-88 зелёный, фактические числа записаны в отчёт (TR-88).

---

## 📉 Исходное состояние (аудит 1.10.0)

| # | Что расходится | Факт (где видно) | Шаг |
|---|---|---|---|
| P1 | Сообщение об ошибке хранилища теряется, если ошибка возникла до подписки `App` на шину | `src/hooks/useMap.ts:53` — чтение в инициализаторе `useState`; `src/App.tsx:53` — подписка в `useEffect`; `src/data/stats-service.ts:148-154` — `_report` подавляет повтор навсегда | 22.1 |
| P2 | `data` импортирует `app`: заголовок и тип шины | `src/data/stats-service.ts:8-9` → `../app/error-bus` (нарушение A53, цикл `app → data → app`) | 22.1 |
| P3 | Выход подтверждается нативным `confirm()` | `src/hooks/useGame.ts:180`; тесты подменяют `confirm` (`useGame.test.tsx:164,174`, `App.map-freshness.test.tsx:32`) | 22.2 |
| P4 | Миграция не сохраняется, лог повторяется на каждом `load()`; тестовый двойник отдаёт тот же объект | `src/core/stats-schema.ts:55-69` (цикл с логом), `src/data/stats-service.ts:45-53` (нет write-back), `test/support/memory-repository.ts:17-24` (`return this._data`) | 22.3 |
| P5 | Результат `saveTrainerIndex` игнорируется: при провале записи игрок «уезжает» вперёд | `src/hooks/useMap.ts:160-164` (`services.stats.saveTrainerIndex(...)` без проверки) | 22.5 |
| D1 | GIGACODE утверждает, что модалку «Игра уже запущена» показывает **уже открытая** вкладка | `GIGACODE.md:363` | 22.6 |
| D2 | `Services` описан без `errors` | `GIGACODE.md:300` | 22.6 |
| D3 | Устаревший список «Вне текущей области» (переписывание тестов на `import`, `allowJs: false`, React-тесты) | `GIGACODE.md:364-367` | 22.6 |
| D4 | «`verify-dist.mjs` — 12 проверок» вместо 11 | `tasks/TASKS_v1_10_0.md:52` (в актуальном `TASKS.md` строка уже исправлена) | 22.6 |
| D5 | У версии 1.10.0 статус «К исполнению» при выполненном PLAN/TASKS | `.gigacode/specs/SPEC.md:132` | 22.6 |
| D6 | T77 требует `TASKS_v1_10_0.md`, план 1.10.0 постановил его не создавать | `rules_v1_10_0.md:225`, `PLAN_v1_10_0.md` (решение 17) | 22.8 |
| D7 | Комментарий smoke обещает «ещё 10 проверок» вместо 11 | `scripts/smoke.mjs:9` | 22.6 |
| N1 | `SessionState` не используется ни в `src/`, ни в `test/` | `src/core/types.ts:42-48` | 22.6 |
| N2 | Три копии пути «reload + navigate» вместо одного обработчика | `src/App.tsx:74-86` (`handleExitToMap`, `handleMapChanged`), `handleBackToMap` | 22.4 |
| N3 | CI-шаг бюджета использует `\|\| true` у grep-проверок | `.github/workflows/ci.yml`, шаг «Бюджет строк и запреты» | 22.6 |
| N4 | Два сьюта на `App.tsx` без правила-исключения | `test/components/App.test.tsx` (191), `test/components/App.map-freshness.test.tsx` (64) | 22.6 |
| N5 | T52 требует от `Header` проверку жизней, которых в компоненте нет | `test/components/Header.test.tsx`, T52 в `rules_v1_10_0.md` | 22.6 |

### Что уже готово и не переделывается

- Бюджет строк (`src`/`test` ≤ 200, `scripts` ≤ 250, `css` ≤ 200), 276 тестов в 29 сьютах, пороги покрытия 80/60.
- `CONFIG`: 10 вопросов, 3 жизни, `easy`, 10 очков, 3 зоны × 5 тренажёров, карта `math`.
- Карта: шаг 100px, `MOVE_MS = 600` = `transition 600ms`, старт `−1`, правила `play/move/ignore`, `PlayerState`.
- `Stats` v3, ключи `ml_stats` / `ml_session_lock`, миграции `1 → 2 → 3`, сессионная блокировка 1.10.0.
- Единственный канал сообщений (`ErrorBus` → `showError` → `ErrorModal`), дедупликация A79, `MemoryFallback`.
- Сборка и ассеты: `build = tsc --noEmit && vite build`, `base: './'`, `sourcemap`, `assetsInlineLimit: 0`, `AUDIO_URLS` на `?url`.
- Архитектура A72–A78 и инструменты T63–T70 — кроме поправок T84 в `rules_v1_10_1.md`.
- CSS модалки и кнопок: `.modal-overlay`, `.modal`, `.btn`, `.btn-primary`, `.btn-secondary` уже есть; `.btn` даёт ширину 100% и `margin-bottom: 12px` — новые правила не нужны.

---

## 🧱 Целевая структура изменений

```
src/core/error-reporting.ts     # NEW: порт ErrorReporter + STORAGE_ERROR_TITLE (T79)
src/core/types.ts               # − SessionState (N1/A75)
src/core/stats-schema.ts        # migrate(data, onStep?) (T81)
src/data/stats-service.ts       # порт вместо app; write-back миграции; Set ступеней в логе
src/app/error-bus.ts            # реализует ErrorReporter; очередь недоставленных сообщений
src/App.tsx                     # returnToMap(); состояние подтверждения; рендер ConfirmModal
src/components/ConfirmModal.tsx # NEW: презентационное подтверждение (T80)
src/hooks/useGame.ts            # onExitRequested(roundScore); без confirm()
src/hooks/useMap.ts             # проверка saveTrainerIndex + write-ahead позиция (≤ 200 строк)
test/support/memory-repository.ts        # сериализация save/load (T84.4)
test/app/error-bus.test.ts               # NEW: доставка очереди, подписка/отписка
test/components/ConfirmModal.test.tsx    # NEW: тексты, кнопки, оверлей
test/components/App.startup.test.tsx     # NEW: стартовая ошибка хранилища (A91)
test/data/memory-repository.test.ts      # toEqual вместо toBe
test/{core,data,hooks,components}/*      # правки под новые контракты
.github/workflows/ci.yml        # grep-проверки без `|| true` (T66/A77)
scripts/smoke.mjs               # комментарий «11 проверок» (D7)
README.md, GIGACODE.md, test/README.md   # структура, A91, версия 1.10.1
.gigacode/**                    # PLAN/TASKS 1.10.1, архивы 1.10.0, SPEC 1.10.0 «Выполнено»
```

---

## 🗺️ Шаги

### 22.1. Порт `ErrorReporter` и буфер шины (TR-81, TR-82)

**Зависимость:** нет
**Файлы:** `src/core/error-reporting.ts` (NEW), `src/data/stats-service.ts`, `src/app/error-bus.ts`, `test/app/error-bus.test.ts` (NEW), `test/components/App.startup.test.tsx` (NEW), `test/data/stats-service.test.ts`, `test/support/stats-fixtures.ts`

- 22.1.1. `src/core/error-reporting.ts` [NEW]: `export interface ErrorReporter { report(title: string, message: string): void }` и `export const STORAGE_ERROR_TITLE = 'Ошибка хранилища'`; файл без рантайм-логики, кроме константы (T79).
- 22.1.2. `StatsService`: поле `_errors: ErrorReporter | null`, `STORAGE_ERROR_TITLE` из `core`; `grep -RIn "from '../app" src/data` — пусто (A53/A87/Z45).
- 22.1.3. `ErrorBus` реализует порт: поле `_pending: Array<[string, string]>`; `report()` без подписчиков кладёт пару в очередь, с подписчиками — доставляет сразу; `subscribe()` сначала синхронно отдаёт очередь в порядке публикации и очищает её, затем регистрирует слушателя (A86/T79).
- 22.1.4. Очередь — поле экземпляра: `window.*`, `globalThis.*`, модульных переменных нет (A78/Z44); два экземпляра шины не делят сообщения.
- 22.1.5. `test/app/error-bus.test.ts` [NEW]: две публикации до подписки → подписчик получает обе по порядку, очередь пуста; вторая подписка ничего не получает; отписка снимает слушателя; `report()` после подписки доставляется сразу; очередь одного экземпляра не видна другому.
- 22.1.6. `test/components/App.startup.test.tsx` [NEW]: реальный `StatsService` на репозитории, бросающем на **первом** `load()`, **без** ручного `errors.report(...)`:
  повреждённая запись (`version` новее `CONFIG.VERSION`) → модалка «Ошибка хранилища» + «Данные повреждены. Счёт сброшен.», счёт 0, карта активна, раунд стартует;
  недоступное хранилище → модалка + «Хранилище недоступно. Игра работает без сохранения.», `save` не бросает, игра идёт.
- 22.1.7. `App.tsx`: порядок не меняется — чтение статистики остаётся в `useMap`, подписка в `useEffect`; доставку обеспечивает очередь. Тест на повторный монтаж (эмуляция `StrictMode`) не показывает модалку дважды.
- 22.1.8. Дедупликация сохранена: тот же `action + userMessage` не публикуется повторно без успешной записи; другой текст — публикуется (тест в `stats-service.test.ts`).
- 22.1.9. Сьюты ≤ 200 строк; `npm test` зелёный; число тестов не уменьшилось.

**Критерий:** тест «ошибка при старте» видит модалку без ручной публикации в шину; `grep -RIn "from '../app" src/data` пуст; `npm test` зелёный.

---

### 22.2. Подтверждение выхода — `ConfirmModal` (TR-83)

**Зависимость:** 22.1 (позиция и сообщения при выходе)
**Файлы:** `src/components/ConfirmModal.tsx` (NEW), `src/hooks/useGame.ts`, `src/App.tsx`, `test/components/ConfirmModal.test.tsx` (NEW), `test/hooks/useGame.test.tsx`, `test/components/App.test.tsx`, `test/components/App.map-freshness.test.tsx`

- 22.2.1. `ConfirmModal` [NEW]: props `{ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }`; разметка `.modal-overlay.open > .modal > h2 + p + .btn.btn-primary + .btn.btn-secondary`; клик по оверлею — `onCancel`, клик по `.modal` не закрывает (как `ErrorModal`, T33); новых CSS-правил и значений не вводится (T80).
- 22.2.2. `UseGameDeps`: `onExitToMap` заменяется на `onExitRequested(roundScore: number)`; `exit()` = `audio.play('click')` + `onExitRequested(model.roundScore)`; раунд не завершается, `onRoundFinished` не вызывается; `confirm` удаляется (A88/Z46).
- 22.2.3. `App`: состояние `const [exitConfirm, setExitConfirm] = useState<{ roundScore: number } | null>(null)`; ✕ → `setExitConfirm(prev => prev ?? { roundScore })` (повторный ✕ — no-op); «Остаться»/оверлей → `null`; «Выйти» → `null`, `exitGame()`, затем тот же путь возврата, что «На карту» (в шаге 22.4 он сводится к `returnToMap()`).
- 22.2.4. Тексты фиксированы: «Выйти из игры?», «Заработано N очков сгорят.», «Выйти», «Остаться»; `N` — `roundScore` из модели; звук `click` на кнопках модалки играют обработчики `App` (решение 11).
- 22.2.5. `test/components/ConfirmModal.test.tsx` [NEW]: тексты и кнопки, `onConfirm`, `onCancel` по кнопке и по оверлею, клик внутри `.modal` не закрывает.
- 22.2.6. `useGame.test.tsx`: оба «exit»-теста переписываются без `vi.spyOn(window, 'confirm')` — `exit()` вызывает `onExitRequested(roundScore)` один раз, играет `click`, раунд не завершается.
- 22.2.7. `App.test.tsx`: выход из раунда через модалку — «Остаться» → экран игры активен, статистика не изменилась; «Выйти» → карта, счёт раунда не записан.
- 22.2.8. `App.map-freshness.test.tsx`: `vi.stubGlobal('confirm', …)` удаляется; путь «победа → Играть снова → ✕ → Выйти» даёт `🏆 100`.
- 22.2.9. `grep -RIn "confirm(\|alert(\|prompt(" src` — пусто; нативные диалоги в тестах не подменяются (Z46).

**Критерий:** модалка выхода покрыта тестами; нативных диалогов в `src/**` нет; `npm test` зелёный.

---

### 22.3. Миграция сохраняется, лог — один раз на ступень (TR-84)

**Зависимость:** нет (пересекается с 22.1 по `load()`)
**Файлы:** `src/core/stats-schema.ts`, `src/data/stats-service.ts`, `test/support/memory-repository.ts`, `test/data/memory-repository.test.ts`, `test/core/stats-schema.test.ts`, `test/data/stats-service.test.ts`

- 22.3.1. `StatsSchema.migrate(data, onStep?: (from: number, to: number) => void)`; `onStep` вызывается на каждую выполненную ступень; по умолчанию `console.info('[StatsSchema] миграция', from, '→', to)`; без `onStep` поведение и сигнатура прежние (T81).
- 22.3.2. `StatsService`: единый приватный `_read()` для `load()` и `_readOrDefaults()` — читает запись, мигрирует с колбэком экземпляра; если версия исходных данных меньше `CONFIG.VERSION` — `repo.save(migrated)` (write-back).
- 22.3.3. Колбэк экземпляра хранит `Set<string>` ступеней (`from→to`) и не печатает ступень повторно, если write-back не удался (A89/Z47).
- 22.3.4. Провал write-back: `handleError` + сообщение через порт, игра продолжается; `load()` возвращает мигрированные данные; ступень в логе не дублируется.
- 22.3.5. Актуальная запись (`version = CONFIG.VERSION`): ни `save`, ни `console.info` (тест спаем).
- 22.3.6. `MemoryRepository`: `save` копирует через `JSON.parse(JSON.stringify(data))`, `load` отдаёт копию; сьют: `toEqual` вместо `toBe`, мутация загруженного объекта не меняет сохранённый (T84.4).
- 22.3.7. Тесты: сериализующий репозиторий + v1 → три `load()` дают ровно две строки лога (1→2, 2→3), после write-back следующий `load()` — ноль; v2 → одна строка; v3 → ноль; прямые тесты `migrate()` остаются зелёными.
- 22.3.8. Проверить тесты, считающие вызовы `repo.save`: write-back добавляет запись только при загрузке устаревшей записи.

**Критерий:** лог ступени — ровно один раз на запись; write-back подтверждён сериализующим двойником; `grep -RIn "console\.log" src` пуст.

---

### 22.4. Единый путь возврата на карту (TR-85)

**Зависимость:** 22.2 (✕ вызывает тот же путь)
**Файлы:** `src/App.tsx`, `test/components/App.test.tsx`, `test/components/App.map-freshness.test.tsx`

- 22.4.1. `returnToMap = useCallback(() => { reloadMap(); navigate('map'); }, [reloadMap, navigate])`; порядок обязателен — чтение статистики до переключения экрана (A82/T82).
- 22.4.2. ✕ → `exitGame(); returnToMap()`; «На карту» → `returnToMap()`; смена карты (`useMapSelection`) → `returnToMap()`; отдельных копий пары «reload + navigate» нет (`handleExitToMap`, `handleMapChanged` удаляются).
- 22.4.3. Тест: победа → результаты → «Играть снова» → ✕ → «Выйти» → `🏆 100`; «На карту» → `🏆 100`; смена карты (English) → счёт последнего раунда виден.
- 22.4.4. `App.tsx` укладывается в 200 строк: удаление двух копий обработчиков компенсирует состояние подтверждения и рендер модалки (сейчас 188).
- 22.4.5. `App.map-freshness` расширяется путём смены карты; регресс 1.9.0/1.10.0 не допускается.

**Критерий:** все пути возврата дают одинаковый счёт; `wc -l src/App.tsx` ≤ 200.

---

### 22.5. Провал записи позиции откатывает отображение (TR-86)

**Зависимость:** 22.1 (сообщение через шину), 22.3 (сериализующий двойник)
**Файлы:** `src/hooks/useMap.ts`, `test/hooks/useMap.test.tsx`, `test/components/App.startup.test.tsx`

- 22.5.1. `gameFinished`: целевой индекс вычисляется без мутации (`isSuccessful ? player.index : player.previous`), затем `const written = services.stats.saveTrainerIndex(target)` (A90/T83).
- 22.5.2. При `true` — фиксация: победа → `player.commitWin()`, провал на новом → `player.revert()`; при `false` — `PlayerState` не меняется, отображаемый индекс остаётся прежним, счёт читается из хранилища.
- 22.5.3. Повторная игра (`isReplay()`) — ранний выход без записи (A28/T23) сохраняется.
- 22.5.4. `useMap.ts` остаётся ≤ 200 строк: правка компенсируется сокращением шапки/комментариев в том же файле; логика движения, модалки и `UseMap` не меняются.
- 22.5.5. Тест: репозиторий бросает `QuotaExceededError` на `save` → индекс в UI прежний, `getTrainerIndex()` не изменился, счёт не «прыгнул», в шине есть сообщение; при успешной записи поведение 1.10.0 (победа закрепляет, провал откатывает).

**Критерий:** провал `saveTrainerIndex` не двигает игрока; `wc -l src/hooks/useMap.ts` ≤ 200; `npm test` зелёный.

---

### 22.6. Документы, мёртвый код и CI (TR-87)

**Зависимость:** 22.1–22.5 (документы описывают итоговый код)
**Файлы:** `src/core/types.ts`, `GIGACODE.md`, `README.md`, `test/README.md`, `test/components/Header.test.tsx`, `scripts/smoke.mjs`, `.github/workflows/ci.yml`, `.gigacode/tasks/TASKS.md`, `.gigacode/specs/SPEC.md`

- 22.6.1. `SessionState` удалён из `src/core/types.ts`; `grep -RIn "SessionState" src` — пусто (N1/A75).
- 22.6.2. GIGACODE: D1 — модалку «Игра уже запущена» видит **претендент**, владелец молчит; D2 — `Services` с `errors`; D3 — актуальный список «Вне текущей области» (вместо переписывания тестов на `import`/`allowJs`/React-тестов — гонка двух вкладок, разблокировка открытой вкладки, новая функциональность, зависимости); структура дополнена `src/core/error-reporting.ts` и `src/components/ConfirmModal.tsx`.
- 22.6.3. D4 закрыт ещё переводом `TASKS.md` на 1.10.1 (в актуальном файле нет «12 проверок»; в архиве `TASKS_v1_10_0.md:52` — история); `SPEC.md`: статус 1.10.0 → «Выполнено» (D5); `scripts/smoke.mjs:9`: комментарий «11 проверок» (D7).
- 22.6.4. CI (N3/T84.3): grep-проверки оформляются как `if grep …; then echo "✗ …"; fail=1; fi`; добавляются `from '../app'` в `src/data`, `SessionState` в `src`, `confirm(`/`alert(`/`prompt(` в `src`; ни одного `|| true` не остаётся.
- 22.6.5. `Header.test.tsx` (N5/T52): проверяются общий счёт `🏆` и кнопка `🌍`; жизни проверяет `GameScreen.test.tsx`; шапка сьюта соответствует T52.
- 22.6.6. `test/README.md`: A91 — почему `App.map-freshness.test.tsx` и `App.startup.test.tsx` отдельные сьюты; структура `test/{core,data,services,components,hooks,app}` (`test/app/error-bus.test.ts` — мирроринг `src/app`); бюджет сьюта 200 строк; число проверок `smoke:browser`.
- 22.6.7. `README.md`/`GIGACODE.md`: число тестов и сьютов, структура с новыми файлами, известное ограничение (гонка двух вкладок), версия 1.10.1.
- 22.6.8. Документы не ссылаются на несуществующие файлы и команды (T69/T77).

**Критерий:** `grep` из TR-88 пуст; документы соответствуют дереву; `npm run lint` и `format:check` зелёные.

---

### 22.7. Бюджет строк и новые сьюты (TR-88)

**Зависимость:** 22.1–22.6
**Файлы:** `src/**/*.ts(x)`, `test/**/*.test.ts(x)`, `test/support/*.ts`, `scripts/*.mjs`, `css/**/*.css`

- 22.7.1. `wc -l`: каждый `src`/`test`-файл ≤ 200, `scripts` ≤ 250, `css` ≤ 200; под наблюдением `App.tsx` (188 → ≤ 200), `useMap.ts` (200), `stats-service.ts` (165), `App.test.tsx` (191).
- 22.7.2. Новые файлы (`error-bus.test.ts`, `ConfirmModal.test.tsx`, `App.startup.test.tsx`, `ConfirmModal.tsx`, `error-reporting.ts`) каждый ≤ 200; общие фикстуры — в `test/support/`.
- 22.7.3. Сьюты не дробятся ради бюджета: при переполнении — фикстуры/хелперы в `test/support/` (A60/A91), сценарии не удаляются (Z42).
- 22.7.4. `npm test` — не меньше 276 тестов; фактическое число фиксируется в отчёте.

**Критерий:** все лимиты соблюдены; число тестов не уменьшилось.

---

### 22.8. Архивы документов и версия 1.10.1 (TR-87)

**Зависимость:** 22.6–22.7
**Файлы:** `.gigacode/plans/**`, `.gigacode/tasks/**`, `.gigacode/specs/SPEC.md`, `.gigacode/rulles/RULES.md`, `package.json`, `package-lock.json`, `README.md`, `GIGACODE.md`

- 22.8.1. Архивы созданы: `plans/PLAN_v1_10_0.md` (снимок HEAD `0fa9aa0`, с пометкой об архиве) и `tasks/TASKS_v1_10_0.md`; версионированные `PLAN_v1_10_1.md`/`TASKS_v1_10_1.md` **не создаются** (T84.6, D6).
- 22.8.2. `TASKS.md` переведён на 1.10.1 (задачи 22.x, покрытие TR-81…TR-88, факт выполнения).
- 22.8.3. `package.json` `version` → `1.10.1`; `package-lock.json` — `npm install --package-lock-only` (дерево не переустанавливается). Только на шаге выпуска, после зелёного TR-88.
- 22.8.4. `SPEC.md`/`RULES.md`: 1.10.1 в индексах и истории, статус 1.10.1 актуален; ссылки только на существующие файлы.
- 22.8.5. Версия в `README.md`/`GIGACODE.md`/`test/README.md` — 1.10.1.

**Критерий:** `node -p "require('./package.json').version"` = `1.10.1`; архивы 1.10.0 на месте; версия совпадает во всех документах.

---

### 22.9. Финальный прогон TR-88

**Зависимость:** 22.1–22.8
**Файлы:** отчёт в коммите/описании PR; `dist/`, `coverage/` не коммитятся

```bash
npm ci
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run lint
npm run format:check
npm run smoke
npm run smoke:browser
```

Дополнительно, с кодом 0:

```bash
wc -l src/**/*.ts src/**/*.tsx test/**/*.test.ts test/**/*.test.tsx   # каждый ≤ 200
wc -l scripts/*.mjs css/**/*.css                                      # 250 / 200
git ls-files .idea | wc -l                                            # 0
grep -RIn "confirm(\|alert(\|prompt(" src                             # пусто
grep -RIn "from '../app" src/data                                     # пусто
grep -RIn "SessionState" src                                          # пусто
grep -RIn ">= 100\|>= 70\|>= 40" src/core/game-rules.ts               # пусто
grep -RIn "retry" src/core src/data src/hooks src/App.tsx             # пусто
grep -RIn "console\.log" src                                          # пусто
grep -RIn "|| true" .github/workflows/ci.yml                          # пусто
```

**Критерий:** порядок обязателен (`coverage` после тестов, `smoke` после `build`); все команды — код 0; фактические числа (тесты, покрытие, размеры файлов, проверки `dist`) записаны в отчёт.

---

## ✅ Проверки и приёмка

| Проверка | Ожидание |
|---|---|
| `npm run typecheck` | 0 ошибок |
| `npm test` | **не меньше 276** тестов (факт 1.10.1 фиксируется) |
| `npm run test:coverage` | не ниже **97.36 / 88.79**; пороги 80/60 не понижены |
| `npm run build` | `dist/`: JS + `.map`, CSS ~7 КБ, три mp3 |
| `npm run lint` | 0 ошибок, 0 предупреждений |
| `npm run format:check` | «All matched files use Prettier code style» |
| `npm run smoke` | 10/10 HTTP |
| `npm run smoke:browser` | 11/11 (11 браузерных сценариев) |
| Бюджет строк | `src`/`test` ≤ 200, `scripts` ≤ 250, `css` ≤ 200 |
| `git ls-files .idea` | пусто |
| `grep` из TR-88 | все семь — пусто |
| Модалка стартовой ошибки | появляется без ручного `report()` (App-тест) |
| Выход из раунда | `ConfirmModal`, `confirm` в `src/**` отсутствует |
| Миграция | write-back; лог — одна строка на ступень |
| Позиция | при провале `saveTrainerIndex` индекс не меняется |
| `version` | 1.10.1 в `package.json` и lock |
| Документы | PLAN/TASKS = 1.10.1, архивы 1.10.0, ссылки рабочие |

---

## ⚠️ Риски и меры

- **`useMap.ts` ровно 200 строк.** Мера: правка 22.5 компенсируется сокращением шапки/комментариев; логика и `UseMap` не меняются; `wc -l` проверяется сразу после шага.
- **`App.tsx` у предела (188 → модалка).** Мера: `returnToMap()` убирает две копии обработчиков; разметка вынесена в `ConfirmModal`; при переполнении сокращаются комментарии, а не функциональность.
- **`App.test.tsx` 191 строка.** Мера: новые сценарии старта — только в `App.startup.test.tsx`, выход — в существующий сьют `App.test.tsx` без роста за 200 (A91).
- **Очередь и `StrictMode`.** Мера: тест на повторный монтаж — модалка одна; очередь очищается после доставки, доставленные сообщения не повторяются.
- **Дедупликация может скрыть повторную ошибку.** Мера: сброс памяти сообщений при успешной записи/смене режима (как в 1.10.0); тест «другое сообщение — показывается».
- **Write-back падает на квоте.** Мера: `handleError` + сообщение через порт, игра продолжается, лог ступени не дублируется; тест на провал write-back.
- **Сериализация `MemoryRepository` ломает тесты на `toBe`.** Мера: `memory-repository.test.ts` на `toEqual`, фикстуры и сьюты `stats-service` проверяются на копии.
- **Смена `onExitToMap` → `onExitRequested` ломает фейковые deps.** Мера: обновить `useGame.test.tsx`, `App.test.tsx`, `App.map-freshness.test.tsx` и `test/support/app-drivers.ts` (клик «Выйти» вместо стаба `confirm`).
- **CI-grep без `|| true` упадёт на упоминании в комментарии.** Мера: слова `confirm`/`alert`/`prompt` в `src/**` не остаются даже в комментариях; проверка `grep` прогоняется до коммита.
- **`version` 1.10.1 только на выпуске.** Мера: шаг 22.8.3 выполняется после зелёного TR-88, чтобы документы и код не разъезжались.

---

## 📌 Инварианты

- `CONFIG` (значения), `Stats` v3, ключи `ml_stats`/`ml_session_lock`, карта, звук, значения CSS и тексты существующих подсказок — без изменений.
- 276 тестов — минимальная планка; сьюты ≤ 200 строк; покрытие не понижается (80/60).
- `dependencies` — две записи; сервисы создаются только в `createServices()`; глобального стора и скрытых глобалов нет.
- `data` импортирует только `core`/`data`; `app` — `core`/`data`/`services`; циклов слоёв нет.
- Единственный канал показа сообщений — `showError` в `App`; второго канала нет.
- Никаких новых рантайм-зависимостей, Playwright/Puppeteer, type-aware ESLint, Prettier для `.md`.
- `dist/` и `coverage/` в git не попадают; `git add -A` не используется.

---

## 📎 Документы версии 1.10.1

| Документ | Состояние | Примечание |
|---|---|---|
| `specs/SPEC.md` | индекс 1.10.1 | 1.10.0 — «Выполнено» (шаг 22.6) |
| `specs/spec_v1_10_1.md` | действующий | TR-81…TR-88 |
| `rulles/RULES.md` | индекс 1.10.1 | дополнение к конституции |
| `rulles/rules_v1_10_1.md` | действующий | A86–A91, T79–T85, Z44–Z48 |
| `plans/PLAN.md` | **этот файл**, 1.10.1 | этап 22 |
| `plans/PLAN_v1_10_0.md` | архив 1.10.0 | снимок HEAD `0fa9aa0` |
| `plans/PLAN_v1_10_1.md` | **не создаётся** | дубль текущего плана запрещён (T77/T84.6) |
| `tasks/TASKS.md` | 1.10.1 | переведён на задачи 22.x |
| `tasks/TASKS_v1_10_0.md` | архив 1.10.0 | снимок HEAD `0fa9aa0` |
| `tasks/TASKS_v1_10_1.md` | **не создаётся** | для текущей версии архив не создаётся (T84.6) |
