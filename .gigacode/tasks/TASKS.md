# TASKS.md — MathLingo

**Версия:** 1.10.0
**Основа:** PLAN.md 1.10.0 (этап 21), SPEC 1.10.0 (`TR-71…TR-80`), RULES 1.10.0 (`A79–A85`, `T71–T78`, `Z39–Z43`)
**Предыдущая версия:** `TASKS_v1_9_0.md` (архив)
**Статус:** задачи 21.1–21.9 **выполнены** (ветка `feature/1.10`). Базовая линия — 1.9.0: `typecheck` 0, `lint` 0, **261/261 в 28 сьютах**
**Архив на месте:** `PLAN.md` уже 1.10.0, `PLAN_v1_9_0.md` и `TASKS_v1_9_0.md` — архивы 1.9.0
**Факт выполнения:** `typecheck` 0, `lint` 0, `format:check` 0; **276 тестов в 29 сьютах**
(включая новый `App.map-freshness`); coverage **97.36 / 88.79**; `smoke` **10/10**;
`smoke:browser` **11/11** — 10 HTTP-проверок + сводная, внутри `verify-dist.mjs` **11**
браузерных сценариев (вторая вкладка печатается отдельной строкой). Бюджет: `src` 200,
`test` 199, `scripts` 247, `css` 64; `version` в `package.json` и lock — **1.10.0**

---

## 📖 Правила

- Задачи — **строго по порядку**; зависимость указана в каждой задаче.
- После задачи — критерий готовности и `npm test` зелёный: **не меньше 261** теста (факт 1.10.0 — 276 в 29 сьютах).
- Бюджет строк проверяется сразу, а не «потом»: `src`/`test` ≤ 200, `scripts` ≤ 250, `css` ≤ 200 (A84, Z42).
- `console.log` в `src/**` запрещён; диагностика — `console.info` / `console.warn` / `console.error` (A85).
- При обрыве — продолжать с **последней** незавершённой задачей.
- `git add -A` не используется; `dist/` и `coverage/` не коммитятся.
- Новые зависимости, Playwright/Puppeteer, type-aware ESLint, Prettier для `.md` — не добавляются (Z43).

---

## 📂 Структура (1.10.0)

```
package.json                      # version 1.10.0; скрипты не меняются
.gigacode/plans/PLAN.md           # 1.10.0 — текущий план
.gigacode/plans/PLAN_v1_9_0.md    # архив 1.9.0
.gigacode/tasks/TASKS.md          # этот файл, 1.10.0
.gigacode/tasks/TASKS_v1_9_0.md   # архив 1.9.0
src/app/error-bus.ts              # NEW: шина игровых сообщений (subscribe/report)
src/app/types.ts                  # + errors: ErrorBus
src/app/createServices.ts         # шина + фабрика резервного репозитория
src/data/memory-fallback.ts       # NEW: декоратор Repository «память вместо диска»
src/data/stats-service.ts         # действия применены, boolean, дедуп сообщений
src/hooks/useResults.ts           # запись до onRoundFinished; earnings по результату
src/hooks/useSessionLock.ts       # hello/busy + heartbeat; возвращает { blocked }
src/hooks/useMap.ts               # ≤ 200 строк (только шапка/комментарии/дубли)
src/App.tsx                       # подписка на шину; ✕ = reload + map; guard на blocked
src/core/game-rules.ts            # пороги из CONFIG.RATINGS[].min
src/core/stats-schema.ts          # console.info на ступень миграции
test/support/*-fixtures.ts        # NEW: фикстуры/хелперы для бюджета сьютов
scripts/verify-dist.mjs           # + сценарий второй вкладки (12 проверок)
.github/workflows/ci.yml          # + format:check, coverage, бюджет строк
```

---

## 🧩 Задачи

### 21.1. Ошибки хранилища доходят до игрока

**Требования:** TR-71, TR-78 · **Зависимость:** нет
**Файлы:** `src/app/error-bus.ts` (NEW), `src/app/types.ts`, `src/app/createServices.ts`, `src/data/memory-fallback.ts` (NEW), `src/data/stats-service.ts`, `src/App.tsx`, `test/data/stats-service.test.ts`, `test/components/App.test.tsx`

- [x] 21.1.1. `src/app/error-bus.ts` [NEW]: класс `ErrorBus` с `subscribe(listener: (title, message) => void): () => void` и `report(title, message)`; состояние — только в экземпляре, без `window.*`/модульных переменных (A78).
- [x] 21.1.2. `Services` получает `errors: ErrorBus`; `createServices()` создаёт шину и передаёт её в `StatsService` вместе с фабрикой резервного репозитория.
- [x] 21.1.3. `src/data/memory-fallback.ts` [NEW]: декоратор `Repository`, хранящий копию данных в памяти; после переключения основной репозиторий не вызывается ни на чтение, ни на запись; сигнатура `Repository` не меняется (T72).
- [x] 21.1.4. `StatsService`: результат `handleError()` передаётся в приватный `_apply(info)` — `reset` → `repo.clear()` + `StatsSchema.defaults()`, `memory` → подмена на `MemoryFallback`, `skip` → запись не выполняется.
- [x] 21.1.5. `_report(info)` публикует `userMessage` в шину с заголовком «Ошибка хранилища»; повторная пара `action + userMessage` не публикуется, пока не было успешной записи или смены режима (A79).
- [x] 21.1.6. `App.tsx`: `useEffect` подписки на `services.errors` → `showError`; модалка — существующий `ErrorModal`; `alert()`/`confirm()` отсутствуют (Z39).
- [x] 21.1.7. Тест «повреждённые данные»: `CorruptedDataError` → сообщение в шине, `repo.clear()` вызван, `load()` = defaults, счёт 0.
- [x] 21.1.8. Тест «недоступное хранилище»: `StorageUnavailableError` → режим памяти: `save` не бросает, следующий `load()` читает память, счётчик вызовов основного репозитория не растёт.
- [x] 21.1.9. Тест «skip» (`QuotaExceededError` на `save`): запись отсутствует, `save` вернул `false`, сообщение опубликовано.
- [x] 21.1.10. TR-78: подтвердить `action: 'reset' | 'skip' | 'memory'`; `grep -RIn "retry" src` — пусто; каждое из трёх действий покрыто тестом «применено».
- [x] 21.1.11. Правленые сьюты ≤ 200 строк; `npm test` — зелёный (276 тестов в 29 сьютах).

**Критерий:** тест видит и сообщение в шине, и применённое действие; `load()` после сброса даёт defaults; `npm test` зелёный.

---

### 21.2. Провал сохранения не зачитывает очки

**Требования:** TR-72 · **Зависимость:** 21.1
**Файлы:** `src/data/stats-service.ts`, `src/hooks/useResults.ts`, `test/data/stats-service.test.ts`, `test/hooks/useResults.test.tsx`, фейковые `Services` в тестах

- [x] 21.2.1. `save`, `updateAfterRound`, `saveTrainerIndex`, `switchMap`, `reset` возвращают `boolean` (true — запись на диск прошла); `updateAfterRound` при провале возвращает `false` и не меняет состояние в памяти (write-ahead, A12).
- [x] 21.2.2. `useResults.show`: `const written = isSuccessful && services.stats.updateAfterRound(roundScore)`; `✓` только при `written`, иначе `Заработано: N (не зачтено)`.
- [x] 21.2.3. Звук раунда не зависит от записи: победа — `win`, провал — `lose` (решение 7 плана).
- [x] 21.2.4. Фейковый `Services` в тестах возвращает `true` из записывающих методов; обновлены `useResults`, `useMap`, `App`-сьюты.
- [x] 21.2.5. Тест: репозиторий бросает `QuotaExceededError` на `save` → `updateAfterRound` = false, `getTotalScore()` = 0, `earnings` содержит `(не зачтено)`, в шине есть сообщение.
- [x] 21.2.6. Тест: успешная запись → true, `✓`, счёт 80; повторный раунд суммирует, а не перезаписывает.

**Критерий:** тест на провал записи подтверждает неизменный счёт, пометку и сообщение; `npm test` зелёный.

---

### 21.3. Вторая вкладка блокируется сама

**Требования:** TR-73 · **Зависимость:** 21.1
**Файлы:** `src/hooks/useSessionLock.ts`, `src/App.tsx`, `test/hooks/useSessionLock.test.tsx`, `scripts/verify-dist.mjs`, `test/components/App.test.tsx`

- [x] 21.3.1. `useSessionLock(showError): { blocked: boolean }`; канал `BroadcastChannel('mathlingo_session')`, на монтаже — `postMessage({ type: 'hello' })`.
- [x] 21.3.2. Владелец на `hello` отвечает `{ type: 'busy' }` и **не** показывает модалку; претендент на `busy` → `blocked = true` + `showError('Игра уже запущена', 'Закройте другую вкладку с MathLingo.')` (текст не меняется).
- [x] 21.3.3. Heartbeat-метка `ml_session_lock` = `JSON.stringify({ id, ts })`, TTL 2500 мс, обновление каждые 1000 мс; на монтаже свежая чужая метка → `blocked`, иначе запись своей.
- [x] 21.3.4. Старое значение `'1'`/не-JSON считается свободной меткой и перезаписывается (решение 9 плана).
- [x] 21.3.5. Cleanup: `channel.close()`, `clearInterval`, удаление метки только своего `id`; в `StrictMode` двойной монтаж не блокирует сам себя.
- [x] 21.3.6. Fallback без `BroadcastChannel`: занятая метка → модалка, свободная → запись; `catch` — только осознанный no-op с комментарием (Z39).
- [x] 21.3.7. `App`: при `blocked` не стартует раунд — `handleSelectDifficulty` и `handlePlayAgain` повторяют модалку и выходят (A81/Z40).
- [x] 21.3.8. `test/hooks/useSessionLock.test.tsx` переписан: владелец молчит и отвечает `busy`; претендент — модалка один раз и `blocked`; истёкшая/удалённая метка → запуск без модалки; fallback занят/свободен.
- [x] 21.3.9. `scripts/verify-dist.mjs`: второй CDP-target открывает тот же URL; владелец — без `.modal-overlay.open`, претендент — с модалкой и без старта игры; проверка печатается отдельной строкой.
- [x] 21.3.10. `npm run smoke:browser` — **11/11** (10 HTTP + сводная; 11 браузерных сценариев).

**Критерий:** сценарий второй вкладки виден в выводе `smoke:browser`; юнит-тесты хука и `App` зелёные.

---

### 21.4. Актуальный счёт на карте на всех путях

**Требования:** TR-74 · **Зависимость:** 21.2 (порядок записи)
**Файлы:** `src/App.tsx`, `src/hooks/useResults.ts`, `test/hooks/useResults.test.tsx`, `test/components/App.test.tsx`, при нехватке бюджета — `test/components/App.map-freshness.test.tsx` (NEW)

- [x] 21.4.1. ✕ во время игры: `exitGame(); reloadMap(); navigate('map')` — тот же путь, что «На карту» (`handleBackToMap`).
- [x] 21.4.2. `useResults.show`: порядок `updateAfterRound` → `onRoundFinished(isSuccessful)`; `map.gameFinished` читает `getTotalScore()` уже после записи (корень P4).
- [x] 21.4.3. `map.stats` обновляется только из хранилища в `reload()`/`gameFinished`; кэша в модульных переменных нет (A78).
- [x] 21.4.4. Тест `useResults`: после `show(WIN)` `getTotalScore()` = 80; следующая победа даёт 160, а не 80.
- [x] 21.4.5. Тест App: карта `🏆 0` → победа 10/10 → результаты → «Играть снова» → ✕ → в шапке `🏆 100`.
- [x] 21.4.6. Тест App: «На карту» даёт тот же результат (регресс 1.9.0 не допускается).
- [x] 21.4.7. При нехватке 200 строк — **новый** сьют, а не дробление существующего (A60).

**Критерий:** оба пути возврата (✕ и «На карту») показывают `🏆 100`; регресс 1.9.0 зелёный.

---

### 21.5. Пороги оценки — из `CONFIG.RATINGS`

**Требования:** TR-75 · **Зависимость:** нет
**Файлы:** `src/core/game-rules.ts`, `test/core/game-rules.test.ts`

- [x] 21.5.1. `getRating`: `lives <= 0` → `CONFIG.GAMEOVER`; далее перебор `CONFIG.RATINGS` по убыванию `min` (`find(r => accuracy >= r.min) ?? CONFIG.RATINGS[CONFIG.RATINGS.length - 1]`).
- [x] 21.5.2. Литералов `100/70/40` в `src/**` нет; точность округляется один раз, до сравнения.
- [x] 21.5.3. Тест границ сохранён: 100 → 🏆, 70 → 🎉, 40 → 💪, 0 → 📚, `lives = 0` → 💔.
- [x] 21.5.4. Тест: подмена `CONFIG.RATINGS[0].min = 90` меняет оценку для 95%; восстановление в `afterEach` (копия массива на тест).
- [x] 21.5.5. `grep -RIn ">= 100\|>= 70\|>= 40" src` — пусто.

**Критерий:** правка порога в `CONFIG` меняет оценку без правок кода; `grep` пуст; `npm test` зелёный.

---

### 21.6. Бюджет строк

**Требования:** TR-76 · **Зависимость:** 21.1–21.5 (сьюты правятся вместе с кодом)
**Файлы:** `src/hooks/useMap.ts`, `test/core/generator.test.ts`, `test/core/session-model.test.ts`, `test/data/stats-service.test.ts`, `test/components/App.test.tsx`, `test/support/stats-fixtures.ts` (NEW), `test/support/generator-fixtures.ts` (NEW)

- [x] 21.6.1. `useMap.ts` 209 → ≤ 200: шапка, комментарии, дубли `useCallback`-обвязки; логика, `UseMap` и тесты карты не меняются.
- [x] 21.6.2. `test/support/stats-fixtures.ts` [NEW]: `defaults()`, `withEnglish()`, `emptyMap`, фабрика сервиса; `stats-service.test.ts` 317 → ≤ 200 при сохранении всех **26** сценариев.
- [x] 21.6.3. `test/support/generator-fixtures.ts` [NEW] + `test.each`; `generator.test.ts` 281 → ≤ 200, сценарии 1:1.
- [x] 21.6.4. `session-model.test.ts` 213 → ≤ 200 и `App.test.tsx` 203 → ≤ 200 — те же приёмы, без удаления тестов.
- [x] 21.6.5. `wc -l scripts/*.mjs` — каждый ≤ 250 (сейчас 225/134/130); `wc -l css/**/*.css` — каждый ≤ 200.
- [x] 21.6.6. `npm test`: **276 тестов в 29 сьютах** (не меньше 261); новые сценарии только добавлены (Z42).

**Критерий:** `wc -l` по всем областям в лимитах; число тестов не уменьшилось.

---

### 21.7. Диагностика миграций

**Требования:** TR-77 · **Зависимость:** нет
**Файлы:** `src/core/stats-schema.ts`, `test/core/stats-schema.test.ts`

- [x] 21.7.1. В цикле `migrate` каждая выполненная ступень пишет `console.info('[StatsSchema] миграция', version - 1, '→', version)` — один раз за ступень.
- [x] 21.7.2. Загрузка актуальной записи и повторный `load()` ничего не пишут (без миграции — без вывода).
- [x] 21.7.3. Тест: `vi.spyOn(console, 'info')` — запись v1 → два вызова (1→2, 2→3), запись v2 → один, запись v3 → ноль.
- [x] 21.7.4. `grep -RIn "console\.log" src` — пусто; `handleError()` логирует ошибки как раньше.

**Критерий:** спай на `console.info` подтверждает одну запись на ступень; `console.log` в `src` отсутствует.

---

### 21.8. Гигиена репозитория и документов

**Требования:** TR-79 · **Зависимость:** 21.1–21.7
**Файлы:** `.gitignore`, `package.json`, `package-lock.json`, `README.md`, `GIGACODE.md`, `test/README.md`, `.github/workflows/ci.yml`, `.gigacode/**`

- [x] 21.8.1. `git rm -r --cached .idea` (8 файлов); `.gitignore` += `.idea/`, `.npm-cache/`; `git ls-files .idea | wc -l` = 0; история git не переписывается.
- [x] 21.8.2. `version` в `package.json` → `1.10.0`; `package-lock.json` обновлён через `npm install --package-lock-only` (дерево не переустанавливается).
- [x] 21.8.3. Архивы 1.9.0 на месте: `PLAN_v1_9_0.md`, `TASKS_v1_9_0.md`; текущие `PLAN.md`/`TASKS.md` = 1.10.0 (выполнено при выпуске документов 1.10.0).
- [x] 21.8.4. Версионные дубли не создаются: `PLAN_v1_10_0.md` и `TASKS_v1_10_0.md` отсутствуют; ссылок на них нет.
- [x] 21.8.5. README: 11 браузерных проверок (`smoke:browser` 11/11), структура без `.idea/` и с `src/app/error-bus.ts` + `src/data/memory-fallback.ts`, раздел «Бюджет строк», диагностика `console.info`, версия 1.10.0, 29 сьютов / 276 тестов.
- [x] 21.8.6. GIGACODE: то же + раздел «Диагностика и бюджет строк», история 1.10.0, актуальные команды.
- [x] 21.8.7. `test/README.md`: бюджет сьюта 200 строк (теперь проверяется), `test/support/*-fixtures.ts`, число проверок `smoke:browser`.
- [x] 21.8.8. CI: `format:check`, `test:coverage` и шаг «Бюджет строк» (bash-цикл `wc -l` + три `grep` из TR-80); без новых зависимостей; `smoke:browser` остаётся локальным.
- [x] 21.8.9. `SPEC.md`/`RULES.md`: индексы и история 1.10.0 полны, битых ссылок на несуществующие файлы и команды нет.

**Критерий:** `git ls-files .idea` пуст; `.gitignore` содержит оба пути; `version` 1.10.0; документы соответствуют фактическому дереву.

---

### 21.9. Финальный критерий TR-80

**Требования:** TR-80 · **Зависимость:** 21.1–21.8

- [x] 21.9.1. `npm ci` — 0.
- [x] 21.9.2. `npm run typecheck` — 0.
- [x] 21.9.3. `npm test` — 276 тестов в 29 сьютах (не меньше 261).
- [x] 21.9.4. `npm run test:coverage` — не ниже 96.83 / 88.74, пороги 80/60 не понижены.
- [x] 21.9.5. `npm run build` — `dist/`: JS + `.map`, CSS ~7 КБ, три mp3.
- [x] 21.9.6. `npm run lint` — 0 ошибок, 0 предупреждений.
- [x] 21.9.7. `npm run format:check` — «All matched files use Prettier code style».
- [x] 21.9.8. `npm run smoke` — 10/10 HTTP.
- [x] 21.9.9. `npm run smoke:browser` — 11/11 (11 браузерных сценариев), включая вторую вкладку.
- [x] 21.9.10. Бюджет: `wc -l` по `src/**/*.ts(x)`, `test/**/*.test.ts(x)` (≤ 200), `scripts/*.mjs` (≤ 250), `css/**/*.css` (≤ 200).
- [x] 21.9.11. Гейты: `git ls-files .idea | wc -l` = 0; `grep` литералов порогов, `retry`, `console.log` — пусто.
- [x] 21.9.12. Фактические числа (тесты, покрытие, размеры файлов, проверки dist) записаны в отчёт коммита/PR и сверены с PLAN 1.10.0.

**Критерий:** порядок обязателен (`coverage` после тестов, `smoke` после `build`); все команды — код 0.

---

## 🗺️ Покрытие требований

| Требование | Задачи |
|---|---|
| TR-71 сообщения об ошибках хранилища | 21.1.1–21.1.9 |
| TR-72 провал сохранения | 21.2.1–21.2.6 |
| TR-73 блокировка второй вкладки | 21.3.1–21.3.10 |
| TR-74 свежесть счёта на карте | 21.4.1–21.4.7 |
| TR-75 пороги из `CONFIG.RATINGS` | 21.5.1–21.5.5 |
| TR-76 бюджет строк | 21.6.1–21.6.6, 21.9.10 |
| TR-77 диагностика миграций | 21.7.1–21.7.4 |
| TR-78 контракт `ErrorInfo` | 21.1.4–21.1.6, 21.1.10 |
| TR-79 гигиена и документы | 21.8.1–21.8.9 |
| TR-80 критерий проверок | 21.9.1–21.9.12 |

---

## 🔜 Backlog после 1.10.0

- Type-aware ESLint (`recommendedTypeChecked`) — отдельная версия, с замером времени прогона.
- E2E на Playwright: 7 сценариев из `test/README.md`; только при согласии владельца на зависимость.
- `smoke:browser` в CI с установкой Chromium — после стабилизации сценария второй вкладки.
- Автоматизация бюджета строк отдельным скриптом (`scripts/check-lines.mjs`) вместо bash-цикла в CI.
- Вынести TTL/heartbeat блокировки сессии в константы модуля `useSessionLock` (значения `CONFIG` не трогаются).
