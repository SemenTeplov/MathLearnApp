# TASKS.md — MathLingo

**Версия:** 1.8.2  
**Основа:** PLAN.md 1.8.2, SPEC.md 1.8.2, RULES.md 1.8.2

---

## 📖 Правила

- Задачи — **строго по порядку**
- Перед задачей — проверить **зависимости**
- После задачи — проверить **критерий готовности** (одна строка)
- При обрыве — продолжать с **последней** незавершённой

**Статус:** этапы 0–7 ✅ (1.2.0), **этап 8** ✅ (1.3.0), **этап 9** ✅ (1.3.1), **этап 10 «Игрок на карте»** ✅ (1.4.0), **этап 11 «Модалка при приходе, откат и повторная игра»** ✅ (1.4.1), **этап 12 «Глобальная карта и `Stats` v3»** ✅ (1.5.0), **этап 13 «TypeScript без React»** ✅ (1.6.0), **этап 14 «React-пилот»** ✅ (1.7.0), **этап 15 «Миграция экранов на React»** ✅ (1.8.0), **этап 16 «Статистика раунда»** ✅ (1.8.1), **этап 17 «ES-модули»** — ✅ выполнено (1.8.2).

> ℹ️ Итог 1.8.0: 10 компонентов и 6 хуков в `src/`, `js/view/**` и `js/controller/**` удалены, `js/script.js` удалён (вход — `main.tsx` + `src/bootstrap.ts`); `npx tsc --noEmit` — **0**, `npm test` — **141/141** в 11 сьютах (решение №8), CSS (21 файл) — **0 правок** (`md5sum`).
> 🎯 Сквозной прогон 1.8.0 в headless Chromium: 31/31 проверок основного сценария + 7/7 (смена карты, узкий экран) — карта, движение 600 мс, модалки, игра, победа/провал, результаты, перезагрузка, вторая вкладка; консоль без ошибок.
> 🧭 1.8.1 (этап 16): счётчики `correct`/`wrong` в `SessionModel`, `total = correct + wrong`, сьют `test/model/session-model.test.js` — 15 тестов; итог **156/156** в 12 сьютах, изменены 2 кодовых файла.
> 🧩 1.8.2 (этап 17): классические скрипты → ES-модули. `js/` (19 файлов) удалён, `index.html` — `#root` + один module-скрипт, код — `src/core` (13)/`data` (4)/`services` (1)/`ui`/`app`; `npx tsc --noEmit` — **0**, `npm run dev` работает, `npx vite build` собирается (53 модуля), `npm test` — **9 сьютов / 113 тестов красные** (ENOENT на `./js/…`), **43/156 зелёных в 3 сьютах**; `test/**` не менялся (этап 3). Smoke: **15/15** проверок в headless Chromium.

**Покрытие US/FR — см. карту в конце.**

---

## 📂 Структура

```
main.tsx                              # [NEW 1.7.0] точка входа React (createRoot)
src/
  App.tsx                             # [NEW 1.7.0] state ошибки + window.showErrorModal
  components/ErrorModal.tsx           # [NEW 1.7.0] модалка на CSS-классах .modal-overlay/.modal
js/
  model/ types.ts, config.ts, map-catalog.js, stats-schema.js, session-model.ts, game-model.ts
  storage/ repository.ts, local-repository.ts, memory-repository.ts, session-repository.ts
  service/ stats-service.ts, session-service.ts, audio-service.js
  logic/ generator.ts, scoring.ts, game-rules.ts, player-rules.js, player-state.js
  view/ dom.js, error-view.js, screen-view.js, map-layout.js, map-player-view.js, map-view.js, global-map-view.js, game-view.js, results-view.js
  controller/ session-controller.js, map-controller.js, global-map-controller.js, app-controller.js, game-controller.js, results-controller.js
  errors/ custom-errors.ts, error-handler.ts
  script.js                           # [ИЗМ 1.7.0] IIFE инициализации + мост ErrorView
css/ map.css, map_items/ (map-screen, map-zone, map-road, map-trainer, map-player, map-modal, map-global), game_items/, result_items/, screen_items/
audio/ click.mp3, win.mp3, lose.mp3
```

**Порядок подключения скриптов:** Errors → Audio → Model → Storage → Service → Logic → View → Controller → (закомментированный `script.js`) → `#root` + `<script type="module" src="/main.tsx">`.

**Новое в 1.6.0:** `js/model/types.ts` (только типы, в `index.html` **не** подключается), `test/ts-source.js` (transpile `.ts` для `eval`).
**Новое в 1.7.0:** `main.tsx`, `src/App.tsx`, `src/components/ErrorModal.tsx`, глобальная функция `window.showErrorModal(title, message)`.
**Изменяется в 1.7.0:** `index.html` (`#root` + module `main.tsx`, `script.js` закомментирован), `js/script.js` (+мост `ErrorView`, ≤ 10 строк), `js/model/types.ts` (+`interface Window`), `tsconfig.json` (`include: ["js", "src", "*.tsx"]`), `package.json` (`@types/react`, `@types/react-dom`).
**Удаляется в 1.7.0:** — (старый вход сохранён закомментированным, `#errorOverlay` остаётся fallback до Этапа 5).
**Не меняется в 1.7.0:** 9 View, 6 Controller, 21 CSS-файл, 5 `.js`-слоёв (`map-catalog`, `stats-schema`, `player-rules`, `player-state`, `audio-service`), Storage, игровая логика, звук, 182 теста.
**Переименовывается в 1.6.0 (`.js` → `.ts`):** `model/config`, `model/session-model`, `model/game-model`, `logic/generator`, `logic/scoring`, `logic/game-rules`, `storage/*` (4), `service/stats-service`, `service/session-service`, `errors/*` (2).
**Остаётся `.js` в 1.6.0:** `model/map-catalog.js`, `model/stats-schema.js`, `logic/player-rules.js`, `logic/player-state.js`, `service/audio-service.js`, весь `view/`, весь `controller/`, `script.js`.
**Инструменты:** `tsconfig.json` (`include: ["js", "src", "*.tsx"]`), `package.json` (`typecheck`, `@types/react`, `@types/react-dom`), `vitest.config.ts` (`setupFiles`).

### Структура после 1.8.0 (выполнено)

```
main.tsx                              # [ИЗМ] bootstrap() + createRoot, без import './js/script.js'
src/
  App.tsx                             # [ИЗМ] каркас, состояние, порталы, модалки
  bootstrap.ts                        # [NEW] init слоёв — замена IIFE из script.js
  config.ts                           # [NEW] export const config: Config = CONFIG
  types.ts                            # [ПЕРЕЕЗД] из js/model/types.ts + view-типы + MlBridge (временный)
  components/
    ResultsScreen.tsx MapSelectionModal.tsx GameScreen.tsx MapScreen.tsx   # [NEW] TR-15…TR-18
    Zone.tsx Trainer.tsx Player.tsx Path.tsx                              # [NEW] TR-18, T40
    Header.tsx                                                            # [NEW] TR-19
    ErrorModal.tsx                                                        # [без изм.]
  hooks/
    useResults.ts useGame.ts useMap.ts useMapSelection.ts useSessionLock.ts useAudio.ts  # [NEW]
js/                                   # только слои: 19 файлов (13 .ts + 6 .js)
  model/    config.ts session-model.ts map-catalog.js stats-schema.js     # [game-model.ts УДАЛЁН]
  storage/  repository.ts local-repository.ts memory-repository.ts session-repository.ts
  service/  stats-service.ts session-service.ts audio-service.js
  logic/    generator.ts scoring.ts game-rules.ts player-rules.js player-state.js map-layout.js  # [map-layout переехал]
  errors/   custom-errors.ts error-handler.ts
  view/ — УДАЛЁН · controller/ — УДАЛЁН · script.js — УДАЛЁН
css/** (21 файл)                      # [без изм.]
test/** (11 сьютов, 141 тест)          # [ИЗМ] −3 UI-сьюта (41 тест), путь map-layout
```

**Порядок подключения после 1.8.0:** 19 classic-тегов слоёв (Errors → Audio → Model → Storage → Service → Logic) + `<script type="module" src="/main.tsx">`; `#root` с `style="display: contents"` — `.app` остаётся прямым flex-элементом `body`.

**Дельта 1.8.1 (этап 16):** новых файлов структуры нет — `js/model/session-model.ts` получает поля `_correct`/`_wrong` и инкременты в `recordCorrect`/`recordIncorrect`; добавляется один сьют `test/model/session-model.test.js` (15 тестов, 12-й сьют). `src/`, `css/`, `index.html` не меняются.

### Структура после 1.8.2 (план)

```
index.html                            # [ИЗМ] #root + один <script type="module" src="/src/main.tsx">
tsconfig.json                         # [ИЗМ] Bundler, verbatimModuleSyntax, types: ["vite/client"], allowJs: true
src/
  main.tsx                            # [NEW] CSS-импорты → createServices → preload → handlers → render
  App.tsx                             # [ИЗМ] App({ services }), импорты типов
  app/ createServices.ts types.ts     # [NEW] composition root и Services
  core/ config.ts types.ts errors.ts error-handler.ts session-model.ts map-catalog.ts
        stats-schema.ts game-rules.ts generator.ts scoring.ts player-rules.ts
        player-state.ts map-layout.ts # [NEW] домен, 13 модулей
  data/ repository.ts local-repository.ts memory-repository.ts stats-service.ts # [NEW]
  services/ audio-service.ts          # [NEW] класс AudioService, AudioKind
  ui/ types.ts                        # [NEW] view-модели
  components/ (10)                    # [ИЗМ] import type; GameScreen — CONFIG
  hooks/ (5)                          # [ИЗМ] services первым аргументом; useAudio удалён
  bootstrap.ts config.ts types.ts     # [УДАЛ]
main.tsx (корень)                     # [УДАЛ] переехал в src/main.tsx
js/ (19)                              # [УДАЛ] целиком
css/ (21) audio/ (3) test/ (12)       # [без изм.] (test — красный до этапа 3)
```

**Порядок подключения после 1.8.2:** один `<script type="module" src="/src/main.tsx">`; CSS — импортами из `src/main.tsx` в прежнем порядке (`base`, `buttons`, `screens`, `game`, `results`, `map`); `#root` с `style="display: contents"`.

---

## Этап 0. Подготовка — ✅ выполнено (1.2.0)

**0.1.** Создать папки: `model/ storage/ service/ logic/ view/ controller/ errors/`.  
**Критерий:** 7 папок, пусты. **Зависимости:** —.

**0.2.** Backup старых `js/*.js` в `_backup/`.  
**Критерий:** backup есть. **Зависимости:** —.

**0.3.** Создать `model/types.js` — JSDoc `@typedef` для DTO: `Problem`, `GameResult`, `Stats`, `SessionState`, `ErrorInfo`.  
**Критерий:** 5 типов, JSDoc корректен. **Зависимости:** 0.1.

---

## Этап 1. Model + Errors — ✅ выполнено (1.2.0)

**1.1.** `errors/custom-errors.js` — классы: `StorageError`, `CorruptedDataError`, `StorageUnavailableError`, `QuotaExceededError`, `SessionError`. Все наследуют `Error`, имеют поле `name`.  
**Критерий:** `instanceof` работает. **Зависимости:** 0.1.

**1.2.** `errors/error-handler.js` — объект `ErrorHandler`: `handle(error, context)` → `{ action, userMessage }`, `init()` — глобальные обработчики. Классификация: `CorruptedDataError` → reset, `QuotaExceededError` → skip, `StorageUnavailableError` → memory, `SessionError` → reset, другие → throw.  
**Критерий:** `handle` возвращает корректные `action` / `userMessage`. **Зависимости:** 1.1.

**1.3.** `model/config.js` — перенести `CONFIG`. Убрать `POINTS_STREAK_BONUS`. Добавить `VERSION: 1`, `STORAGE_PREFIX: 'ml_'`.  
**Критерий:** серия убрана, VERSION и PREFIX добавлены. **Зависимости:** 0.1.

**1.4.** `model/session-model.js` — класс `SessionModel`: поля `lives`, `roundScore`, `currentQuestionIndex`, `difficulty`, `completed`. Метод `reset()`, геттеры/сеттеры. **Нет** `streak` / `bestStreak`.  
**Критерий:** модель + reset работают. **Зависимости:** 1.3.

**1.5.** `model/game-model.js` — класс `GameModel`: поля `totalScore`, `version`. Методы `reset()`, `toJSON()`, `fromJSON()`, геттеры/сеттеры.  
**Критерий:** toJSON/fromJSON работают. **Зависимости:** 1.3.

**1.6.** Обновить `index.html` — подключить Errors и Model в правильном порядке.  
**Критерий:** консоль без ошибок. **Зависимости:** 1.1–1.5.

**1.7.** Тест Model + Errors: создать `SessionModel` / `GameModel`, проверить `reset`, `toJSON`/`fromJSON`, бросить каждое исключение → проверить `handle`.  
**Критерий:** все сценарии работают. **Зависимости:** 1.6.

**1.8.** Сверить с критериями: файлы созданы, JSDoc есть, ≤ 200 строк, нет `console.log()`, Model изолирован, кастомные исключения используются.  
**Критерий:** все ✅. **Зависимости:** 1.7.

---

## Этап 2. Storage + Service — ✅ выполнено (1.2.0)

**2.1.** `storage/repository.js` — абстрактный класс `Repository`: методы `save`, `load`, `clear`, бросают `Error('Not implemented')`.  
**Критерий:** методы бросают. **Зависимости:** 1.1.

**2.2.** `storage/local-repository.js` — `LocalStorageRepository extends Repository`. Конструктор принимает `key`. `save` → setItem с обработкой `QuotaExceededError` / `StorageUnavailableError`. `load` → getItem + JSON.parse, при `SyntaxError` → `CorruptedDataError`. `clear` → removeItem.  
**Критерий:** все методы + кастомные исключения. **Зависимости:** 2.1.

**2.3.** `storage/memory-repository.js` — `MemoryRepository extends Repository`. Приватное `#data`. Методы работают в памяти.  
**Критерий:** методы работают. **Зависимости:** 2.1.

**2.4.** `storage/session-repository.js` — `SessionRepository extends Repository`. **No-op**: `save` ничего, `load` → `null`, `clear` ничего. Пояснить в JSDoc: состояние раунда не сохраняется.  
**Критерий:** методы-заглушки. **Зависимости:** 2.1.

**2.5.** `service/stats-service.js` — `StatsService`: `init(repo)`, `load()`, `save(stats)` (write-ahead), `updateAfterRound(roundScore)`, `reset()`. Обработка ошибок через `ErrorHandler`. Миграция: `version < VERSION` → пошагово, `version > VERSION` → reset + сообщение, ошибка миграции → reset + сообщение.  
**Критерий:** сервис + миграция + ошибки. **Зависимости:** 2.2, 1.2, 1.5, 1.3.

**2.6.** `service/session-service.js` — `SessionService`: `init(repo)`, `save(session)` (no-op), `load()` → null, `clear()` (no-op).  
**Критерий:** no-op. **Зависимости:** 2.4.

**2.7.** Подключить Storage + Service в `index.html`.  
**Критерий:** консоль без ошибок. **Зависимости:** 2.1–2.6.

---

## Этап 3. Logic — ✅ выполнено (1.2.0)

**3.1.** `logic/generator.js` — перенести `ProblemGenerator` (без изменений).  
**Критерий:** работает как раньше. **Зависимости:** 1.3.

**3.2.** `logic/scoring.js` — `Scoring`: `calculateRoundScore(correct)` → `correct * POINTS_BASE`; `isRoundSuccessful(lives, completed)` → `lives > 0 && completed`.  
**Критерий:** методы возвращают корректные значения. **Зависимости:** 1.3.

**3.3.** `logic/game-rules.js` — `GameRules`: `checkAnswer(question, chosen)`, `shouldEndGame(session)`, `getRating(results)`.  
**Критерий:** методы работают. **Зависимости:** 1.3.

**3.4.** Подключить Logic + тест: сгенерировать вопрос, `calculateRoundScore(7) === 70`, `isRoundSuccessful(2, true) === true`, `getRating({accuracy: 100}) === RATINGS[0]`.  
**Критерий:** тесты пройдены. **Зависимости:** 3.1–3.3.

---

## Этап 4. View — ✅ выполнено (1.2.0)

**4.1.** `view/dom.js` — `$` и `$$`.  
**Критерий:** работает. **Зависимости:** 0.1.

**4.2.** `view/error-view.js` — `ErrorView`: `showMessage({title, message})`, `hide()`. Только отрисовка.  
**Критерий:** модалка работает. **Зависимости:** 4.1.

**4.3.** `view/screen-view.js` — `ScreenView`: `showScreen(name)` (welcome/game/results), `highlightDifficulty(difficulty)`.  
**Критерий:** переключение работает. **Зависимости:** 4.1.

**4.4.** `view/game-view.js` — `GameView`: `renderQuestion`, `renderProgress`, `renderLives`, `renderRoundScore`, `showFloatingScore`, `renderFeedback`, `markAnswer`.  
**Критерий:** методы работают, «+10» через 1.5 сек исчезает. **Зависимости:** 4.1.

**4.5.** `view/results-view.js` — `ResultsView`: `render(results, rating)`, `renderRoundEarnings(score)`.  
**Критерий:** результаты отображаются. **Зависимости:** 4.1.

**4.6.** Обновить `index.html`: разметка (`total-score` в меню, `round-score` вместо `1/10`, `score-badge`, «Заработано: N», модалка) + подключить View.  
**Критерий:** разметка + скрипты. **Зависимости:** 4.1–4.5.

**4.7.** Проверить: View без логики, не меняет Model, все `render*` есть.  
**Критерий:** ✅. **Зависимости:** 4.6.

---

## Этап 5. Controller — ✅ выполнено (1.2.0)

**5.1.** `controller/session-controller.js` — `SessionController`: `init()` через `BroadcastChannel`. Вторая вкладка → сообщение + блокировка.  
**Критерий:** вторая вкладка блокируется. **Зависимости:** 4.1.

**5.2.** `controller/app-controller.js` — `AppController`: `init()` — `SessionController.init`, `ErrorHandler.init`, `StatsService.init(new LocalStorageRepository(PREFIX + 'stats'))`, загрузить Stats, показать в меню, привязать кнопки сложности и «Начать игру». `onStartGame()` — создать `SessionModel`, `roundScore = 0`, перейти на игровой экран, отрисовать вопрос.  
**Критерий:** приложение запускается. **Зависимости:** 5.1, 2.5, 3.4, 4.6.

**5.3.** `controller/game-controller.js` — `GameController`: `init`, `onAnswer(chosen, btn)` — проверить, обновить `roundScore`/`lives`, отрисовать, `showFloatingScore('+10')`; `onNext` — проверить завершение; `onExit` — `confirm()` с суммой, сброс сессии. Сгорание очков при выходе/провале.  
**Критерий:** игра работает, очки сгорают. **Зависимости:** 5.2, 3.3, 4.4.

**5.4.** `controller/results-controller.js` — `ResultsController`: `init`, `show()` — результаты, `isRoundSuccessful`, при успехе `updateAfterRound(roundScore)`, `getRating`, рендер. Кнопки: «Играть снова» → `AppController.onStartGame`, «В меню» → экран welcome.  
**Критерий:** результаты + общий счёт только при успехе. **Зависимости:** 5.3, 2.5, 4.5.

**5.5.** Подключить Controllers + script.js.  
**Критерий:** скрипты подключены. **Зависимости:** 5.1–5.4.

---

## Этап 6. Интеграция — ✅ выполнено (1.2.0)

**6.1.** `script.js` — `DOMContentLoaded` → `AppController.init()`.  
**Критерий:** приложение запускается. **Зависимости:** 5.5.

**6.2.** Удалить старые `js/*.js`.  
**Критерий:** только новые папки + script.js. **Зависимости:** 6.1.

**6.3.** Тест полного цикла: первый запуск, успех, провал, выход, сохранение, вторая вкладка, повреждённые данные, инкогнито.  
**Критерий:** все сценарии без ошибок. **Зависимости:** 6.2.

**6.4.** Финальная проверка критериев из PLAN.md (слои, ≤ 200 строк, JSDoc, write-ahead, version, блокировка, сохранение, сгорание, звук) — в 1.2.0 это критерии 1–23.  
**Критерий:** все ✅. **Зависимости:** 6.3.

---

## 🔊 Этап 7. Звуковое сопровождение — ✅ выполнено (1.2.0)

**7.1.** `js/service/audio-service.js` — класс `AudioService`: приватные `#sounds` (Map) и `#isReady`. Метод `preload()` — для каждого имени (`'click'`, `'win'`, `'lose'`) создаёт `new Audio('audio/' + name + '.mp3')`, сохраняет в `#sounds`, ошибки в `console.warn`, устанавливает `#isReady = true`. Метод `play(name)` — клонирует `audioElement` через `cloneNode()`, вызывает `.play()`, всё в `try/catch`, ошибки в `console.warn`. JSDoc для публичных методов.  
**Критерий:** preload загружает 3 звука, play воспроизводит, ошибки не ломают игру. **Зависимости:** —.

**7.2.** Подключить `audio-service.js` в `index.html` (после Errors, перед Model) + вызвать `AudioService.preload()` после Controllers.  
**Критерий:** скрипт подключён, preload вызван, консоль без ошибок. **Зависимости:** 7.1.

**7.3.** Интегрировать звук в Controllers: `AppController` — `play('click')` на кнопки сложности и «Начать игру»; `GameController` — `play('click')` на кнопки ответов; `ResultsController` — `play('win')` при успехе, `play('lose')` при провале, `play('click')` на кнопки навигации. Все в `try/catch`, ошибки в `console.warn`.  
**Критерий:** клик на любую кнопку → звук, победа/поражение → соответствующие звуки. **Зависимости:** 7.2.

**7.4.** Тест звука: предзагрузка, клик, победа, поражение, отключение звука в браузере, удаление MP3-файлов (игра работает + `console.warn`), Safari autoplay policy.  
**Критерий:** все сценарии пройдены. **Зависимости:** 7.3.

---

## 🗺️ Этап 8. Режим карты (1.3.0) — ✅ выполнено

**Запреты этапа (Z10):** не добавлять меню; не делать зоны кликабельными; не блокировать тренажёры; не показывать прогресс на карте; не передавать тему в генератор; не менять логику игры.

**8.1.** `model/types.js` — добавить `@typedef Zone`: `id`, `title`, `color`, `trainersCount`. Остальные 5 типов не трогать.  
**Критерий:** тип `Zone` описан, существующие DTO без изменений. **Зависимости:** —.

**8.2.** `model/config.js` — добавить `CONFIG.ZONES`: три зоны — `addition` / «Сложение» / зелёный (`#4CAF50`), `subtraction` / «Вычитание» / синий (`#2196F3`), `multiplication` / «Умножение» / оранжевый (`#FF9800`), у каждой `trainersCount: 5`. `VERSION: 1` и `STORAGE_PREFIX` **не менять**; тренажёры отдельно не описывать (A19).  
**Критерий:** 3 зоны со всеми четырьмя полями, схема хранилища прежняя. **Зависимости:** 8.1.

**8.3.** `index.html` — удалить `#welcomeScreen` целиком (логотип, `.difficulty-selector`, `#startBtn`); меню не должно остаться ни в разметке, ни в JS (A18, Z10); кнопке OK модалки ошибок дать `id="errorOkBtn"` и убрать inline `onclick="ErrorView.hide()"`.  
**Критерий:** в `index.html` и `js/**` нет `welcomeScreen` / `startBtn` и inline `onclick`. **Зависимости:** 8.2.

**8.4.** `index.html` — добавить экран карты `#mapScreen` (класс `screen active`) с `#totalScore` сверху по центру и `#mapContainer`; добавить модалку `#difficultyModal` (`#diffModalTitle`, три `.diff-btn` с `data-diff="easy|medium|hard"`, `#cancelDiffBtn`); `#menuBtn` «В меню» → `#mapBtn` **«На карту»** (A18, A21, US-22, US-25, US-26).  
**Критерий:** карта, модалка и кнопка «На карту» присутствуют, меню отсутствует. **Зависимости:** 8.3.

**8.5.** `view/map-view.js` — `MapView.render(zones)`: для каждой зоны `.map-zone[data-zone]` с фоном/акцентом из `zone.color` и подписью `zone.title`; внутри — `.map-path` с `zone.trainersCount` элементами `button.map-trainer[data-zone][data-trainer]` с номерами 1…N. Только DOM, без обработчиков и бизнес-логики (A20, T15, FR-16).  
**Критерий:** 3 зоны × 5 тренажёров, цвета и номера соответствуют `CONFIG.ZONES`. **Зависимости:** 8.2, 4.1.

**8.6.** `view/map-view.js` — `buildPathPoints(count)`: чистая функция координат узлов «змейки» (чередующееся горизонтальное смещение, равный шаг по вертикали); раскладка тренажёров по этим точкам + `svg.map-path-lines` — полилиния через те же точки (T15, US-24).  
**Критерий:** 5 точек, смещение чередуется, линия проходит через все узлы. **Зависимости:** 8.5.

**8.7.** `view/map-view.js` — `renderTotalScore(totalScore)` (US-22), `showDifficultyModal({zoneTitle, trainerNumber})` (подпись `#diffModalTitle`), `hideDifficultyModal()` (A21, US-25). Никаких `addEventListener` в View.  
**Критерий:** счёт выводится, модалка открывается/скрывается только методами View. **Зависимости:** 8.4, 8.5.

**8.8.** `view/screen-view.js` — карта вместо welcome: `showScreen('map' | 'game' | 'results')`, карта в карте экранов (`map: 'mapScreen'`); `highlightDifficulty()` сохранить (нужен кнопкам модалки). `ScreenView` знает о карте как об экране (A18, A20).  
**Критерий:** `showScreen('map')` показывает `#mapScreen`, упоминаний welcome нет. **Зависимости:** 8.4.

**8.9.** `controller/map-controller.js` — `MapController.init()`: делегирование клика на `#mapContainer` для `.map-trainer`, привязка кнопок сложности и `#cancelDiffBtn`; `onTrainerClick(zone, trainerNumber)` → `AudioService.play('click')` + `MapView.showDifficultyModal(...)`. Единственное место, слушающее события карты (A20, US-24, US-25).  
**Критерий:** клик на тренажёр открывает модалку со звуком клика. **Зависимости:** 8.5, 8.7, 7.1.

**8.10.** `controller/map-controller.js` — `onDifficultySelect(difficulty)` → `play('click')`, скрыть модалку, `AppController.onStartGame(difficulty)`; `onCancel()` → `play('click')`, скрыть модалку, игрок остаётся на карте. Сложность **не сохранять**, тему и номер тренажёра в игру не передавать (A21, US-25, US-27, T16, Z10).  
**Критерий:** выбор сложности стартует игру, «Отмена» возвращает на карту, в `localStorage` ничего не добавлено. **Зависимости:** 8.9, 8.11.

**8.11.** `controller/app-controller.js` — `init()`: `SessionController.init`, `ErrorHandler.init`, `StatsService.load()` → `MapView.renderTotalScore`, `MapView.render(CONFIG.ZONES)`, `MapController.init`, `ResultsController.init`, привязка `#exitBtn` (с `AudioService.play('click')`) и `#errorOkBtn` (вместо inline `onclick`), `ScreenView.showScreen('map')`. Привязки меню (`.diff-btn` при загрузке, `#startBtn`) **удалить** (A18).  
**Критерий:** при загрузке открывается карта со счётом; меню и его обработчики отсутствуют; inline-обработчиков в разметке нет; выход сопровождается звуком клика; консоль без ошибок. **Зависимости:** 8.8, 8.9, 5.1, 2.5.

**8.12.** `controller/app-controller.js` — `onStartGame(difficulty)`: сложность из параметра, иначе текущая из `SessionModel`, иначе `CONFIG.START_DIFFICULTY`; далее без изменений (reset, `setDifficulty`, `generator.setDifficulty`, игровой экран, вопрос). `onExit()` → `confirm()` (очки сгорят) → **на карту** + обновление счёта. Логику раунда не менять (T17, Z10).  
**Критерий:** игра стартует с выбранной сложностью; выход из игры возвращает на карту. **Зависимости:** 8.11.

**8.13.** `controller/results-controller.js` — `#mapBtn` («На карту») → `play('click')`, `ScreenView.showScreen('map')`, `MapView.renderTotalScore(StatsService.load().totalScore)`; `#playAgainBtn` → `AppController.onStartGame()` (текущая сложность). Общий счёт по-прежнему начисляется только при успешном раунде (FR-18, US-26).  
**Критерий:** с результата возврат на карту с актуальным счётом. **Зависимости:** 8.11, 5.4.

**8.14.** `index.html` — подключить `js/view/map-view.js` (View, после `screen-view.js`) и `js/controller/map-controller.js` (Controller, после `session-controller.js`), добавить `<link rel="stylesheet" href="css/map.css">`.  
**Критерий:** порядок Errors → Audio → Model → Storage → Service → Logic → View → Controller → script.js сохранён, консоль без ошибок. **Зависимости:** 8.5, 8.9.

**8.15.** `css/map.css` + `css/map_items/map-screen.css`, `map-zone.css`, `map-path.css`, `map-trainer.css`, `map-modal.css` — зоны — блоки разного цвета, тренажёры — по пути, соединения — линии, карта прокручивается вертикально, зоны сверху вниз; стили `.diff-btn` / `.difficulty-options` перенести без переименования классов (T15, US-22, US-23, US-24).  
**Критерий:** карта прокручивается, зоны визуально различаются цветом, тренажёры стоят по пути. **Зависимости:** 8.5, 8.6.

**8.16.** Удалить `css/screen_items/screens-logo.css` и `css/screen_items/screens-difficulty.css`, убрать их `@import` из `css/screens.css`.  
**Критерий:** файлов нет, `screens.css` без «битых» `@import`, стили кнопок сложности сохранены в `map-modal.css`. **Зависимости:** 8.15.

**8.17.** Сверить неизменность игры и генератора: `logic/generator.js`, `logic/scoring.js`, `logic/game-rules.js`, `view/game-view.js`, `controller/game-controller.js` — без изменений; тема/номер зоны и тренажёра нигде не передаются в генератор (T16, T17, Z10).  
**Критерий:** 5 файлов не изменены, генератор остаётся смешанным. **Зависимости:** 8.10, 8.12.

**8.18.** Тесты: `npm test` — 48 базовых тестов проходят (Logic/Service не тронуты) + `test/map/map-view.test.js` (6 тестов: `buildPathPoints` и отрисовка карты).  
**Критерий:** 54/54 зелёные. **Зависимости:** 8.6, 8.17.

**8.19.** Ручной прогон карты: загрузка → карта и счёт; клик по зоне → ничего; клик по тренажёру → модалка; выбор сложности → игра с этой сложностью; «Отмена» → карта; игра → результат → «На карту» + счёт; выход из игры → карта; вторая вкладка блокируется.  
**Критерий:** все сценарии без ошибок. **Зависимости:** 8.18.

**8.20.** Финальная сверка критериев **24–34** из PLAN.md (карта — главный экран, зоны в `CONFIG`, 5 тренажёров по пути, некликабельные зоны, модалка, несохраняемая сложность, «На карту», неизменность генератора и игры, отдельные view/controller, вертикальная прокрутка), а также повторная сверка критериев 9 и 20 (inline-обработчики убраны, звук клика на всех кнопках).  
**Критерий:** все ✅ (включая критерии 9 и 20). **Зависимости:** 8.19.

---

## 🗺️ Этап 9. Карта на весь экран и непрерывная дорога (1.3.1) — ✅ выполнено

**Запреты этапа (Z10):** не добавлять меню; не делать зоны кликабельными; не блокировать тренажёры; не показывать прогресс на карте; не передавать тему в генератор; не менять логику игры; не рисовать дорогу отдельными линиями на каждую зону; не возвращать `polyline`/пунктир; не добавлять `gap`/`margin` между зонами.

**9.1.** `js/view/map-layout.js` [NEW] — константы `MAP_LAYOUT`: `TRAINER_SPACING: 100`, `TRAINER_SIZE: 52`, `TOP_OFFSET: 50`, `AMPLITUDE_RATIO: 0.18`, `AMPLITUDE_MIN: 60`, `AMPLITUDE_MAX: 110`, `FALLBACK_WIDTH: 600`. Метод `buildLayout(zones, width)`: `N = Σ trainersCount`; `height = N × 100`; полосы `bands` (`top = 100 × Σ предыдущих`, `height = 100 × count`, плюс `id`, `title`, `color`); тренажёры со сквозным индексом `i`: `y = 50 + i × 100`, `x = width / 2 ± A`, `A = clamp(width × 0.18, 60, 110)`; поля `zoneId`, `number`, `x`, `y`. Только чистые функции: без DOM и `CONFIG` (T15, US-24).  
**Критерий:** для 3×5 — 15 тренажёров с `y` 50…1450, полосы 0/500/1000 по 500; разница соседних (включая границу зон) — 100px. **Зависимости:** 8.2.

**9.2.** `js/view/map-layout.js` — `buildRoadPath(trainers)`: строка `M x0 y0`, затем на каждый следующий узел `C x_prev (y_prev+50), x_cur (y_cur−50), x_cur y_cur`; пустой массив → `''`; координаты округлять до 0.1; JSDoc (T15, US-23).  
**Критерий:** 14 сегментов `C`, первая/последняя точки совпадают с первым/последним тренажёром, касательные в узлах вертикальные. **Зависимости:** 9.1.

**9.3.** `index.html` — вынести `#mapScreen` из `.app` в `<body>` (перед `.app`), сохранив `#totalScore`, `#mapContainer` и классы; `.app` оставить для экранов игры/результатов; модалки не трогать.  
**Критерий:** `#mapScreen` — прямой потомок `body` вне `.app`; ID и внутренняя структура сохранены; `ScreenView` не меняется. **Зависимости:** —.

**9.4.** `css/map_items/map-screen.css` — `#mapScreen`: `position: fixed`, `top/left: 20px`, `width: calc(100vw - 40px)`, `height: calc(100vh - 40px)`, `box-sizing: border-box`, `overflow-x: hidden`, `overflow-y: auto`, внутренние отступы, скругление/фон/тень; `.total-score` — `sticky` сверху; `.map` — `position: relative`, `width: 100%`, без flex и `gap` (T15, US-22).  
**Критерий:** карта занимает экран с отступами 20px, появляется вертикальный скролл, горизонтального нет. **Зависимости:** 9.3.

**9.5.** `css/map_items/map-zone.css` — `.map-zone`: `position: absolute`, `left: 0`, `width: 100%`, `z-index: 0`, `background: var(--zone-color)`; убрать потоковые отступы; `.map-zone--first` / `.map-zone--last` скругляют только внешние углы; `.map-zone-title` — компактная плашка у верхнего края с модификаторами `--left` / `--right` и `pointer-events: none` (T15, US-24).  
**Критерий:** полосы стыкуются без зазоров, подпись не перекрывает тренажёр. **Зависимости:** 9.1, 9.4.

**9.6.** `css/map_items/map-road.css` [NEW] + `css/map.css` — `.map-road`: `position: absolute`, `inset: 0`, `width/height: 100%`, `z-index: 1`, `pointer-events: none`; `.map-road-line`: `fill: none`, `stroke: rgba(255,255,255,0.85)`, `stroke-width: 8`, `stroke-linecap/linejoin: round`, **без** `stroke-dasharray`. Удалить `css/map_items/map-path.css`, заменить импорт в `map.css` (T15, US-23).  
**Критерий:** стили относятся к единой дороге, `map-path.css` удалён, `map.css` без «битого» `@import`. **Зависимости:** 9.4.

**9.7.** `view/map-view.js` — `render(zones, width?)`: ширина = аргумент → `#mapContainer.clientWidth` → `MAP_LAYOUT.FALLBACK_WIDTH`; layout из `MapLayout.buildLayout()`; очистка контейнера; `height` из layout; порядок вставки: полосы зон → один `svg.map-road` (`viewBox="0 0 width height"`, `preserveAspectRatio="none"`) с одним `path.map-road-line` (`d = roadPath`) → тренажёры (`left`/`top` из layout). Подписи зон — сторона, противоположная первому тренажёру; классы `map-zone--first/--last`. Удалить `buildPathPoints()`, `_offsetX()`, `_buildPath()`; модалку не менять (A20, T15, US-22…US-24).  
**Критерий:** 3 зоны, 15 тренажёров, ровно один `svg.map-road` и один `path`, `polyline` отсутствует, координаты из layout. **Зависимости:** 9.1, 9.2, 9.3, 9.5, 9.6.

**9.8.** `css/map_items/map-trainer.css` — добавить `z-index: 2` (кнопки поверх дороги); размеры, позиционирование и анимации не менять (US-24).  
**Критерий:** кнопки видны поверх линии и кликабельны. **Зависимости:** 9.6, 9.7.

**9.9.** `controller/map-controller.js` — добавить `onResize()`: debounce ~100 мс → `MapView.render(this._zones)`; в `init()` подписать `window` на `resize`. Делегирование клика по `.map-trainer`, кнопки модалки, звук и «Отмена» — без изменений; на зоны обработчиков не вешать (A20, A21, US-23).  
**Критерий:** после изменения окна карта перерисована, повторной подписки и дублей обработчиков нет, зоны некликабельны. **Зависимости:** 9.7.

**9.10.** `index.html` — подключить `js/view/map-layout.js` **перед** `js/view/map-view.js`; остальные слои и их порядок не менять.  
**Критерий:** порядок Errors → Audio → Model → Storage → Service → Logic → View (`map-layout`, `map-view`) → Controller → script.js сохранён, консоль без ошибок. **Зависимости:** 9.1, 9.2, 9.7.

**9.11.** Тесты: `test/map/map-layout.test.js` [NEW] — шаг 100px у всех 15 (включая переход зон), полосы 0/500/1000 по 500, чередование X в границах, путь `M … 14 × C`, пустой список. `test/map/map-view.test.js` [ИЗМ] — `render(zones, 600)`: 3 зоны, 15 тренажёров, один `svg.map-road`, один `path`, нет `polyline`, `d` содержит `C`; старые тесты на проценты (`[50, 20, 80, 20, 50]`, `[10, 30, …]`) удалить.  
**Критерий:** `npm test` — все сьюты зелёные, тестов не меньше 54. **Зависимости:** 9.2, 9.7.

**9.12.** Ручная проверка и критерии **35–43**: 1280×800 и 360×640 — карта на весь экран с отступами 20px; вертикальный скролл; шаг 100px (и на границе зон); одна сплошная S-дорога через все зоны; зоны некликабельны; тренажёр → модалка → игра → результат → «На карту»; выход из игры → карта; `logic/`, `storage/`, `service/`, `game-controller.js`, `app-controller.js` не изменены; `map-view.js` и `map-layout.js` ≤ 200 строк.  
**Критерий:** все пункты и критерии 35–43 ✅. **Зависимости:** 9.9, 9.10, 9.11.

---

## 🧍 Этап 10. Игрок на карте (1.4.0) — ✅ выполнено

**Запреты этапа (Z10):** не добавлять меню; не делать зоны кликабельными; не блокировать тренажёры; не показывать прогресс на карте; не передавать тему в генератор; не менять логику игры; не рисовать дорогу отдельными линиями на каждую зону; не возвращать `polyline`/пунктир; не добавлять `gap`/`margin` между зонами.

**Запреты этапа (Z11):** не двигать игрока к дальним тренажёрам; не игнорировать блокировку во время движения; не сохранять позицию до игры; не менять версию `Stats` без миграции; не использовать спрайт вместо эмодзи.

**Решения до реализации (согласованы с владельцем):** «предыдущий» = откуда пришёл (origin последнего хода); стартовая позиция — у первого тренажёра, геометрия 1.3.1 не меняется; игрок рисуется поверх тренажёра. После победы цель отката закрепляется на выигранном тренажёре, иначе повторная игра откатывала бы сохранённый прогресс.

**10.1.** `js/logic/player-rules.js` [NEW] — `PlayerRules`: `START_INDEX = -1`, `MOVE_MS = 600`; `getAction(currentIndex, targetIndex)` → `'play'` (текущий) / `'move'` (index ± 1) / `'ignore'` (дальний); `resolveAfterGame(isSuccessful, currentIndex, previousIndex)`; `resolveAfterCancel(previousIndex)`; `normalizeIndex(index, total)` → `[−1, total−1]`. Только чистые функции: без DOM, `CONFIG` и обработчиков (A23, A25, FR-19, FR-20).  
**Критерий:** `getAction` различает три случая, `resolveAfterGame(true, 3, 2) === 3`, `resolveAfterGame(false, 3, 2) === 2`, `normalizeIndex(−5, 15) === −1`, `normalizeIndex(99, 15) === 14`. **Зависимости:** —.

**10.2.** `model/types.js` — в `@typedef Stats` добавить `@property {number} currentTrainerIndex` — плоский индекс текущего тренажёра (`−1`…`N−1`). Остальные DTO не трогать (A22, A24, T20).  
**Критерий:** тип `Stats` содержит поле, `Problem`/`GameResult`/`SessionState`/`ErrorInfo`/`Zone` без изменений. **Зависимости:** —.

**10.3.** `model/config.js` — `VERSION: 1` → **`2`**. `ZONES`, `TOTAL_QUESTIONS`, `MAX_LIVES`, `START_DIFFICULTY`, `POINTS_BASE`, `RATINGS`, `GAMEOVER`, `STORAGE_PREFIX` не менять (A24, T20, Z11).  
**Критерий:** `CONFIG.VERSION === 2`, схема ключа `ml_stats` прежняя. **Зависимости:** —.

**10.4.** `service/stats-service.js` — дефолты при отсутствии данных и в обоих аварийных возвратах `load()` включают `currentTrainerIndex: -1`; `reset()` → `{ version: CONFIG.VERSION, totalScore: 0, currentTrainerIndex: -1 }`; новые методы `getTrainerIndex()` (из `load()`) и `saveTrainerIndex(index)` (`load()` → присвоить → `save()`); `updateAfterRound()` не менять — он сохраняет весь загруженный объект и позицию не теряет (A24, T20, FR-21).  
**Критерий:** нет данных → `{ version: 2, totalScore: 0, currentTrainerIndex: -1 }`; `saveTrainerIndex(7)` → `getTrainerIndex() === 7`; `updateAfterRound()` сохраняет прежний индекс; ошибки по-прежнему через `ErrorHandler`. **Зависимости:** 10.2, 10.3.

**10.5.** `service/stats-service.js` — `_migrate()`: `case 2: data.currentTrainerIndex = -1; break;`; после цикла — защита `if (data.currentTrainerIndex == null) data.currentTrainerIndex = -1;`. Версию менять только вместе с миграцией (A24, T20, Z11).  
**Критерий:** запись `{version: 1, totalScore: 30}` → `{version: 2, totalScore: 30, currentTrainerIndex: -1}`; `version > 2` → `CorruptedDataError` + reset, как раньше. **Зависимости:** 10.4.

**10.6.** `test/setup.js` — `global.CONFIG.VERSION: 1` → **`2`** (дубликат `CONFIG` для тестов, иначе миграционные тесты будут врать).  
**Критерий:** тестовый `CONFIG.VERSION === 2`, остальные поля тестового конфига без изменений. **Зависимости:** 10.3.

**10.7.** `js/view/map-layout.js` — в каждый объект тренажёра добавить `index` (плоский 0…`N−1`, тот же порядок, что в `trainers`); `buildLayout` и `buildRoadPath` в остальном не менять (T18).  
**Критерий:** `trainers[i].index === i` для всех 15 при 3×5; дорога, полосы и шаг 100px не изменились. **Зависимости:** —.

**10.8.** `js/view/map-layout.js` — константы `PLAYER_SIZE: 52`, `PLAYER_START_GAP: 20` и чистая функция `getPlayerPoint(trainers, index)`: `index < 0` → точка первого тренажёра со сдвигом вверх на `PLAYER_START_GAP`; `index ≥ length` → последний тренажёр; пустой список → `null`; возвращает `{ x, y }`. Геометрия 1.3.1 не меняется (A22, US-28, US-32).  
**Критерий:** `getPlayerPoint(trainers, −1)` при ширине 600 → `{ x: 192, y: 30 }`; `getPlayerPoint(trainers, 14)` → точка 15-го; `index ≥ 15` клампится; `[]` → `null`. **Зависимости:** 10.7.

**10.9.** `js/view/map-player-view.js` [NEW] — `build(point)` (элемент `.map-player` с эмодзи 🚶, `transform: translate(x, y) translate(-50%, -50%)`), `move(el, point)` (смена `transform`), `markTrainers(container, currentIndex, total)` (классы `map-trainer--current` / `--near` / `--far` через `PlayerRules.getAction()`). Только DOM, без обработчиков и бизнес-логики; JSDoc (A22, T18, T19, FR-19, FR-20).  
**Критерий:** один элемент игрока с 🚶 и координатами точки; у тренажёров выставлены три класса по правилам; файл ≤ 200 строк. **Зависимости:** 10.1, 10.8.

**10.10.** `css/map_items/map-player.css` [NEW] + `css/map.css` — `.map-player`: 52px, `z-index: 3`, `pointer-events: none`, `transform: translate(0, 0) translate(-50%, -50%)`, `transition: transform 600ms ease-in-out`; добавить `@import url('map_items/map-player.css');` после дороги и перед тренажёрами. Длительность перехода должна совпадать с `PlayerRules.MOVE_MS` (комментарий в файле) (A22, T19).  
**Критерий:** игрок виден поверх дороги и кнопок, движение плавное 600 мс, клики по тренажёрам не блокируются. **Зависимости:** 10.9.

**10.11.** `css/map_items/map-trainer.css` — `.map-trainer--far { cursor: not-allowed; }`, `.map-trainer--near`, `.map-trainer--current` → `cursor: pointer`; размеры, позиционирование, `z-index` и анимации не менять (T18, US-30).  
**Критерий:** на дальних тренажёрах `not-allowed`, на соседних и текущем — `pointer`. **Зависимости:** 10.1, 10.9.

**10.12.** `js/view/map-view.js` — `render(zones, width?, playerIndex?)`: индекс = аргумент → сохранённый `_playerIndex` → `−1`; тренажёрам добавить `data-index`; после тренажёров добавить `.map-player` (через `MapPlayerView`) и вызвать `markTrainers()`; новые методы `setPlayerIndex(index)` / `getPlayerIndex()` / `movePlayer(index, callback?)` (двигает существующий элемент без перерисовки). Модалку, зоны и дорогу не менять; ≤ 200 строк (A20, A22, T18, T19, US-28).  
**Критерий:** `render(zones, 600, 3)` даёт 3 зоны, 15 тренажёров с `data-index`, одну дорогу и ровно одного `.map-player` на нужной точке; повторный `render` без аргумента сохраняет позицию игрока. **Зависимости:** 10.7, 10.8, 10.9.

**10.13.** `controller/map-controller.js` — состояние `_playerIndex`, `_previousIndex`, `_isMoving`, `_moveTimer`; `init(zones, playerIndex?)`; в делегировании клика читать `data-index` и различать через `PlayerRules.getAction()`: `ignore` → ничего, `play` → `AudioService.play('click')` + модалка (как 1.3.1), `move` → `play('click')`, `_previousIndex = _playerIndex`, `_playerIndex = target`, `MapView.movePlayer(...)`, установка `_isMoving` и снятие флага по таймеру `PlayerRules.MOVE_MS`; при `_isMoving` клик игнорируется; `onResize()` сохраняет позицию. Дальних не двигать, блокировку не игнорировать (A23, T18, T19, US-29, US-30, Z11).  
**Критерий:** соседний → движение и блокировка на 600 мс, текущий → модалка, дальний → ничего; во время движения клики не срабатывают; зоны некликабельны. **Зависимости:** 10.1, 10.12.

**10.14.** `controller/map-controller.js` — `returnToPrevious()` (игрок возвращается на `_previousIndex`, **без** сохранения) и `onGameFinished(isSuccessful)`: победа → `_previousIndex = _playerIndex` («якорь») + `StatsService.saveTrainerIndex(_playerIndex)`; провал → `_playerIndex = resolveAfterGame(false, …)` + `StatsService.saveTrainerIndex(_playerIndex)`; затем `MapView.setPlayerIndex()`. `onCancel()` дополнительно вызывает `returnToPrevious()`; `getPlayerIndex()` / `isMoving()` (A24, A25, T20, US-31, Z11).  
**Критерий:** позиция сохраняется только после игры; победа оставляет игрока, провал возвращает; отмена не пишет в хранилище. **Зависимости:** 10.4, 10.5, 10.13.

**10.15.** `controller/app-controller.js` — `init()`: один `StatsService.load()` → `PlayerRules.normalizeIndex()` → `MapView.setPlayerIndex()` → `MapController.init(CONFIG.ZONES, index)` **до** первого рендера → `ScreenView.showScreen('map')` → `MapView.render(CONFIG.ZONES)` → `renderTotalScore(stats.totalScore)`. `onExit()` после `confirm()` вызывает `MapController.returnToPrevious()` — позиция не сохраняется (A24, A25, US-32).  
**Критерий:** после перезагрузки игрок на сохранённой позиции; выход из игры возвращает на карту с игроком на предыдущем тренажёре и без записи в `ml_stats`. **Зависимости:** 10.4, 10.13, 10.14.

**10.16.** `controller/results-controller.js` — в `show()` после вычисления `isSuccessful` вызвать `MapController.onGameFinished(isSuccessful)` (сохранение позиции по победе/провалу). Начисление общего счёта (`updateAfterRound`) и звуки — без изменений; `#mapBtn` и `#playAgainBtn` не трогать (A24, A25, FR-21, US-31).  
**Критерий:** успешный раунд → позиция сохранена и игрок остался; провал → позиция предыдущего сохранена и игрок вернулся; «На карту» показывает игрока на актуальной позиции. **Зависимости:** 10.14.

**10.17.** `index.html` — подключить `js/logic/player-rules.js` в блок Logic (после `game-rules.js`) и `js/view/map-player-view.js` в блок View (**перед** `map-view.js`). Разметку карты не менять: игрок создаётся динамически.  
**Критерий:** порядок Errors → Audio → Model → Storage → Service → Logic (`player-rules`) → View (`map-layout`, `map-player-view`, `map-view`) → Controller → script.js сохранён, консоль без ошибок. **Зависимости:** 10.1, 10.9, 10.12.

**10.18.** Тесты — `test/logic/player-rules.test.js` [NEW]: `getAction` (текущий/±1/дальний, старт `−1` → только `0`, последний → только назад), `resolveAfterGame`, `resolveAfterCancel`, `normalizeIndex`. `test/service/stats-service.test.js` [NEW]: дефолт без данных, миграция 1 → 2 с сохранением `totalScore`, `saveTrainerIndex`/`getTrainerIndex`, `reset()`, `updateAfterRound()` не теряет позицию. `test/map/map-layout.test.js` [ИЗМ]: `index` у всех 15, `getPlayerPoint` для `−1`/последнего/за границей/пустого списка; прежние проверки шага 100px и полос сохранить. `test/map/map-view.test.js` [ИЗМ]: `render(zones, 600, 3)` — один `.map-player` с 🚶 и координатами точки, `data-index` у 15 тренажёров, классы `--current`/`--near`/`--far`, `setPlayerIndex(−1)` + повторный рендер; прежние тесты карты сохранить (A22…A25, T18…T20).  
**Критерий:** `npm test` — все сьюты зелёные, тестов **не меньше 67** (ориентир — 85–90). **Зависимости:** 10.1–10.17.

**10.19.** Ручная проверка и критерии **44–52**: старт — игрок у первого тренажёра, дальние с `not-allowed`; клик на дальний → ничего, на соседний → плавное движение 600 мс, клики во время движения игнорируются; текущий → модалка; «Отмена» → возврат назад без изменения `ml_stats`; победа → игрок остаётся и позиция сохранена (`version: 2`), провал → возврат и сохранение; перезагрузка — игрок там же; запись `{version: 1, totalScore: 100}` мигрирует в `version: 2` с `currentTrainerIndex: −1` и счётом 100; выход ✕ → возврат без сохранения, очки сгорают; `logic/generator.js`, `scoring.js`, `game-rules.js`, `game-controller.js`, `storage/`, `service/audio-service.js` не изменены; `js/` ≤ 200 строк на файл.  
**Критерий:** все пункты и критерии 44–52 ✅. **Зависимости:** 10.17, 10.18.

**10.20.** Документация после реализации — обновить `README.md`, `GIGACODE.md`, `test/README.md` (игрок, версия `Stats` 2 и миграция, новые файлы `player-rules.js`, `map-player-view.js`, `map-player.css`, новое число тестов). Сам `TASKS.md` — этот файл (10.1–10.20).  
**Критерий:** документы отражают 1.4.0, число тестов совпадает с фактическим. **Зависимости:** 10.19.

---

## 🧍 Этап 11. Модалка при приходе, откат и повторная игра (1.4.1) — ✅ выполнено

**Запреты этапа (Z10, Z11):** без меню, кликабельных зон, прогресса и блокировки тренажёров; тема не передаётся в генератор; логика игры не меняется; дорога — одна; без `polyline`/пунктира и `gap`/`margin` между зонами; игрок не ходит к дальним; блокировка не игнорируется; позиция не сохраняется до игры; версия `Stats` не меняется без миграции; без спрайта.

**Запреты этапа (Z12):** не открывать модалку при возврате (после отмены/провала/выхода); не двигать игрока при открытой модалке; не сохранять позицию при отмене или выходе; не игнорировать откат при отмене.

**Запреты этапа (Z13):** не откатывать игрока при провале на текущем (тренировка); не откатывать при выходе на текущем; не блокировать повторную игру; не отменять начисление очков при повторной победе.

**Решения до реализации:** «новый / текущий» определяется как `current === previous` (без отдельного флага); флаг `isModalOpen` живёт в `MapController` (A26), состояние позиции — в `PlayerState`; `map-view.js` (199 строк) и CSS не меняются; `Stats.version` остаётся 2.

**11.1.** `js/logic/player-state.js` [NEW] — класс `PlayerState`: поля `_current`, `_previous`; конструктор `(index)` задаёт обе позиции; геттеры `index`, `previous`; `moveTo(target)` (`previous = current`, `current = target`); `isReplay()` (`current === previous`); `revert()` (`current = previous`); `commitWin()` (`previous = current`). Без DOM/Storage/`Stats`/`CONFIG`, JSDoc у публичных методов (A23, A27, A28, T22).  
**Критерий:** старт `−1` → `isReplay() === true`; после `moveTo(0)` → `false`; после `commitWin()` и `revert()` → `true`; цепочка `moveTo(1) → moveTo(2) → revert()` даёт `1`; файл ≤ 200 строк. **Зависимости:** —.

**11.2.** `js/logic/player-rules.js` [ИЗМ] — удалить `resolveAfterGame()` и `resolveAfterCancel()` (их роль выполняет `PlayerState`); оставить `START_INDEX`, `MOVE_MS`, `getAction()`, `normalizeIndex()`. Проверить `grep` по `js/`: вызовов удалённых методов не осталось (A23, A27).  
**Критерий:** файл содержит только 4 члена + JSDoc; в `js/` нет `resolveAfterGame` / `resolveAfterCancel`. **Зависимости:** 11.1.

**11.3.** `controller/map-controller.js` — состояние и защита: в `init()` создавать `this._player = new PlayerState(playerIndex == null ? PlayerRules.START_INDEX : playerIndex)`, `_isMoving = false`, `_isModalOpen = false`; убрать `_playerIndex`/`_previousIndex`; в `onTrainerClick()` guard `if (this._isMoving || this._isModalOpen) return;` (A26, T21); `_findZone()` инлайнится через `this._zones.find(...)`, клик читает `data-index` (A26, US-33).  
**Критерий:** клик при открытой модалке и во время движения не вызывает ни движения, ни модалки; `map-controller.js` ≤ 200 строк. **Зависимости:** 11.1.

**11.4.** `controller/map-controller.js` — приход и модалка: `_startMove(index, zone, trainerNumber)` — `_isMoving = true`, `MapView.movePlayer(index)`, таймер `PlayerRules.MOVE_MS` → `onArrival(zone, trainerNumber)`; `onArrival()` — `_isMoving = false`, `_openModal(...)` **сразу** по приходу; `_openModal()`/`_closeModal()` — флаг `_isModalOpen`, `MapView.showDifficultyModal()`/`hideDifficultyModal()`; клик `play` → `_openModal()` (повторная игра); `onDifficultySelect()` → `_closeModal()` + `AppController.onStartGame(difficulty)` (A23, A26, A28, T21, FR-22, US-29 доп., US-30 доп.).  
**Критерий:** клик на соседний → через 600 мс `MapView.showDifficultyModal` вызван с зоной и номером; флаг `isModalOpen` установлен; выбор сложности сбрасывает флаг и запускает игру. **Зависимости:** 11.3.

**11.5.** `controller/map-controller.js` — отмена и общий откат: `revertPosition()` — `PlayerState.revert()` + `MapView.setPlayerIndex()` + `MapView.movePlayer()`; модалка при откате **не** открывается; `onCancel()` — `AudioService.play('click')`, `_closeModal()`, `revertPosition()`; `Stats` при отмене не трогается (A27, T22, US-29 доп., US-33, Z12).  
**Критерий:** «Отмена» → игрок на предыдущем, модалка закрыта, `StatsService.saveTrainerIndex` не вызван. **Зависимости:** 11.4.

**11.6.** `controller/map-controller.js` — итог игры: `onGameFinished(isSuccessful)` — при `PlayerState.isReplay()` выход **без** сохранения (тренировка); новый + победа → `commitWin()` + `StatsService.saveTrainerIndex()`; новый + провал → `revertPosition()` + `StatsService.saveTrainerIndex()`; затем `MapView.setPlayerIndex()`. `results-controller.js` **не меняется** (очки повторной победы — по-прежнему `updateAfterRound()`) (A25, A28, T22, T23, FR-23, FR-24, US-31 доп., US-34, US-35, Z13).  
**Критерий:** победа на новом → сохранён текущий индекс; провал на новом → сохранён предыдущий и игрок откатился; повторная игра (победа или провал) → `saveTrainerIndex` не вызван, игрок не двигается. **Зависимости:** 11.5.

**11.7.** `controller/map-controller.js` + `controller/app-controller.js` — выход: `onExitGame()` — повторная игра → остаётся (без сохранения), новый тренажёр → `revertPosition()` (без сохранения); геттеры `getPlayerIndex()`, `isMoving()`, `isModalOpen()`; `AppController.onExit()` после `confirm()` вызывает `MapController.onExitGame()` вместо `returnToPrevious()` (A25, A27, T23, US-31 доп., Z12, Z13).  
**Критерий:** выход на новом → откат без сохранения; выход в повторной → позиция не меняется, сохранения нет; очки раунда сгорают. **Зависимости:** 11.6.

**11.8.** `index.html` — подключить `js/logic/player-state.js` в блок Logic **после** `player-rules.js`; остальные скрипты и разметку не менять.  
**Критерий:** порядок Errors → Audio → Model → Storage → Service → Logic (`player-rules`, `player-state`) → View → Controller → script.js сохранён, консоль без ошибок. **Зависимости:** 11.1.

**11.9.** Тесты — `test/logic/player-state.test.js` [NEW]: старт, `moveTo`, `isReplay`, `revert`, `commitWin`, цепочка ходов. `test/logic/player-rules.test.js` [ИЗМ]: удалить блоки `resolveAfterGame` и `resolveAfterCancel`, остальные тесты сохранить. `test/map/map-controller.test.js` [NEW] (jsdom + `jest.useFakeTimers()`): модалка по приходу после 600 мс; клик во время движения игнорируется; клик при открытой модалке движение не запускает; клик на дальний — ничего; «Отмена» → откат без сохранения; победа на новом → сохранение; провал на новом → откат + сохранение; победа/провал в повторной → без сохранения; выход на новом → откат без сохранения; выход в повторной → без движения и сохранения (A23, A26…A28, T21…T23, Z12, Z13).  
**Критерий:** `npm test` — все сьюты зелёные, тестов **не меньше 107** (ориентир — 120–125). **Зависимости:** 11.1–11.8.

**11.10.** Ручная проверка и критерии **53–60**: приход → модалка без второго клика; движение при открытой модалке не срабатывает, после закрытия — снова доступно; «Отмена» → игрок на предыдущем, модалка закрыта, `ml_stats` не изменился; повторный клик на текущий → модалка, победа → очки, провал и выход → игрок остаётся, `ml_stats` не перезаписывается; победа на новом → позиция сохранена; провал на новом → откат + сохранение; выход на новом → откат без сохранения, очки сгорели; перезагрузка → игрок на сохранённой позиции; `map-view.js` (199 строк) и CSS не изменены; консоль без ошибок.  
**Критерий:** все пункты и критерии 53–60 ✅. **Зависимости:** 11.8, 11.9.

**11.11.** Документация после реализации — обновить `README.md`, `GIGACODE.md`, `test/README.md` (модалка по приходу, флаг `isModalOpen`, повторная игра, правила сохранения позиции, новый `player-state.js`, новое число тестов).  
**Критерий:** документы отражают 1.4.1, число тестов совпадает с фактическим. **Зависимости:** 11.10.

---

## 🌍 Этап 12. Глобальная карта и `Stats` v3 (1.5.0) — ✅ выполнено

**Запреты этапа (Z10–Z13 сохраняются, Z14 — новый):** те же, что в 1.4.1 (без меню, кликабельных зон, прогресса и блокировки тренажёров; геометрия, CSS карты и `map-view.js` не меняются; модалка сложности и повторная игра работают как в 1.4.1) плюс: не показывать 🌍 в игре и на результатах; не сбрасывать общий счёт при выборе карты; не сбрасывать позицию при выборе **той же** карты; не требовать подтверждения при выборе; не хранить `Stats` плоско.

**Решения до реализации:** счёт и позиция — по картам (`maps[currentMap]`, A30/T25), `#totalScore` показывает счёт текущей карты; выбор карты сбрасывает позицию выбранной карты (A31) и закрывает модалку; выбор той же карты — полный no-op; 🌍 живёт внутри `#mapScreen`; `MapController.init()` — только обработчики, состояние ставит `reset(zones, index)`; карту рисует только `AppController.showCurrentMap()`; `StatsSchema` вынесена в Model; `map-view.js` (199 строк) и CSS карты не меняются; `CONFIG.VERSION: 3`.

**12.1.** `js/model/config.js` [ИЗМ] — вынести `ZONES` и `MAPS` на верхний уровень: `MAPS = [{ id: 'math', title: 'Математика', zones: ZONES }]`; в `CONFIG` добавить `ZONES` (ссылка на зоны карты по умолчанию), `MAPS`, `DEFAULT_MAP: 'math'`, поднять `VERSION: 2` → **`3`**. `TOTAL_QUESTIONS`, `MAX_LIVES`, `START_DIFFICULTY`, `POINTS_BASE`, `RATINGS`, `GAMEOVER`, `STORAGE_PREFIX` не менять (A29, A30, T25).  
**Критерий:** `CONFIG.VERSION === 3`; `CONFIG.DEFAULT_MAP === 'math'`; `CONFIG.MAPS[0].zones === CONFIG.ZONES` (та же ссылка); остальные поля без изменений; ключ `ml_stats` прежний. **Зависимости:** —.

**12.2.** `js/model/map-catalog.js` [NEW] — каталог карт: `get(id)` (неизвестный/`undefined` → карта по умолчанию), `getDefault()` (`CONFIG.DEFAULT_MAP`, фолбэк — первая карта каталога), `has(id)`. Только чтение `CONFIG.MAPS`, без DOM/Storage/`Stats`, JSDoc у публичных методов (A29, US-38, FR-25).  
**Критерий:** `get('math').id === 'math'`; `get('chemistry').id === 'math'` и `get(undefined).id === 'math'`; `has('math') === true`, `has('chemistry') === false`; файл ≤ 200 строк. **Зависимости:** 12.1.

**12.3.** `js/model/stats-schema.js` [NEW] + `js/model/types.js` [ИЗМ] — схема `Stats` v3: `defaults()` (все карты каталога: `totalScore: 0`, `currentTrainerIndex: -1`, `currentMap = CONFIG.DEFAULT_MAP`, `version = CONFIG.VERSION`), `emptyMap()`, `entry(stats)` (`stats.maps[stats.currentMap]`, T25), `migrate(data)` (пошагово 1 → 2 → 3; версия > текущей → `CorruptedDataError`; в конце `ensureMaps`), `ensureMaps(data)` (дополняет карты и поля, `currentMap` вне каталога → карта по умолчанию). В `types.js`: `@typedef MapStats` (`totalScore`, `currentTrainerIndex`), `@typedef GameMap` (`id`, `title`, `zones`), `Stats` переписать на `version` / `currentMap` / `maps`; плоских `totalScore`/`currentTrainerIndex` в `Stats` не остаётся (A30, T25, FR-27, US-38, Z14).  
**Критерий:** без данных → v3 с картой `math` (0 / −1); `{version: 1, totalScore: 30}` → v3, счёт 30 в `math`, позиция −1; `{version: 2, totalScore: 5, currentTrainerIndex: 7}` → v3, счёт и позиция **сохранены** в `math`; `currentMap: 'chemistry'` → `'math'`, данные «химии» не удалены; `version: 9` → `CorruptedDataError`; повторная миграция идемпотентна; 3 новых `@typedef`, JSDoc; оба файла ≤ 200 строк. **Зависимости:** 12.1, 12.2.

**12.4.** `js/service/stats-service.js` [ИЗМ] — `load()`/`save()`/`init()` по контракту без изменений, но `load()` возвращает `StatsSchema.migrate()` / `StatsSchema.defaults()`; новые `getCurrentMap()`, `getTotalScore()`, `switchMap(mapId)`; `updateAfterRound()`, `getTrainerIndex()`, `saveTrainerIndex()` работают через `StatsSchema.entry()` (только текущая карта); `reset()` → `StatsSchema.defaults()`; `switchMap`: та же или неизвестная карта → `false` **без записи**, иначе `currentMap = mapId`, `currentTrainerIndex = -1`, `save()`, `true` (A30, A31, T25, FR-26, FR-27, Z14).  
**Критерий:** нет данных → v3; `updateAfterRound()` и `saveTrainerIndex()` меняют только текущую карту; `switchMap('math')` → `false` и объект в репозитории не перезаписан; `switchMap('unknown')` → `false`; `switchMap('english')` (вторая карта добавляется в тесте) → `true`, позиция новой карты −1, счёт прежней сохранён; ошибки по-прежнему через `ErrorHandler`; файл ≤ 200 строк. **Зависимости:** 12.3.

**12.5.** `index.html` + `css/map_items/map-global.css` [NEW] + `css/map.css` [ИЗМ] — кнопка `#globalMapBtn` (🌍, `type="button"`, `title`/`aria-label`) **внутри** `#mapScreen` после `#totalScore`; модалка `#mapSelectModal` (`.modal-overlay` → `.modal` → `h2` «Выбор карты», `#mapSelectList`, `#closeMapSelectBtn` «Закрыть») рядом с модалкой сложности; стили `.global-map-btn` (`position: fixed`, `top/right: 32px`, `z-index: 4`, круглая 52×52), `.map-select-list` (вертикальный `flex`, `gap: 10px`), `.map-select-item` и `.selected` (как `.diff-btn`: `#58cc02` / `#d7ffb8` / `#58a700`); `@import url('map_items/map-global.css');` в `css/map.css` (A29, T24, US-36).  
**Критерий:** 🌍 видна только на карте и остаётся в углу при прокрутке; модалка открывается классом `open`; существующие CSS-файлы карты не изменены. **Зависимости:** 12.1.

**12.6.** `js/view/global-map-view.js` [NEW] — `show(maps, currentMap)`: очистить `#mapSelectList`, собрать `.map-select-item` с `data-map` и `textContent = map.title`, текущей карте — класс `selected`, `#mapSelectModal.classList.add('open')`; `hide()`: снять `open`. Только DOM, без обработчиков, `Stats` и `Storage` (US-36, FR-25).  
**Критерий:** `show(CONFIG.MAPS, 'math')` даёт по кнопке на карту каталога, у текущей `selected`, модалка `.open`; `hide()` убирает `.open`; повторный `show` не дублирует кнопки; файл ≤ 200 строк. **Зависимости:** 12.1, 12.5.

**12.7.** `js/controller/global-map-controller.js` [NEW] — `init()`: клик по `#globalMapBtn` → `open()`, делегирование клика по `[data-map]` в `#mapSelectList` → `onSelect(id)`, клик по `#closeMapSelectBtn` → `close()`; `open()` — `AudioService.play('click')` + `GlobalMapView.show(CONFIG.MAPS, StatsService.getCurrentMap())`; `close()` — звук + `GlobalMapView.hide()`; `onSelect(mapId)` — `switchMap` вернул `false` → выход **без** звука и закрытия, `true` → звук, `GlobalMapView.hide()`, `AppController.showCurrentMap()` (A29, A31, US-36, US-37, FR-25, FR-26, Z14).  
**Критерий:** клик по 🌍 открывает модалку со списком; «Закрыть» закрывает; выбор той же карты не закрывает модалку, не вызывает `showCurrentMap` и не играет звук; выбор другой — закрывает и вызывает `AppController.showCurrentMap()`; файл ≤ 200 строк. **Зависимости:** 12.4, 12.6.

**12.8.** `js/controller/map-controller.js` [ИЗМ] — `init()` без аргументов: только привязка обработчиков (карта, `.diff-btn`, `#cancelDiffBtn`, `resize`), состояние не трогает; новый `reset(zones, playerIndex)` — `clearTimeout(_moveTimer)`, `_moveTimer = null`, `_zones`, `new PlayerState(playerIndex == null ? PlayerRules.START_INDEX : playerIndex)`, `_isMoving = false`, `_isModalOpen = false`; остальные методы (клик, приход, модалка, откат, итог игры, выход) не меняются (A31, Z12, Z13).  
**Критерий:** `init()` не навешивает состояние и не ломает клики; `reset()` во время движения отменяет таймер — через 600 мс модалка **не** открывается, позиция сброшена; `reset()` с новой позицией двигает игрока; `map-controller.js` ≤ 200 строк. **Зависимости:** 12.1.

**12.9.** `js/controller/app-controller.js` + `js/controller/results-controller.js` + `js/view/screen-view.js` [ИЗМ] — `AppController.init()`: `GlobalMapController.init()`, `MapController.init()`, затем `this.showCurrentMap()`, `highlightDifficulty` — после; новый `showCurrentMap()` — зоны `MapCatalog.get(StatsService.getCurrentMap()).zones`, `PlayerRules.normalizeIndex(StatsService.getTrainerIndex(), total)`, `MapController.reset(zones, index)`, `MapView.setPlayerIndex()`, `ScreenView.showScreen('map')`, `MapView.render(zones)`, `MapView.renderTotalScore(StatsService.getTotalScore())`; `onExit()` → `MapController.onExitGame()` + `showCurrentMap()`; `ResultsController` `#mapBtn` → `AppController.showCurrentMap()`; из `ScreenView.showScreen()` удалить блок перерисовки карты (`:27–31`) (A29, A31, US-37, US-38, FR-26, FR-27).  
**Критерий:** при старте рисуется карта из `Stats.currentMap`, позиция нормализована, счёт — текущей карты; после смены карты — новые зоны, игрок на −1, счёт новой карты; `ScreenView` больше не вызывает `MapView.render`; консоль без ошибок; файлы ≤ 200 строк. **Зависимости:** 12.7, 12.8.

**12.10.** `index.html` — подключить `js/model/map-catalog.js` и `js/model/stats-schema.js` в блок Model (после `config.js`), `js/view/global-map-view.js` в блок View, `js/controller/global-map-controller.js` в блок Controller (после `map-controller.js`, до `app-controller.js`); остальной порядок не менять.  
**Критерий:** порядок Errors → Audio → Model (`types`, `config`, `map-catalog`, `stats-schema`, `session-model`, `game-model`) → Storage → Service → Logic → View (…, `map-view`, `global-map-view`) → Controller (`map-controller`, `global-map-controller`, `app-controller`, …) → script.js; консоль без ошибок. **Зависимости:** 12.2, 12.3, 12.6, 12.7.

**12.11.** Тесты — `test/model/map-catalog.test.js` [NEW] (`get`/`getDefault`/`has`, неизвестный id → `math`); `test/model/stats-schema.test.js` [NEW] (`defaults`, v1 → v3, v2 → v3 с сохранением счёта и позиции, частичные данные, `currentMap: 'chemistry'` → `math`, `version: 9` → `CorruptedDataError`, идемпотентность, `entry`); `test/service/stats-service.test.js` [ИЗМ] (структура v3, `getTotalScore`/`getTrainerIndex`/`updateAfterRound`/`saveTrainerIndex` только по текущей карте, `switchMap` та же/неизвестная/другая, `reset`); `test/map/global-map-controller.test.js` [NEW] (jsdom; 🌍 открывает список, текущая `selected`, «Закрыть», выбор той же — no-op без звука и закрытия, выбор другой — `hide` + `showCurrentMap`); `test/map/map-controller.test.js` [ИЗМ] (`setup()` через `init()` + `reset()`, `reset()` отменяет таймер и двигает игрока); `test/setup.js` [ИЗМ] (`VERSION: 3`, `MAPS`, `DEFAULT_MAP`) (A29…A31, T24, T25, Z14, US-36…US-38, FR-25…FR-27).  
**Критерий:** `npm test` — все сьюты зелёные, тестов **не меньше 126** (ориентир — 150–165); сьюты `map-catalog`, `stats-schema`, `global-map-controller` присутствуют. **Зависимости:** 12.1–12.10.

**12.12.** Ручная проверка и критерии **61–70** + документация: 🌍 в углу и только на карте; модалка со списком, текущая выделена, «Закрыть»; выбор той же — ничего; выбор другой (временная вторая карта в `CONFIG.MAPS`) — сброс позиции, счёт прежней карты сохранён, без подтверждения; перезагрузка — та же карта; `currentMap: 'chemistry'` → «Математика»; регресс 1.4.1 (модалка по приходу, откат, повторная игра, правила сохранения позиции); `map-view.js` = 199 строк и не изменён; CSS карты не изменён; `js/` ≤ 200 строк на файл; `ml_stats` после перезагрузки — v3; затем обновить `README.md`, `GIGACODE.md`, `test/README.md` (🌍, `Stats` v3, миграция, новые файлы, число тестов).  
**Критерий:** все пункты и критерии 61–70 ✅; документы отражают 1.5.0, число тестов совпадает с фактическим. **Зависимости:** 12.10, 12.11.

---

## 🔷 Этап 13. TypeScript без React (1.6.0) — ✅ выполнено

**Запреты этапа (Z15):** не добавлять React; не менять архитектуру (слои, имена, порядок загрузки, Repository API); не трогать `js/view/**`, `js/controller/**`, `js/script.js`; не добавлять новые фичи и новые тесты; не использовать `any` без необходимости; не дублировать типы JSDoc + TS.

**Запреты этапа (Z16):** `any` в публичных API без обоснования; неявные `any` (`noImplicitAny` через `strict`); дублирование интерфейсов в разных файлах; типы вне `types.ts`, кроме локальных.

**Дополнительно:** не подключать `types.ts` в `index.html` (`export {}` → SyntaxError); не добавлять `import`/`export` в боевые `.ts` (сломает классические скрипты); не включать `checkJs`; не переименовывать 5 файлов вне области; не делать `Repository` `abstract`; не менять формат `Stats`, ключ `ml_stats`, пороги оценок, звук, CSS и порядок скриптов.

**Решения до реализации:** объём — 13 файлов из TR-2/TR-3 + `generator.ts` (SPEC называет его в «Что типизируется», но забывает в таблицах) + `types.ts` = 15 `.ts`; `types.ts` — ES-модуль с `export {}` + `declare global`, интерфейсы глобальны; `tsconfig.json` — `include: ["js"]` (каталога `src/` нет); `typescript` — `~5.9.3` (в TS 6 `moduleResolution: "Node"` даёт TS5107); `build` = `typecheck` (Vite не бандлит classic `.ts`); запуск — только `npm run dev`; `MapStats` → `MapData`; `Rating.min` = 100/70/40/0 как метаданные; `Repository` — не `abstract`; harness чинится **до** переименований, чтобы после каждого шага были зелёными и `tsc`, и `npm test`. Подробности — PLAN.md 1.6.0 и раздел «Решения и уточнения 1.6.0».

**Соответствие PLAN.md:** 13.0 → задачи 13.1–13.2; 13.1 → 13.3–13.4; 13.2 → 13.7; 13.3 → 13.8; 13.4 → 13.9; 13.5 → 13.10; 13.6 → 13.11; 13.7 → 13.12; 13.8 → 13.5–13.6 (+ обновление путей в 13.7, 13.9, 13.11); 13.9 → 13.13–13.14.

**13.1.** Инструменты и скрипты — `npm install -D typescript@~5.9.3 vite@^8.3.5`; в `package.json`: `"typecheck": "tsc --noEmit"`, `"build": "npm run typecheck"`; `dev`/`preview`/`test*` не меняются; `vite` теперь закреплён явно, а не только транзитивно через `vitest` (TR-5, A34, T26, T28).  
**Критерий:** `npx tsc --version` → `5.9.x`; `npm run typecheck` — 0 ошибок на текущем чисто-JS коде; `typescript` и `vite` есть в `devDependencies`. **Зависимости:** —.

**13.2.** `tsconfig.json` [ИЗМ] — `"include": ["js"]` вместо `["src"]`; остальные опции T26 (`target`, `lib`, `module`, `moduleResolution: "Node"`, `jsx`, `strict`, `allowJs`, `esModuleInterop`, `skipLibCheck`, `noEmit`) сохранить без изменений (TR-5, A34, T26).  
**Критерий:** `npx tsc --noEmit` — 0 ошибок и реально читает файлы `js/` (`npx tsc --noEmit --listFiles | grep -c "/js/"` > 0), а не пустую программу. **Зависимости:** 13.1.

**13.3.** `js/model/types.ts` [NEW] — `export {}` + `declare global`: интерфейсы `Problem`, `GameResult`, `MapData`, `Stats`, `SessionState`, `ErrorInfo`, `Rating`, `Zone`, `GameMap`, `Config` и тип `Difficulty = 'easy' | 'medium' | 'hard'`; без исполняемого кода; в шапке файла — предупреждение «только типы, в `index.html` не подключать». Поля — по таблице PLAN.md «types.ts — состав»; `MapStats` не объявлять (TR-1, A33, Z16).  
**Критерий:** `tsc` = 0; 10 `interface` + `Difficulty`; все **7** обязательных типов TR-1 на месте; файл ≤ 200 строк; `grep -rn "export" js/` показывает только `types.ts`. **Зависимости:** 13.2.

**13.4.** `js/model/types.js` [УДАЛ] + `index.html` [ИЗМ] + `js/model/stats-schema.js` [ИЗМ-комментарии] — удалить старый JSDoc-файл; убрать строку `<script src="js/model/types.js">` из блока Model; в `stats-schema.js` заменить `MapStats` → `MapData` в двух JSDoc (`emptyMap`, `entry`), код не трогать (TR-1, Z16).  
**Критерий:** `grep -rn "MapStats" js/ test/` — пусто; `types.js` отсутствует; `index.html` больше не подключает типы; `stats-schema.js` функционально не изменился (тест `stats-schema` проверяется после 13.5). **Зависимости:** 13.3.

**13.5.** Тестовая обвязка (до переименований!) — `vitest.config.ts` [ИЗМ]: `setupFiles: ['./test/setup.js']`; `test/setup.js` [ИЗМ]: `jest.fn` → `vi.fn` (4 вхождения); `test/**/*.test.js` [ИЗМ]: `jest.` → `vi.` (**55** вхождений в 5 файлах); `test/service/audio-service.test.js` [ИЗМ]: к `eval(...)` дописать `'\nglobal.AudioService = AudioService;'` (в ESM-строгом режиме `var` из `eval` не утекает) (T28).  
**Критерий:** `npm test` — **182/182** в 14 сьютах; `grep -rn "jest\." test/` — пусто; новых тестов нет. **Зависимости:** 13.4.

**13.6.** `test/ts-source.js` [NEW] + три теста [ИЗМ] — `readSource(relPath)`: `fs.readFileSync` + `typescript.transpileModule` (`target: ES2020`, `module: None`) для `.ts`, для `.js` — исходник как есть; путь от корня проекта (`path.resolve(__dirname, '..')`). Перевести `test/model/config.test.js`, `test/model/stats-schema.test.js`, `test/service/stats-service.test.js` на `readSource` с **текущими** `.js`-путями (T28).  
**Критерий:** `npm test` — 182/182; эти три файла не вызывают `fs.readFileSync('./js/...')` напрямую; хелпер ≤ 30 строк. **Зависимости:** 13.5.

**13.7.** `js/errors/custom-errors.js` → `.ts`, `js/errors/error-handler.js` → `.ts` [TS] — `constructor(message: string)`, `handle(error: Error, context: string): ErrorInfo`, `init(): void`; JSDoc без `@param {string}`; `index.html` — два `src` → `.ts`; в `test/model/stats-schema.test.js` и `test/service/stats-service.test.js` пути `custom-errors`, `error-handler` → `.ts` (TR-3, T27).  
**Критерий:** `tsc` = 0; `instanceof` работает для всех 5 классов; `handle` возвращает те же `action`/`userMessage`; оба файла ≤ 200 строк; `npm test` — 182/182. **Зависимости:** 13.6.

**13.8.** Storage → `.ts`: `repository.ts`, `local-repository.ts`, `memory-repository.ts`, `session-repository.ts` [TS] — `save(data: unknown): void`, `load(): unknown`, `clear(): void`; `catch (e)` → сужение (`e instanceof Error`, `(e as { code?: number }).code`); `JSON.parse` → сразу `unknown`; `Repository` **не** `abstract`; `index.html` — четыре `src` → `.ts` (TR-3, T27).  
**Критерий:** `tsc` = 0; `new Repository().save({})` бросает `Not implemented`; ошибки `localStorage` по-прежнему дают `QuotaExceededError` / `StorageUnavailableError` / `CorruptedDataError`; 4 файла ≤ 200 строк; `npm test` — 182/182. **Зависимости:** 13.7.

**13.9.** Model → `.ts`: `config.ts` (+`min` в `RATINGS`/`GAMEOVER`), `session-model.ts`, `game-model.ts` [TS] — `ZONES: Zone[]`, `MAPS: GameMap[]`, `CONFIG: Config`; `SessionModel` с полями/геттерами/сеттерами и `getResults(): GameResult`; `GameModel.toJSON(): { version: number; totalScore: number }` (legacy v2, **не** `Stats` v3); `index.html` — три `src` → `.ts`; `test/setup.js` — синхронно `min` (parity с боевым `CONFIG`); `test/model/config.test.js` — путь `config.ts` (TR-2, TR-3, T27).  
**Критерий:** `tsc` = 0; `CONFIG.VERSION === 3`, `DEFAULT_MAP === 'math'`, `MAPS[0].zones === ZONES`; пороги `getRating` не изменились; parity-тест `config.test.js` зелёный; `npm test` — 182/182. **Зависимости:** 13.8.

**13.10.** Logic → `.ts`: `generator.ts`, `scoring.ts`, `game-rules.ts` [TS] — `difficulty: Difficulty`, `setDifficulty`, `rnd`, `generate/easy/medium/hard`, `build(): Problem`; `Scoring` и `GameRules.getRating(results: GameResult): Rating`; локальные переменные типизировать там, где потребует `tsc`; `index.html` — три `src` → `.ts` (TR-2, T27).  
**Критерий:** `tsc` = 0; `build()` даёт 4 уникальных варианта и правильный `answer`; `getRating` возвращает те же значения, что в 1.5.0; `generator.ts` ≤ 200 строк; `npm test` — 182/182. **Зависимости:** 13.9.

**13.11.** Service → `.ts`: `stats-service.ts`, `session-service.ts` [TS] — `_repo: Repository | null`, `load(): Stats`, `save(stats: Stats)`, `switchMap(mapId: string): boolean`; границы к JS-модулям — `const entry: MapData = StatsSchema.entry(stats);`; `index.html` — два `src` → `.ts`; `test/service/stats-service.test.js` — путь `stats-service.ts` (TR-3, T27, T28).  
**Критерий:** `tsc` = 0; `load()` без данных → `Stats` v3; `switchMap` (та же / неизвестная / другая карта) работает как в 1.5.0; `any` в публичном API нет; `npm test` — 182/182. **Зависимости:** 13.10.

**13.12.** `index.html` — проверка и консолидация подключений (строки уже переведены в 13.7–13.11): все 14 `src` → `.ts`, `types.js` удалён, у View/Controller/`script.js` — `.js`; порядок Errors → Audio → Model → Storage → Service → Logic → View → Controller → `script.js` не изменён; `grep -n "\.js\"" index.html` не показывает переименованные файлы; `npm run dev` — старт без ошибок в консоли, карта и 🌍 работают (TR-6, A32).  
**Критерий:** список скриптов совпадает со спецификацией; приложение работает через `npm run dev`; консоль чиста. **Зависимости:** 13.7–13.11.

**13.13.** Финальная проверка — критерии **71–80**: `npm run typecheck` = 0; `npm test` = 182/182; ручной прогон 10 сценариев 1.5.0 (карта, счёт, позиция, 🌍, модалка выбора карты, no-op той же карты, модалка сложности, отмена-откат, повторная игра, результаты, перезагрузка, `ml_stats` = v3); лимит 200 строк по `js/**`; `map-view.js` = 199 и `map-controller.js` = 198 не изменены; CSS, звук и Storage не тронуты; `grep -rn "any" js/**/*.ts` — 0 или каждый случай с комментарием (TR-6, T28, A32–A35, Z15, Z16).  
**Критерий:** все пункты и критерии 71–80 ✅. **Зависимости:** 13.12.

**13.14.** Документация после реализации — `README.md`, `GIGACODE.md` (TypeScript, Vite, `npm run dev` как единственный способ запуска, `npm run typecheck`, 182 теста вместо Jest), `test/README.md` (vitest, `ts-source.js`), в этом файле — статус этапа 13.  
**Критерий:** документы отражают 1.6.0, число тестов совпадает с фактическим, Jest не упоминается как рабочий раннер. **Зависимости:** 13.13.

---

## ⚛️ Этап 14. React-пилот (1.7.0) — ✅ выполнено

**Запреты этапа (Z17):** не заменять View/Controller (позже — Этап 3); не добавлять Context/Zustand (позже — Этап 4); не удалять старый JS (позже — Этап 5); не менять логику игры; не добавлять новые фичи; не трогать `view/*.js` и `controller/*.js`.

**Запреты этапа (Z18):** `any` без необходимости; прямой доступ к DOM (кроме `#root`); хранение бизнес-логики в компонентах; `var` (только `const`/`let`).

**Дополнительно:** не оставлять два подключения `script.js` (тег + импорт) — двойная инициализация; не импортировать CSS в `main.tsx` (дублирует `<link>`); не добавлять `import`/`export` в классические `.js`/`.ts`; не менять `build` на `vite build` (нерабочий `dist`); не включать `checkJs` и не менять `moduleResolution`; не обновлять TypeScript до 6.x; не писать новые тесты (включая React); компоненты — только `src/*.tsx`, не в `js/`.

**Решения до реализации:** вход один — `main.tsx`, `<script src="js/script.js">` закомментирован, а сам `js/script.js` импортируется из `main.tsx`; мост `ErrorView → window.showErrorModal` — в `js/script.js` (≤ 10 строк), `view/*.js` не трогается (Z17 выше буквы TR-11); `tsconfig.include = ["js", "src", "*.tsx"]` (буквальный T31 выбросил бы `js/` из программы); CSS остаётся в `<link>`; React — 19.3.1 + `@types/react@^19`; `Window.showErrorModal` — в `js/model/types.ts`; `build` = `typecheck`; новых тестов нет — 182/182. Подробности — PLAN.md 1.7.0 (решения №1–7, отклонения, риски) и раздел «Решения и уточнения 1.7.0».

**Соответствие PLAN.md:** 14.0 → 14.1–14.3; 14.1 → 14.4–14.5; 14.2 → 14.6; 14.3 → 14.7; 14.4 → 14.8; 14.5 → 14.9; 14.6 → 14.11; 14.7 → 14.10; 14.8 → 14.12; 14.9 → 14.13–14.14.

**14.1.** Зафиксировать базовую линию — `find js/view js/controller css -type f -exec md5sum {} + | sort > /tmp/ml-guard-1.7.0.txt`; записать `npx tsc --version` (5.9.3), `npm run typecheck` (0), `npm test` (182/182), `npm ls react react-dom` (19.3.1) (PLAN 14.0, критерий 89).  
**Критерий:** файл контрольных сумм создан; `tsc` = 0; `npm test` = 182/182; версии зафиксированы. **Зависимости:** —.

**14.2.** `package.json` [ИЗМ] — `npm install -D @types/react@^19 @types/react-dom@^19`; `react`/`react-dom` **не** переустанавливать и диапазон **не** менять (TR-7, T30).  
**Критерий:** `@types/react`, `@types/react-dom` в `devDependencies`; `react`, `react-dom` `^19.3.1` в `dependencies`; `npm ls react react-dom` без ошибок. **Зависимости:** 14.1.

**14.3.** `tsconfig.json` [ИЗМ] — `"include": ["js", "src", "*.tsx"]`; остальные опции (`target`, `lib`, `module`, `moduleResolution: "Node"`, `jsx: "react-jsx"`, `strict`, `allowJs`, `esModuleInterop`, `skipLibCheck`, `types: []`, `noEmit`) не трогать (TR-13, T31, A34).  
**Критерий:** `tsc` = 0 и реально читает 15 `.ts` (`npx tsc --noEmit --listFiles | grep -c "/js/"` > 0); `include` покрывает `js`, `src`, `*.tsx`. **Зависимости:** 14.2.

**14.4.** `js/model/types.ts` [ИЗМ] — в существующий `declare global` добавить `interface Window { showErrorModal?: (title: string, message: string) => void }` с комментарием «временный мост 1.7.0, удаляется после Этапа 3»; доменные типы не трогать (A33, A40, Z18).  
**Критерий:** `tsc` = 0; `Window` объявлен **один раз**; файл ≤ 200 строк (≈103); `types.ts` по-прежнему не подключён в `index.html`. **Зависимости:** 14.3.

**14.5.** `src/components/ErrorModal.tsx` [NEW] — функциональный компонент; `ErrorModalProps { title: string; message: string; onClose: () => void }`; разметка `.modal-overlay open` → `.modal` → `h2` / `p` / `button.btn.btn-primary`; клик по фону закрывает (`event.target === event.currentTarget`), `stopPropagation` на `.modal`; цвет и отступ сообщения — инлайн (`#666`, `20`), как в старой модалке; без `any`, `var` и прямого DOM; возвращаемый тип не аннотировать (в React 19 глобального `JSX.Element` нет) (TR-9, A39, T33, Z18).  
**Критерий:** `tsc` = 0; файл ≤ 200 строк (≈40); `grep -nE "\bany\b|\bvar "` — пусто; классы совпадают с `css/map_items/map-modal.css`. **Зависимости:** 14.4.

**14.6.** `src/App.tsx` [NEW] — state `ErrorMessage | null`; `useEffect` публикует `window.showErrorModal` и удаляет его при размонтировании; `handleClose` = `AudioService.play('click')` + `setError(null)`; рендер `ErrorModal` / `null`; никакой бизнес-логики (TR-11, A40, T32).  
**Критерий:** `tsc` = 0; модалка рендерится **только** через state; окно закрывается «OK» и кликом по фону; `AudioService` виден через `allowJs` (объявлений не добавлять). **Зависимости:** 14.5.

**14.7.** `main.tsx` [NEW] — `StrictMode`, `createRoot` из `react-dom/client`, `<App />`, `import './js/script.js'`, guard на `#root` (TR-8, A38, T32).  
**Критерий:** `tsc` = 0; `createRoot` (не `ReactDOM.render`); файл ≤ 200 строк (≈18); из DOM — только `document.getElementById('root')`. **Зависимости:** 14.6.

**14.8.** `index.html` [ИЗМ] — перед `</body>` добавить `<div id="root"></div>` и `<script type="module" src="/main.tsx"></script>`; `<script src="js/script.js"></script>` **закомментировать** с пояснением (файл не удалять); 14 тегов `.ts` и 20 тегов `.js`, их порядок и 6 `<link>` CSS — без изменений; `#errorOverlay` оставить (TR-10, T34, T35).  
**Критерий:** активных тегов 35 (14 `.ts` + 20 `.js` + 1 module); `#root` есть; `script.js` закомментирован; CSS-ссылки прежние; `#errorOverlay` на месте. **Зависимости:** 14.7.

**14.9.** `js/script.js` [ИЗМ] — в начало IIFE добавить мост: сохранить `legacyShowMessage = ErrorView.showMessage`; `ErrorView.showMessage = function (params) { ... }` → если `typeof window.showErrorModal === 'function'`, вызвать её, иначе `legacyShowMessage.call(ErrorView, params)`; больше ничего не менять (TR-11, TR-12, Z17).  
**Критерий:** `js/script.js` ≤ 40 строк; `js/view/**`, `js/controller/**` без изменений (`md5sum`); при отсутствии React показывается прежняя модалка. **Зависимости:** 14.8.

**14.10.** Типы и тесты — `npm run typecheck` = 0; `npm test` = **182/182**; тесты не менять (TR-13, T28, критерий 89).  
**Критерий:** 0 ошибок, включая `.tsx`; 182/182 в 14 сьютах; `vitest.config.ts` и `test/**` не изменены; новых тестов нет. **Зависимости:** 14.9.

**14.11.** Сквозной прогон гибрида — `npm run dev`: в консоли `window.showErrorModal('Тест', 'Проверка React-модалки')` → появляется `.modal-overlay.open`; клик по фону закрывает; повторно — «OK» закрывает со звуком `click`; вторая вкладка при открытой первой → в первой **React**-модалка «Игра уже запущена», `#errorOverlay` остаётся скрытой; 12 сценариев 1.6.0 (карта, счёт, позиция, 🌍, список карт, no-op, модалка сложности, отмена-откат, повторная игра, результаты, перезагрузка, `ml_stats` v3); консоль без ошибок (TR-12, TR-14).  
**Критерий:** React-модалка открывается/закрывается; игра играется как в 1.6.0; визуальных изменений нет. **Зависимости:** 14.10.

**14.12.** Аудит лимитов и запретов — `wc -l` по `main.tsx`, `src/App.tsx`, `src/components/ErrorModal.tsx`, `js/script.js`; `grep -nE "\bany\b|\bvar "` по `main.tsx` и `src/**/*.tsx`; `md5sum -c /tmp/ml-guard-1.7.0.txt`; `wc -l js/view/map-view.js` = 199, `js/controller/map-controller.js` = 198; ровно **одно** подключение `script.js`; в классических `.js` нет `import`/`export` (Z17, Z18, T2).  
**Критерий:** лимит 200 соблюдён; `any`/`var` нет; View/Controller/CSS/логика/Storage не изменены; одиночное подключение. **Зависимости:** 14.11.

**14.13.** Документация — `README.md` (React 19 и `@types`, `main.tsx`, `src/`, «Запуск»), `GIGACODE.md` (структура, «Порядок подключения в index.html», архитектура гибрида, `Window.showErrorModal` в `types.ts`), `test/README.md` (182 теста; React-слой тестами не покрыт — вне области) (критерий 90).  
**Критерий:** документы описывают 1.7.0; число тестов совпадает с фактическим; React описан как пилот, а не как «основной стек». **Зависимости:** 14.12.

**14.14.** Финальная проверка — критерии **81–90**: `tsc` = 0; `npm test` = 182/182; `npm run dev` играется; лимиты и `md5sum` сходятся; в этом файле обновить статус этапа 14 и раздел «Готовность проекта».  
**Критерий:** все пункты 81–90 ✅; отчёт о прогоне зафиксирован. **Зависимости:** 14.13.

---

## ⚛️ Этап 15. Миграция экранов на React (1.8.0) — ✅ выполнено

**Запреты этапа (Z19):** глобальное состояние (Context/Zustand/redux); оптимизация (`memo`, `useMemo` «для скорости»); новые тесты и порт UI-тестов на React; новые фичи (анимации, тосты, `Escape`/`aria-modal`/фокус-ловушки, порталы сверх `ScreenPortal`, прогресс тренажёров, звук шагов); изменение CSS (21 файл `css/**`); изменение логики игры (пороги, очки, жизни, генератор, `Stats`/`ml_stats`, `PlayerRules`/`PlayerState`).

**Запреты этапа (Z20):** классовые компоненты; `any` без необходимости; `var`; прямой DOM (`document.*`, `innerHTML`, `classList`, `addEventListener`) — кроме `getElementById('root')` в `main.tsx`, `getElementById(targetId)` в `ScreenPortal` (до 15.17) и `ref` на `.map`/`.map-player`; бизнес-логика в компонентах; дублирование доменных типов вне `src/types.ts`.

**Запреты этапа (Z21):** мигрировать два экрана одновременно; оставлять старый `view/*.js`/`controller/*.js` после шага; менять CSS «заодно»; добавлять фичи; забывать мёртвый код (`GameModel`, `.streak-badge`); оставлять два входа (`script.js` + `main.tsx`) после 15.18.

**Дополнительно:** не импортировать классические слои как ES-модули (исчезнут глобалы) — только через `<script>`-теги; не включать `checkJs`, не менять `moduleResolution`, не обновлять TypeScript/React; не менять `build` на `vite build`; не вызывать `ScreenView`/`AppController` из компонентов после 15.17; не оставлять `window.mlBridge` после 15.15 и `window.showErrorModal` после 15.17; не класть компоненты/хуки в `js/`; не писать новые тесты (разрешены только удаление сьютов удалённых файлов и правка пути к `map-layout`).

**Решения до реализации:** экран мигрирует «порталом» в существующий контейнер, `.active` до 15.17 переключает `ScreenView` (№1); модалки — в дереве `App` (№2); временный мост `window.mlBridge` — с 15.5 по 15.15 (№3); контроллеры → хуки (№4); Model/Logic/Storage/Service/Errors — классические глобалы (№5, D2); `main.tsx` — в корне (D1); движение — CSS transition 600 мс + `onTransitionEnd` (A47, D7); тесты — **141/141** в 11 сьютах после удаления 3 UI-сьютов (41 тест, №8); git нет — контрольные точки `md5sum` + журнал (№9, D12); `#root` — `display: contents` (№10, D9); мёртвый код (`GameModel`, `.streak-badge`) убирается (№11). Подробности — PLAN.md 1.8.0 (решения №1–12, отклонения D1–D12, риски) и раздел «Решения и уточнения 1.8.0».

**Соответствие PLAN.md:** 15.0 → 15.1–15.2; 15.1 → 15.3–15.5; 15.2 → 15.6–15.7; 15.3 → 15.8–15.10; 15.4 → 15.11–15.14; 15.5 → 15.15; 15.6 → 15.16–15.17; 15.7 → 15.18; 15.8 → 15.19; 15.9 → 15.20.

**Контрольные точки (D12):** после 15.5, 15.7, 15.10, 15.14, 15.15, 15.17, 15.18, 15.19 и 15.20 — `md5sum`-снимок `js/`, `css/`, `index.html` + запись метки в `/tmp/ml-1.8.0-log.txt`; перед удалением файлов шага — копия в `/tmp/ml-1.8.0-backup/<метка>/`.

**15.1.** Базовая линия 1.8.0 и журнал (PLAN 15.0, D12) — `find js css index.html -type f -exec md5sum {} + | sort > /tmp/ml-1.8.0-base.txt`; `md5sum` по `js/view`, `js/controller`, `css` → `/tmp/ml-guard-1.8.0.txt`; обнулить `/tmp/ml-1.8.0-log.txt` записью `15.0 baseline`; создать `/tmp/ml-1.8.0-backup/`; зафиксировать `npx tsc --version` (5.9.3), `npm run typecheck` (0), `npm test` (182/182 в 14 сьютах), `npm ls react react-dom` (19.3.1).  
**Критерий:** снимок, guard-файл, журнал и каталог backup созданы; `tsc` 0; `npm test` — 182/182; версии совпадают с PLAN.md «Исходное состояние». **Зависимости:** —.

**15.2.** `src/types.ts` + `src/config.ts` (PLAN 15.0) — перенести `js/model/types.ts` → `src/types.ts` (`export {}` + `declare global` сохраняются), добавить view-типы `Point`, `TrainerPoint`, `MapBand`, `MapGeometry`, `MapViewData`, `ResultsView`, `GameSessionView`, `GameFeedbackView`, временный `MlBridge` и `Window.mlBridge?` (исчезает в 15.15); `js/model/types.ts` удалить (в `index.html` не подключался — рантайм не затронут); создать `src/config.ts` — `export const config: Config = CONFIG`; `tsconfig.include` уже покрывает `src` — не менять.  
**Критерий:** `tsc` 0; `js/model/types.ts` отсутствует; `src/types.ts` ≤ 200 строк (≈160); `grep -rn "mlBridge" src/` находит объявление. **Зависимости:** 15.1.

**15.3.** `src/hooks/useAudio.ts` + `src/hooks/useResults.ts` (PLAN 15.1) — `useAudio`: `{ play(kind: 'click' | 'win' | 'lose'): void }` — обёртка `AudioService.play`; `useResults`: `{ view: ResultsView | null; show(results: GameResult): void }`, порядок 1:1 с `ResultsController.show`: `GameRules.getRating` → `Scoring.isRoundSuccessful(lives, completed)` → `onRoundFinished(isSuccessful)` (до 15.14 — `MapController.onGameFinished`) → при победе `StatsService.updateAfterRound(roundScore)` → `AudioService.play('win'|'lose')` → `earnings` (`Заработано: N ✓` / `Заработано: N (не зачтено)`) → `setView`; без таймеров и DOM.  
**Критерий:** `tsc` 0; `grep -nE "\bany\b|\bvar " src/hooks/` — пусто; порядок побочных эффектов совпадает с `results-controller.js` (сверка построчно). **Зависимости:** 15.2.

**15.4.** `src/components/ResultsScreen.tsx` (PLAN 15.1, TR-15) — разметка 1:1 с `results-view.js`: `.result-icon`, `h1`, `.subtitle`, `.stats` (две `.stat-card`), блок `#roundEarnings` с inline `text-align:center;color:#888;margin-bottom:15px`, кнопки `.btn.btn-primary` «Играть снова» и `.btn.btn-secondary` «На карту»; `ResultsScreenProps { results; rating; earnings; onPlayAgain; onBackToMap }`; без DOM и без расчётов.  
**Критерий:** `tsc` 0; файл ≤ 200 строк (≈55); классы и inline-стили совпадают с `css/results.css` и `results-view.js`; `grep -nE "\bany\b|\bvar "` — пусто. **Зависимости:** 15.3.

**15.5.** Интеграция результатов + удаление старого (PLAN 15.1) — `src/App.tsx`: `useResults`, `navigate('results')` через `ScreenView.showScreen`, `ScreenPortal` в `#resultScreen`; эффект публикует/снимает `window.mlBridge.showResults` (обработчик: `results.show(r)` + `navigate('results')`); `onPlayAgain` → `AppController.onStartGame()`, `onBackToMap` → `AppController.showCurrentMap()` + `navigate('map')`; `js/controller/game-controller.js` — в конце раунда `window.mlBridge?.showResults(this._sessionModel.getResults())` вместо `ResultsController.show(...)`; `js/controller/app-controller.js` — убрать `ResultsController.init()`; `index.html` — −2 тега (`results-view.js`, `results-controller.js`), `#resultScreen` → пустой `<div class="screen" id="resultScreen"></div>`; удалить `js/view/results-view.js`, `js/controller/results-controller.js`.  
**Критерий:** победа и провал рисуются React-ом (иконка, заголовок, статистика, «Заработано … ✓/не зачтено»), звуки, позиция и `ml_stats` как раньше; `tsc` 0; `npm test` — 182/182; точка `results` в журнале. **Зависимости:** 15.4.

**15.6.** `src/hooks/useMapSelection.ts` (PLAN 15.2, TR-16) — `{ isOpen, maps, currentMap, open(), close(), select(mapId) }`; `open()` — `click` + снимок `{ maps: CONFIG.MAPS, currentMap: StatsService.getCurrentMap() }`; `close()` — `click`; `select(id)` — `if (!StatsService.switchMap(id)) return;` → `click` → `close()` → `onMapChanged()` (до 15.14 — `AppController.showCurrentMap()`); та же или неизвестная карта — полный no-op (без звука, без закрытия, без записи).  
**Критерий:** `tsc` 0; no-op подтверждён кодом и ручной проверкой; хук не трогает DOM. **Зависимости:** 15.2.

**15.7.** `src/components/MapSelectionModal.tsx` + интеграция (PLAN 15.2) — `null` при закрытии, иначе `.modal-overlay open` → `.modal` → `h2` «Выбор карты» → `.map-select-list` → `.map-select-item` (+`selected` у текущей) → `.btn.btn-secondary` «Закрыть»; `MapSelectionModalProps { maps; currentMap; onSelect; onClose }`; `src/App.tsx` — рендер модалки + мост `openMapSelection`/`closeMapSelection`/`selectMap`; `js/controller/global-map-controller.js` сжать до адаптера (≈20 строк): `init()` вешает только клик на `#globalMapBtn` → `window.mlBridge?.openMapSelection()`; `index.html` — −1 тег (`global-map-view.js`), разметка `#mapSelectModal` удаляется; удалить `js/view/global-map-view.js` и `test/map/global-map-controller.test.js` (9).  
**Критерий:** 🌍 открывает список, текущая выделена; «Закрыть» закрывает; та же карта — no-op; другая — `switchMap`, позиция `−1`, карта перерисована legacy-путём; `tsc` 0; **173/173** в 13 сьютах; точка `map-select`. **Зависимости:** 15.6.

**15.8.** `src/hooks/useGame.ts` (PLAN 15.3, TR-17) — `SessionModel` и `ProblemGenerator` в `useRef`; `start(difficulty?)` = `reset` + `setDifficulty` + `generator.setDifficulty` + сброс состояния (счёт 0, жизни, `1/10`, прогресс 10 %, первый вопрос); `answer(index)` = `click` → `GameRules.checkAnswer` → `recordCorrect`/`recordIncorrect` → `+10` на 1.5 с (таймер очищается в cleanup) → классы ответов, `feedback` (тексты 1:1), жизни, счёт; `next()` = `click` → `advanceQuestion` → `GameRules.shouldEndGame` ? `setCompleted(true)` + `onRoundFinished(results)` : следующий вопрос + счётчик/прогресс + скрытие feedback; `exit()` = `click` + `confirm('Выйти из игры? Заработано N очков сгорят.')` → `onExitToMap()`; наружу — снимок `GameSessionView`, модель не отдаётся.  
**Критерий:** `tsc` 0; `any`/`var` нет; порядок answer/next/exit совпадает с `game-controller.js` + `AppController.onStartGame`/`onExit`; таймер `+10` очищается. **Зависимости:** 15.5.

**15.9.** `src/components/GameScreen.tsx` (PLAN 15.3, TR-17) — `.game-header` (`.close-btn` → `onExit`, `.progress-bar`/`.progress-fill`, `.round-score`, `.question-counter`, `.lives`, `.score-badge`), `.question`, `.answers` с 4 `.answer-btn` (`key`, `data-index`, классы `correct`/`wrong`, `disabled` после ответа), `.feedback` (+`show`) и кнопка «Продолжить»; `GameScreenProps { session; question; feedback; selectedIndex; correctIndex; floatingScore; onAnswer; onNext; onExit }`; разметка и классы 1:1 с `game-view.js`.  
**Критерий:** `tsc` 0; файл ≤ 200 строк (≈120); списки ответов с `key`; `onClick`, без `React.createElement` и `onclick=`; `any` нет. **Зависимости:** 15.8.

**15.10.** Интеграция игры + удаление старого (PLAN 15.3) — `src/App.tsx`: `useGame`, портал `<GameScreen/>` в `#gameScreen` при `screen === 'game'`, мост `startGame` (`game.start(diff)` + `navigate('game')`), `onRoundFinished` → `results.show`, `onExitToMap` → `MapController.onExitGame()` + `AppController.showCurrentMap()` + `navigate('map')` (до 15.14); `js/controller/app-controller.js` — `onStartGame` сжать до адаптера `window.mlBridge?.startGame(difficulty)`, удалить `onExit` и `_sessionModel`, `init()` без аргументов, без `#nextBtn`/`#exitBtn` и без `GameView`; `js/script.js` — убрать `sessionModel`/`generator`/`GameController.setDeps`; `index.html` — −2 тега (`game-view.js`, `game-controller.js`), `#gameScreen` → пустой контейнер; удалить `js/view/game-view.js`, `js/controller/game-controller.js`; снять `window.mlBridge.showResults` и `MlBridge.showResults`.  
**Критерий:** верный/неверный ответ, классы, feedback, `+10`, жизни и счёт как раньше; победа и провал → результаты; ✕ → `confirm` и откат/сохранение; `tsc` 0; **173/173**; точка `game`. **Зависимости:** 15.9.

**15.11.** Подкомпоненты карты (PLAN 15.4, TR-18, T40) — `Zone.tsx` (`band`, `isFirst`, `isLast`, `titleSide`), `Trainer.tsx` (`trainer`, `action: 'play' | 'move' | 'ignore'`, `onSelect`), `Player.tsx` (`point`, `isMoving`, `onArrived` — `ref` + `onTransitionEnd`), `Path.tsx` (`width`, `height`, `d` — один `<path>` с кубическими кривыми `C`); разметка и классы 1:1 с `_buildZone`/`_buildTrainer`/`MapPlayerView`/`_buildRoad`.  
**Критерий:** `tsc` 0; 4 файла ≤ 200 строк (≈30/30/25/20); один `<svg>` и один `<path>` на карту; `key` в списках. **Зависимости:** 15.2.

**15.12.** `src/components/MapScreen.tsx` (PLAN 15.4, TR-18) — `.map` с `ref` для замера ширины и `style={{ height }}`; `.map-zone` × 3 через `Zone`, `svg.map-road` + `Path`, `.map-trainer` × 15 через `Trainer`, `Player`; модалка сложности: `.modal-overlay open` → `.modal` → `h2` «{zoneTitle} · Тренажёр {N}» → три `.diff-btn` (+`selected`) → `.btn.btn-secondary` «Отмена»; `MapScreenProps` из PLAN (`stats`, `mapData`, `isMoving`, `isModalOpen`, `modalTarget`, `selectedDifficulty`, `onTrainerClick`, `onSelectDifficulty`, `onCancel`, `onPlayerArrived`).  
**Критерий:** `tsc` 0; файл ≤ 200 строк (≈90); DOM — только `ref` на `.map`; `key` у зон и тренажёров; классы и inline-стили как в `map-view.js`. **Зависимости:** 15.11.

**15.13.** `src/hooks/useMap.ts` (PLAN 15.4) — `PlayerState` + `reload()` (`MapCatalog.get` → зоны → `PlayerRules.normalizeIndex(StatsService.getTrainerIndex(), total)` → счёт); клик: `PlayerRules.getAction` → `ignore` (без звука) / `play` (модалка) / `move` (`click`, `moveTo`, `isMoving`, `arrived` в `ref`); прибытие — из `onTransitionEnd` (`propertyName === 'transform'`, `target === currentTarget`), затем модалка; отмена — закрыть + `revert`; `gameFinished(ok)` — реплей не пишет, победа `commitWin` + `saveTrainerIndex`, провал `revert` + `saveTrainerIndex`; `exitGame()` — реплей не двигает, иначе `revert`; resize + debounce 100 мс; `totalScore` в состоянии; ширина — `ref` + `useLayoutEffect` + повторный замер после появления скроллбара.  
**Критерий:** `tsc` 0; файл ≤ 200 строк (≈160; при переполнении вынести resize, не дублируя логику); движение — 600 мс на CSS transition, без `setTimeout`-на-приход; `any`/`var` нет. **Зависимости:** 15.12.

**15.14.** Интеграция карты + удаление старого (PLAN 15.4) — `src/App.tsx`: `useMap` (до `useResults`), портал `<MapScreen/>` в `#mapRoot`; `useResults` → `map.gameFinished` и `map.reload()` + `navigate('map')`; `onSelectDifficulty` → `game.start(diff)`; выход из игры → `map.exitGame()` + `navigate('map')`; `js/view/screen-view.js` — удалить `highlightDifficulty`, оставить `showScreen`; `js/view/map-layout.js` → `js/logic/map-layout.js` (шапка файла, `index.html`); `test/map/map-layout.test.js` — только путь; `index.html` — −3 тега, `map-layout` в блок Logic, `#mapContainer` → `<div id="mapRoot"></div>`, разметка `#difficultyModal` удаляется; удалить `js/view/map-view.js`, `js/view/map-player-view.js`, `js/controller/map-controller.js`, `test/map/map-view.test.js` (13), `test/map/map-controller.test.js` (19); `app-controller.js` теряет `showCurrentMap`/`onStartGame`/`onExit` и вызов `showCurrentMap()` из `init()`.  
**Критерий:** карта 15 тренажёров, шаг 100px, игрок 52px; клик текущий/соседний/дальний, движение, модалки, «Отмена», победа/провал, resize (debounce) и скроллбар — как в 1.7.0; `tsc` 0; **141/141** в 11 сьютах; точка `map`. **Зависимости:** 15.13.

**15.15.** `src/components/Header.tsx` + интеграция шапки (PLAN 15.5, TR-19) — `.total-score` («🏆 N») и `.global-map-btn` 🌍 → `onOpenMapSelection`; `HeaderProps { totalScore; onOpenMapSelection }`; `App` — портал в `#headerRoot`, `totalScore` из `useMap`, `openMapSelection` = `click` + `mapSelection.open()`; `js/controller/app-controller.js` — убрать `GlobalMapController.init()`; `index.html` — −1 тег, `#totalScore` и `#globalMapBtn` → `<div id="headerRoot"></div>` перед `#mapRoot`; удалить `js/controller/global-map-controller.js`; **снять `window.mlBridge` и `MlBridge`**.  
**Критерий:** счёт на карте равен `StatsService.getTotalScore()` и обновляется после раунда; 🌍 открывает/закрывает модалку; смена карты перерисовывает карту и счёт; `tsc` 0; **141/141**; `grep -rn "mlBridge" js/ src/` — пусто; точка `header`. **Зависимости:** 15.14.

**15.16.** `src/hooks/useSessionLock.ts` (PLAN 15.6, TR-20) — эффект: `BroadcastChannel('mathlingo_session')` + `hello`; при сообщении второй вкладки однократно `showError('Игра уже запущена', 'Закройте другую вкладку с MathLingo.')`; cleanup закрывает канал; fallback — `ml_session_lock` в `localStorage`.  
**Критерий:** `tsc` 0; двойной монтаж `StrictMode` не дублирует модалку; канал и слушатели закрываются в cleanup. **Зависимости:** 15.2.

**15.17.** Каркас приложения (PLAN 15.6, TR-20) — `src/App.tsx` рендерит весь каркас: `#mapScreen` (`.screen`/`.active` из `screen`) + `<Header/>` + `<MapScreen/>`; `.app` → `<GameScreen/>` + `<ResultsScreen/>`; модалки и `ErrorModal` рядом; `ScreenView.showScreen` из `navigate` убрать; `useSessionLock(showError)`; удалить `window.showErrorModal` и `Window.showErrorModal`; «экран приветствия» — подтвердить отсутствие (D6); `index.html` — `#root` + `style="display: contents"`, удалены обёртки экранов, `#errorOverlay`, `.streak-badge`, комментарий `script.js`; `js/script.js` — убрать мост `ErrorView` и `AppController.init()`; удалить `app-controller.js`, `session-controller.js`, `screen-view.js`, `error-view.js`, `dom.js`.  
**Критерий:** карта — главный экран; переходы только через состояние; вторая вкладка → **React**-модалка, `#errorOverlay` отсутствует; карточка 600px и центрирование как раньше; `tsc` 0; **141/141**; точка `app-shell`. **Зависимости:** 15.15, 15.16.

**15.18.** Чистый вход (PLAN 15.7, TR-21) — `src/bootstrap.ts` (`AudioService.preload` → `new LocalStorageRepository(CONFIG.STORAGE_PREFIX + 'stats')` → `StatsService.init` → `SessionService.init(new SessionRepository())` → `ErrorHandler.init`); `main.tsx` без `import './js/script.js'`, `bootstrap()` до `createRoot`; удалить `js/script.js`, каталоги `js/view/` и `js/controller/` (пустые), `js/model/game-model.ts` (мёртв, №11); итог `js/` — 19 файлов (13 `.ts` + 6 `.js`), 19 classic-тегов + модуль (D2).  
**Критерий:** `grep -rn "script.js\|ScreenView\|AppController\|ResultsController\|GameController\|MapController\|ErrorView" js/ src/ index.html` — пусто; `tsc` 0; **141/141**; игра работает без `script.js`; точка `legacy-entry`. **Зависимости:** 15.17.

**15.19.** Сквозной прогон и аудит (PLAN 15.8, TR-22) — `npm run dev`: 16 сценариев PLAN (карта/позиция/счёт; текущий, соседний, дальний тренажёр; «Отмена»; старт игры; верный и неверный ответ; «Продолжить»; победа и провал; «Играть снова»; «На карту»; 🌍 → другая карта `−1` → возврат; перезагрузка; вторая вкладка); `npx tsc --noEmit` — 0; `npm test` — 141/141 в 11 сьютах; `md5sum -c /tmp/ml-guard-1.8.0.txt` (сверять только `css/`); `wc -l` по `src/**` ≤ 200; `grep -n "any\|var \|React.createElement\|onclick=" src/` — 0; `grep -n "key=" src/components/*.tsx` — все списки с `key`, `createPortal` — только `ScreenPortal`.  
**Критерий:** все 16 сценариев зелёные, консоль чиста; CSS (`css/**`) не изменён; лимиты и запреты соблюдены; точка `final-run`. **Зависимости:** 15.18.

**15.20.** Документация и финальная проверка (PLAN 15.9) — `README.md` (React 19, 10 компонентов, 6 хуков, `src/`, 141/141 и почему меньше, запуск без изменений), `GIGACODE.md` (структура без `view/controller`, архитектура `bootstrap` + classic-слои, 19 тегов + модуль, история мостов 1.7.0 → 1.8.0), `test/README.md` (11 сьютов/141; удаление 3 сьютов и переезд `map-layout`), `.gigacode/specs/SPEC.md` — статус 1.8.0 → «Выполнено»; в этом файле — статус этапа 15 и «Готовность проекта»; критерии **91–106**.  
**Критерий:** документация соответствует коду; критерии 91–106 ✅; все контрольные точки в журнале (`15.0 baseline` … `docs 1.8.0`). **Зависимости:** 15.19.

---

## 🧮 Этап 16. Статистика раунда (1.8.1) — ✅ выполнено

> ℹ️ Итог 1.8.1: `_correct`/`_wrong` и инкременты в `recordCorrect`/`recordIncorrect`, `total = correct + wrong`, `reset()` обнуляет счётчики; сьют `test/model/session-model.test.js` — 15 тестов (**156/156** в 12 сьютах, red → green); `npx tsc --noEmit` — 0; изменены только `js/model/session-model.ts` и новый тест.

**Запреты этапа (Z22):** вычислять `correct`/`wrong` из `_currentQuestionIndex`, `_roundScore`, `_lives`, `POINTS_BASE` или DOM; менять `CONFIG` (`TOTAL_QUESTIONS`, `MAX_LIVES`, `POINTS_BASE`, `RATINGS`, `GAMEOVER`); менять разметку и CSS экрана результатов, добавлять точность/«из 10»; трогать `Stats`, позицию, карту, звук, блокировку вкладок; добавлять фичи (серии, бонусы, таймеры, анимации) и рефакторить вне дефекта; менять сигнатуры `recordCorrect`/`recordIncorrect`/`reset`/`getResults`; «чинить» через пересчёт в `Scoring`/`GameRules`/на экране.

**Запреты этапа (Z23):** копировать логику модели в тест вместо вызова `SessionModel`; подменять/дублировать `CONFIG` (только `test/setup.js`); ослаблять или удалять старые тесты; писать тест, проходящий и на баге; проверять только `roundScore` без `correct`/`wrong`/`total`.

**Дополнительно:** не править `src/**` (`useGame`, `useResults`, `ResultsScreen`), `js/logic/game-rules.ts`, `src/types.ts`, `index.html`, `css/**`; не добавлять геттеры/сеттеры счётчиков; не делать `total` зависимым от `TOTAL_QUESTIONS`; не менять числа в README «на глаз»; не оставлять `test/README.md`/`GIGACODE.md` с 141/11.

**Решения до реализации:** счётчики — в `SessionModel`, инкремент — в `recordCorrect`/`recordIncorrect` (A48); `total = correct + wrong` с комментарием (A49); оценка — существующий `GameRules.getRating`, без правок (A50, D13); `reset()` обнуляет счётчики (A51); тест — реальная модель через `readSource` + `eval`, `CONFIG` из `setup.js` (T42); 15 тестов, итог 156/12; изменяются ровно два кодовых файла (T43/D17). Подробности — PLAN.md 1.8.1 (решения №1–9, отклонения D13–D17, риски).

**Соответствие PLAN.md:** 16.0 → 16.1; 16.1 → 16.2; 16.2 → 16.3; 16.3 → 16.4; 16.4 → 16.5; 16.5 → 16.6.

**Контрольные метки журнала:** `16.0 baseline` (16.1), `red-8-2` (16.2), `fix-model` (16.3), `ui-check` (16.4), `docs 1.8.1` (16.5), `final-run` (16.6) — в `/tmp/ml-1.8.1-log.txt`; снимок `git rev-parse HEAD` и `git status --short` — `/tmp/ml-1.8.1-baseline.txt`; копия модели и образца теста — `/tmp/ml-1.8.1-backup/`.

**16.1.** Базовая линия и откат (PLAN 16.0) — `npx tsc --noEmit` (0), `npm test` (141/141 в 11 сьютах), `git rev-parse HEAD` (`5cec9da`) и `git status --short` → `/tmp/ml-1.8.1-baseline.txt`; обнулить `/tmp/ml-1.8.1-log.txt` записью `16.0 baseline`; скопировать `js/model/session-model.ts` и `test/model/stats-schema.test.js` (образец `eval`-загрузки) в `/tmp/ml-1.8.1-backup/`; зафиксировать текущие «141 тест в 11 сьютах» в README, `test/README.md`, `GIGACODE.md` как то, что пойдёт под замену в 16.5.  
**Критерий:** срез и журнал созданы, копия модели есть; `tsc` 0; `npm test` 141/141; откат одного файла возможен без коммита. **Зависимости:** —.

**16.2.** `test/model/session-model.test.js` [NEW] (PLAN 16.1, T42) — сьют на реальной модели: `const { readSource } = require('../ts-source');`, `eval(readSource('./js/model/session-model.ts') + '\nglobal.SessionModel = SessionModel;')`, затем `eval(readSource('./js/logic/game-rules.ts') + '\nglobal.GameRules = GameRules;')` (только для оценки); `CONFIG` — из `test/setup.js`; `beforeEach` создаёт новую модель. 15 тестов: `recordCorrect` — 1) 1 верный → `correct 1`, `roundScore 10`; 2) 8 верных → `correct 8`, `roundScore 80`; 3) 3 × `advanceQuestion` + 1 верный → `correct 1`; `recordIncorrect` — 4) 1 ошибка → `wrong 1`, `lives 2`; 5) 3 ошибки → `wrong 3`, `lives 0`; 6) 1 верный + 1 ошибка → `correct 1`, `wrong 1`, `roundScore 10`, `lives 2`; `getResults` — 7) **8/2** + `setCompleted(true)` → `8/2/10/80/lives 1/completed true`, `getRating` = 🎉 «Отлично!»; 8) **10/10** → `10/0/10/100`, 🏆; 9) **0/3** (жизни 0) → `0/3/3`, 💔 «Игра окончена»; 10) 3 верных + 1 ошибка с `advanceQuestion` → `total = 4`; 11) без ответов → `0/0/0`, точность 0; 12) `setCompleted(true)` без ответов → `completed true`, `total 0`; `reset` — 13) после 1 верного и 1 ошибки → `0/0/0`; 14) после `setDifficulty('hard')` и ответов, затем `reset()` → `lives 3`, `difficulty = CONFIG.START_DIFFICULTY`, индекс 0, `completed false`; 15) второй раунд после `reset()` → 1 верный → `correct 1`, `wrong 0`, `total 1`. Прогнать `npx vitest run test/model/session-model.test.js` → **красный**: падают 14 из 15 (зелёным остаётся только №14), 8/2 даёт `wrong = 10` вместо 2; записать метку `red-8-2` в журнал.  
**Критерий:** файл создан, тест вызывает модель (логика не скопирована), `CONFIG` не дублирован; 8/2 падает; `git status --short` — только новый файл. **Зависимости:** 16.1.

**16.3.** `js/model/session-model.ts` [ИЗМ] (PLAN 16.2, TR-23/24/26) — добавить поля `_correct: number` и `_wrong: number` и инициализировать их нулями в конструкторе; `recordCorrect()` — `_correct++` вместе с `_roundScore += CONFIG.POINTS_BASE`; `recordIncorrect()` — `_wrong++` и `_lives--`; `reset()` — `_correct = 0`, `_wrong = 0` вместе с остальными полями; `getResults()` — `correct: this._correct`, `wrong: this._wrong`, `total: this._correct + this._wrong` + комментарий: `total` — фактически отвечено (A49), неотвеченные вопросы не являются ошибками, «0 из 10» после трёх ответов вводил бы в заблуждение; геттеры/сеттеры прежних полей, `advanceQuestion`, сигнатуры и JSDoc-стиль — не менять.  
**Критерий:** `npx vitest run test/model/session-model.test.js` — **15/15**; `npm test` — **156/156** в 12 сьютах; `npx tsc --noEmit` — 0; `grep -n "TOTAL_QUESTIONS" js/model/session-model.ts` — пусто; файл ≤ 130 строк (≈118); метка `fix-model`. **Зависимости:** 16.2.

**16.4.** Проверка UI и локализации (PLAN 16.3, TR-25, T43, Z22) — `git diff --name-only` → только `js/model/session-model.ts` и `test/model/session-model.test.js`; `git diff --stat -- src/ css/ index.html js/logic js/service js/storage js/errors js/model/config.ts` → пусто; `npm run dev`: (а) 8 верных + 2 ошибки → «🎉 Отлично!», «Правильных: 8», «Заработано: 80 ✓», позиция закреплена, `ml_stats` +80; (б) 10 верных → «🏆 Идеально!», «Правильных: 10», 100 очков; (в) 3 ошибки подряд → «💔 Игра окончена», «Правильных: 0», очки не зачтены, позиция откачена; (г) «Играть снова» → 0/0/0, жизни 3/3, счёт раунда 0; консоль без ошибок; `localStorage.ml_stats` — `version: 3`, структура и суммы прежние.  
**Критерий:** четыре сценария дают ожидаемые экраны; React-слой и CSS не изменены; `ml_stats` v3; метка `ui-check`. **Зависимости:** 16.3.

**16.5.** Документация (PLAN 16.4, TR-27) — `README.md`: «141 тест в 11 сьютах» → **156 в 12** (запуск, тесты, статус), `test/model/` + сьют `session-model`, раздел «1.8.1 — статистика раунда» (счётчики, `total = отвечено`, 8/2 → «Отлично!»), строка статуса 1.8.1, в smoke-тесте п. 11 — «победа с 8 верными из 10 → «Отлично!», «Правильных» = 8, «Заработано: 80 ✓»» (сценариев по-прежнему 16); `test/README.md`: структура (+`model/session-model.test.js` — 15), таблица покрытия (+`model/session-model.ts` — 15), итог **156**, раздел «1.8.1» (red → green); `GIGACODE.md`: 156/12, `test/model/` в структуре, «счётчики ответов в `SessionModel`»; `.gigacode/specs/SPEC.md` — статус 1.8.1 → «Выполнено».  
**Критерий:** числа в README/test/README/GIGACODE совпадают с фактическим прогоном; SPEC/TASKS/PLAN — 1.8.1; метка `docs 1.8.1`. **Зависимости:** 16.4.

**16.6.** Финальный прогон и аудит (PLAN 16.5, критерии 107–118) — `npx tsc --noEmit` = 0; `npm test` = 156/156 в 12 сьютах (141 прежний зелёный); `git status --short` + `git diff --name-only` (код — 2 файла, документация — README/test/README/GIGACODE/SPEC/TASKS/PLAN+архив; `src/`, `css/`, `index.html`, `js/logic`, `js/model/config.ts` — без правок); `grep -n "_currentQuestionIndex" js/model/session-model.ts` — не в `getResults`; `grep -n "TOTAL_QUESTIONS" js/model/session-model.ts` — пусто; `wc -l` ≤ 200; `grep -nE "any|var |console.log"` — пусто; `npm run dev` — сценарии 16.4 + базовые (карта, 🌍, вторая вкладка) без регрессий; `localStorage.ml_stats` — v3; в этом файле — статус этапа 16 и «Готовность проекта»; при согласии владельца — один коммит `fix(1.8.1): фактическая статистика раунда`; метка `final-run`.  
**Критерий:** критерии 107–118 ✅; 156/156 и `tsc` 0; локализация и `ml_stats` подтверждены; все метки в журнале. **Зависимости:** 16.5.

---

## 🧩 Этап 17. ES-модули (1.8.2) — ✅ выполнено

> ℹ️ Цель 1.8.2: один граф ES-модулей вместо 19 `<script>`-тегов и глобалов. Слои: `src/core` (13 модулей) ← `src/data` (4) ← `src/services` (1) ← `src/app` (composition root); `index.html` — `#root` + один `<script type="module" src="/src/main.tsx">`; каталог `js/` удаляется целиком. Поведение, разметка, CSS (21 файл), тексты, `CONFIG`, `Stats` v3 и ключи `ml_stats`/`ml_session_lock` — **не меняются**. `npx tsc --noEmit` — 0; `npm test` на этом этапе **красный** (9 сьютов / 113 тестов) — тесты переписываются на `import` на этапе 3.

> ✅ Итог 1.8.2 (17.11): `tsc` — 0; `js/` удалён; `index.html` — 1 скрипт; `grep` по `declare global` / `window.*=` / `global.` / `SessionService` / `bootstrap` в `src` — пусто; `src/hooks/useMap.ts` — 200 строк; тесты — **9 сьютов / 113 тестов красные, 43/156 зелёных** (факт); dev-smoke — **15/15**; `npx vite build` — собирается; ветка `refactor/es-modules`, без мержа.

**Запреты этапа (Z24):** оставлять `declare global`, `window.*`-мосты, `globalThis.*`, `global.*` в `src/`; подключать код тегами `<script>` (кроме одного module-скрипта) и `<link>` для CSS; реэкспортировать `CONFIG` (`src/config.ts`) и использовать `config` в нижнем регистре; создавать сервисы в хуках/компонентах, хранить их в модульных переменных, вызывать `init(repo)`, деструктурировать методы; менять значения `CONFIG`, формат `Stats` v3, ключи `ml_stats`/`ml_session_lock`; менять разметку, id, классы, тексты, CSS, звуки; добавлять зависимости (`@vitejs/plugin-react`, Context/Zustand и т.п.); переписывать тесты, включать `allowJs: false`, «чинить» `vite build`; мержить ветку до зелёного `npm test` (этап 3).

**Запреты этапа (Z25):** удалять, скипать, ослаблять тесты или менять `test/**`; подгонять пути `readSource` под новую структуру; объявлять успех по «частично зелёному» прогону; скрывать красный список из отчёта.

**Запреты этапа (Z26):** коммитить `node_modules`, `dist`, кэш Vite; делать `git add -A`; мержить `refactor/es-modules` в основную ветку; переписывать историю (`rebase -i`, `reset --hard`) без согласования.

**Решения до реализации:** порядок `core → data → services → ui/types → app+main → tsconfig+index → удаление js/ → smoke → docs`; `src/types.ts` удаляется после смены `tsconfig` (D18); `src/config.ts` — с потребителями (D19); `SessionService`/`SessionRepository` — на шаге удаления `js/` (D23), пока `bootstrap` жив; сервисы создаются один раз в `createServices()`, хуки получают их первым аргументом (A54/T46); клики в `App` — через проп `services.audio.play('click')` (D20); `allowJs: true` до этапа 3 (спека D2); `test/**` не трогается. Подробности — PLAN.md 1.8.2 (решения №1–14, отклонения D18–D33, риски).

**Соответствие PLAN.md:** 17.0 → 17.1; 17.1 → 17.2; 17.2 → 17.3; 17.3 → 17.4; 17.4 → 17.5; 17.5a → 17.6; 17.5b → 17.7; 17.6 → 17.8; 17.7 → 17.9; 17.8 → 17.10; 17.9 → 17.11.

**Контрольные метки журнала:** `17.0 baseline` (17.1), `core` (17.2), `data` (17.3), `services` (17.4), `types-ui` (17.5), `app` (17.6), `build` (17.7), `remove-js` (17.8), `red-list`/`smoke` (17.9), `docs 1.8.2` (17.10), `final-audit` (17.11) — в `/tmp/ml-1.8.2-log.txt`; снимок baseline — `/tmp/ml-1.8.2-baseline.txt`; копии для отката — `/tmp/ml-1.8.2-backup/`; красный список — `/tmp/ml-1.8.2-red.txt`.

**17.1.** Базовая линия, ветка и откат (PLAN 17.0, TR-40/A58) — `git status --short` (ожидаемо: `SPEC.md`/`RULES.md` modified, untracked `spec_v1_8_2.md`, `rules_v_1_8_2.md`, `PLAN_v1_8_1.md`; чужие правки не коммитить); `git switch -c refactor/es-modules` от `HEAD` (`a6f6ffa`); `npx tsc --noEmit` (0), `npm test` (156/156 в 12 сьютах), `git rev-parse HEAD`, `git branch --show-current` → `/tmp/ml-1.8.2-baseline.txt`; копии `js/`, `src/`, `index.html`, `tsconfig.json`, корневого `main.tsx` → `/tmp/ml-1.8.2-backup/`; записать прогноз красного списка — **9 сьютов / 113 тестов** (`config` 6, `map-catalog` 9, `session-model` 15, `stats-schema` 16, `player-rules` 13, `player-state` 7, `map-layout` 18, `audio-service` 5, `stats-service` 24), зелёными останутся **3 / 43** (`scoring` 8, `game-rules` 12, `generator` 23); метка `17.0 baseline`.  
**Критерий:** ветка `refactor/es-modules`; baseline-файл и копии есть; `tsc` 0; `npm test` 156/156; прогноз red-list записан. **Зависимости:** —.

**17.2.** `src/core` — 13 модулей (PLAN 17.1, TR-28/29/30/31, A52–A56) — создать `config`, `types`, `errors`, `error-handler`, `session-model`, `map-catalog`, `stats-schema`, `game-rules`, `generator`, `scoring`, `player-rules`, `player-state`, `map-layout`; перенести содержимое из `js/` (шесть `.js` → `.ts`), добавить `export` и явные `import`; `CONFIG` — `export const`, `ZONES`/`MAPS` — внутренние `const`; `core/types.ts` — домен, включая геометрию (`Point`, `TrainerPoint`, `MapBand`, `MapGeometry`); `src/types.ts` пока **не трогать** (нужен ещё не перенесённому `js/`); JSDoc заменить сигнатурами, краевые случаи (`undefined`, `NaN`, пустые массивы, фолбэки) сохранить 1:1; `any` не добавлять.  
**Критерий:** `npx tsc --noEmit` 0; `grep -R "window\.\|localStorage\|from 'react'" src/core` — только `window.addEventListener` в `error-handler.ts`; `declare global` в `src/core` — 0; `git diff --name-only` — только `src/core/**`; метка `core`. **Зависимости:** 17.1.

**17.3.** `src/data` — 4 модуля (PLAN 17.2, TR-28/36/38) — `repository.ts`, `local-repository.ts`, `memory-repository.ts`, `stats-service.ts`; `StatsService` — **класс**: `constructor(repo: Repository)`, `init()` удалён, `_repo` не `null`; `load/save/getCurrentMap/getTotalScore/updateAfterRound/getTrainerIndex/saveTrainerIndex/switchMap/reset` 1:1, включая `try/catch` и `handleError`; `LocalStorageRepository` бросает те же три исключения; `MemoryRepository` остаётся (тестовый двойник этапа 3); `SessionService`/`SessionRepository` пока не трогать.  
**Критерий:** `npx tsc --noEmit` 0; в `src/data` нет React/`services`/`components`; `grep -R "init(" src/data` — пусто; метка `data`. **Зависимости:** 17.2.

**17.4.** `src/services` — `audio-service.ts` (PLAN 17.3, TR-30/38) — класс `AudioService` вместо IIFE: `export type AudioKind`, `_sounds: Map<string, HTMLAudioElement>`, `_isReady`, `preload()`, `play(kind: AudioKind)`, `cloneNode().play().catch(() => {})`, `try/catch` + `console.warn` — 1:1.  
**Критерий:** `npx tsc --noEmit` 0; `AudioService` — только объявление в этом файле; ошибки звука глотаются; метка `services`. **Зависимости:** 17.3.

**17.5.** `src/ui/types.ts` (PLAN 17.4, TR-31/A56) — `MapViewData`, `MapModalTarget`, `ResultsView`, `GameSessionView`, `GameFeedbackView`; каждый — `export interface`; домен — только `import type { … } from '../core/types'`; `declare global` нет.  
**Критерий:** `npx tsc --noEmit` 0; 5 view-моделей; `grep -R "declare global" src/ui` — пусто; метка `types-ui`. **Зависимости:** 17.2.

**17.6.** Composition root и оболочка (PLAN 17.5a, TR-32/33/36, A54/T46) — `src/app/types.ts` (`interface Services`) и `src/app/createServices.ts` (`new StatsService(new LocalStorageRepository(CONFIG.STORAGE_PREFIX + 'stats'))`, `new AudioService()`); `src/main.tsx` (перенос корневого: `createServices()` → `services.audio.preload()` → `initGlobalErrorHandlers()` → проверка `#root` → `render(<StrictMode><App services={services} /></StrictMode>)`, **без CSS-импортов** до 17.7); `App.tsx`: `App({ services }: AppProps)`, `useMap(services)`, `useResults(services, …)`, `useGame(services, …)`, `useMapSelection(services, …)`, клики — `services.audio.play('click')`, типы — `import type`; хуки: `services` первым аргументом, `config` → `CONFIG`, `StatsService`/`AudioService` → `services.stats`/`services.audio`, `readMapState(services)`; компоненты: `GameScreen` → `CONFIG`, `MapScreen` → `PlayerRules` + типы, остальные — `import type`; удалить `src/config.ts`, `src/bootstrap.ts`, `src/hooks/useAudio.ts`, корневой `main.tsx`.  
**Критерий:** `npx tsc --noEmit` 0 (по старому `tsconfig`); `grep -R "declare global" src` — пока ещё `src/types.ts` (уйдёт в 17.7); `grep -R "SessionService\|SessionRepository" src` — пусто; метка `app`. **Зависимости:** 17.3, 17.5.

**17.7.** Сборка и один вход (PLAN 17.5b, TR-34/35, T47/T48) — `tsconfig.json` по T47 (`moduleResolution: "Bundler"`, `verbatimModuleSyntax`, `isolatedModules`, `types: ["vite/client"]`, `allowJs: true`, `include: ["src", "test", "vite.config.ts", "vitest.config.ts"]`); `src/main.tsx` — шесть CSS-импортов в порядке `base`, `buttons`, `screens`, `game`, `results`, `map`; `index.html` — `head` (`charset`/`viewport`/`title`), `#root` с `style="display: contents"`, один `<script type="module" src="/src/main.tsx">`; удалить `src/types.ts` (после `include: ["src", …]` глобалы больше не нужны).  
**Критерий:** `npx tsc --noEmit` 0; `grep -R "declare global" src` — пусто; `grep -c '<script' index.html` → 1; `grep -R '<script src="js/' index.html` — пусто; `npm run dev` — приложение открывается, консоль чистая; метка `build`. **Зависимости:** 17.6.

**17.8.** Удаление `js/` и мёртвого кода (PLAN 17.6, TR-36/39, A57) — `git rm -r js/` (включая `service/session-service.ts` и `storage/session-repository.ts`); проверить `test ! -d js`, `find src -name '*.js'` — пусто, `grep -R "SessionService\|SessionRepository\|bootstrap" src test` — пусто; `npx tsc --noEmit` 0; `npm run dev` работает; `npm test` → **красный**: 9 сьютов / 113 тестов (ENOENT на `./js/…`), 3 сьюта / 43 — зелёные.  
**Критерий:** каталога `js/` нет; тесты красные ровно по прогнозу 17.1; `git diff --name-only` не содержит `test/**`; метка `remove-js`. **Зависимости:** 17.7.

**17.9.** Красный список и smoke (PLAN 17.7, TR-39/41) — `npx vitest run 2>&1 | tee /tmp/ml-1.8.2-red.txt`: файл/причина по каждому красному сьюту, сверка с 113/9 и 43/3 (фактические числа — в отчёт, без «подгонки»); `npx tsc --noEmit` 0; `npm run dev` — 9 сценариев: (1) первый запуск — карта «Математика», счёт 0, игрок перед первым тренажёром; (2) дальний клик — игнор, соседний — 600 мс и модалка; (3) сложность — 10 вопросов, 3 жизни, прогресс, «+10»; (4) 8/2 — «🎉 Отлично!», «Правильных: 8», «Заработано: 80 ✓», `win`; (5) 0 жизней — «💔 Игра окончена», `lose`, очки не зачтены; (6) «Играть снова»/«На карту» — новый раунд/карта, commit/revert; (7) 🌍 — смена карты и возврат; (8) F5 и вторая вкладка — «Игра уже запущена»; (9) консоль без ошибок; `localStorage.ml_stats` — `version: 3`.  
**Критерий:** red-list и smoke записаны; 9 сценариев зелёные; метки `red-list`, `smoke`. **Зависимости:** 17.8.

**17.10.** Документация (PLAN 17.8, SPEC «Что не входит») — `README.md`: структура `src/core`/`data`/`services`/`app` вместо `js/`, «Тесты» — 156 тестов и 9 красных сьютов до этапа 3 (причина — `readSource('./js/…')`), статус-строка 1.8.2, убрать «классические слои/порядок скриптов», smoke — 9 сценариев; `test/README.md`: «Как тесты читают исходники» — 9 сьютов падают после 1.8.2, red-list и этап 3; `GIGACODE.md`: обзор, структура, `tsconfig` (T47), стиль (`core/types`/`ui/types`, `import type`), архитектура (слои и матрица), удалить разделы «Классические слои в React» и пример `index.html` с 19 скриптами; `.gigacode/specs/SPEC.md` — статус 1.8.2 → «Выполнено»; `.gigacode/tasks/TASKS.md` — этот файл (этап 17), архив — `TASKS_v1_8_1.md`; `PLAN.md` — 1.8.2, `PLAN_v1_8_1.md` — архив.  
**Критерий:** числа и структура в README/test/README/GIGACODE совпадают с прогоном 17.9; SPEC/TASKS/PLAN — 1.8.2; метка `docs 1.8.2`. **Зависимости:** 17.9.

**17.11.** Финальный аудит (PLAN 17.9, критерии 119–135) — `npx tsc --noEmit` 0; `npm test` — 113/156 красных в 9 сьютах, 43/156 зелёных в 3; `grep -R "declare global" src` — пусто; `grep -REn "window\.[A-Za-z_$]+ *=" src` — пусто; `grep -R "global\." src` — пусто; `grep -c '<script' index.html` → 1; `test ! -d js`; `grep -R "SessionService\|SessionRepository\|bootstrap" src test` — пусто; `grep -R "localStorage" src/core src/components` — пусто; `grep -R "from '../config'\|from './config'" src` — только `core/config`; `wc -l src/hooks/useMap.ts` ≤ 200; `git status --short` + `git diff --name-only` (изменены только `src/**`, `index.html`, `tsconfig.json`, удалённый `js/**`, документация; `css/`, `audio/`, `test/`, `package*.json`, `jest.config.js` — 0 правок); `git branch --show-current` — `refactor/es-modules`, мержа нет; коммиты по слоям (`core`, `data`, `services`, `types-ui`, `app`, `build`, `remove-js`, `docs`); обновить статус этапа 17 и «Готовность проекта» в этом файле; метка `final-audit`.  
**Критерий:** критерии 119–135 ✅; `tsc` 0; red-list подтверждён; ветка без мержа. **Зависимости:** 17.10.

---

## 📊 Карта покрытия

### 1.2.0 (выполнено)

| US | Задачи | FR | Задачи |
|----|--------|----|--------|
| US-1 | 1.4, 4.3, 5.2 | FR-1 | 3.1 |
| US-2 | 1.4, 5.2 | FR-2–FR-8 | 3.3 |
| US-3 | 3.3, 5.3 | FR-9 | 4.4 |
| US-4 | 3.3, 5.3 | FR-10 | 2.4, 2.5 |
| US-5 | 4.4 | FR-11 | 2.5, 3.2, 5.4 |
| US-6 | 4.4 | FR-12 | 1.3, 2.5 |
| US-7 | 4.4 | FR-13 | 4.4, 4.5 |
| US-8 | 4.5, 5.4 | FR-14 | 7.1, 7.2, 7.3 |
| US-9 | 4.5, 5.4 | FR-15 | 7.1, 7.4 |
| US-10 | 5.4 | | |
| US-11 | 5.4 | | |
| US-12 | 1.5, 2.5, 5.2, 5.4 | | |
| US-13 | 3.2, 5.3, 5.4 | | |
| US-14 | 3.2, 5.3, 5.4 | | |
| US-15 | 2.4, 5.3 | | |
| US-16 | 2.5, 5.2 | | |
| US-17 | 4.4, 4.5, 4.6 | | |
| US-18 | 5.1 | | |
| US-19 | 7.1, 7.3 | | |
| US-20 | 7.1, 7.3 | | |
| US-21 | 7.1, 7.3 | | |

### 1.3.0 (выполнено)

| US / FR | Задачи |
|---------|--------|
| US-22 | 8.4, 8.7, 8.11, 8.15 |
| US-23 | 8.2, 8.5, 8.15 |
| US-24 | 8.5, 8.6, 8.9, 8.15 |
| US-25 | 8.4, 8.7, 8.9, 8.10 |
| US-26 | 8.4, 8.13 |
| US-27 | 8.10, 8.12, 8.17 |
| FR-16 | 8.2, 8.5, 8.6 |
| FR-17 | 8.4, 8.9, 8.10 |
| FR-18 | 8.4, 8.13 |

### 1.3.1 (выполнено)

| US / FR | Задачи |
|---------|--------|
| T15 (доп.) | 9.1–9.8, 9.10–9.12 |
| US-22 (доп.) | 9.3, 9.4, 9.7, 9.12 |
| US-23 (доп.) | 9.1, 9.2, 9.6, 9.7, 9.12 |
| US-24 (доп.) | 9.1, 9.5, 9.7, 9.12 |
| FR-16 (уточнение) | 9.5, 9.7 |
| A20 (границы слоёв) | 9.7, 9.9 |

### 1.4.0 (выполнено)

| Требование | Задачи |
|-----------|--------|
| A22. Игрок на карте | 10.2, 10.7, 10.8, 10.9, 10.10, 10.12 |
| A23. Движение только к соседним | 10.1, 10.10, 10.13 |
| A24. Сохранение позиции | 10.2, 10.4, 10.5, 10.14, 10.15, 10.16 |
| A25. Победа / провал / отмена / выход | 10.1, 10.13, 10.14, 10.15, 10.16 |
| T18. Интерактивность карты | 10.9, 10.11, 10.12, 10.13 |
| T19. Движение — CSS transition | 10.10, 10.13 |
| T20. Версия `Stats` 2 + миграция | 10.2, 10.3, 10.4, 10.5 |
| Z11. Запреты игрока | 10.1, 10.5, 10.13, 10.14, 10.18 |
| US-28. Игрок на карте | 10.2, 10.8, 10.9, 10.10, 10.12 |
| US-29. Движение игрока | 10.1, 10.10, 10.13 |
| US-30. Клик на тренажёры | 10.1, 10.11, 10.13 |
| US-31. Сохранение позиции | 10.4, 10.14, 10.15, 10.16 |
| US-32. Стартовая позиция | 10.1, 10.5, 10.15 |
| FR-19. Движение игрока | 10.1, 10.9, 10.10, 10.13 |
| FR-20. Клик на тренажёры | 10.1, 10.13 |
| FR-21. Сохранение позиции | 10.2, 10.3, 10.4, 10.5, 10.14, 10.16 |

### 1.4.1 (выполнено)

| Требование | Задачи |
|-----------|--------|
| A23. Движение и модалка (новая редакция) | 11.1, 11.3, 11.4 |
| A26. Блокировка движения | 11.3, 11.4 |
| A27. Откат при отмене | 11.1, 11.5 |
| A28. Повторная игра | 11.1, 11.6, 11.7 |
| T21. Модалка при движении | 11.4 |
| T22. Сохранение позиции | 11.6 |
| T23. Повторная игра | 11.6, 11.7 |
| Z12. Запреты модалки | 11.3–11.7, 11.9 |
| Z13. Запреты повторной игры | 11.6, 11.7, 11.9 |
| US-29 (доп.). Движение и модалка | 11.4, 11.5 |
| US-30 (доп.). Клик на тренажёры | 11.4 |
| US-31 (доп.). Исход игры | 11.6, 11.7 |
| US-33. Блокировка движения | 11.3, 11.4 |
| US-34. Повторная игра | 11.6 |
| US-35. Сохранение позиции | 11.6 |
| FR-22. Модалка при движении | 11.4 |
| FR-23. Исход игры | 11.6, 11.7 |
| FR-24. Сохранение позиции | 11.6 |

### 1.5.0 (выполнено)

| Требование | Задачи |
|-----------|--------|
| A29. Глобальная карта | 12.1, 12.5–12.7, 12.9 |
| A30. `Stats` v3 | 12.1, 12.3, 12.4, 12.11 |
| A31. Выбор карты | 12.4, 12.7–12.9 |
| T24. UI глобальной карты | 12.5, 12.6 |
| T25. Доступ через `currentMap` | 12.3, 12.4 |
| Z14. Запреты глобальной карты | 12.3, 12.4, 12.7, 12.11 |
| US-36. Список карт | 12.5–12.7 |
| US-37. Выбор карты | 12.4, 12.7, 12.9 |
| US-38. Сохранение текущей карты | 12.2–12.4, 12.9 |
| FR-25. Глобальная карта | 12.5, 12.6 |
| FR-26. Выбор карты | 12.4, 12.7, 12.9 |
| FR-27. `Stats` v3 | 12.3, 12.4 |

### 1.6.0 (выполнено)

| Требование | Задачи |
|-----------|--------|
| TR-1. `types.ts`, 7 типов | 13.3, 13.4 |
| TR-2. Простые файлы → `.ts` | 13.9, 13.10 |
| TR-3. Сложные файлы → `.ts` | 13.7, 13.8, 13.9, 13.11 |
| TR-4. View/Controller — `.js` | весь этап, 13.12, 13.13 |
| TR-5. `allowJs`, `strict`, `noEmit` | 13.1, 13.2, 13.12 |
| TR-6. Игра работает | 13.12, 13.13 |
| A32. Постепенная миграция | 13.7–13.11 |
| A33. Типы в `types.ts` | 13.3 |
| A34. Строгий режим | 13.2 |
| A35. View/Controller — JS | весь этап, 13.13 |
| T26. Конфигурация TS | 13.1, 13.2 |
| T27. Правила типизации | 13.7–13.11 |
| T28. `npx tsc --noEmit` | 13.1, 13.13 |
| Z15. Запреты этапа 1 | 13.3–13.14 |
| Z16. Запреты в типах | 13.3, 13.13 |

US/FR в 1.6.0 **не добавляются** (только TR / A / T / Z) — новых US и FR нет.

**Критерии PLAN.md:** 1–23 → этапы 0–7 (проверено задачей 6.4); 24–34 → этап 8 (задачи 8.19, 8.20); **35–43 → этап 9 (задача 9.12)**; **44–52 → этап 10 (задача 10.19)**; **53–60 → этап 11 (задача 11.10)**; **61–70 → этап 12 (задача 12.12)**. **71–80 → этап 13 (задача 13.13)**; **81–90 → этап 14 (задача 14.14)**; **91–106 → этап 15 (задача 15.20)**; **107–118 → этап 16 (задача 16.6)**; **119–135 → этап 17 (задача 17.11)**.

### 1.7.0 (выполнено)

| Требование | Задачи |
|-----------|--------|
| TR-7. React + типы | 14.2 |
| TR-8. `main.tsx` | 14.7 |
| TR-9. `ErrorModal` | 14.5 |
| TR-10. `index.html` | 14.8 |
| TR-11. Мост `ErrorView` | 14.6, 14.9 |
| TR-12. Гибрид | 14.8–14.11 |
| TR-13. `.tsx` в `tsconfig` | 14.3, 14.10 |
| TR-14. Игра работает | 14.11, 14.14 |
| A36. Постепенная интеграция | весь этап, 14.11 |
| A37. Гибрид | 14.7–14.9 |
| A38. Точка входа | 14.7 |
| A39. Первый компонент | 14.5 |
| A40. Связь через `window` | 14.6, 14.9 |
| T30. Установка React | 14.2 |
| T31. `tsconfig` и `.tsx` | 14.3 |
| T32. `main.tsx` | 14.7 |
| T33. `ErrorModal` | 14.5 |
| T34. `index.html` | 14.8 |
| T35. Гибрид | 14.9, 14.12 |
| Z17. Запреты этапа 2 | 14.9, 14.12 |
| Z18. Запреты в React | 14.5–14.7, 14.12 |
| T28. `tsc --noEmit` | 14.10 |

US/FR в 1.7.0 **не добавляются** (только TR / A / T / Z) — новых US и FR нет.

### 1.8.0 (выполнено)

| Требование | Задачи |
|-----------|--------|
| TR-15. Результаты | 15.3–15.5 |
| TR-16. Модалка карт | 15.6–15.7 |
| TR-17. Игра | 15.8–15.10 |
| TR-18. Карта | 15.11–15.14 |
| TR-19. Шапка | 15.15 |
| TR-20. Каркас и приветствие | 15.16–15.17 |
| TR-21. Чистка | 15.18 |
| TR-22. Игра работает | 15.19–15.20 |
| T36. Структура `src/` | 15.2–15.13, 15.18 |
| T37. Компоненты | 15.4, 15.7, 15.9, 15.11–15.12, 15.15 |
| T38. Хуки | 15.3, 15.6, 15.8, 15.13, 15.16 |
| T39. Обработчики | 15.4–15.15 |
| T40. SVG-дорога | 15.11–15.12 |
| A41. По одному экрану | весь этап |
| A42. Порядок | 15.3 → 15.17 |
| A43. Удаление + фиксация | 15.5, 15.7, 15.10, 15.14, 15.15, 15.17–15.18 |
| A44. Функциональные компоненты | 15.4, 15.7, 15.9, 15.11–15.12, 15.15 |
| A45. Локальное состояние | 15.3, 15.6, 15.8, 15.13, 15.16–15.17 |
| A46. CSS не изменён | 15.19 |
| A47. Движение 600 мс | 15.11–15.13 |
| Z19–Z21. Запреты этапа | весь этап, 15.19 |
| T28. `tsc` + тесты | 15.19 |

US/FR в 1.8.0 **не добавляются** (только TR / A / T / Z) — новых US и FR нет.

### 1.8.1 (выполнено)

| Требование | Задачи |
|-----------|--------|
| TR-23. Счётчики при ответе | 16.3 |
| TR-24. Фактический `getResults` | 16.3 |
| TR-25. Оценка из счётчиков | 16.2, 16.4 |
| TR-26. `reset()` счётчиков | 16.3 |
| TR-27. Тесты и регрессия | 16.2, 16.3, 16.5, 16.6 |
| A48. Единственный источник истины | 16.3, 16.6 |
| A49. `total = correct + wrong` | 16.3 |
| A50. Оценка только из `CONFIG` | 16.2, 16.4 |
| A51. Полный `reset()` | 16.3 |
| T41. Поля и API модели | 16.3 |
| T42. Сьют `SessionModel` | 16.2 |
| T43. Совместимость | 16.4, 16.6 |
| Z22. Запреты фикса | весь этап, 16.4, 16.6 |
| Z23. Запреты тестов | 16.2 |
| Приёмочные тесты 1–4 (SPEC) | 16.2, 16.3 |

US/FR в 1.8.1 **не добавляются** (только TR / A / T / Z) — новых US и FR нет.

### 1.8.2 (выполнено)

| Требование | Задачи |
|-----------|--------|
| TR-28. Перенос файлов | 17.2, 17.3, 17.4, 17.6–17.8 |
| TR-29. Явные импорты | 17.2–17.7 |
| TR-30. `.js → .ts` | 17.2, 17.4 |
| TR-31. Типы | 17.2, 17.5, 17.7 |
| TR-32. `src/config.ts` | 17.6 |
| TR-33. Composition root | 17.6 |
| TR-34. `index.html` | 17.7 |
| TR-35. `tsconfig` | 17.7 |
| TR-36. Мёртвый код | 17.6, 17.8 |
| TR-37. Слои | 17.2–17.6 |
| TR-38. Контракты | 17.3, 17.4 |
| TR-39. Тесты | 17.8, 17.9 |
| TR-40. Ветка | 17.1, 17.11 |
| TR-41. Проверки | 17.9, 17.11 |
| A52. ES-модули | 17.2–17.7 |
| A53. Слои | 17.2–17.6 |
| A54. Один root | 17.6 |
| A55. `CONFIG` | 17.2, 17.6 |
| A56. Типы-модули | 17.2, 17.5 |
| A57. Тесты red | 17.8, 17.9 |
| A58. Ветка | 17.1, 17.11 |
| T44. Структура и имена | 17.2–17.6 |
| T45. Контракты сервисов | 17.3, 17.4 |
| T46. Сигнатуры хуков | 17.6 |
| T47. `tsconfig` | 17.7 |
| T48. `index.html` / `main.tsx` | 17.7 |
| T49. Проверки | 17.9, 17.11 |
| Z24. Запреты миграции | весь этап, 17.9, 17.11 |
| Z25. Запреты тестов | 17.8, 17.9 |
| Z26. Запреты git | 17.1, 17.11 |

US/FR в 1.8.2 **не добавляются** (только TR / A / T / Z) — новых US и FR нет.

---

## ✅ Готовность проекта

**Выполнено в 1.2.0:**

1. 42 задачи этапов 0–7 выполнены
2. 21 US реализованы
3. 15 FR покрыты
4. Критерии 1–23 из PLAN.md ✅
5. Ручное тестирование пройдено

**Выполнено в 1.3.0:**

6. 20 задач этапа 8 (8.1–8.20) выполнены
7. US-22…US-27 реализованы (всего 27 US)
8. FR-16…FR-18 покрыты (всего 18 FR)
9. Критерии 24–34 из PLAN.md ✅ (всего 34); критерии 9 и 20 — повторно ✅
10. `npm test` — **54/54** ✅ (48 базовых + 6 тестов карты)
11. Сквозная проверка в jsdom — **33/33** ✅ (карта → модалка → игра → результат → карта, звук, хранилище)
12. Код соответствует RULES.md 1.3.0 (A18–A21, T15–T17, Z10) и SPEC.md 1.3.0
13. Список «вне области» из SPEC v1.3.0 не затронут (прогресс, статусы, блокировки, звёзды, темы, доп. зоны, дизайн, анимации)

**Выполнено в 1.3.1:**

14. 12 задач этапа 9 (9.1–9.12): геометрия, полный экран, шаг 100px, единая дорога, resize, тесты
15. Критерии 35–43 из PLAN.md 1.3.1 ✅
16. `npm test` — **67/67** ✅ (48 базовых + 19 тестов карты)
17. `README.md`, `GIGACODE.md` и `test/README.md` обновлены

**Выполнено в 1.4.0:**

18. 20 задач этапа 10 (10.1–10.20): правила игрока, `Stats` версии 2 с миграцией, точка игрока в геометрии, отрисовка и CSS игрока, клики и блокировка, сохранение позиции
19. US-28…US-32 реализованы (всего 32 US), FR-19…FR-21 покрыты (всего 21 FR), A22–A25, T18–T20, Z11
20. Критерии 44–52 из PLAN.md 1.4.0 ✅ — задача 10.19: 10 сквозных сценариев в jsdom + сверка неизменности файлов
21. `npm test` — **107/107** ✅ (8 сьютов: 48 базовых + 12 тестов карты из 1.3.1 + 16 `player-rules` + 12 `stats-service` + 12 новых/изменённых тестов карты)
22. `README.md`, `GIGACODE.md`, `test/README.md` обновлены — задача 10.20

**Выполнено в 1.4.1:**

23. 11 задач этапа 11 (11.1–11.11): машина состояний `PlayerState`, модалка по приходу, флаг `isModalOpen`, откат при отмене, повторная игра, правила сохранения позиции
24. US-33…US-35 реализованы (всего 35 US), FR-22…FR-24 покрыты (всего 24 FR), A23 (новая редакция), A26–A28, T21–T23, Z12–Z13
25. Критерии 53–60 из PLAN.md 1.4.1 ✅ — задача 11.10: 11 сквозных сценариев в jsdom + сверка неизменности `map-view.js`, CSS и сервисов
26. `npm test` — **126/126** ✅ (10 сьютов: 107 базовых + 7 `player-state` + 15 `map-controller`, `player-rules` −3 теста)
27. `README.md`, `GIGACODE.md`, `test/README.md` обновлены — задача 11.11

**Выполнено в 1.5.0:**

28. 12 задач этапа 12 (12.1–12.12): каталог карт, `Stats` v3 с миграцией 1 → 2 → 3, 🌍 и модалка выбора карты, `switchMap()`, разделение `init()` / `reset()` в `MapController`, `AppController.showCurrentMap()`.
29. US-36…US-38 реализованы (всего 38 US), FR-25…FR-27 покрыты (всего 27 FR), A29–A31, T24–T25, Z14.
30. Критерии 61–70 из PLAN.md 1.5.0 ✅ — задача 12.12: сквозной прогон в jsdom (порядок скриптов, 🌍, модалка выбора, no-op той же карты, переключение с сохранением счёта, перезагрузка, неизвестная карта → «Математика», миграция, смена карты во время движения, регресс 1.4.1) + сверка неизменности `map-view.js` (199 строк) и CSS карты.
31. `npm test` — **182/182** ✅ (14 сьютов: 126 из 1.4.1 + 6 `config` + 9 `map-catalog` + 16 `stats-schema` + 9 `global-map-controller` + 4 новых `map-controller` + 12 новых `stats-service`)
32. `README.md`, `GIGACODE.md`, `test/README.md` обновлены — задача 12.12

**Выполнено в 1.6.0:**

33. 14 задач этапа 13 (13.1–13.14): TypeScript 5.9 + `typecheck`, `types.ts` (10 интерфейсов + `Difficulty`), 14 файлов Model / Logic / Storage / Service / Errors → `.ts`, `Rating.min`, `MapData`
34. TR-1…TR-6, A32–A35, T26–T28, Z15–Z16 реализованы; новых US и FR нет
35. Критерии 71–80 из PLAN.md 1.6.0 ✅ — задача 13.13
36. `npm test` — **182/182** в 14 сьютах после починки harness (13.5); `npm run typecheck` — **0 ошибок** (13.2, 13.13); `npx tsc --version` → 5.9.3
37. Запуск — только `npm run dev`: `file://` и `python3 -m http.server` больше не воспроизводят игру (MIME `.ts`); сквозной прогон через Vite (карта → модалка → игра → результаты → карта, `ml_stats` v3)
38. `README.md`, `GIGACODE.md`, `test/README.md` обновлены — задача 13.14; `js/` ≤ 200 строк, `map-view.js` = 199 и `map-controller.js` = 198 не изменены; `any` в `js/**/*.ts` — 0

**Выполнено в 1.7.0:**

39. 14 задач этапа 14 (14.1–14.14): `@types/react`/`@types/react-dom` ^19.3.0, `include: ["js", "src", "*.tsx"]`, `src/components/ErrorModal.tsx`, `src/App.tsx`, `main.tsx`, `#root` + `type="module"` в `index.html`, мост `ErrorView` в `js/script.js`
40. TR-7…TR-14, A36–A40, T30–T35, Z17–Z18 покрыты; новых US и FR нет
41. Критерии 81–90 из PLAN.md 1.7.0 — задача 14.14
42. `npm test` — **182/182** в 14 сьютах без новых тестов; `npm run typecheck` — **0 ошибок**, включая `.tsx`; `npm run dev` — игра играется, модалка ошибок на React
43. `README.md`, `GIGACODE.md` и `test/README.md` обновлены — задача 14.13
44. `js/view/**` и `js/controller/**` — 0 правок (`md5sum`), CSS (21 файл), звук, Storage и игровая логика не тронуты; `map-view.js` = 199, `map-controller.js` = 198

**Выполнено в 1.8.0:**

45. 20 задач этапа 15 (15.1–15.20): 10 компонентов и 6 хуков в `src/`, `bootstrap.ts`, переезд `types.ts` в `src/`, удаление 9 `view/*.js`, 6 `controller/*.js` и `js/script.js`
46. TR-15…TR-22, A41–A47, T36–T40, Z19–Z21 покрыты; новых US и FR нет
47. Критерии 91–106 из PLAN.md 1.8.0 — задача 15.20
48. `npm test` — **141/141** в 11 сьютах (после удаления 3 UI-сьютов, 41 тест; решение №8); `npx tsc --noEmit` — 0
49. CSS (21 файл) — `md5sum` без изменений; игровая логика, `Stats` v3, `ml_stats` и звук — без изменений
50. `README.md`, `GIGACODE.md`, `test/README.md`, `SPEC.md` — задача 15.20

**Итоги реализации 1.8.0:**

51. Мосты сняты: `window.mlBridge` (15.15) и `window.showErrorModal` (15.17); `window.*`-API не осталось
52. Движение игрока — CSS transition 600 мс + `onTransitionEnd`, без `setTimeout`-на-приход (A47)
53. Состояние экранов — только `useState` в хуках, без Context/Zustand; CSS и `Stats` не тронуты
54. Контрольные точки журнала: `/tmp/ml-1.8.0-log.txt` (15.0 baseline … docs 1.8.0), снимки `/tmp/ml-1.8.0-*.txt`, копии удалённых файлов — `/tmp/ml-1.8.0-backup/`

**Выполнено в 1.8.1:**

55. 6 задач этапа 16 (16.1–16.6): базовый срез и откат, красный сьют `session-model` (15 тестов), фикс `SessionModel` (`_correct`/`_wrong`, `total = correct + wrong`, `reset`), проверка UI/локализации, документация, финальный аудит
56. TR-23…TR-27, A48–A51, T41–T43, Z22–Z23 покрыты; новых US и FR нет
57. Критерии 107–118 из PLAN.md 1.8.1 — задача 16.6
58. `npm test` — **156/156** в 12 сьютах (141 + 15); `npx tsc --noEmit` — 0; старые 141 зелёные без правок
59. Изменены только `js/model/session-model.ts` и `test/model/session-model.test.js`; `src/`, `css/`, `index.html`, `GameRules`, `CONFIG`, `Stats` — 0 правок (`git diff`)
60. README/test/README/GIGACODE — 156/12 и раздел 1.8.1; `SPEC.md` — 1.8.1 «Выполнено»; `PLAN.md` — 1.8.1, `PLAN_v1_8_0.md` — архив

**Выполнено в 1.8.2:**

61. 11 задач этапа 17 (17.1–17.11): ветка и baseline, `src/core` (13 модулей), `src/data` (4), `src/services` (1), `ui/types`, composition root и оболочка, `tsconfig`/`index.html`, удаление `js/`, red-list и smoke, документация, финальный аудит
62. TR-28…TR-41, A52–A58, T44–T49, Z24–Z26 покрыты; новых US и FR нет
63. Критерии 119–135 из PLAN.md 1.8.2 — задача 17.11
64. `npx tsc --noEmit` — **0**; `npm run dev` — работает (`http://127.0.0.1:5173`); `npm test` — **9 сьютов / 113 тестов красные** (ENOENT на `./js/…`), **43/156 зелёных** в 3 сьютах; `test/**` — 0 правок (этап 3)
65. CSS (21 файл), `audio/` (3), разметка, тексты, `CONFIG`, `Stats` v3, ключи `ml_stats`/`ml_session_lock` — 0 правок; `npx vite build` собирается (53 модуля), `audio/` в `dist` не копируется
66. Документация: README/test/README/GIGACODE — структура 1.8.2 и red-list; `SPEC.md` — 1.8.2 «Выполнено»; `TASKS.md` — этот файл; `PLAN.md` — 1.8.2 «выполнено»; архивы `PLAN_v1_8_1.md`, `TASKS_v1_8_1.md`
67. Ветка `refactor/es-modules` от `a6f6ffa`; изменения не коммитились — рабочее дерево содержит правки кода и документации; мержа в `main`/`fix/fix_statstic` нет до зелёного `npm test` (этап 3)

---

## 📝 Решения при реализации 1.3.0

- **`#totalScore` перенесён внутрь `#mapScreen`** — счёт виден на карте сверху по центру (US-22); на игровом экране больше не дублируется.
- **`AppController.onExit()` не вызывает `SessionController.leave()`** — вкладка остаётся открытой, поэтому блокировка второй вкладки (критерий 16) сохраняется; `leave()` остаётся публичным методом без вызовов.
- **`#streakBadge` оставлен как есть** — скрыт через `display: none` и не используется с 1.2.0, вне области этапа 8.
- **Тесты карты добавлены** (`test/map/map-view.test.js`) — покрывают `buildPathPoints` и отрисовку зон/тренажёров/линии.

---

## 📝 Решения и уточнения 1.3.1 (до реализации)

- **100px — между центрами тренажёров.** Поэтому высота полосы зоны = `trainersCount × 100`, а зоны стыкуются без `gap`/`margin`. Если имелся в виду просвет 100px между кнопками, меняется одна константа: `TRAINER_SPACING = 52 + 100 = 152`; остальная геометрия следует за ней.
- **`#mapScreen` вынесен из `.app`** — карточка ограничивает ширину 600px и имеет `overflow: hidden`; полноэкранная карта не должна от неё зависеть.
- **`js/view/map-layout.js` отделён от `map-view.js`** — чистая геометрия и отрисовка разделены, оба файла остаются ≤ 200 строк, геометрия тестируется без DOM.
- **Один SVG в пиксельной системе координат** — `viewBox="0 0 width height"`, ширина измеряется при рендере; фолбэк `600` для jsdom.
- **Resize** — единственное новое DOM-событие; живёт в `MapController` (критерий 9), View остаётся без обработчиков.
- **Старые тесты `buildPathPoints` заменяются** — функция переехала в `MapLayout`, проценты заменены пиксельной сеткой.
- **Ширина полотна пересчитывается после появления скроллбара** — иначе координаты тренажёров расходились бы с фактической шириной `.map`; `MapView.render()` делает повторный замер и перестраивает layout.
- **`#mapScreen.active` без анимации** — `fadeIn` с `transform` смещал fixed-экран при появлении.
- **Карта перерисовывается при показе экрана** (`ScreenView.showScreen('map')`) — если окно изменили во время игры, карта не остаётся с геометрией скрытого контейнера.

---

## 📝 Решения и уточнения 1.4.0 (до реализации)

- **«Предыдущий» = откуда пришёл** (решение владельца). `MapController._previousIndex` — индекс, с которого игрок пришёл на текущий тренажёр; провал, отмена модалки и выход ✕ возвращают именно на него.
- **После победы цель отката закрепляется** на выигранном тренажёре. Иначе повторная игра на уже выигранном тренажёре с провалом отбрасывала бы игрока назад, обнуляя сохранённый прогресс (противоречит A25 «победа — игрок остаётся»).
- **Геометрия 1.3.1 не меняется:** первый тренажёр `y = 50`, шаг 100px, высота 1500px, дорога из 15 узлов и 14 сегментов `C`. Стартовая позиция (`−1`) — точка первого тренажёра, сдвинутая вверх на `PLAYER_START_GAP = 20px`.
- **Игрок рисуется поверх тренажёра** (решение владельца): `.map-player` с `z-index: 3` и `pointer-events: none`, поэтому номер текущего тренажёра скрыт, но клики по кнопке не блокируются.
- **Отрисовка игрока вынесена в `js/view/map-player-view.js`** — `map-view.js` уже 149 строк, интеграция игрока вплотную подошла бы к лимиту 200 строк; заодно разделены ответственности «геометрия / игрок / карта».
- **Плоский `data-index` у тренажёра** — индекс берётся из `MapLayout`, контроллер не пересчитывает его по зонам и номерам, меньше шансов разойтись с геометрией.
- **Меняется поведение клика:** в 1.3.1 модалку открывал любой тренажёр, в 1.4.0 — только текущий; соседний сначала перемещает игрока (SPEC 1.4.0: соседний → движение, текущий → игра).
- **Движение не сохраняется, сохраняется только результат игры** (A24). Поэтому между отменой (или выходом) и следующей игрой отображаемая позиция может отличаться от `localStorage` — это ожидаемо.
- **`CONFIG.VERSION: 2` затрагивает и `model/game-model.js`** (не используется в `script.js`): его дефолтная версия тоже станет 2 — безвредно, но стоит держать в голове.
- **`test/setup.js` дублирует `CONFIG`** — версию нужно поднять и там (задача 10.6), иначе тесты миграции будут проверять не то.
- **Блокировка кликов — таймер, а не `transitionend`:** флаг `_isMoving` снимается через `PlayerRules.MOVE_MS = 600`; значение обязано совпадать с `transition: transform 600ms` в `map-player.css`.

---

## 📝 Решения и уточнения 1.4.1 (до реализации)

- **«Новый / текущий» определяется как `current === previous`** — отдельного флага «повторная игра» нет. `PlayerState` хранит origin последнего хода (решение 1.4.0 «предыдущий = откуда пришёл»), а инвариант «после любой игры/отмены `previous === current`» поддерживается `commitWin()` и `revert()`.
- **`isModalOpen` остаётся в `MapController`** (A26), а не в `PlayerState`: это флаг интерфейса карты, а не позиции. `PlayerState` знает только индексы.
- **`PlayerState` вынесен в `js/logic/player-state.js`** — `map-controller.js` (186 строк) с новой логикой превысил бы 200, а `map-view.js` уже 199 и трогать его нельзя. Заодно машина состояний тестируется без DOM.
- **`PlayerState` в Logic, а не в Model:** это правила переходов позиции (куда вернуться, когда закрепить), а не DTO и не сохраняемые данные; `PlayerRules` остаётся набором чистых предикатов.
- **`resolveAfterGame()` и `resolveAfterCancel()` удаляются** — иначе появятся два источника правды о том, куда возвращаться; их тесты переезжают в `player-state.test.js`.
- **`Stats.version` остаётся 2:** формат не меняется, меняются только правила *когда* писать `currentTrainerIndex` (T22). Миграция 1 → 2 не трогается.
- **Повторная победа** начисляет очки через `updateAfterRound()`; он сохраняет весь объект `Stats`, но `currentTrainerIndex` не меняется — это запись счёта, а не сохранение позиции (T22).
- **Модалка по приходу делает карту строго последовательной:** пройти дальше можно только победив на текущем тренажёре, отмена и провал возвращают назад. Это прямое следствие A23/A25/A27.
- **Откат в повторной игре — no-op:** `previous === current`, поэтому «Отмена» в модалке повторной игры визуально ничего не меняет (A27 при этом соблюдён).
- **`map-view.js` (199 строк) и CSS не меняются:** `render(..., playerIndex)`, `setPlayerIndex`, `getPlayerIndex`, `movePlayer`, `showDifficultyModal`, `hideDifficultyModal` уже есть; оверлей модалки уже `fixed` с `z-index: 1000`.
- **Резерв на лимит строк:** если `map-controller.js` всё же превысит 200, переносится только привязка кнопок модалки (`$$('.diff-btn')`, `#cancelDiffBtn`) в `AppController.init()` — она не относится к карте.
---

## 📝 Решения и уточнения 1.5.0 (до реализации)

- **Счёт и позиция — по картам.** A30 задаёт `maps[<карта>].totalScore`, T25 требует доступа через `currentMap`, поэтому `#totalScore` показывает счёт **текущей** карты. «Общий счёт сохраняется» (US-37) означает, что счёт прежней карты не сбрасывается и лежит в её `maps`-записи.
- **Выбор карты сбрасывает позицию выбранной карты** (`currentTrainerIndex = -1`, A31, US-37). Практическое следствие: вернувшись на карту, игрок начинает её заново, счёт карты сохраняется. Если владелец имел в виду «возврат продолжает прогресс», меняется одна строка в `StatsService.switchMap` — убрать `currentTrainerIndex = -1`.
- **Выбор карты закрывает модалку:** SPEC не описывает это явно, но «новая карта загружается» и «начало сначала» означают возврат к карте; «Закрыть» остаётся для выхода без выбора (US-36).
- **Выбор той же карты — полный no-op:** `switchMap` возвращает `false` до записи, поэтому нет ни звука, ни закрытия модалки, ни сохранения (US-37, Z14).
- **Подтверждения нет** (A31, Z14): `confirm()` в смене карты не вызывается, в отличие от выхода из игры.
- **🌍 внутри `#mapScreen`.** Экран скрывается через `display: none` (`.screen` без `.active`), поэтому кнопка автоматически видна только на карте; `#mapScreen.active` уже имеет `animation: none`, иначе `transform` у анимации сломал бы `position: fixed` у кнопки.
- **`MapController.init()` теряет состояние.** Повторный `init()` навесил бы вторые обработчики на `#mapContainer`, `.diff-btn` и `window`; состояние ставит `reset()`, он же отменяет таймер движения — иначе смена карты во время 600-мс анимации открыла бы модалку сложности на старой карте.
- **Карту рисует только `AppController.showCurrentMap()`.** `ScreenView.showScreen('map')` больше не перерисовывает карту из `CONFIG.ZONES`, иначе после смены карты нарисовалась бы «Математика»; это же снимает дублирующий рендер при инициализации.
- **`StatsSchema` вынесена в `js/model/stats-schema.js`.** `stats-service.js` с миграцией 2 → 3 и API по картам превысил бы 200 строк; схема — чистая структура данных без Storage и DOM, тестируется без репозитория (тот же приём, что `PlayerState` в 1.4.1).
- **`map-view.js` (199 строк) и CSS карты не меняются:** глобус и список карт живут в HTML/CSS, для рендера хватает существующего API (`render`, `setPlayerIndex`, `movePlayer`, `renderTotalScore`).
- **`CONFIG.ZONES` остаётся** ссылкой на зоны карты по умолчанию; приложение читает зоны через `MapCatalog.get(...).zones`, поэтому вторая карта со своими зонами не потребует правок в отрисовке.
- **`CONFIG.VERSION: 3` затрагивает и `model/game-model.js`** (не используется в `script.js`): его дефолтная версия тоже станет 3 — безвредно.
- **`test/setup.js` дублирует `CONFIG`** — версию и каталог карт нужно обновить и там (задача 12.11), иначе тесты миграции будут проверять не то.
- **Второй карты нет:** смена карты проверяется тестами (искусственная вторая карта в каталоге) и вручную — временной записью в `CONFIG.MAPS`; в коммит вторая карта не попадает.
- **Сам `TASKS.md` — этот файл** (задачи 12.1–12.12); после реализации его статус обновляется задачей 12.12.

---

## 📝 Решения и уточнения 1.6.0 (до реализации)

- **Объём — 13 файлов из TR-2/TR-3 + `generator.ts` + `types.ts`.** `generator` назван в SPEC «Что типизируется» (Logic: `generator`, `scoring`, `game-rules`), но отсутствует в обеих таблицах TR-2/TR-3 — считаем это пропуском в таблицах: без него Logic был бы типизирован на 2 из 5 файлов.
- **5 файлов слоёв остаются `.js`:** `model/map-catalog.js`, `model/stats-schema.js`, `logic/player-rules.js`, `logic/player-state.js`, `service/audio-service.js` (363 строки). A32 выполнен на 14 из 19 файлов — это зафиксированный долг 1.6.x, а не пропуск.
- **`types.ts` — ES-модуль с `export {}` + `declare global`.** Буквальный `export` интерфейсов невозможен: приложение грузит классические `<script>` без модулей, и top-level `export` лишил бы остальные файлы глобалов (`CONFIG`, `StatsService`, …). Поэтому `types.ts` не подключается в `index.html`, а интерфейсы объявлены глобально.
- **`include: ["js"]` вместо `["src"]` из T26.** Каталога `src/` нет: с буквальным значением `tsc` не видел ни одного файла (ложно-зелёная проверка). Переезд в `src/` — этап 2–3.
- **`typescript` закреплён `~5.9.3`.** В TypeScript 6 `moduleResolution: "Node"` (T26) — ошибка TS5107. При обновлении до 6.x нужен `"moduleResolution": "Bundler"` и отдельное решение владельца.
- **`build` = `npm run typecheck`.** Vite не бандлит классические `.ts`-скрипты: `vite build` оставляет `<script src="js/model/config.ts">` и не эмитит файл. До 1.6.0 `build` и так падал (`tsc` не установлен), так что регресса нет; полноценный бандл — этап 2–3.
- **Запуск — только `npm run dev`.** Браузер не исполняет `.ts`, а `python3 -m http.server` отдаёт `.ts` с неверным MIME. Прямое открытие `index.html` перестаёт работать — неизбежное следствие TR-2/TR-3; фиксируется в README (13.14).
- **`MapStats` → `MapData`.** TR-1 требует имя `MapData`; `MapStats` не остаётся (Z16). Меняются две JSDoc-ссылки в `stats-schema.js` и объявления в `types.ts`.
- **`Rating.min` (100/70/40/0, `GAMEOVER` — 0) — метаданные.** `GameRules.getRating()` продолжает работать по текущим порогам, значения `min` с ними совпадают. `test/setup.js` дублирует `CONFIG` — `min` добавляется синхронно в 13.9, иначе parity-тест `config.test.js` падает.
- **`Repository` не делаем `abstract`.** Иначе методы исчезнут из прототипа и `new Repository()` перестанет бросать `Not implemented` — изменение поведения, запрещённое Z15.
- **`GameModel.toJSON()` — inline-тип `{ version: number; totalScore: number }`.** Это legacy-формат v2, а не `Stats` v3; файл не используется в `script.js`, «чинить» его не нужно.
- **`catch (e: unknown)` + сужение.** `e instanceof Error`, `(e as { code?: number }).code`; `JSON.parse` возвращает `any` — сразу в `unknown`, чтобы `any` не просачивался (T27).
- **Границы TS ↔ JS.** `stats-service.ts` вызывает `StatsSchema` и `MapCatalog`, которые остаются `.js`: результаты аннотируются на месте (`const entry: MapData = StatsSchema.entry(stats)`), без правок JS и без `any`.
- **JSDoc остаётся описанием, типы уходят в сигнатуры.** `@param {Type}` / `@returns {Type}` / `@type` удаляются (Z15/Z16), описания публичных функций сохраняются (T7).
- **Harness чинится до переименований (13.5–13.6).** `setupFiles` + `vi.*` + `global.AudioService` возвращают 182/182 ещё на `.js`; `ts-source.js` позволяет `eval`-ить `.ts` через `transpileModule`. Поэтому после каждой задачи 13.7–13.11 зелёные и `tsc`, и `npm test`, а не «покраснело до 13.13».
- **`global.AudioService = AudioService` в тесте звука.** В ESM-строгом режиме `var` из `eval` не утекает; без этой строки 5 тестов падают на `AudioService is not defined`.
- **Тесты-«копии» (`generator`, `scoring`, `game-rules`) не проверяют боевые файлы** — известное ограничение 1.5.0; новых тестов 1.6.0 не пишет (Z15).
- **`jest.config.js` остаётся мёртвым файлом** — чистка вне области; документация перестаёт упоминать Jest как рабочий раннер (13.14).
- **Сам `TASKS.md` — этот файл** (задачи 13.1–13.14); после реализации статус обновляется задачей 13.14.

---

## 📝 Решения при реализации 1.6.0

- **`"types": []` в `tsconfig.json`.** Автоподключение `@types/node` (Node 26) приносит
  глобальные `QuotaExceededError`/`QuotaExceededErrorOptions` из `web-globals/domexception.d.ts`,
  и кастомный `class QuotaExceededError` даёт TS2300. `types: []` отключает автоподключение
  `@types`, не трогая `lib: ["DOM", …]`; тесты не проверяются `tsc` (`include: ["js"]`), так что
  типы Node не нужны. Остальные опции T26 сохранены.
- **Классы ошибок не переименовывались.** `QuotaExceededError`/`SessionError` остаются
  глобальными и `instanceof` работает; конфликт с `@types/node` снят конфигурацией, а не
  сменой API.
- **`test/setup.js` получил `min` раньше `config.ts`** (13.5): parity-тест `config.test.js`
  был единственным красным (181/182) до задачи 13.9 — это ожидаемый промежуточный шаг.
- **Фактический baseline до починки harness — 177 собранных тестов (100 passed, 77 failed),
  а не 153:** часть сьютов падала на этапе сбора из-за отсутствия `CONFIG`/`vi`, поэтому
  счётчик не отражал полный набор. После `setupFiles` + `vi.*` — ровно **182/182**.
- **`test/ts-source.js` использует CommonJS `require`** (`fs`, `path`, `typescript`), потому
  что тесты грузят исходники через `eval` и не должны становиться ES-модулями.
- **`generator.ts` — явные `let a: number, b: number, …`;** `strict` не потребовал
  инициализировать их до ветвлений (definite assignment проходит), файл — 139 строк.
- **Сквозная проверка 1.6.0:** `npm run dev` + jsdom загружает страницу с Vite-сервера;
  проверены карта (3 зоны / 15 тренажёров / 1 игрок), старт `−1` (14 `--far`), клик по
  соседнему → модалка через 600 мс, выбор сложности → игра с 4 вариантами, полный раунд →
  результаты → «На карту», `ml_stats` = `{version: 3, …}`. Единственные сообщения jsdom —
  `HTMLMediaElement.play()` не реализован (звук в jsdom не проверяется; в браузере работает)
  и CSS-парсер jsdom на современных стилях.

---

## 📝 Решения и уточнения 1.7.0 (до реализации)

- **Вход один — `main.tsx`.** `<script src="js/script.js">` закомментирован, а сам файл импортируется из `main.tsx` (`import './js/script.js'`): T34 («закомментирован, не удалён») и TR-12/TR-14 («игра работает») выполняются одновременно. Модуль исполняется после 34 классических скриптов, IIFE — ровно один раз.
- **Мост `ErrorView → window.showErrorModal` — в `js/script.js`,** а не в `js/view/error-view.js`: Z17 («не трогать `view/*.js`») выше буквы TR-11, а TR-12 прямо разрешает минимальную адаптацию `script.js`. `error-view.js` не изменяется; правка в 3 строки — только с разрешения владельца (открытый вопрос PLAN).
- **`include: ["js", "src", "*.tsx"]`** вместо буквального T31 `["src", "*.tsx", "*.ts"]`: иначе из программы `tsc` выпадут все 15 `.ts` в `js/`, а `*.ts` затянет `vitest.config.ts`.
- **CSS не импортируется в `main.tsx`.** Шесть `<link>` остаются в `index.html` (TR-10 «CSS без изменений»); T32 допускает «если нужно».
- **React — 19.3.1, уже установленный** в `dependencies`; добавляются только `@types/react@^19`, `@types/react-dom@^19`. `createRoot` из `react-dom/client` (T32); `ReactDOM.render` в 19 удалён.
- **`Window.showErrorModal` — в `js/model/types.ts`** (существующий `declare global`), без нового `global.d.ts`: единый источник типов (A33), файл в `index.html` не подключается.
- **`types: []` сохраняется.** JSX-типы приходят через резолюцию модуля `react/jsx-runtime`, а не через автоподключение `@types`; `types: []` защищает от `@types/node` (история 1.6.0).
- **`build` остаётся `npm run typecheck`.** `vite build` собирает модуль, но оставляет в `dist` теги на неэмитированные classic-скрипты — проверено в PLAN.
- **Модалка:** `.modal-overlay open` (иначе `display:none`), `.modal`, `.btn .btn-primary`; клик по фону закрывает, `stopPropagation` на `.modal`; цвет и отступ сообщения — инлайн, как в старой разметке (CSS не меняем).
- **Звук клика на «OK»** сохранён (`AudioService.play('click')` в `handleClose`) — паритет со старым `#errorOkBtn` (`app-controller.js`).
- **StrictMode** включён: в dev эффект публикует `window.showErrorModal` дважды (снятие + повторная установка) — идемпотентно, модалка не дублируется.
- **Fallback старой модалки сохраняется:** если React ещё не смонтирован (редкий путь `SessionController` без `BroadcastChannel`), `ErrorView.showMessage` показывает прежний `#errorOverlay`; сам `#errorOverlay` и обработчик `#errorOkBtn` в `app-controller.js` не удаляются до Этапа 5.
- **Новых тестов нет:** 182/182 — обязательное условие; React-слой проверяется `tsc` и ручным прогоном (тесты экранов появятся на Этапе 3).
- **Без git:** «не тронуто» проверяется контрольными суммами (`md5sum`) до/после (задачи 14.1, 14.12), а не `git diff`.
- **Сам `TASKS.md` — этот файл** (задачи 14.1–14.14); после реализации статус обновляется задачей 14.14.

## 📝 Решения при реализации 1.7.0

- **`@types/react`/`@types/react-dom` установились версией 19.3.0** (а не 19.2.x из PLAN):
  диапазон `^19` разрешился в актуальную версию, совместимую с React 19.3.1.
- **`tsconfig.include = ["js", "src", "*.tsx"]`** — `js/` сохранён в программе `tsc`
  (15 `.ts`), добавлены компоненты `src/` и корневой `main.tsx`.
- **Мост в `js/script.js`** — 10 строк в начале IIFE (обёртка `ErrorView.showMessage`
  с fallback на прежнюю DOM-модалку); `js/view/**` и `js/controller/**` не тронуты
  (View/Controller/CSS — 36 файлов, `md5sum` совпадает).
- **`index.html`** — старый `<script src="js/script.js">` закомментирован, перед `</body>`
  добавлены `#root` и `<script type="module" src="/main.tsx">`; 34 классических скрипта,
  их порядок, 6 `<link>` CSS и `#errorOverlay` не изменены.
- **Сквозная проверка в Chromium 152 (headless, CDP): 44 проверки, 0 провалов, два прогона.**
  `npm run dev` → карта (3 зоны, 15 тренажёров, игрок на старте `−1`, счёт 0);
  `window.showErrorModal('Тест', …)` → `.modal-overlay.open` внутри `#root`, клик по фону и
  «OK» закрывают, `#errorOverlay` всё время скрыт; 🌍 открывает список карт с выделенной
  текущей; дальний тренажёр — no-op, соседний — модалка через 600 мс, «Отмена» откатывает
  игрока; сложность «Легко» → 10 правильных ответов → результаты → «На карту»,
  `ml_stats` = v3 с `currentTrainerIndex: 0` и счётом 100; перезагрузка восстанавливает
  позицию и счёт; вторая вкладка → React-модалка «Игра уже запущена»; консоль без ошибок
  (кроме штатного 404 `/favicon.ico`).

---

## 📝 Решения и уточнения 1.8.0 (до реализации)

- **Экран мигрирует «порталом» в свой существующий контейнер** (`#resultScreen`, `#gameScreen`, `#mapRoot`), `.active` по-прежнему переключает `ScreenView` — вёрстка и CSS не меняются, шаги изолированы (решение №1, D8). Удаление контейнеров и `ScreenView` — один раз, в 15.17.
- **Модалки живут в дереве `App`, без порталов** (`.modal-overlay` — `fixed`, `z-index: 1000`; контейнеры `#difficultyModal`/`#mapSelectModal` уходят из HTML) — решение №2.
- **Один временный мост `window.mlBridge`** (`Partial<MlBridge>`): `showResults` — до 15.10, `openMapSelection`/`closeMapSelection`/`selectMap` — до 15.15; мост удаляется вместе с последним legacy-вызывающим (A40/D11).
- **Контроллеры превращаются в хуки:** `results-controller` → `useResults`, `game-controller` → `useGame`, `map-controller` → `useMap`, `global-map-controller` → `useMapSelection`, `session-controller` → `useSessionLock`, `AudioService` → `useAudio`; View-файлы удаляются (решение №4).
- **Model / Logic / Storage / Service / Errors остаются классическими глобалами** в `js/` (13 `.ts` + 6 `.js`); `src/config.ts` — типизированный ре-экспорт `CONFIG`. Перевод слоёв в ES-модули — не Этап 3: он лишает их глобалов и ломает порядок инициализации и `eval`-тесты (решение №5, D2).
- **`main.tsx` остаётся в корне** (A38/T32), хотя T36 показывает его в `src/`: рабочая `<script type="module" src="/main.tsx">` не меняется; `types.ts` переезжает в `src/` (D1).
- **Движение игрока — CSS `transition: transform 600ms` + `onTransitionEnd`** (A47, D7), без `setTimeout`-на-приход и `requestAnimationFrame`; `arrived` хранится в `ref`, guard — `propertyName === 'transform'` и `target === currentTarget`. Страховочный таймер `MOVE_MS + 200` — только если ручной прогон покажет залипание.
- **Тесты сокращаются до 141/141 в 11 сьютах** (решение владельца №8, D10): удаляются 3 сьюта, читающие `view/controller` (9 + 13 + 19 = 41 тест); `map-layout` переезжает в `js/logic/` с правкой **только пути** (18 тестов). Новых тестов нет (Z19).
- **Git не создаём (решение владельца №9, D12):** вместо коммитов — контрольная точка: `md5sum`-снимок `js/`, `css/`, `index.html` + запись в `/tmp/ml-1.8.0-log.txt`; перед удалением файлов шага — их копия в `/tmp/ml-1.8.0-backup/<метка>/`. Обязательство A43 «коммит» выполняется по духу — фиксацией состояния.
- **`#root` получает inline `display: contents`** (15.17), иначе `.app` перестанет быть прямым flex-элементом `body` и карточка не растянется до `max-width: 600px` (решение №10, D9). Если браузер даст неожиданный результат — альтернатива из PLAN: оставить `.app` прямым ребёнком `body`, а React-каркас рендерить в него порталом.
- **Мёртвый код убирается:** `GameModel` создаётся в `script.js` и нигде не используется — удаляется в 15.18; `.streak-badge` никто не показывает — удаляется из HTML в 15.17 (решение №11, Z21).
- **Состояние карты — в `useMap`, а не в `MapScreen`** (D3): `currentTrainerIndex`/`isModalOpen`/`isMoving`, движение, откат и сохранение позиции — это логика, а Z20 её в компонентах запрещает; `MapScreen` получает read-only значения и колбэки.
- **`earnings` — презентационный проп `ResultsScreen`** (D4): строка «Заработано … ✓/не зачтено» зависит от `isSuccessful`, которого нет в `GameResult`; расчёт остаётся в `useResults` (прежний код `ResultsController.show`).
- **`GameScreen` получает снимок `GameSessionView`, а не `SessionModel`** (D5): рендер не должен зависеть от мутабельного класса без уведомления React.
- **Экран приветствия удалён ещё в 1.5.0** (D6): 15.17 фиксирует «уже нет» и удаляет оставшиеся `app-controller.js`, `session-controller.js`, `screen-view.js`, `error-view.js`, `dom.js`.
- **`MapLayout` переезжает в `js/logic/`** (15.14) — это чистая геометрия, а не View; меняются путь в `index.html`, шапка файла и путь в `test/map/map-layout.test.js`.
- **Типы `MapLayout` и `PlayerState`/`PlayerRules`.** JSDoc возвращает нестрогие `Object[]`/`{…}`, а view-типы строгие. Если `tsc` не примет неявные типы — уточнить JSDoc в `map-layout.js` (без изменения логики) или объявить API в `src/types.ts`; `as any` не использовать.
- **`test/README.md` временно рассинхронизирован** после 15.7/15.14 (в нём ещё 14 сьютов/182) — приводится в порядок в 15.20; тесты от этого не зависят.
- **Сам `TASKS.md` — этот файл** (задачи 15.1–15.20); после реализации статус этапа 15 обновляется задачей 15.20.

---

## 📝 Решения и уточнения 1.8.1 (до реализации)

- **`GameRules.getRating` не меняется (D13).** Он уже проверяет `lives <= 0` первым, считает `accuracy = round(correct / total × 100)` и берёт пороги из `CONFIG.RATINGS`; 1.8.1 только **проверяет** его тестами №7–9. Диффа по `game-rules.ts` не будет — это выполнение TR-25, а не пропуск требования.
- **`wrong` в 1.8.1 не совместим с 1.8.0 (D14).** Прежнее значение копировало `correct` (баг), сохранять его незачем: `GameResult` и UI `wrong` не показывают.
- **`total` — фактически отвечено (D15).** Для незавершённого раунда/0 ответов это 0–9, а не 10; `ResultsScreen` `total` не отображает, поэтому меняется только знаменатель точности — ровно то, что требует A49 (тесты №9–12).
- **`TOTAL_QUESTIONS` остаётся только в `GameRules.shouldEndGame` (D16).** `SessionModel` его больше не читает (`grep` — 0); условие завершения раунда не меняется.
- **Тест грузит модель через `readSource` + `eval` (T42).** `global.SessionModel = SessionModel;` обязателен (класс в области `eval`); `GameRules` подгружается только для оценки, его формулы не копируются; `CONFIG` — из `test/setup.js`, не дублируется.
- **15 тестов → 156/12 — ожидание.** Если фактическое число отличается, документация 16.5 обновляется по выводу `npm test`, а не по плану (критерий 113/118 требует совпадения чисел, а не конкретной цифры).
- **Git-фиксация (D17).** Репозиторий существует (`5cec9da`), поэтому аудит локализации — `git diff --name-only` + `git status --short`; один коммит `fix(1.8.1): фактическая статистика раунда` — только по согласию владельца; `git add -A` не делать (до задачи уже modified `README.md`, `SPEC.md`, `PLAN.md`).
- **`TASKS.md` — этот файл** (задачи 16.1–16.6); после реализации статус этапа 16 и «Готовность проекта» обновляются задачей 16.6; предыдущая версия — `.gigacode/tasks/TASKS_v1_8_0.md`.

---

## 📝 Решения при реализации 1.8.1

- **Сьют написан до фикса и был красным (red → green).** На 1.8.0 падали 14 из 15 тестов, сценарий 8/2 давал `wrong = 10` вместо 2; зелёным остался только `reset` без проверки счётчиков. Метка `red-8-2` в `/tmp/ml-1.8.1-log.txt`.
- **`total = correct + wrong` подтверждён тестами:** 8/2 → 10, 0/3 → 3, без ответов → 0; `TOTAL_QUESTIONS` в `SessionModel` не встречается (0 вхождений), условие завершения осталось в `GameRules.shouldEndGame`.
- **Оценка не менялась (D13):** `GameRules.getRating` уже проверяет `lives <= 0` первым и считает точность от `correct / total`; 8/2 → 🎉 «Отлично!», 10/10 → 🏆 «Идеально!», 0/3 → 💔 «Игра окончена».
- **Локализация:** `git diff --name-only` — только `js/model/session-model.ts` и новый тест (плюс документация); `src/`, `css/`, `index.html`, `js/logic`, `js/model/config.ts`, `Stats` — без правок.
- **Документация:** README/test/README/GIGACODE — 156/12 и раздел 1.8.1; `SPEC.md` — «Выполнено»; `PLAN.md` — статус «реализован».

---

## 📝 Решения и уточнения 1.8.2 (до реализации)

- **Порядок шагов: `core` → `data` → `services` → `ui/types` → `app`+`main` → `tsconfig`+`index` → удаление `js/` → smoke → docs.** `tsc` 0 после каждого слоя; классические скрипты удаляются последними, поэтому красные тесты появляются только там, где их и ждёт TR-39.
- **`src/types.ts` удаляется после смены `tsconfig` (D18).** Пока `js/` в программе `tsc`, глобальные типы нужны классическим файлам; удаление раньше дало бы сотни TS2304.
- **`src/config.ts` уходит вместе с потребителями (D19)**, `SessionService`/`SessionRepository` — на шаге удаления `js/` (D23), потому что их вызывает живой `bootstrap.ts`.
- **Сервисы создаются один раз в `createServices()`** (A54/T46): `App({ services })`, хуки получают `services` первым аргументом, методы вызываются через экземпляр (не деструктурируются).
- **Клики в `App` — через проп `services.audio.play('click')` (D20).** A53 запрещает импорт значений из `data`/`services`, но T46 передаёт `services` в `App`; альтернатива «перенести клики в хуки» — вопрос владельцу.
- **`src/main.tsx` получает CSS-импорты только после `types: ["vite/client"]` (D32).** До этого `tsc` не типизирует `*.css` (TS2307), поэтому 17.6 и 17.7 — два коммита; критерий шага — после 17.7.
- **Красный список — 9 сьютов / 113 тестов (D22):** `config` (6), `map-catalog` (9), `session-model` (15), `stats-schema` (16), `player-rules` (13), `player-state` (7), `map-layout` (18), `audio-service` (5), `stats-service` (24) падают на `readSource('./js/…')`; `scoring` (8), `game-rules` (12), `generator` (23) остаются зелёными, потому что дублируют логику у себя. Если фактические числа другие — в отчёт и документацию идут фактические.
- **`allowJs: true` сохраняется до этапа 3** (спека D2); `jest.config.js`, `package.json`, `package-lock.json`, `test/**`, `css/**`, `audio/**` — 0 правок.
- **`useMap.ts` на границе лимита 200 строк (D25):** после импортов и `services` ≈207 — сокращаем шапку и ужимаем импорты, файл не дробим.
- **`vite.config.ts` отсутствует (D21):** `include` из T47 его «не находит», это не ошибка; `build` остаётся `npm run typecheck`.
- **Документация — отдельный последний шаг (D26):** README/GIGACODE/TASKS описывают `js/` и порядок скриптов; 17.10 переписывает разделы целиком, иначе останутся противоречия.
- **`TASKS.md` — этот файл** (задачи 17.1–17.11); после реализации статус этапа 17 и «Готовность проекта» обновляются задачей 17.11; предыдущая версия — `.gigacode/tasks/TASKS_v1_8_1.md`.

---

## 📝 Решения при реализации 1.8.2

- **Красный список фактически — 9 сьютов failed / 3 passed, 43 теста passed.** Vitest не запускает 113 тестов из упавших сьютов (падение на `readSource('./js/…')` до `describe`), поэтому в выводе «Tests 43 passed», а не «113 failed». Числа сходятся: 156 − 43 = 113.
- **Smoke — 15 проверок / 9 сценариев** (headless Chromium через CDP): карта, дальний/соседний тренажёр, старт игры, 8/2 → «Отлично!» и 80 ✓, 0 жизней, «На карту», 🌍, F5, вторая вкладка, консоль. Сценарий 8/2 проверен целиком (8 верных + 2 неверных), а не только 10/10.
- **Вторая вкладка:** модалку «Игра уже запущена» показывает **уже открытая** вкладка (так работает `BroadcastChannel` + `hello` с 1.8.0); поведение не менялось — это инвариант, а не регресс 1.8.2.
- **`useMap.ts` — ровно 200 строк:** вместо `React.RefObject` импортируется `type { RefObject }` из React, шапка сокращена; лимит соблюдён без дробления файла.
- **`src/main.tsx` написан сразу с CSS-импортами**, `types: ["vite/client"]` добавлен в `tsconfig` до финального прогона `tsc` — отдельный коммит 17.6/17.7 не понадобился (правки не коммитились).
- **`npx vite build` работает как побочный эффект** (53 модуля); `audio/` не копируется в `dist`, потому что путь `new Audio('audio/…')` задаётся в рантайме. Правок под прод не делалось (TR-41, «Что не входит»).
- **Git:** изменения оставлены в рабочем дереве ветки `refactor/es-modules` без коммитов — в дереве уже были несохранённые правки владельца (`SPEC.md`, `RULES.md`, `PLAN.md`, `TASKS.md`, новые `spec_v1_8_2.md`, `rules_v_1_8_2.md`), `git add -A` запрещён (Z26); коммиты — по согласованию.
- **Документация:** README/GIGACODE переписаны под 1.8.2 (структура, слои, `tsconfig`, red-list, smoke); `test/README.md` — red-list и этап 3; `SPEC.md` и `spec_v1_8_2.md` — «Выполнено»; `PLAN.md` — статус «выполнено».
