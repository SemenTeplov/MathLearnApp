# TASKS.md — MathLingo

**Версия:** 1.6.0  
**Основа:** PLAN.md 1.6.0, SPEC.md 1.6.0, RULES.md 1.6.0

---

## 📖 Правила

- Задачи — **строго по порядку**
- Перед задачей — проверить **зависимости**
- После задачи — проверить **критерий готовности** (одна строка)
- При обрыве — продолжать с **последней** незавершённой

**Статус:** этапы 0–7 ✅ (1.2.0), **этап 8** ✅ (1.3.0), **этап 9** ✅ (1.3.1), **этап 10 «Игрок на карте»** ✅ (1.4.0), **этап 11 «Модалка при приходе, откат и повторная игра»** ✅ (1.4.1), **этап 12 «Глобальная карта и `Stats` v3»** ✅ (1.5.0) и **этап 13 «TypeScript без React»** ✅ (1.6.0).

> ℹ️ Цифра **182/182** снова воспроизводится: `setupFiles` подключён, тесты используют `vi.*` (задача 13.5). `npm run typecheck` — 0 ошибок, запуск — только `npm run dev` (Vite).

**Покрытие US/FR — см. карту в конце.**

---

## 📂 Структура

```
js/
  model/ types.js, config.js, map-catalog.js, stats-schema.js, session-model.js, game-model.js
  storage/ repository.js, local-repository.js, memory-repository.js, session-repository.js
  service/ stats-service.js, session-service.js, audio-service.js
  logic/ generator.js, scoring.js, game-rules.js, player-rules.js, player-state.js
  view/ dom.js, error-view.js, screen-view.js, map-layout.js, map-player-view.js, map-view.js, global-map-view.js, game-view.js, results-view.js
  controller/ session-controller.js, map-controller.js, global-map-controller.js, app-controller.js, game-controller.js, results-controller.js
  errors/ custom-errors.js, error-handler.js
  script.js
css/ map.css, map_items/ (map-screen, map-zone, map-road, map-trainer, map-player, map-modal, map-global)
audio/ click.mp3, win.mp3, lose.mp3
```

**Порядок подключения скриптов:** Errors → Audio → Model → Storage → Service → Logic → View → Controller → script.js.

**Новое в 1.3.0:** `js/view/map-view.js`, `js/controller/map-controller.js`, `css/map.css`, `css/map_items/*`.
**Удаляется в 1.3.0:** `css/screen_items/screens-logo.css`, `css/screen_items/screens-difficulty.css`.
**Новое в 1.3.1:** `js/view/map-layout.js`, `css/map_items/map-road.css`.
**Удаляется в 1.3.1:** `css/map_items/map-path.css`.
**Новое в 1.4.0:** `js/logic/player-rules.js`, `js/view/map-player-view.js`, `css/map_items/map-player.css`.
**Удаляется в 1.4.0:** —.
**Новое в 1.4.1:** `js/logic/player-state.js`.
**Удаляется в 1.4.1:** методы `PlayerRules.resolveAfterGame()` и `PlayerRules.resolveAfterCancel()` (переезжают в `PlayerState`).
**Новое в 1.5.0:** `js/model/map-catalog.js`, `js/model/stats-schema.js`, `js/view/global-map-view.js`, `js/controller/global-map-controller.js`, `css/map_items/map-global.css`.
**Удаляется в 1.5.0:** — (плоские поля `Stats` не удаляются из кода, а мигрируют в `maps`).

**Переименовывается в 1.6.0 (`.js` → `.ts`):** `model/config.js`, `model/session-model.js`, `model/game-model.js`, `logic/generator.js`, `logic/scoring.js`, `logic/game-rules.js`, `storage/repository.js`, `storage/local-repository.js`, `storage/memory-repository.js`, `storage/session-repository.js`, `service/stats-service.js`, `service/session-service.js`, `errors/custom-errors.js`, `errors/error-handler.js`.
**Новое в 1.6.0:** `js/model/types.ts` (только типы, в `index.html` **не** подключается), `test/ts-source.js` (transpile `.ts` для `eval`).
**Удаляется в 1.6.0:** `js/model/types.js` (заменён `types.ts`).
**Остаётся `.js` в 1.6.0:** `model/map-catalog.js`, `model/stats-schema.js`, `logic/player-rules.js`, `logic/player-state.js`, `service/audio-service.js`, весь `view/`, весь `controller/`, `script.js`.
**Инструменты в 1.6.0:** `tsconfig.json` (`include: ["js"]`), `package.json` (`typecheck`), `vitest.config.ts` (`setupFiles`).

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

**Критерии PLAN.md:** 1–23 → этапы 0–7 (проверено задачей 6.4); 24–34 → этап 8 (задачи 8.19, 8.20); **35–43 → этап 9 (задача 9.12)**; **44–52 → этап 10 (задача 10.19)**; **53–60 → этап 11 (задача 11.10)**; **61–70 → этап 12 (задача 12.12)**. **71–80 → этап 13 (задача 13.13)**.

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
