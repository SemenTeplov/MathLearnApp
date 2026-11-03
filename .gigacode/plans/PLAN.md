# План — MathLingo

**Версия:** 1.8.1  
**Статус:** Этап 16 «Статистика раунда» (SPEC 1.8.1 — «Этап 3.1») — ✅ реализован  
**Предыдущие этапы:** 1–15 (1.2.0–1.8.0) — ✅ реализованы; базовая линия 1.8.0: **`npx tsc --noEmit` — 0 ошибок, 141/141 в 11 сьютах**, все экраны — React, `js/` — 19 classic-файлов  
**Создан на основе:** RULES 1.8.1 (`rules_v_1_8_1.md`: A48–A51, T41–T43, Z22–Z23) и SPEC 1.8.1 (`spec_v1_8_1.md`: TR-23…TR-27, приёмочные тесты 1–4)  
**Предыдущая версия плана:** 1.8.0 (`plans/PLAN_v1_8_0.md` — архив)  
**Тип изменения:** локальное исправление модели раунда — счётчики ответов вместо вывода из индекса вопроса. Компоненты, хуки, CSS, `CONFIG`, `Stats` и пороги оценок **не меняются**.

---

## ⚠️ Решения, на которых стоит план

| # | Решение | Следствие |
|---|---------|-----------|
| 1 | **Счётчики живут в `SessionModel`** (`_correct`, `_wrong`) и меняются в `recordCorrect()`/`recordIncorrect()` — единственный источник истины (A48). `getResults()` только читает | Дефект исправляется в одном файле; экран и хуки не знают, откуда числа, и не нуждаются в правках |
| 2 | **Инкремент — в модели, а не в `useGame`.** `useGame.answer()` уже вызывает нужный метод в каждой ветке (`useGame.ts:113` — `recordCorrect`, `:123` — `recordIncorrect`) | Правка не выходит за `js/model/session-model.ts` (T43). Счёт в хуке потребовал бы правок React-слоя — прямое нарушение Z22 и лишний риск |
| 3 | **`total = correct + wrong`** — «фактически отвечено» (A49). `TOTAL_QUESTIONS` остаётся только условием завершения раунда (`GameRules.shouldEndGame`) и больше не участвует в точности | Для завершённого раунда 10 ответов `total` всё равно 10; при 0 жизнях — 3, а не 10 |
| 4 | **`GameRules.getRating` не меняем.** Он уже считает `accuracy = round(correct / total × 100)`, проверяет `lives <= 0` первым и берёт пороги из `CONFIG.RATINGS` (A50) | После фикса 8/2 автоматически даёт 80% → 🎉. Правка здесь была бы «починкой через правила/экран», запрещённой Z22 |
| 5 | **Тест — до фикса.** Новый сьют `test/model/session-model.test.js` (T42) вызывает **реальную** `SessionModel` через `readSource` + `eval` (как `stats-service.test.js`), а не переписывает её логику | На 1.8.0 сценарий 8/2 обязан упасть — это доказательство дефекта, а не «подгонка» теста |
| 6 | **15 тестов в 12-м сьюте**: 4 приёмочных сценария спеки + инварианты `total`, счётчики после `reset`, «0 ответов», независимость от индекса | Итог **156/156** (141 + 15); 11 прежних сьютов не трогаются |
| 7 | **`reset()` — часть фикса:** новые поля обнуляются вместе с `_lives`, `_roundScore`, `_currentQuestionIndex`, `_difficulty`, `_completed` (A51) | «Забыть» счётчики в `reset()` — типичная регрессия; тест №13–15 её ловит |
| 8 | **Git теперь есть** (`5cec9da` — initial commit), поэтому локализация доказывается `git diff --name-only`, а не только `md5sum` | Правка допустима ровно в двух кодовых файлах: `js/model/session-model.ts` и новый тест. Остальное — документация |
| 9 | **Оценки и статистика не «улучшаются».** `StatsService.updateAfterRound(roundScore)` получает те же очки (80), `ml_stats` по значениям не меняется; `ResultsScreen` показывает `results.correct` | «Правильных: 8» появляется без единой правки разметки; `ml_stats` остаётся v3 |

---

## 🎯 Цель

Результаты раунда показывают **фактические** ответы, а оценка считается **от них**:

- `getResults()` → `correct` = число правильных, `wrong` = число неправильных, `total = correct + wrong`;
- 8/2 → «🎉 Отлично!» (80%) и «Правильных: 8» вместо «🏆 Идеально!» и «10»;
- 10/10 → «🏆 Идеально!» (100%), 0/3 → «💔 Игра окончена» — как и раньше;
- «Играть снова» начинает с 0/0/0;
- **`tsc --noEmit` — 0; `npm test` — 156/156 в 12 сьютах**; старые 141 — зелёные;
- компоненты, хуки, CSS, `CONFIG`, `Stats`, пороги, `index.html` — **без изменений**.

Никакого рефакторинга модели, новых карточек, точности в UI и правок «заодно».

---

## 📐 Что именно меняет 1.8.1

| Источник | Требование | Следствие для плана |
|----------|-----------|---------------------|
| **TR-23** | Счётчики в модели: правильный → `_correct++` + `_roundScore += POINTS_BASE`; неправильный → `_wrong++`, `_lives--`; только при ответе | 16.2: два поля + инкременты; индекс, очки и жизни на счётчики не влияют |
| **TR-24** | `getResults()` отдаёт фактические `correct`/`wrong`, `total = correct + wrong` — отвечено | 16.2: `getResults` читает поля; комментарий про `total` (A49) |
| **TR-25** | Оценка: `lives <= 0` → «Игра окончена» первым; иначе точность от `correct/total`; пороги из `CONFIG.RATINGS` | Правок нет: `GameRules.getRating` уже такой; 16.1/16.3 проверяют три сценария автоматически и в UI |
| **TR-26** | `reset()` обнуляет оба счётчика вместе с остальными полями | 16.2: две строки в `reset()`; тест 16.1 |
| **TR-27** | Сьют `test/model/session-model.test.js` на реальной модели: 8/2, 10/10, 0/3, reset + инварианты; прежние 141 — зелёные; `tsc` 0; README/test/README | 16.1 (красный), 16.2 (зелёный), 16.4 (документация) |
| **A48/A49/A51** | Счётчики — источник истины; `total` — отвечено; `reset` — полный сброс | Та же локализация; запрет выводить счётчики из индекса/очков/жизней/DOM |
| **T41/T43** | Поля и сигнатуры `SessionModel`; `GameResult` не расширяется; правка только в модели | Контракт ниже; `src/types.ts` не меняется |
| **T42/Z23** | Тест вызывает модель, `CONFIG` — из `test/setup.js`, red → green, не ослаблять старые тесты | Сьют ниже; `GameRules` подгружается только для оценки, его формулы не копируются |
| **Z22** | Запрещено: индекс/очки/жизни как источник счётчиков, правки `CONFIG`, UI/CSS, `Stats`, карты, звука, сигнатур | Раздел «Запреты» |

---

## ✅ Что НЕ меняется

| Область | Факт |
|---------|------|
| `src/**` | 0 правок: `useGame` уже зовёт `recordCorrect`/`recordIncorrect`/`getResults` (`useGame.ts:113/123/149`), `useResults` — `GameRules.getRating`, `ResultsScreen` — `results.correct` (`ResultsScreen.tsx:26`) |
| `js/logic/game-rules.ts` | `checkAnswer`, `shouldEndGame`, `getRating` — без изменений; `getRating` уже соответствует A50 |
| `CONFIG` | `TOTAL_QUESTIONS = 10`, `MAX_LIVES = 3`, `POINTS_BASE = 10`, `RATINGS` (100/70/40/0), `GAMEOVER` — те же значения и тексты |
| `Stats` / Storage | `StatsService.updateAfterRound(roundScore)`, `ml_stats` v3, позиция, `switchMap` — не затрагиваются; очки за раунд те же |
| CSS / разметка | 21 файл `css/**`, классы, inline-стили — 0 правок; новых карточек, точности и «из 10» нет |
| `index.html` | `js/model/session-model.ts` уже подключён (строка 28) после `config.ts` — порядок подходит |
| `GameResult` | `src/types.ts` (6 полей: `correct`, `wrong`, `total`, `roundScore`, `lives`, `completed`) не меняется |
| Старые тесты | 141 тест в 11 сьютах — без правок и ослаблений (Z23) |

---

## 📎 Исходное состояние (проверено 03.11.2026)

| Проверка | Факт | Вывод |
|----------|------|-------|
| `npx tsc --noEmit` | **0 ошибок** | Исходная точка зелёная |
| `npm test` | **141/141** в **11** сьютах, ~4.9 с | Базовая линия; после сьюта модели — 156/12 |
| `js/model/session-model.ts` | **98 строк**; поля `_lives`, `_roundScore`, `_currentQuestionIndex`, `_difficulty`, `_completed`; счётчиков ответов **нет** | Место дефекта |
| `getResults()` | `const total = CONFIG.TOTAL_QUESTIONS; const correct = this._currentQuestionIndex; const wrong = correct;` (`session-model.ts:84–99`) | К концу раунда `correct = 10`, `wrong` копирует `correct`; точность всегда 100% |
| `recordCorrect()` / `recordIncorrect()` | Только `_roundScore += POINTS_BASE` / `_lives--` | Инкрементов счётчиков нет — отсюда баг |
| Вызовы модели | `useGame.ts:113` — `recordCorrect()`, `:123` — `recordIncorrect()`, `:145` — `advanceQuestion()`, `:149` — `getResults()` | Контракт менять не нужно: оба метода уже вызываются в нужных ветках |
| `GameRules.getRating` | `lives <= 0` → `GAMEOVER`; `accuracy = Math.round(correct / total * 100)`; пороги `CONFIG.RATINGS` | Уже соответствует TR-25/A50 — правок нет |
| `ResultsScreen.tsx:26` | `<div className="stat-value">{results.correct}</div>` | «Правильных» станет 8 автоматически |
| Сьюты `test/model/` | `config` (6), `map-catalog` (9), `stats-schema` (16); сьюта `session-model` **нет** | T42 требует новый файл |
| `test/logic/scoring.test.js` | Копирует формулы в тест (8 тестов) | **Анти-пример** из T42: сьют модели должен вызывать класс |
| `test/setup.js` | `global.CONFIG` с `TOTAL_QUESTIONS`, `MAX_LIVES`, `START_DIFFICULTY`, `POINTS_BASE`, `RATINGS`, `GAMEOVER` | Готов для теста модели; дублировать `CONFIG` нельзя |
| `test/ts-source.js` | `readSource()` + `typescript.transpileModule` (ES2020, `module: None`) | Работает для `.ts`-класса с `eval` |
| README / test/README | «141 тест в 11 сьютах»; таблица покрытия из 11 модулей | Обновить до 156/12 (16.4) |
| Git | Один коммит `5cec9da`; `spec_v1_8_1.md`/`rules_v_1_8_1.md` — untracked, `PLAN.md` — modified | Локализация проверяется `git diff --name-only` |
| `.gigacode/tasks/TASKS.md` | Версия 1.8.0, этапы 0–15 ✅ | Синхронизировать на 16 (16.4), иначе PLAN и TASKS расходятся |

### Чего не хватает после 1.8.0

1. **Счётчиков ответов в модели** — вместо них в `getResults()` индекс вопроса.
2. **Инкрементов в `recordCorrect`/`recordIncorrect`** — методы меняют только очки/жизни.
3. **`total` = фактически отвечено** — сейчас всегда `TOTAL_QUESTIONS` (10).
4. **Теста модели** — баг не поймал ни один из 141 теста.
5. **Документации 1.8.1** — README/test/README/GIGACODE/SPEC/TASKS всё ещё про 1.8.0.

---

## 🏗️ Архитектура (минимальная дельта)

```
index.html
  └─ <script src="js/model/session-model.ts">            [без изм.: уже строка 28]
        class SessionModel                                [ИЗМ: +_correct, +_wrong]
          recordCorrect()   → _correct++ ; _roundScore += POINTS_BASE    [ИЗМ]
          recordIncorrect() → _wrong++  ; _lives--                        [ИЗМ]
          reset()           → нули, включая счётчики                      [ИЗМ]
          getResults()      → читает _correct/_wrong/_lives/...           [ИЗМ]

src/hooks/useGame.ts        [без изм.]  answer → record*; next → advanceQuestion → shouldEndGame → getResults
src/hooks/useResults.ts     [без изм.]  getRating(results) → isRoundSuccessful → Stats/звук → view
src/components/ResultsScreen.tsx [без изм.] results.correct, results.roundScore
js/logic/game-rules.ts      [без изм.]  getRating: lives<=0 → accuracy(correct/total) → CONFIG.RATINGS

test/model/session-model.test.js   [NEW]  readSource + eval → 15 тестов
```

**Поток 8/2 (после фикса):** 8 × `recordCorrect()` → `_correct = 8`, `_roundScore = 80`; 2 × `recordIncorrect()` → `_wrong = 2`, `_lives = 1`; 10 × `advanceQuestion()` → индекс 10; `shouldEndGame` → `setCompleted(true)`; `getResults()` → `{ correct: 8, wrong: 2, total: 10, roundScore: 80, lives: 1, completed: true }`; `getRating` → 80 → `CONFIG.RATINGS[1]` → 🎉 «Отлично!».

**Почему не в хуке и не на экране:** счётчик ответа — факт модели раунда, а не представления. Расчёт в `useGame`/`useResults`/`ResultsScreen` нарушил бы A48 («единственный источник истины») и потребовал бы правок React-слоя, запрещённых T43/Z22.

---

## 🧩 Контракты

### `js/model/session-model.ts` (98 → ≈118 строк)

```ts
class SessionModel {
    _lives: number;
    _roundScore: number;
    _correct: number;      // NEW (A48)
    _wrong: number;        // NEW (A48)
    _currentQuestionIndex: number;
    _difficulty: Difficulty;
    _completed: boolean;

    constructor() {
        this._lives = CONFIG.MAX_LIVES;
        this._roundScore = 0;
        this._correct = 0;
        this._wrong = 0;
        this._currentQuestionIndex = 0;
        this._difficulty = CONFIG.START_DIFFICULTY;
        this._completed = false;
    }

    // геттеры/сеттеры прежних полей — без изменений;
    // геттеры correct/wrong не обязательны и в 1.8.1 не добавляются

    recordCorrect(): void {
        this._correct++;
        this._roundScore += CONFIG.POINTS_BASE;
    }

    recordIncorrect(): void {
        this._wrong++;
        this._lives--;
    }

    reset(): void {
        this._lives = CONFIG.MAX_LIVES;
        this._roundScore = 0;
        this._correct = 0;
        this._wrong = 0;
        this._currentQuestionIndex = 0;
        this._difficulty = CONFIG.START_DIFFICULTY;
        this._completed = false;
    }

    getResults(): GameResult {
        return {
            correct: this._correct,
            wrong: this._wrong,
            // A49: total — фактически отвечено, а не TOTAL_QUESTIONS:
            // при досрочном окончании «0 из 10» вводил бы в заблуждение,
            // а неотвеченные вопросы не являются ошибками.
            total: this._correct + this._wrong,
            roundScore: this._roundScore,
            lives: this._lives,
            completed: this._completed
        };
    }
}
```

Правила: сигнатуры `recordCorrect`, `recordIncorrect`, `reset`, `getResults` — те же (T41); `setLives`/`setRoundScore`/`setDifficulty`/`setCompleted` сохраняются; `advanceQuestion()` двигает только индекс (T41); `any` не добавляется; `GameResult` не расширяется (T43).

### `test/model/session-model.test.js` (NEW, ≈120 строк, 15 тестов)

Шапка сьюта:

```js
const { readSource } = require('../ts-source');

eval(readSource('./js/model/session-model.ts') + '\nglobal.SessionModel = SessionModel;');
eval(readSource('./js/logic/game-rules.ts') + '\nglobal.GameRules = GameRules;');
```

`CONFIG` — из `test/setup.js` (не дублируется, T42). Тест **вызывает** модель; `GameRules` нужен только для оценки (TR-25), его формулы в тест не копируются.

| Блок | # | Проверка | Ожидание |
|------|---|----------|----------|
| `recordCorrect` | 1 | один правильный ответ | `correct = 1`, `roundScore = POINTS_BASE` |
| | 2 | восемь правильных | `correct = 8`, `roundScore = 80` |
| | 3 | 3 × `advanceQuestion` + 1 правильный | `correct = 1` — счётчик не зависит от индекса (A48) |
| `recordIncorrect` | 4 | одна ошибка | `wrong = 1`, `lives = MAX_LIVES − 1` |
| | 5 | три ошибки | `wrong = 3`, `lives = 0` |
| | 6 | 1 правильный + 1 неправильный | `correct = 1`, `wrong = 1`, `roundScore = 10`, `lives = MAX_LIVES − 1` |
| `getResults` | 7 | **8/2**, `setCompleted(true)` | `correct 8`, `wrong 2`, `total 10`, `roundScore 80`, `lives 1`, `completed true`; `getRating` → 🎉 «Отлично!» (80) |
| | 8 | **10/10**, completed | `correct 10`, `wrong 0`, `total 10`, `roundScore 100`; 🏆 «Идеально!» |
| | 9 | **0/3** (жизни 0), completed | `correct 0`, `wrong 3`, `total 3`; 💔 «Игра окончена» (`lives <= 0` первым) |
| | 10 | 3 правильных + 1 неправильный с `advanceQuestion` | `total = correct + wrong = 4` (A49) |
| | 11 | без ответов | `correct 0`, `wrong 0`, `total 0`, `roundScore 0`; точность 0 (без деления на 0) |
| | 12 | `setCompleted(true)` без ответов | `completed true`, `total 0` — признак пробрасывается |
| `reset` | 13 | после 1 правильного и 1 неправильного | `0/0/0`, `roundScore 0` |
| | 14 | после `setDifficulty('hard')` и ответов, затем `reset()` | `lives = MAX_LIVES`, `difficulty = CONFIG.START_DIFFICULTY`, индекс 0, `completed false` |
| | 15 | второй раунд после `reset()` | не наследует счётчики: 1 правильный → `correct 1`, `wrong 0`, `total 1` |

**Red → green:** на 1.8.0 падают **14 из 15** — все, где проверяются `correct`/`wrong`/`total`; зелёным остаётся только №14 (поля после `reset`). Минимальное доказательство — сценарий 8/2 (№7). Первый прогон фиксируется в журнале 16.1.

---

## 🚀 Этап 16: статистика раунда (SPEC 1.8.1 = «Этап 3.1»)

Порядок жёсткий: **тест (red) → фикс (green) → проверка UI → документация**. После каждого шага: `npx tsc --noEmit` → 0, `npm test` → зелёный, `git diff --stat` — только ожидаемые файлы.

| Шаг | Что делается | Файлы | Метка |
|-----|--------------|-------|-------|
| 16.0 | подготовка, базовый срез | — | `baseline 1.8.0` |
| 16.1 | сьют модели, **красный** | `test/model/session-model.test.js` | `red-8-2` |
| 16.2 | фикс модели | `js/model/session-model.ts` | `fix-model` |
| 16.3 | проверка UI и локализации | — | `ui-check` |
| 16.4 | документация | README, test/README, GIGACODE, SPEC, TASKS | `docs 1.8.1` |
| 16.5 | финальный прогон и аудит | — | `final-run` |

### 16.0. Подготовка

- Зафиксировать базовый срез: `npx tsc --noEmit` (0), `npm test` (141/141), `git rev-parse HEAD` + `git status --short` → `/tmp/ml-1.8.1-baseline.txt`.
- Скопировать `js/model/session-model.ts` и `test/model/stats-schema.test.js` (образец `eval`-загрузки) в `/tmp/ml-1.8.1-backup/` — откат одного файла без коммита.
- Свериться с числами, которые пойдут под замену на 16.4: «141 тест в 11 сьютах» в `README.md`, `test/README.md`, `GIGACODE.md`.

**Критерий:** есть baseline-срез и копия исходной модели; `tsc` 0; `npm test` 141/141. **Охватывает:** A43 (фиксация), T43 (точка отката).

### 16.1. Тест, воспроизводящий баг (T42, обязательство 1)

**Создать:** `test/model/session-model.test.js` — 15 тестов из таблицы «Контракты» (блоки `recordCorrect`, `recordIncorrect`, `getResults`, `reset`).

**Проверить:** `npx vitest run test/model/session-model.test.js` → **красный**; в отчёте видны падения 8/2 (`wrong = 10` вместо 2), 10/10 (`wrong = 10` вместо 0) и сценариев с `total`. Полный `npm test` на этом шаге **красный** — это ожидаемо и фиксируется в журнале; остальные 141 не трогаются.

**Критерий:** сьют существует, вызывает реальную модель, 8/2 падает; `git diff --name-only` — только новый файл. **Охватывает:** T42, Z23, приёмочные тесты 1–4 (в виде падающих проверок).

### 16.2. Фикс `SessionModel` (TR-23, TR-24, TR-26; A48/A49/A51)

**Изменить `js/model/session-model.ts`:**

- поля `_correct`, `_wrong` + инициализация в конструкторе;
- `recordCorrect()`: `_correct++` вместе с `_roundScore += CONFIG.POINTS_BASE`;
- `recordIncorrect()`: `_wrong++` и `_lives--`;
- `reset()`: `_correct = 0`, `_wrong = 0` вместе с остальными полями;
- `getResults()`: `correct: this._correct`, `wrong: this._wrong`, `total: this._correct + this._wrong` + комментарий A49 о фактически отвеченных.

**Не менять:** геттеры/сеттеры прежних полей, `advanceQuestion`, JSDoc-стиль, сигнатуры.

**Проверить:** `npx vitest run test/model/session-model.test.js` → **15/15 зелёные**; `npm test` → **156/156** в 12 сьютах; `npx tsc --noEmit` → 0.

**Критерий:** 8/2 → `correct 8`, `wrong 2`, `total 10`, `roundScore 80`, 🎉; 10/10 → 🏆; 0/3 → `total 3`, 💔; `reset()` → 0/0/0. **Охватывает:** TR-23/24/26, A48/A49/A51, приёмочные тесты 1–4.

### 16.3. Проверка UI и локализации (TR-25, T43, Z22)

1. **Локализация:** `git diff --name-only` → ровно `js/model/session-model.ts` + `test/model/session-model.test.js` (документация появится на 16.4). `git diff --stat -- src/ css/ index.html js/logic js/service js/storage js/errors js/model/config.ts` → пусто.
2. **Автоматическая оценка:** тесты 16.1 уже проверяют три сценария (🎉/🏆/💔) — вручную не дублировать.
3. **`npm run dev`** (ручной прогон, без правок кода):
   - смешанный раунд: 8 верных + 2 ошибки, жизни > 0 → «🎉 Отлично!», «Правильных: 8», «Заработано: 80 ✓», позиция закреплена, `ml_stats` +80;
   - 10 верных → «🏆 Идеально!», «Правильных: 10», 100 очков;
   - 3 ошибки подряд → «💔 Игра окончена», «Правильных: 0», очки не зачтены, позиция откачена;
   - «Играть снова» → 0/0/0, жизни 3/3, счёт раунда 0;
   - консоль без ошибок.
4. **Статистика:** `localStorage.ml_stats` — `version: 3`, `totalScore` растёт только за победу на те же 80/100; структура не изменилась.

**Критерий:** React-слой и CSS не изменены; четыре сценария п. 3 дают ожидаемые экраны; `ml_stats` v3. **Охватывает:** TR-25, T43, Z22, критерии 114/116.

### 16.4. Документация (TR-27, обязательство 7)

- **`README.md`**: «141 тест в 11 сьютах» → **156 в 12** (три места: «Запуск», «Тесты», «Статус»); в «Тесты» — `test/model/` + сьют `session-model`; раздел «1.8.1 — статистика раунда» (счётчики, `total = отвечено`, 8/2 → «Отлично!»); в статус-таблицу — строка 1.8.1; в smoke-тест п. 11 уточнить: «победа с 8 верными из 10 → «Отлично!», «Правильных» = 8, «Заработано: 80 ✓»» (число сценариев остаётся 16).
- **`test/README.md`**: структура (+`model/session-model.test.js` — 15), таблица покрытия (+`model/session-model.ts` — 15: счётчики, `getResults`, `total`, `reset`), итог **156**; раздел «1.8.1» с red → green.
- **`GIGACODE.md`**: `npm test` — 156/12; `test/model/` в структуре; при упоминании модели — «счётчики ответов в `SessionModel`».
- **`.gigacode/specs/SPEC.md`**: статус 1.8.1 → **Выполнено** (после 16.5); история версий — как в `spec_v1_8_1.md`.
- **`.gigacode/tasks/TASKS.md`**: версия/основа → 1.8.1, этап 16 «Статистика раунда» ✅, итог 156/12; либо `TASKS_v1_8_0.md` — архив (если владелец предпочитает архивировать, как план).
- **`.gigacode/plans/PLAN.md`** — эта версия (1.8.1); **`PLAN_v1_8_0.md`** — архив 1.8.0.

**Критерий:** числа в README/test/README/GIGACODE совпадают с фактическим прогоном (156/12); SPEC/TASKS/PLAN — 1.8.1. **Охватывает:** TR-27 (последний пункт), обязательство 7.

### 16.5. Финальный прогон и аудит

| # | Проверка | Ожидание |
|---|----------|----------|
| 1 | `npx tsc --noEmit` | 0 ошибок |
| 2 | `npm test` | **156/156**, 12 сьютов; 141 прежний — зелёный |
| 3 | `git diff --name-only` + `git status --short` | код: `js/model/session-model.ts`, `test/model/session-model.test.js`; документация: README, test/README, GIGACODE, SPEC, TASKS, PLAN(+архив). **Ничего в `src/`, `css/`, `index.html`, `js/logic`, `js/model/config.ts`** |
| 4 | `grep -n "_currentQuestionIndex" js/model/session-model.ts` | только геттер/`reset`/`advanceQuestion`, **не** в `getResults` (A48) |
| 5 | `grep -n "TOTAL_QUESTIONS" js/model/session-model.ts` | **0** (A49: `total` не из `TOTAL_QUESTIONS`) |
| 6 | `wc -l js/model/session-model.ts` | ≤ 200 (ожидается ≈118) |
| 7 | `grep -n "any\|var \|console.log" js/model/session-model.ts` | 0 |
| 8 | `npm run dev` | 4 сценария 16.3 + базовые (карта, 🌍, вторая вкладка) без регрессий |
| 9 | `localStorage.ml_stats` | `version: 3`, структура и суммы те же |

**Критерий:** все пункты зелёные; при желании владельца — один коммит `fix(1.8.1): фактическая статистика раунда` (A43: коммит после шага; здесь один шаг — одна модель). **Охватывает:** TR-27, Z22/Z23, критерии 107–118.

---

## ✅ Критерии завершения (1.8.1, 107–118)

107. **Счётчики при ответе** (A48/TR-23): `recordCorrect` → `_correct++` и `+POINTS_BASE`; `recordIncorrect` → `_wrong++`, `_lives--`; счётчики не зависят от индекса, очков и жизней; 8 верных → `correct = 8`.
108. **Фактический результат** (A49/TR-24): `getResults()` читает счётчики; `total = correct + wrong` (комментарий в коде); 8/2 → 8/2/10/80; 0/3 → `total = 3`.
109. **Оценка** (A50/TR-25): `lives <= 0` → 💔 первым; точность `round(correct/total×100)`, при `total = 0` — 0; пороги `CONFIG.RATINGS`; 8/2 → 🎉, 10/10 → 🏆, 0/3 → 💔; `getRating` не изменён.
110. **Сброс** (A51/TR-26): `reset()` обнуляет `_correct`/`_wrong` вместе с жизнями, очками, индексом, сложностью, `completed`; после него `0/0/0`, `lives = 3`.
111. **Сьют модели** (T42/TR-27): `test/model/session-model.test.js`; реальная модель через `readSource` + `eval`; `CONFIG` из `setup.js`; 15 тестов; 4 приёмочных сценария + `total = correct + wrong` + `total = 0`; логика в тесте не скопирована.
112. **Red → green:** на 1.8.0 сьют падал (минимум 8/2), после фикса — зелёный; прогоны зафиксированы (журнал/коммит).
113. **Регрессия:** 141 прежний тест — зелёный (без правок и ослаблений); итог **156/156** в 12 сьютах; `npx tsc --noEmit` — 0.
114. **Локализация** (T43/Z22): код изменён только в `js/model/session-model.ts` + новый тест; `src/**`, `css/**`, `index.html`, `js/logic/**`, `js/service/**`, `js/storage/**`, `js/errors/**`, `js/model/config.ts` — 0 правок (`git diff`).
115. **`CONFIG` не изменён** (Z22): `TOTAL_QUESTIONS 10`, `MAX_LIVES 3`, `POINTS_BASE 10`, `RATINGS`, `GAMEOVER` — значения и тексты те же.
116. **UI не изменён** (Z22): разметка/CSS результатов те же; «Правильных» показывает фактические 8; точность, «из 10», новые карточки не добавлены; сигнатуры методов те же.
117. **`Stats` и позиция не тронуты** (Z22): `ml_stats` v3, суммы/позиция/`switchMap` — прежние; звук и блокировка вкладок не затронуты.
118. **Документация синхронизирована:** README/test/README/GIGACODE — 156/12 и раздел 1.8.1; `SPEC.md` — 1.8.1 выполнено; `TASKS.md` — этап 16; `PLAN.md` = 1.8.1, `PLAN_v1_8_0.md` — архив.

---

## 📏 Бюджет 200 строк

| Файл | Сейчас | После 1.8.1 | Как уложиться |
|------|--------|-------------|----------------|
| `js/model/session-model.ts` | 98 | **≈118** | +2 поля, +2 инкремента, +2 строки `reset`, комментарий A49; без геттеров `correct`/`wrong` и новых методов |
| `test/model/session-model.test.js` | — | **≈120** | 4 блока, 15 тестов, `beforeEach` с новой моделью |
| `src/**` | — | **без изменений** | правок нет |
| README.md / test/README.md / GIGACODE.md | — | правки текста | числа и один раздел |

Если `session-model.ts` выйдет за 130 строк — виноваты лишние геттеры/хелперы; в 1.8.1 они не нужны (Z22: минимальный фикс).

---

## 📂 Структура файлов (дельта)

```
js/model/session-model.ts          # [ИЗМ] +_correct/+_wrong, record*, reset, getResults (A48/A49/A51)
js/logic/game-rules.ts             # [без изм.] getRating уже считает от correct/total
src/hooks/useGame.ts               # [без изм.] record*/getResults вызываются как раньше
src/hooks/useResults.ts            # [без изм.] getRating → Stats/звук
src/components/ResultsScreen.tsx   # [без изм.] results.correct, results.roundScore
src/types.ts                       # [без изм.] GameResult — те же 6 полей
index.html                         # [без изм.] session-model.ts уже подключён
test/model/session-model.test.js   # [NEW] 15 тестов (T42)
test/README.md README.md GIGACODE.md   # [ИЗМ] 156/12, раздел 1.8.1
.gigacode/
  plans/PLAN.md                    # этот файл (1.8.1)
  plans/PLAN_v1_8_0.md             # архив 1.8.0
  specs/SPEC.md                    # статус 1.8.1 — выполнено
  specs/spec_v1_8_1.md             # источник (не меняется)
  rulles/RULES.md, rules_v_1_8_1.md # источник (не меняется)
  tasks/TASKS.md                   # версия 1.8.1, этап 16
```

---

## 🚫 Запреты

### Z22 (фикс) — буквально

- Вычислять `correct`/`wrong` из `_currentQuestionIndex`, `_roundScore`, `_lives`, `POINTS_BASE` или DOM.
- Менять `CONFIG`: `TOTAL_QUESTIONS`, `MAX_LIVES`, `POINTS_BASE`, `RATINGS`, `GAMEOVER`.
- Менять разметку и CSS экрана результатов; добавлять точность, «из 10», карточки.
- Трогать `Stats`, позицию, карту, звук, блокировку вкладок.
- Добавлять фичи (серии, бонусы, таймеры, анимации) и рефакторить вне дефекта.
- Менять сигнатуры `recordCorrect`, `recordIncorrect`, `reset`, `getResults`.
- «Чинить» через пересчёт очков в `Scoring`, `GameRules` или на экране.

### Z23 (тесты) — буквально

- Копировать логику модели в тест вместо вызова `SessionModel` (как в `scoring.test.js`).
- Подменять `CONFIG` или пороги под ожидания; дублировать `CONFIG` вместо `test/setup.js`.
- Ослаблять/удалять старые тесты ради зелёного прогона.
- Писать тест, проходящий и на баге; проверять только `roundScore`, не проверяя `correct`/`wrong`/`total`.

### Дополнительно для 1.8.1

- Править `useGame`, `useResults`, `GameRules`, `ResultsScreen`, `types.ts` — даже «для ясности».
- Добавлять геттеры `correct`/`wrong`, сеттеры счётчиков, новые методы или поля `GameResult`.
- Делать `total` зависимым от `TOTAL_QUESTIONS` «для совместимости».
- Менять числа в README «на глаз» — только по фактическому прогону.
- Оставлять `test/README.md`/`GIGACODE.md` с 141/11.

---

## 📦 Вне области (SPEC v1.8.1)

- Показ точности/«из 10»/новых строк на экране результатов; правки CSS.
- Изменение порогов, `POINTS_BASE`, `MAX_LIVES`, `TOTAL_QUESTIONS`, `GAMEOVER`.
- `Stats` (v3/v4), позиция, карта, звук, блокировка вкладок.
- Новые фичи: серии, бонусы, таймеры, анимации.
- Порт UI-тестов на React, перевод слоёв на ES-модули, `vite build` (Этапы 4–5).
- Рефакторинг `SessionModel` сверх дефекта (переименования, приватность, `#private`).

---

## ⚠️ Отклонения/уточнения от буквы SPEC/RULES

| # | Требование | Уточнение | Как решаем |
|---|-----------|-----------|-----------|
| D13 | **TR-25** «оценка — из фактических счётчиков» | `GameRules.getRating` уже реализует A50 (`lives<=0` первым, `correct/total`, `CONFIG.RATINGS`) | Правок нет; 16.1/16.3 **проверяют** три сценария. Диффа по `game-rules.ts` не будет — это ожидаемо, а не «невыполнение» TR-25 |
| D14 | **TR-24** `wrong` — фактическое число | В 1.8.0 `wrong` копировал `correct`, т.е. любое прежнее значение было багом | Совместимость с прежним `wrong` не сохраняем; UI его не показывает, API (`GameResult`) — тот же |
| D15 | **A49** `total` — отвечено | Для незавершённого раунда/0 ответов `total` теперь 0–9, а не 10 | UI `total` не отображает; меняется только знаменатель точности — ровно то, что требует спека. Фиксируется тестами №9–11 |
| D16 | **A49** `TOTAL_QUESTIONS` — не знаменатель | `shouldEndGame` по-прежнему использует `TOTAL_QUESTIONS` (условие завершения — не точность) | `SessionModel` `TOTAL_QUESTIONS` не читает вовсе; `GameRules.shouldEndGame` не трогаем |
| D17 | **A43** «Git-коммит после каждого экрана» | Модель — не экран; в плане 1.8.0 репозитория не было, теперь он есть | Фиксация — `git diff --name-only`/`stat` на каждом шаге; один коммит — по согласованию с владельцем на 16.5. Откат — копия в `/tmp/ml-1.8.1-backup/` |

---

## 🔗 Трассировка требований

| Требование | Где реализуется | Шаг | Критерии |
|-----------|-----------------|-----|----------|
| TR-23. Счётчики при ответе | `session-model.ts` (`_correct`, `_wrong`, `record*`) | 16.2 | 107 |
| TR-24. Фактический `getResults` | `session-model.ts` (`getResults`, `total`) | 16.2 | 108 |
| TR-25. Оценка из счётчиков | `game-rules.ts` (без изм.) + тесты | 16.1, 16.3 | 109 |
| TR-26. `reset()` счётчиков | `session-model.ts` (`reset`) | 16.2 | 110 |
| TR-27. Тесты и регрессия | `test/model/session-model.test.js`, README | 16.1, 16.2, 16.4 | 111–113 |
| A48. Единственный источник истины | `recordCorrect`/`recordIncorrect`, запрет индекса | 16.2, 16.5 | 107, 114 |
| A49. `total = correct + wrong` | `getResults` + комментарий + тесты | 16.2 | 108, 111 |
| A50. Оценка только из `CONFIG` | `getRating` без изм.; тесты 7–9 | 16.1 | 109, 115 |
| A51. Полный `reset()` | `reset` | 16.2 | 110 |
| T41. Поля и API модели | контракт `SessionModel` | 16.2 | 108, 116 |
| T42. Сьют `SessionModel` | `test/model/session-model.test.js` | 16.1 | 111, 112 |
| T43. Совместимость | `git diff`, отсутствие правок `src/` | 16.3, 16.5 | 114, 116 |
| Z22. Запреты фикса | раздел «Запреты» | весь этап | 114–117 |
| Z23. Запреты тестов | раздел «Запреты» | 16.1 | 111–113 |
| Приёмочные 1–4 (SPEC) | тесты №7, 8, 9, 13 | 16.1 | 111, 112 |

---

## ⚠️ Риски и примечания

- **`answeredRef` в `useGame`** защищает от двойного `recordCorrect` за один вопрос. Модель такой защиты не даёт — и не должна (в 1.8.0 её не было). Если тест/будущий код вызовет `record*` дважды, счётчик честно увеличится на 2; guard не добавляем (Z22: минимальный фикс).
- **`advanceQuestion` без ответа** (например, в тесте) даёт `correct = 0`, `wrong = 0`, `total = 0` при индексе 3. Это **корректно** по A49: отвечено 0. В UI такого пути нет — `advanceQuestion` вызывается только из `next()` после ответа.
- **`total = 0` и оценка.** `getRating` → `accuracy = 0` → 📚 «Нужно потренироваться». Для завершённого раунда это недостижимо (0 ответов → `completed` не выставляется), для 0/3 срабатывает `lives <= 0`. Тест №11 фиксирует отсутствие деления на ноль.
- **Eval и класс.** `eval(readSource(...))` создаёт `SessionModel` в области `eval`; без `global.SessionModel = SessionModel;` тест упадёт с `ReferenceError`. Порядок загрузки: `session-model.ts` → `game-rules.ts` (второй использует `SessionModel` только в типе JSDoc, после транспиляции ссылки нет).
- **`CONFIG.START_DIFFICULTY` в тесте `reset`.** Тест ставит `'hard'`, затем проверяет, что `reset()` вернул сложность к `CONFIG.START_DIFFICULTY` (сейчас `'easy'`) — сравнение с константой, а не с литералом `'easy'`.
- **Числа в документации.** «156/12» — ожидание; если тестов окажется 14/16, критерий 113/118 требует **совпадения** чисел с фактическим прогоном, а не конкретной цифры. Пересчитать в 16.4 по выводу `npm test`.
- **README-срез 1.8.0.** В `README.md` уже есть срез 1.8.0 и чек-лист 16 сценариев; на 16.4 обновлять **только** числа и сценарий 11, не переписывая чек-лист (иначе история 1.8.0 потеряется).
- **`git diff` и untracked-файлы.** `spec_v1_8_1.md`/`rules_v_1_8_1.md`/`PLAN_v1_8_0.md` — новые файлы, `git diff` их не покажет. Для аудита использовать `git status --short` + `git diff --name-only` вместе.
- **Коммит.** Если владелец не даёт согласия на коммит, фиксация — `git diff` + журнал `/tmp/ml-1.8.1-log.txt` (метки 16.0–16.5). Не делать `git add -A`: `README.md`/`PLAN.md`/`SPEC.md` были modified ещё до задачи.
- **`vite build`** остаётся нерабочим (D2 из 1.8.0) — вне области; не пытаться «заодно» починить.
- **Песочница.** `npm test`/`npm run dev` пишут `node_modules/.vite` вне сессионного workspace — при работе в песочнице может требоваться расширение доступа; это окружение, а не проект.

### Вопросы владельцу (если не согласовано)

1. **Коммит:** один `fix(1.8.1): фактическая статистика раунда` в конце (16.5) — да/нет? (по умолчанию — только `git diff`, без коммита).
2. **`TASKS.md`:** обновить на месте до 1.8.1 или архивировать в `TASKS_v1_8_0.md` (как `PLAN_v1_8_0.md`)?
3. **Геттеры `correct`/`wrong`:** не добавляем (T41 «по желанию»); если нужны для отладки — только чтение, без сеттеров.

---

## ✅ Ожидаемый результат 1.8.1

- **Статистика честная:** `correct`/`wrong` считаются при ответе; 8/2 → «Правильных: 8», «🎉 Отлично!» (80%), «Заработано: 80 ✓».
- **`total = correct + wrong`** — фактически отвечено; при 0 жизнях `total` равен числу ответов (3), оценка — «💔 Игра окончена».
- **`reset()`** обнуляет счётчики вместе с раундом; «Играть снова» начинается с 0/0/0.
- **Локализация:** изменены только `js/model/session-model.ts` и новый тест; `src/`, `css/`, `index.html`, `GameRules`, `CONFIG`, `Stats` — 0 правок.
- **`tsc --noEmit` — 0**, **`npm test` — 156/156** в 12 сьютах (141 прежний + 15 новых), red → green зафиксирован.
- **Документация:** README/test/README/GIGACODE/SPEC/TASKS/PLAN — 1.8.1; `PLAN_v1_8_0.md` — архив.

---

## 📌 Краткая памятка агенту

✅ Сначала тест: 8/2 → `correct 8`, `wrong 2`, 🎉; на 1.8.0 он **красный**
✅ Счётчики — только в `recordCorrect`/`recordIncorrect`; `getResults` только читает
✅ `total = correct + wrong` (комментарий A49 + тест 0/3 → 3)
✅ `lives <= 0` → «Игра окончена» первым; пороги — `CONFIG.RATINGS`
✅ `reset()` обнуляет `_correct`, `_wrong` и остальные поля
✅ Тест вызывает реальную `SessionModel` (`readSource` + `eval`), `CONFIG` — из `setup.js`
✅ После фикса: 156/156 в 12 сьютах, `tsc` 0, старые 141 зелёные
✅ Правка — только `js/model/session-model.ts` + новый тест; документация — 16.4

❌ `correct` из `_currentQuestionIndex`/`_roundScore`/`_lives`
❌ `TOTAL_QUESTIONS` как знаменатель точности
❌ Менять пороги, `POINTS_BASE`, `MAX_LIVES`, `CONFIG`, UI, CSS
❌ Трогать `src/`, `GameRules`, `Stats`, карту, звук
❌ Копировать логику модели в тест; ослаблять старые тесты
❌ Новые фичи и рефакторинг вне дефекта
