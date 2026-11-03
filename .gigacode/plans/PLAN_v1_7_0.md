# План — MathLingo

**Версия:** 1.7.0  
**Статус:** Этап 14 «React-пилот» (SPEC 1.7.0 — «Этап 2») — 📝 план составлен, реализация не начата  
**Предыдущие этапы:** 1–13 (1.2.0–1.6.0) — ✅ реализованы; базовая линия 1.6.0: **`tsc --noEmit` — 0 ошибок, 182 теста в 14 сьютах, 15 `.ts`**  
**Создан на основе:** RULES 1.7.0 (`rules_v_1_7_0.md`) и SPEC 1.7.0 (`spec_v1_7_0.md`)  
**Предыдущая версия плана:** 1.6.0 (`rules_v_1_6_0.md`, `spec_v1_6_0.md`) — реализована  
**Тип изменения:** пилот React — новая точка входа `main.tsx` и один компонент `ErrorModal`; старый JS работает параллельно.

---

## ⚠️ Решения, на которых стоит план

| # | Решение | Следствие |
|---|---------|-----------|
| 1 | **Единственный вход — `main.tsx`.** `<script src="js/script.js">` в `index.html` **закомментирован**, а сам `js/script.js` импортируется из `main.tsx` (`import './js/script.js'`) | Инициализация 1.6.0 выполняется **ровно один раз**: 34 классических скрипта — при разборе HTML, IIFE `script.js` — при импорте модуля. T34 («закомментирован, не удалён») и TR-12 («игра работает») выполняются одновременно |
| 2 | **Мост `ErrorView → window.showErrorModal` живёт в `js/script.js`** (≤ 10 строк), `js/view/error-view.js` **не меняется** | Z17 («не трогать `view/*.js` и `controller/*.js`») имеет приоритет над буквой TR-11; TR-12 прямо разрешает «адаптировать `script.js` минимально». Альтернатива — правка `error-view.js` в 3 строки — только с разрешения владельца |
| 3 | **Компоненты — в `src/`, `main.tsx` — в корне** (A38) | `tsconfig.include = ["js", "src", "*.tsx"]`: сохраняется проверка всех 15 `.ts` и добавляются `.tsx`; буквальный T31 (`src`, `*.tsx`, `*.ts`) выбросил бы `js/` из программы |
| 4 | **CSS не импортируется в `main.tsx`** | CSS остаётся `<link>`-ами в `index.html` (TR-10: «CSS — без изменений»); T32 допускает импорт «если нужно» — дублировать не нужно |
| 5 | **React — 19.3.1** (уже в `dependencies`), типы `@types/react@^19` | T30 требует «18+»; понижение не нужно, `createRoot` из `react-dom/client` |
| 6 | **`Window.showErrorModal` объявляется в `js/model/types.ts`** (в существующем `declare global`), без нового `global.d.ts` | Конвенция «все типы — в `types.ts`» (A33); файл в `index.html` не подключается, поэтому рантайм не затронут |
| 7 | **`build` остаётся `npm run typecheck`** | `vite build` «успешно» собирает модуль, но оставляет в `dist` теги на неэмитированные classic-скрипты (проверено) — прод-сборка вне этапа |

**Границы полномочий 1.7.0.** Версия 1.7.0 **снимает** запрет **Z15** (`rules_v_1_6_0.md`: «Добавлять React (Этап 2+)»), но только в рамках пилота (A36–A40). Требование **A35** «View и Controller — пока JS» **сохраняется** и в 1.7.0 усилено до **Z17/T35**: `view/*.js` и `controller/*.js` не трогаются, удаление старого JS — только после Этапа 5.

---

## 🎯 Цель

Доказать, что React **работает** в проекте, **не сломав** игру:

- **`main.tsx`** в корне — единственная точка входа, `createRoot` → `<App />` в `#root` (TR-8, A38, T32);
- **`src/components/ErrorModal.tsx`** — первый компонент: типизированная модалка ошибок на **существующих** CSS-классах (TR-9, A39, T33);
- **`src/App.tsx`** — состояние модалки и публикация `window.showErrorModal(title, message)` (TR-11, A40);
- **`index.html`** — `#root`, модульный `main.tsx`, старый `script.js` закомментирован, но не удалён (TR-10, T34);
- **старый JS** — 20 `.js` и 14 `.ts` классических скриптов, View/Controller и вся логика **не трогаются** (TR-12, T35, Z17);
- **`npx tsc --noEmit`** — 0 ошибок, включая `.tsx`; **`npm test`** — 182/182; **игра играется** через `npm run dev` (TR-13, TR-14).

Никаких новых фич, миграции экранов, глобального состояния (Context/Zustand), удаления старого кода и изменения логики/данных.

---

## 📐 Что именно меняет 1.7.0

| Источник | Требование | Следствие для плана |
|----------|-----------|---------------------|
| **TR-7 / T30** | `react`, `react-dom` — в `dependencies`; `@types/react`, `@types/react-dom` — в `devDependencies` | Runtime уже стоит (19.3.1); добавляются только **типы** `^19` |
| **TR-8 / A38 / T32** | `main.tsx` в корне: `createRoot`, `#root`, `<App />`, CSS | `main.tsx` ≈ 18 строк: `StrictMode` + `createRoot` + импорт `./js/script.js`; CSS — в HTML |
| **TR-9 / A39 / T33** | `ErrorModal`: функциональный, пропсы `title`/`message`/`onClose`, `.modal-overlay`/`.modal`, клик по фону закрывает, `stopPropagation` на модалке | `src/components/ErrorModal.tsx` ≈ 40 строк, `ErrorModalProps`, без `any` и `var` |
| **TR-10 / T34** | `#root` перед `</body>`; `<script type="module" src="/main.tsx">`; старый `script.js` закомментирован, **не удалён**; CSS без изменений | Правка `index.html` +4 строки; 14 `.ts` и 20 `.js` тегов и их порядок — без изменений |
| **TR-11 / A40** | `window.showErrorModal(title, message)`; старый `ErrorView` вызывает её; модалка через state в `App` | Мост в `script.js` (решение №2); `App` держит state; проверка — вторая вкладка и консоль |
| **TR-12 / T35** | `view/*.js`, `controller/*.js` — без изменений; `script.js` — без изменений или минимально адаптирован; Vite собирает всё вместе | `script.js` +≤10 строк; остальные 34 классических файла — 0 правок |
| **TR-13 / T31** | `jsx: react-jsx`, `include` с `.tsx`, `strict: true` | `include: ["js", "src", "*.tsx"]` (решение №3) |
| **TR-14** | игра работает: карта, игра, результаты, модалка ошибок | Ручной прогон 12 сценариев 1.6.0 + React-модалка |
| **Z17** | не заменять View/Controller, не добавлять Context/Zustand, не удалять старый JS, не менять логику, не добавлять фичи, не трогать `view/*.js`/`controller/*.js` | Список запретов — в разделе «Запреты»; проверка контрольными суммами |
| **Z18** | в React-файлах: без `any` без нужды, без прямого DOM (кроме `#root`), без бизнес-логики, без `var` | `ErrorModal` — «глупый» компонент; DOM только `getElementById('root')` в `main.tsx` |

---

## ✅ Что НЕ меняется

| Область | Факт |
|---------|------|
| Поведение и UI | 12 сценариев 1.6.0 (карта, счёт, позиция, 🌍, список карт, no-op, модалка сложности, отмена-откат, повторная игра, результаты, перезагрузка, `ml_stats` v3) — без изменений. Единственное намеренное дополнение — клик по фону закрывает **модалку ошибок** (T33) |
| View и Controller | `js/view/**` (9 файлов), `js/controller/**` (6 файлов) — **0 правок** |
| `js/script.js` | Файл сохраняется (25 строк), добавляется только мост `ErrorView` (≤ 10 строк); IIFE и порядок инициализации — прежние |
| 5 `.js` слоёв | `model/map-catalog.js` (47), `model/stats-schema.js` (145), `logic/player-rules.js` (48), `logic/player-state.js` (62), `service/audio-service.js` (61) — без изменений |
| CSS | 21 файл `css/**` — **0 правок**; `ErrorModal` использует готовые `.modal-overlay`, `.modal`, `.btn`, `.btn-primary` |
| Storage | Ключ `ml_stats`, `LocalStorageRepository`, `Repository` API, миграции `Stats` v1→v2→v3 — без изменений |
| Игровая логика | Пороги оценок, генератор, `PlayerRules`/`PlayerState`, сгорание очков — без изменений |
| Звук | `AudioService`, вызовы `play('click'/'win'/'lose')` — без изменений; клик на «OK» модалки сохранён |
| Тесты | 182 теста в 14 сьютах — **тот же набор**, новых нет |
| Порядок скриптов | Errors → Audio → Model → Storage → Service → Logic → View → Controller, затем `#root` + модуль `main.tsx` |
| `js/model/types.ts` | Дополняется только `interface Window` (аугментация); доменные типы не меняются |

---

## 📎 Исходное состояние (проверено перед составлением плана)

| Проверка | Факт | Вывод |
|----------|------|-------|
| `npm run typecheck` | `tsc --noEmit` → **0 ошибок** (15 `.ts`: 14 боевых + `types.ts`) | Исходная точка зелёная; ломать нельзя |
| `npm test` | **182/182** в **14** сьютах (vitest + jsdom, `setupFiles`) | Базовая линия тестов |
| `package.json` | `react` и `react-dom` `^19.3.1` **уже в `dependencies`**; `@types/react`, `@types/react-dom` **отсутствуют**; `node_modules/react` = 19.3.1 | TR-7 выполнен наполовину: нужны только типы |
| `tsconfig.json` | 15 строк: `jsx: react-jsx`, `strict`, `allowJs`, `noEmit`, `skipLibCheck`, `types: []`, `include: ["js"]` | `.tsx` **вне программы**; T31 не выполнен |
| `index.html` | 156 строк, **35** `<script>`: 14 `.ts` + 21 `.js`; `js/script.js` — последний; `#root` и `type="module"` отсутствуют | T34 не выполнен; React рендерить некуда |
| `js/` | **36 файлов, 2443 строки**; `.tsx` и `src/` **нет**; максимум — `map-view.js` 199, `map-controller.js` 198 | Лимит 200 соблюдён; новые файлы — ≤ 50 строк |
| CSS модалки | `.modal-overlay` (`display:none`, `.open` → `flex`, `z-index:1000`), `.modal` (белая карточка, `max-width:360`), `.btn` + `.btn-primary` | Компонент собирается **без правок CSS**; overlay перекрывает карту (`z-index` карты ≤ 4) |
| `js/view/error-view.js` | 30 строк, `showMessage({title,message})`; вызовы **только** из `session-controller.js` (2 места — блокировка второй вкладки) | Реальный сценарий проверки React-модалки — **вторая вкладка** |
| `js/script.js` | 25 строк, единственная инициализация (IIFE): `AudioService.preload`, модели, `StatsService.init`, `GameController.setDeps`, `AppController.init` | Точка врезки моста; TR-12 разрешает минимальную адаптацию |
| Vite dev и гибрид | `vite` 8.3.5 отдаёт `/main.tsx` как JS (200), классический `.js` импортируется из модуля (200, `text/javascript`) | `import './js/script.js'` в `main.tsx` рабочий |
| `vite build` | exit 0, но `dist/index.html` сохраняет `<script src="js/...">` на **неэмитированные** файлы | `build` = `typecheck`; прод-сборка — вне этапа |
| Типы React 19 | `@types/react` 19.2 + TS 5.9.3 + `moduleResolution: Node` + `types: []` + `allowJs`: JSX, `createRoot`, `MouseEvent`, аугментация `Window` и глобалы `.js` (`AudioService`) компилируются, **0 ошибок** (проверено на макете конфигурации) | Решение №3/5/6 работоспособно |
| `types: []` и JSX | Типы `react/jsx-runtime` резолвятся как модуль, а не через автоподключение `@types` | `types: []` **не мешает** `.tsx`, менять не нужно |
| Лимит 200 | Новые файлы: `main.tsx` ≈18, `App.tsx` ≈45, `ErrorModal.tsx` ≈40; `script.js` 25 → ≤35 | Запас большой |

### Чего не хватает в 1.6.0

1. **React установлен, но не используется**: `react`/`react-dom` лежат в `dependencies` «мертвым грузом», `@types` нет, `tsc` не видит `.tsx`.
2. **Нет `#root` и модульной точки входа** — `script.js` единственный вход, React рендерить некуда.
3. **Модалка ошибок — DOM-разметка** `#errorOverlay` в `index.html` (инлайн-стили) + `ErrorView`; React-компонента нет.
4. **Нет глобального API** `window.showErrorModal` — старый код не может вызвать React-модалку.
5. **Ни документация, ни тесты** не описывают React-слой: README и GIGACODE говорят «без React».

---

## ⚠️ Отклонения от буквы SPEC/RULES и почему они вынужденные

| Требование | Почему буквально не выходит | Как решаем |
|-----------|------------------------------|-----------|
| **T31**: `"include": ["src", "*.tsx", "*.ts"]` | В проекте нет переезда дерева в `src/`; с таким `include` из программы **выпадут все 15 `.ts`** в `js/` — проверка типов станет ложно-зелёной. `*.ts` затянет ещё и `vitest.config.ts` | `"include": ["js", "src", "*.tsx"]` — `js/` обязателен, `src/` из T31 на месте, `.tsx` покрыт. Возврат к буквальному T31 — только вместе с переездом дерева (Этап 3) |
| **TR-8 / T32**: «импорт глобальных CSS-файлов» в `main.tsx` | CSS уже подключён шестью `<link>` в `index.html`; дублирующий импорт даст второй набор правил. TR-10 требует «CSS — без изменений» | CSS остаётся в `<link>`; `main.tsx` не импортирует CSS. T32 сам оговаривает «если нужно» |
| **TR-11**: «старый `ErrorView` вызывает `window.showErrorModal`» vs **Z17**: «не трогать `view/*.js`» | Прямое противоречие: вызов должен появиться в `js/view/error-view.js`, а править его запрещено | Мост — в `js/script.js` (решение №2): обёртка `ErrorView.showMessage`, которая сначала пробует `window.showErrorModal`. `error-view.js` не изменён. Правка `error-view.js` в 3 строки — только как исключение из Z17 по решению владельца |
| **T34**: «старый `script.js` закомментирован» vs **TR-12/TR-14**: «игра работает» | Если просто закомментировать тег, приложение не инициализируется: React-пилот рендерит только модалку, а карту/контроллеры запускает IIFE из `script.js` | Тег закомментирован, файл **импортируется** из `main.tsx` (`import './js/script.js'`). Модуль исполняется после всех классических скриптов — порядок инициализации сохранён, IIFE выполняется один раз |
| **TR-9 / T33**: «стили — существующие CSS-классы» | У `.modal` нет правила для текста сообщения; старая модалка задавала `color:#666; margin-bottom:20px` **инлайн** | Классы — существующие (`.modal-overlay open`, `.modal`, `.btn .btn-primary`); цвет и отступ сообщения — инлайн-стиль, как в старой разметке. CSS-файлы не меняются |
| **T30**: «React 18+» | В проекте уже стоит React **19.3.1** | Не понижаем: 19.3.1 + `@types/react@^19`; `createRoot` — единственный API (T32), `ReactDOM.render` в 19 удалён |
| **A33**: «все интерфейсы в `types.ts`» | `Window.showErrorModal` — не доменный тип, а мост React ↔ старый JS | Аугментация `interface Window` добавлена в существующий `declare global` в `js/model/types.ts`: единый источник типов сохраняется, новый `.d.ts` не нужен |

---

## 🏗️ Архитектура — дельта к 1.6.0

Слои и имена файлов **сохраняются**. Пометки: **[NEW]** — новый файл, **[TSX]** — новый React-файл, **[ИЗМ]** — правка, **[без изм.]** — не трогаем.

```
index.html
  ├─ 14 <script src="js/**/*.ts">        [без изм.]  классические, объявляют глобалы
  ├─ 20 <script src="js/**/*.js">        [без изм.]  Audio, 5 слоёв .js, View, Controller
  ├─ <!-- <script src="js/script.js"> --> [ИЗМ]      закомментирован, файл сохранён
  ├─ <div id="root"></div>               [NEW]      контейнер React (перед </body>)
  └─ <script type="module" src="/main.tsx"> [NEW]   отложен до разбора DOM
        ├─ import './js/script.js'        [ИЗМ в script.js] IIFE 1.6.0 + мост ErrorView
        └─ createRoot(#root).render(<App/>) [NEW]
              ├─ App.tsx                  [TSX]  state ошибки + window.showErrorModal
              └─ ErrorModal.tsx            [TSX]  модалка на существующих CSS-классах
```

### Поток выполнения (гибрид)

1. Браузер разбирает `index.html`; 34 классических скрипта выполняются **по порядку** и объявляют глобалы (`CONFIG`, `ErrorView`, `AudioService`, контроллеры…).
2. Модуль `main.tsx` отложен до конца разбора; его зависимость `js/script.js` исполняется **до** тела `main.tsx` — срабатывает IIFE 1.6.0: предзагрузка звука, модели, `StatsService.init`, `AppController.init`, карта отрисована.
3. `createRoot(#root).render(<App/>)`; эффект `App` публикует `window.showErrorModal`.
4. Вторая вкладка → `BroadcastChannel` → `session-controller.js` → `ErrorView.showMessage(...)` → мост → `window.showErrorModal(...)` → `setState` → `<ErrorModal/>`.
5. «OK»/клик по фону → `setError(null)` (+ звук `click` на OK); старая `#errorOverlay` остаётся в DOM скрытой и работает как **fallback**, если React ещё не смонтирован.

### Почему мост в `script.js`, а не в `error-view.js`

- **Z17** запрещает правки `view/*.js` — это правило выше SPEC (TR-11).
- **TR-12** прямо разрешает «`script.js` — без изменений (или адаптирован минимально)».
- `ErrorView` — глобальный **объект** (`const`, но свойства изменяемы), поэтому обёртка `ErrorView.showMessage` из `script.js` — минимальная и обратимая (Этап 5 удалит всё вместе).
- Fallback сохраняется: если React упал или не смонтировался, сообщение покажет прежняя DOM-модалка.

---

## 🧩 Контракты файлов

### `main.tsx` (корень, ≈18 строк)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './src/App';
import './js/script.js'; // старый вход 1.6.0: IIFE, выполняется один раз

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('#root not found in index.html');
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
```

Правила: только рендер и подключение; никакой бизнес-логики (A38/T32); `ReactDOM.render` не используется.

### `src/App.tsx` (≈45 строк)

```tsx
import { useCallback, useEffect, useState } from 'react';
import { ErrorModal } from './components/ErrorModal';

interface ErrorMessage {
    title: string;
    message: string;
}

export function App() {
    const [error, setError] = useState<ErrorMessage | null>(null);

    useEffect(() => {
        window.showErrorModal = (title, message) => setError({ title, message });
        return () => {
            delete window.showErrorModal;
        };
    }, []);

    const handleClose = useCallback(() => {
        AudioService.play('click');
        setError(null);
    }, []);

    if (!error) {
        return null;
    }

    return <ErrorModal title={error.title} message={error.message} onClose={handleClose} />;
}
```

Правила: state — единственный источник показа; глобал публикуется в эффекте и снимается при размонтировании (A40); звук клика — паритет со старым `#errorOkBtn` (`app-controller.js`); бизнес-логики нет.

### `src/components/ErrorModal.tsx` (≈40 строк)

```tsx
import type { MouseEvent } from 'react';

export interface ErrorModalProps {
    title: string;
    message: string;
    onClose: () => void;
}

export function ErrorModal({ title, message, onClose }: ErrorModalProps) {
    const handleOverlayClick = (event: MouseEvent<HTMLDivElement>): void => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay open" onClick={handleOverlayClick}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
                <h2>{title}</h2>
                <p style={{ color: '#666', marginBottom: 20 }}>{message}</p>
                <button className="btn btn-primary" type="button" onClick={onClose}>
                    OK
                </button>
            </div>
        </div>
    );
}
```

Правила: функциональный компонент; полная типизация `ErrorModalProps`; `.modal-overlay open` (иначе `display:none`); клик по фону закрывает, `stopPropagation` на `.modal` — нет; без `any`, без `var`, без прямого DOM; возвращаемый тип не аннотируется (в React 19 глобального `JSX.Element` нет — тип выводится).

### `js/model/types.ts` (+4 строки, в `declare global`)

```ts
    /** Временный мост React ↔ старый JS (1.7.0, A40). Удаляется после Этапа 3. */
    interface Window {
        showErrorModal?: (title: string, message: string) => void;
    }
```

### `js/script.js` (+≤10 строк, начало IIFE)

```js
(function init() {
    // 1.7.0: старый ErrorView сначала предлагает сообщение React-модалке,
    // а если её ещё нет — показывает прежнюю DOM-модалку (#errorOverlay).
    var legacyShowMessage = ErrorView.showMessage;
    ErrorView.showMessage = function (params) {
        if (typeof window.showErrorModal === 'function') {
            window.showErrorModal(params.title, params.message);
        } else {
            legacyShowMessage.call(ErrorView, params);
        }
    };

    try {
        // ... остальная инициализация 1.6.0 без изменений ...
```

### `index.html` (+4 строки)

Вместо последнего `<script src="js/script.js"></script>`:

```html
    <!-- Старый вход 1.6.0: закомментирован, не удалён; IIFE импортирует main.tsx -->
    <!-- <script src="js/script.js"></script> -->

    <!-- React: точка входа (main.tsx импортирует js/script.js) -->
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
</body>
```

Блок `#errorOverlay` **остаётся** (fallback до Этапа 5); 6 `<link>` CSS и 34 классических скрипта — без изменений.

---

## ⚙️ Конфигурация

### `tsconfig.json` (итог)

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "Node",
    "jsx": "react-jsx",
    "strict": true,
    "allowJs": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": [],
    "noEmit": true
  },
  "include": ["js", "src", "*.tsx"]
}
```

- `jsx: "react-jsx"` — обязательное условие T31/TR-13; уже стоит;
- `include` — единственная правка: `"js"` (15 `.ts`) + `"src"` (компоненты) + `"*.tsx"` (`main.tsx` в корне);
- `types: []` **сохраняем**: он отключает автоподключение `@types/*` (в т.ч. `@types/node`), а JSX-типы приходят через резолюцию модуля `react/jsx-runtime` — проверено;
- `allowJs: true` + выключенный `checkJs` дают вывод типов для `.js`-глобалов (`AudioService`, `ErrorView`), поэтому `.tsx` видит их без объявлений;
- `moduleResolution: "Node"` + `@types/react@19` работает (файл `jsx-runtime.d.ts` резолвится). При переходе на TS 6 — отдельное решение (`"Bundler"`).

### `package.json` (итог)

```json
"dependencies": {
  "react": "^19.3.1",
  "react-dom": "^19.3.1"
},
"devDependencies": {
  "@types/react": "^19.2.0",
  "@types/react-dom": "^19.2.0"
}
```

`react`/`react-dom` **уже стоят** — не переустанавливать и не менять диапазон; добавляются только `@types/*`. Скрипты (`dev`, `typecheck`, `build`, `test`) не меняются: `build` = `npm run typecheck` (решение №7).

---

## 🧪 Тесты — без новых, 182/182

Новых тестов **нет** (Z17: без новых фич; тестовая база 1.6.0 — 182). Влияние изменений:

| Что меняется | Почему тесты не ломаются |
|--------------|--------------------------|
| `index.html` (+`#root`, модуль, комментарий) | Ни один сьют не читает `index.html` |
| `js/script.js` (+мост) | Ни один сьют не загружает `script.js` (проверено `grep`); IIFE не участвует в тестах |
| `js/model/types.ts` (+`Window`) | Типы — compile-time; тесты не читают `types.ts` |
| `src/**/*.tsx` | Не попадают под vitest-глоб `*.test.*`; типы проверяет `tsc` |
| `js/view/error-view.js` | Не меняется — 0 влияния |
| `package.json` (+`@types`) | Только `devDependencies`, рантайм тестов не затронут |

**Обязательное условие:** `npm test` → **182/182** в **14** сьютах. Падение = регрессия → откат шага, а не правка тестов.

---

## 🚀 Этап 14: React-пилот (1.7.0)

Порядок жёсткий: 14.0 → 14.1 → 14.2 → 14.3 → 14.4 → 14.5 → 14.6 → 14.7 → 14.8 → 14.9. Перед началом зафиксировать контрольные суммы (git в проекте нет):

```bash
find js/view js/controller css -type f -exec md5sum {} + | sort > /tmp/ml-guard.txt
```

### 14.0. Зависимости и `tsconfig`

- `npm install -D @types/react@^19 @types/react-dom@^19`; проверить, что `react`/`react-dom` `19.3.1` уже в `dependencies` (`npm ls react react-dom`).
- `tsconfig.json`: `include` → `["js", "src", "*.tsx"]`; остальные опции не трогать.
- `npx tsc --noEmit` → 0 (пока без `.tsx`), `npx tsc --version` = 5.9.3.

**Критерий:** `@types/*` в `devDependencies`; `react`/`react-dom` в `dependencies`; `include` покрывает `js/` и `*.tsx`; tsc — 0. **Охватывает:** TR-7, T30, T31 (частично), TR-13 (частично).

### 14.1. `ErrorModal.tsx` + тип `Window`

- `src/components/ErrorModal.tsx` — по контракту выше.
- `js/model/types.ts` — `interface Window` в `declare global` (+4 строки).
- `npx tsc --noEmit` → 0.

**Критерий:** компонент создан; `ErrorModalProps` типизирован; разметка использует `.modal-overlay open` / `.modal` / `.btn .btn-primary`; ни одного `any`/`var`. **Охватывает:** TR-9, A39, T33, Z18.

### 14.2. `App.tsx`

- `src/App.tsx` — state, `useEffect` c публикацией/снятием `window.showErrorModal`, `handleClose` со звуком, рендер `ErrorModal`/`null`.
- `npx tsc --noEmit` → 0.

**Критерий:** модалка рендерится **только** через state; `window.showErrorModal` определена после монтирования и удаляется при размонтировании; бизнес-логики нет. **Охватывает:** TR-11 (React-часть), A40, T32.

### 14.3. `main.tsx`

- `main.tsx` в корне: `StrictMode`, `createRoot`, `<App />`, `import './js/script.js'`, guard на `#root`.
- `npx tsc --noEmit` → 0.

**Критерий:** `main.tsx` создан, рендерит в `#root`, не содержит бизнес-логики; `createRoot` (не `ReactDOM.render`). **Охватывает:** TR-8, A38, T32, TR-13.

### 14.4. `index.html`

- Добавить `<div id="root"></div>` и `<script type="module" src="/main.tsx"></script>` перед `</body>`.
- Закомментировать `<script src="js/script.js"></script>` с пояснением (файл не удалять!).
- Сверить: 14 тегов `.ts` и 20 тегов `.js` — на месте и в прежнем порядке; 6 `<link>` CSS — без изменений; `#errorOverlay` — сохранён.

**Критерий:** активных тегов 35 (14 `.ts` + 20 `.js` + 1 module); `#root` есть; `type="module"` есть; `script.js` закомментирован, не удалён; CSS-ссылки не изменены. **Охватывает:** TR-10, T34, T35.

### 14.5. Мост в `js/script.js`

- В начало IIFE — обёртка `ErrorView.showMessage` (≤ 10 строк) с fallback.
- `js/view/**`, `js/controller/**` — без правок (сверить с `md5sum`).

**Критерий:** `js/script.js` ≤ 40 строк; мост применяется до `AppController.init`; старый `ErrorView` при отсутствии React показывает прежнюю модалку; `error-view.js` не изменён. **Охватывает:** TR-11, TR-12, Z17.

### 14.6. Запуск и сквозной прогон (гибрид)

- `npm run dev` → `http://localhost:5173`, консоль без ошибок.
- Консоль браузера: `window.showErrorModal('Тест', 'Проверка React-модалки')` → появляется `.modal-overlay.open`; клик по фону закрывает; повторно — «OK» закрывает, звучит `click`.
- Вторая вкладка при открытой первой → в первой появляется **React**-модалка «Игра уже запущена» (BroadcastChannel), `#errorOverlay` остаётся скрытой.
- 12 сценариев 1.6.0: карта, счёт, позиция, 🌍, список карт, no-op при той же карте, модалка сложности, отмена-откат, повторная игра, результаты (победа/провал), перезагрузка, `ml_stats` = v3.

**Критерий:** игра играется как в 1.6.0; модалка ошибок — React; визуальных изменений нет; консоль чистая. **Охватывает:** TR-12, TR-14.

### 14.7. Типы и тесты

- `npm run typecheck` → **0**; `npm test` → **182/182** (14 сьютов).
- Новых тестов не добавлять; `vitest.config.ts` не трогать.

**Критерий:** 0 ошибок `tsc` (включая `.tsx`); 182/182; `jest.*` не появились. **Охватывает:** TR-13, T28, критерий 89.

### 14.8. Аудит лимитов и запретов

- `wc -l` по новым файлам: `main.tsx`, `App.tsx`, `ErrorModal.tsx` — ≤ 200; `script.js` ≤ 40.
- `grep -n "any\|var "` по `src/**/*.tsx` и `main.tsx` → 0 осмысленных вхождений.
- `md5sum -c` по `js/view`, `js/controller`, `css` → без расхождений; `map-view.js` = 199, `map-controller.js` = 198.
- Проверить: нет `import`/`export` в боевых `.js`; `script.js` подключён **ровно одним** способом (тег закомментирован, импорт в `main.tsx`).

**Критерий:** лимит соблюдён; `any`/`var` нет; View/Controller/CSS/логика/Storage не изменены. **Охватывает:** Z17, Z18, T2.

### 14.9. Документация и финальная проверка

- `README.md`: технологии (+React 19, `@types`), структура (`main.tsx`, `src/`), «Запуск» (вход — `main.tsx`), возможности (модалка ошибок на React без изменения поведения).
- `GIGACODE.md`: обзор (гибрид), структура (`main.tsx`, `src/App.tsx`, `src/components/ErrorModal.tsx`), «Порядок подключения в index.html» (`#root` + module + комментарий вместо `script.js`), архитектура (React только для `ErrorModal`), типы (`Window.showErrorModal` в `types.ts`).
- `test/README.md`: та же база 182 теста; React-компоненты тестами не покрыты — вне области 1.7.0.
- Финальный чек-лист критериев 81–90; ручной прогон 14.6 повторно после правок документации (документация не влияет на код).

**Критерий:** критерии 81–90 выполнены. **Охватывает:** TR-14, критерий 90.

---

## ✅ Критерии завершения

### Сохраняются из 1.2.0–1.6.0 (1–80)

Архитектура, слои, JSDoc-описания, Repository, ошибки, write-ahead, вкладки, счёт, сгорание очков, карта (шаг 100px, одна дорога, 15 тренажёров), игрок (🚶 52px, 600 мс, блокировки), модалки карты/сложности, откат и повторная игра, глобальная карта, `Stats` v3, миграции 1 → 2 → 3, 15 `.ts` с полной типизацией, 182 теста. Число тестов **не уменьшается**.

### React-пилот (1.7.0, 81–90)

81. **React и типы:** `react`/`react-dom` — в `dependencies`; `@types/react`, `@types/react-dom` — в `devDependencies` (TR-7, T30).
82. **`main.tsx`** в корне: `createRoot` (не `ReactDOM.render`), рендер `<App />` в `#root`, guard на отсутствие `#root`, без бизнес-логики (TR-8, A38, T32).
83. **`src/components/ErrorModal.tsx`:** функциональный компонент, `ErrorModalProps { title, message, onClose }`, разметка `.modal-overlay open` → `.modal` → `h2`/`p`/`button.btn.btn-primary`, клик по фону закрывает, `stopPropagation` на модалке, полная типизация, ни одного `any`/`var` (TR-9, A39, T33, Z18).
84. **`src/App.tsx`:** модалка показывается через state; `window.showErrorModal` публикуется в эффекте и снимается при размонтировании; закрытие — «OK» или клик по фону; звук `click` на «OK» сохранён (TR-11, A40, T33).
85. **`index.html`:** `<div id="root">` перед `</body>`, `<script type="module" src="/main.tsx">`, старый `<script src="js/script.js">` закомментирован и **не удалён**; 14 `.ts` и 20 `.js` классических подключений и их порядок не изменены; 6 `<link>` CSS не изменены; `#errorOverlay` сохранён как fallback (TR-10, T34, T35).
86. **`js/script.js`:** минимальная адаптация (≤ 10 строк) — мост `ErrorView.showMessage` → `window.showErrorModal` с fallback; `js/view/**` и `js/controller/**` не изменены (0 правок, контрольные суммы) (TR-11, TR-12, Z17).
87. **`tsconfig.json`:** `jsx: "react-jsx"`, `strict`, `allowJs`, `noEmit`, `skipLibCheck`, `types: []`, `include: ["js", "src", "*.tsx"]`; `npx tsc --noEmit` — **0 ошибок**, включая `.tsx` (TR-13, T31).
88. **Игра работает через `npm run dev`:** 12 сценариев 1.6.0 проходят; модалка ошибок вызывается из старого кода (вторая вкладка) и из консоли; `ml_stats` = v3; консоль без ошибок; прямое открытие `index.html` и `http.server` не используются (TR-12, TR-14).
89. **`npm test` — 182/182** в 14 сьютах; новых тестов нет; CSS (21 файл), звук, Storage, игровая логика и 5 `.js`-слоёв не тронуты; `map-view.js` = 199, `map-controller.js` = 198 (Z17, T2).
90. **Документация синхронизирована:** `README.md`, `GIGACODE.md`, `test/README.md` описывают React-пилот (`main.tsx`, `ErrorModal`, гибрид, `window.showErrorModal`), 182 теста и `npm run typecheck`; `build` = `typecheck` (T28, A36–A40).

---

## 📏 Бюджет 200 строк

| Файл | Сейчас | После 1.7.0 | Как уложиться |
|------|--------|-------------|----------------|
| `main.tsx` | — | **≈18** | Импорты, guard, `createRoot` |
| `src/App.tsx` | — | **≈45** | State + эффект + один `handleClose` |
| `src/components/ErrorModal.tsx` | — | **≈40** | Один обработчик фона + разметка |
| `js/script.js` | 25 | **≤ 35** | Мост ≤ 10 строк, остальное без изменений |
| `js/model/types.ts` | 99 | **≈103** | `interface Window` (+4) |
| `index.html` | 156 | **≈160** | `#root` + module + комментарий |
| `js/view/map-view.js` | **199** | **199** | **Не меняется** |
| `js/controller/map-controller.js` | **198** | **198** | **Не меняется** |
| `js/**` (остальные 34 файла) | 2443 | 2443 | **0 правок** |

Новые файлы — с большим запасом. При желании `handleClose` можно инлайнить в JSX (−3 строки), но читаемость важнее.

---

## 📂 Структура файлов (дельта)

```
index.html                            # [ИЗМ] #root, module main.tsx, script.js закомментирован
main.tsx                              # [NEW] точка входа React (createRoot, StrictMode)
src/
  App.tsx                             # [NEW] state ошибки + window.showErrorModal
  components/
    ErrorModal.tsx                    # [NEW] первый компонент — модалка ошибок
tsconfig.json                         # [ИЗМ] include: ["js", "src", "*.tsx"]
package.json                          # [ИЗМ] @types/react, @types/react-dom в devDependencies
js/
  script.js                           # [ИЗМ] +≤10 строк: мост ErrorView → window.showErrorModal
  model/types.ts                      # [ИЗМ] +interface Window (аугментация)
  model/config.ts                     # [без изм.]
  model/{session-model,game-model}.ts # [без изм.]
  model/{map-catalog,stats-schema}.js # [без изм.]
  logic/{generator,scoring,game-rules}.ts  # [без изм.]
  logic/{player-rules,player-state}.js     # [без изм.]
  storage/*.ts                        # [без изм.]
  service/{stats-service,session-service}.ts # [без изм.]
  service/audio-service.js            # [без изм.]
  errors/*.ts                         # [без изм.]
  view/** (9 файлов), controller/** (6 файлов) # [.js] 0 правок
css/** (21 файл)                      # [без изм.] модалка использует готовые классы
test/** (182 теста, 14 сьютов)        # [без изм.]
README.md, GIGACODE.md, test/README.md # [ИЗМ] документация гибрида
.gigacode/
  plans/PLAN.md                       # этот файл (1.7.0)
  specs/SPEC.md, spec_v1_7_0.md
  rulles/RULES.md, rules_v_1_7_0.md
```

---

## 🚫 Запреты

### Z17 (Этап 2) — соблюдается буквально

- Заменять **View/Controller** на React (Этап 3).
- Добавлять **Context/Zustand** и любое глобальное состояние (Этап 4).
- Удалять **старый JS** (Этап 5) — в том числе `#errorOverlay` из `index.html`, `error-view.js`, `script.js`.
- Менять **логику игры**, очки, жизни, пороги, генератор, `Stats`-формат, ключ `ml_stats`.
- Добавлять **новые фичи** (звуки, анимации, кнопки, Escape/фокус-ловушки, порталы — это уже не пилот).
- Трогать `js/view/*.js` и `js/controller/*.js` (включая «мелкие улучшения»).

### Z18 (React-файлы)

- `any` без обоснования; `var` (только `const`/`let`).
- Прямой доступ к DOM, кроме `document.getElementById('root')` в `main.tsx`.
- Бизнес-логика (правила игры, Storage, Stats) в компонентах.
- Дублирование типов: `Window` объявлен один раз — в `types.ts`.

### Дополнительно для 1.7.0

- Оставлять **два** подключения `script.js` (тег + импорт) — двойная инициализация.
- Импортировать CSS в `main.tsx` (дублирует `<link>`).
- Добавлять `import`/`export` в боевые классические `.js` и `.ts` (сломает порядок глобальных объявлений).
- Менять `build` на `vite build` (даёт нерабочий `dist`).
- Включать `checkJs`, менять `moduleResolution`, обновлять TypeScript до 6.x в этом этапе.
- Писать новые тесты (в том числе на React) — вне области.
- Класть компоненты в `js/` (там лимит 200 и классические скрипты) — только `src/*.tsx`.

---

## 📦 Вне области (SPEC v1.7.0)

- **Этап 3** — миграция экранов на React, замена View/Controller, снятие `window`.
- **Этап 4** — глобальное состояние (Context/Zustand).
- **Этап 5** — удаление старого JS и `#errorOverlay`.
- Тесты React-компонентов, `@testing-library/react`, покрытие `.tsx`.
- Прод-сборка (`vite build` с classic-скриптами) — по-прежнему невозможна; `build` = `typecheck`.
- Переезд дерева в `src/` и буквальный `include` из T31.
- Правки `error-view.js`/`app-controller.js` (мост живёт в `script.js`).
- Новые фичи: портал, `Escape`, `aria-modal`, фокус-ловушка, анимации, тосты.
- Изменение CSS (включая добавление `.modal-message`).
- `checkJs`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Чистка `jest.config.js` / `jest-environment-jsdom`, удаление неиспользуемого кода.

---

## 🔗 Трассировка требований

| Требование | Где реализуется | Этап | Критерии |
|-----------|-----------------|------|----------|
| TR-7. React + типы | `package.json` | 14.0 | 81 |
| TR-8. `main.tsx` | `main.tsx` | 14.3 | 82 |
| TR-9. `ErrorModal` | `src/components/ErrorModal.tsx` | 14.1 | 83 |
| TR-10. `index.html` | `index.html` | 14.4 | 85 |
| TR-11. Мост `ErrorView` | `src/App.tsx`, `js/script.js` | 14.2, 14.5 | 84, 86 |
| TR-12. Гибрид | 34 классических скрипта, `script.js` | 14.4–14.6 | 86, 88 |
| TR-13. `.tsx` в `tsconfig` | `tsconfig.json` | 14.0, 14.7 | 87 |
| TR-14. Игра работает | `npm run dev` | 14.6, 14.9 | 88 |
| A36. Постепенная интеграция | ни один старый экран не заменён | весь этап | 86, 88 |
| A37. Гибрид | `.tsx` с модулями + `.js` без модулей | 14.3–14.5 | 85, 86 |
| A38. Точка входа | `main.tsx` в корне | 14.3 | 82 |
| A39. Первый компонент | `ErrorModal` | 14.1 | 83 |
| A40. Связь через `window` | `window.showErrorModal` | 14.2, 14.5 | 84, 86 |
| T30. Установка React | `package.json` | 14.0 | 81 |
| T31. `tsconfig` и `.tsx` | `tsconfig.json` (с `include` — решение №3) | 14.0 | 87 |
| T32. `main.tsx` | `main.tsx` | 14.3 | 82 |
| T33. `ErrorModal` | `ErrorModal.tsx` | 14.1 | 83 |
| T34. `index.html` | `index.html` | 14.4 | 85 |
| T35. Гибрид | 0 правок View/Controller | 14.5, 14.8 | 86, 89 |
| Z17. Запреты этапа 2 | `md5sum`-аудит | 14.8 | 86, 89 |
| Z18. Запреты в React | `ErrorModal`, `App`, `main` | 14.1–14.3 | 83, 84 |
| T28. `tsc --noEmit` | `typecheck`, 14.7 | 14.7 | 87 |
| Критерий 89 (тесты) | `test/**` без изменений | 14.7 | 89 |

---

## ⚠️ Риски, примечания и открытые вопросы

- **Запуск — только `npm run dev`.** `file://` и `python3 -m http.server` не работают (браузер не исполняет `.ts`, `http.server` отдаёт неверный MIME); `type="module"` это не меняет. README/GIGACODE уже это фиксируют.
- **`vite build` не бандлит classic-скрипты.** Проверено: exit 0, но в `dist/index.html` остаются `<script src="js/...">` на неэмитированные файлы. Поэтому `build` = `typecheck`; `dist/` не считается рабочим артефактом.
- **Двойная инициализация.** Если оставить тег `script.js` **и** импорт в `main.tsx`, IIFE выполнится дважды (двойные слушатели, повторный `AppController.init`). В 14.4/14.8 — отдельная проверка «ровно одно подключение».
- **`script.js` как ES-модуль.** При импорте файл исполняется в strict mode: в нём нет sloppy-конструкций (все переменные объявлены внутри IIFE), поэтому поведение не меняется; `var` остаётся внутри функции.
- **Гонка при старте.** `SessionController.init` в fallback-режиме без `BroadcastChannel` может показать сообщение **до** монтирования `App` — тогда сработает прежняя DOM-модалка. Это допустимый fallback; основной сценарий (BroadcastChannel) асинхронный и всегда попадает в React.
- **`window.showErrorModal` — временный глобал** (A40). После Этапа 3 он удаляется вместе с мостом; сейчас это единственная связь React ↔ старый JS.
- **StrictMode.** В dev эффекты вызываются дважды: `window.showErrorModal` снимается и ставится снова — операция идемпотентна, модалка не дублируется. В prod двойного вызова нет.
- **React 19 и типы.** Глобального `JSX.Element` больше нет — возвращаемые типы компонентов не аннотируем. `@types/react` держать `^19` в паре с `react@19.3.1`; при обновлении React обновлять и типы.
- **`types: []`** не мешает JSX (типы `react/jsx-runtime` резолвятся как модуль); если `tsc` вдруг не найдёт типы — проверить `node_modules/@types/react/jsx-runtime.d.ts`, но не менять `types` вслепую.
- **`AudioService` в `App.tsx`** — глобал из `.js`; `allowJs` выводит его тип, поэтому объявлений не нужно. Если `tsc` начнёт ругаться — добавить `const AudioService` в `types.ts` (единственный источник типов), а не `any`.
- **Мост — monkey-patch.** Обёртка `ErrorView.showMessage` в `script.js` выглядит необычно, но это минимальная и обратимая врезка, разрешённая TR-12. Правка `error-view.js` была бы чище, но нарушает Z17 — вопрос к владельцу, если он предпочитает букву TR-11.
- **Без git.** В проекте нет репозитория, поэтому «не тронуто» проверяется контрольными суммами (`md5sum`) до/после, а не `git diff`.
- **Песочница.** `npm run dev` и `npm install` пишут в `node_modules/` (`.vite`, lock-файлы) — вне сессионного workspace это может требовать расширения доступа; это окружение, а не проект.
- **Открытый вопрос — один:** место моста (решение №2). План по умолчанию делает его в `script.js`; если владелец разрешит точечное исключение из Z17, мост переезжает в `error-view.js` (3 строки) — остальные шаги не меняются.

---

## ✅ Ожидаемый результат 1.7.0

- React **работает** в проекте: `main.tsx` — точка входа, `<App />` рендерится в `#root`.
- **`ErrorModal`** — первый компонент: типизированный, на существующих CSS-классах, открывается/закрывается через state, клик по фону закрывает.
- **`window.showErrorModal(title, message)`** вызывается из старого кода (`ErrorView` → `script.js`) и показывает React-модалку; прежняя DOM-модалка остаётся fallback.
- **Старый JS не тронут:** 14 `.ts` + 20 `.js` классических скриптов, 9 View, 6 Controller, 5 `.js`-слоёв, `script.js` +≤10 строк; CSS — 0 правок.
- **`npx tsc --noEmit` — 0 ошибок** (включая `.tsx`), **`npm test` — 182/182**.
- **Игра играется** как в 1.6.0: карта, игрок, 🌍, модалки, победа/провал, результаты, перезагрузка, `ml_stats` = v3.
- Заложена база Этапа 3 (экраны на React) и Этапа 5 (удаление `window` и старого JS).

---

## 📌 Краткая памятка агенту

✅ `main.tsx` в корне: `createRoot`, `StrictMode`, `#root`, `import './js/script.js'`
✅ `src/App.tsx` — state + `window.showErrorModal`; `src/components/ErrorModal.tsx` — «глупый» компонент
✅ `#root` и `<script type="module" src="/main.tsx">` перед `</body>`; тег `script.js` закомментирован, файл не удалён
✅ Мост `ErrorView.showMessage` — в `js/script.js` (≤ 10 строк), `error-view.js` не трогать
✅ `tsconfig`: `include: ["js", "src", "*.tsx"]`, `jsx: "react-jsx"`, `types: []` оставить
✅ `@types/react@^19`, `@types/react-dom@^19` в `devDependencies`; `react`/`react-dom` уже стоят
✅ Разметка модалки: `.modal-overlay open` → `.modal` → `h2` / `p` / `button.btn.btn-primary`; фон закрывает, `.modal` — `stopPropagation`
✅ Звук `click` на «OK» — паритет со старым `#errorOkBtn`
✅ Проверка: `npm run dev` → консоль `window.showErrorModal(...)` + вторая вкладка
✅ Итог: `tsc` 0, `npm test` 182/182, 12 сценариев 1.6.0

❌ Замена View/Controller, Context/Zustand, удаление старого JS
❌ Правки `js/view/**`, `js/controller/**`, `css/**`
❌ Два подключения `script.js`; импорт CSS в `main.tsx`
❌ `any`, `var`, прямой DOM в компонентах, бизнес-логика в React
❌ Новые фичи, новые тесты, `vite build`, `checkJs`
❌ Изменение `Stats`-формата, ключа `ml_stats`, логики игры
