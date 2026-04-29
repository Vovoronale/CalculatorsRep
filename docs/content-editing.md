# Content editing guide

Майже весь видимий контент сайту (калькулятори, категорії, IVapps top bar, сторінка `/author`, бренд-копія) живе в одному файлі: [`data/content.json`](../data/content.json). Зміни підхоплюються Next.js при наступному `npm run build` (статичний експорт) або при гарячій перезагрузці `npm run dev`.

Цей гайд описує всі секції JSON, схему запису калькулятора, як додавати нові категорії і де редагувати інший контент.

---

## 1. Структура `data/content.json`

| Top-level key | Що контролює | Loader |
|---|---|---|
| `site.brand` | Назви, монограма, ім'я автора, роль | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.navigation.utilityLinks` | Утилітарні посилання у хедері | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.topbar` | IVapps top bar: products dropdown, мови, CTA | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.workspace` | Тексти hero/каталогу/детальної сторінки | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.footer` | Текст футера | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.authorPage` | Усі тексти `/author` | [`lib/site-content.ts`](../lib/site-content.ts) |
| `categories` | Категорії калькуляторів (бічна панель) | [`lib/calculators.ts`](../lib/calculators.ts) |
| `calculators` | Записи калькуляторів | [`lib/calculators.ts`](../lib/calculators.ts) |
| `projectCategories` | Блок «Екосистема продуктів» на `/author` | [`lib/projects.ts`](../lib/projects.ts) |
| `aiAssistants` | Блок AI-асистентів на `/author` | [`lib/projects.ts`](../lib/projects.ts) |

**Усі три loader-файли імпортують `data/content.json` напряму** — окремих джерел даних немає.

---

## 2. Як додати калькулятор

Запис додається у масив `calculators` у [`data/content.json`](../data/content.json). Повний приклад (поточний `cadee-pro`):

```json
{
  "slug": "cadee-pro",
  "title": "CadEE.pro — теплотехнічні розрахунки",
  "shortDescription": "Онлайн-сервіс теплотехнічного розрахунку огороджувальних конструкцій згідно з ДБН.",
  "description": "Розгорнутий опис для детальної сторінки. Кілька речень.",
  "mainCategory": "teplotekhnika",
  "extraCategories": [],
  "displayMode": "embed",
  "accessLabel": "Вбудований розрахунок",
  "embedUrl": "https://cadee.pro",
  "openUrl": "https://cadee.pro",
  "order": 1,
  "seoTitle": "CadEE.pro — теплотехнічний розрахунок онлайн",
  "seoDescription": "Розрахунок опору теплопередачі огороджувальних конструкцій.",
  "editorialLabel": "Популярний",
  "useCases": ["Опір теплопередачі стін", "Перевірка ДБН"],
  "tags": ["теплотехніка", "ДБН", "R-value"],
  "tools": ["CadEE.pro"],
  "icon": "Thermometer"
}
```

### Поля

| Поле | Обов'язкове | Опис |
|---|---|---|
| `slug` | так | URL-сегмент (`/calculator/<slug>`). Унікальний, kebab-case. |
| `title` | так | Назва на картці й детальній сторінці. |
| `shortDescription` | так | Підпис на картці (1–2 речення). |
| `description` | ні | Розгорнутий опис на детальній сторінці. |
| `mainCategory` | так | Один зі `slug` із `categories[]`. Визначає, у якій категорії калькулятор «головний». |
| `extraCategories` | так (може бути `[]`) | Додаткові категорії, у яких теж показувати картку. |
| `displayMode` | так | `"embed"` \| `"external"` \| `"modal"` — див. таблицю нижче. |
| `accessLabel` | так | Підпис типу доступу на картці (наприклад, «Вбудований розрахунок»). |
| `embedUrl` | для `embed` / `modal` | URL, який вантажиться в iframe. |
| `openUrl` | так | URL для кнопки «відкрити окремо» / зовнішнього переходу. Може збігатися з `embedUrl`. |
| `order` | так | Сортування за зростанням у каталозі. |
| `seoTitle` | так | `<title>` детальної сторінки. |
| `seoDescription` | так | `<meta name="description">` детальної сторінки. |
| `editorialLabel` | ні | `"Популярний"` або `"Новий"` — бейдж на картці й chip у hero. |
| `useCases` | так | Масив сценаріїв (≤3 показуються на картці). |
| `tags` | ні | Масив тегів (≤3 показуються на картці). |
| `tools` | ні | Масив інструментів/джерел. |
| `icon` | ні | Назва іконки [lucide-react](https://lucide.dev/icons/). |

### Display modes

| Режим | Що бачить користувач | Коли використовувати |
|---|---|---|
| `embed` | Детальна сторінка `/calculator/<slug>` з iframe-ом усередині макету | Якщо зовнішній сайт **дозволяє** iframe (немає `X-Frame-Options: DENY/SAMEORIGIN` і `frame-ancestors` дозволяє). |
| `external` | Натиск картки → відкриває `openUrl` у новій вкладці. Детальна сторінка теж є, але без iframe. | Зовнішні сервіси, які блокують iframe; інструменти, що мають власний UX (логін, файли). |
| `modal` | Швидке iframe-вікно поверх каталогу, без переходу на детальну сторінку | Маленькі/швидкі калькулятори, які не потребують повної сторінки. |

**Якщо iframe не вантажиться** (видно лише білий блок або помилку у devtools console) — переключи `displayMode` на `"external"`. Це найчастіше через `X-Frame-Options` чи CSP `frame-ancestors`.

---

## 3. Як додати категорію

1. Додай запис у `categories[]` у [`data/content.json`](../data/content.json):
   ```json
   {
     "slug": "teplotekhnika",
     "title": "Теплотехніка",
     "note": "Тепловий розрахунок огороджувальних конструкцій.",
     "icon": "Thermometer"
   }
   ```
2. Додай новий `slug` у union `CategorySlug` у [`lib/calculators.ts`](../lib/calculators.ts):
   ```ts
   export type CategorySlug =
     | "beton"
     | ...
     | "teplotekhnika";
   ```
   TypeScript типізує JSON суворо — без цього кроку білд впаде.
3. Додай fallback-іконку у `FALLBACK_CATEGORY_ICONS` у [`lib/icons.ts`](../lib/icons.ts):
   ```ts
   const FALLBACK_CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
     ...
     teplotekhnika: Thermometer,
   };
   ```
   Це резервна іконка, якщо `icon` у JSON не задано або не знайдено в `iconRegistry`.

`categories[]` без жодного калькулятора показується як порожній розділ у бічній панелі — це нормально, поки наповнення не з'явилось.

---

## 4. Іконки

Використовуємо [lucide-react](https://lucide.dev/icons/). Поле `icon` приймає назву іконки (PascalCase). Уже задіяні в проекті: `Box`, `Layers`, `BrickWall`, `Home`, `Thermometer`, `Paintbrush`. Якщо додаєш нову — переконайся, що вона експортується з `lucide-react`.

---

## 5. Інший контент

### IVapps top bar (продуктовий dropdown)

`site.topbar.products` у [`data/content.json`](../data/content.json). Кожен запис: `{ label, href, external, tagline?, active? }`. Рендериться у [`components/products-dropdown.tsx`](../components/products-dropdown.tsx).

### Утилітарні посилання у хедері

`site.navigation.utilityLinks`. Прості `{ label, href, external }`.

### Бренд і workspace-копія

`site.brand`, `site.workspace`, `site.footer` — одиничні текстові поля. Без структурних змін, просто редагуй текст.

### Сторінка `/author`

- `site.authorPage` — заголовки, інтро, фокус роботи, описи блоків.
- `projectCategories[]` — групи продуктів у блоці «Екосистема продуктів». Кожна група має `slug`, `title`, `description`, `projects[]` (`{ slug, title, description, href }`).
- `aiAssistants[]` — асистенти.

Рендериться у [`components/author-view.tsx`](../components/author-view.tsx).

---

## 6. Перевірка змін

```bash
npm run dev         # візуальна перевірка на http://localhost:3000
npm run typecheck   # типи для JSON-loader-ів
npm run build       # повний статичний експорт у out/
```

Перед комітом має проходити `typecheck` і `build`.

---

## 7. Найчастіші помилки

- **`mainCategory` посилається на неіснуючу категорію** → TypeScript-помилка про невалідний `CategorySlug`.
- **`displayMode: "embed"` без `embedUrl`** → детальна сторінка покаже порожній iframe.
- **Дубльований `slug`** у `calculators[]` → `generateStaticParams()` згенерує конфліктний роут; білд впаде або сторінка буде перезаписана.
- **Новий slug у `categories[]` без оновлення `CategorySlug` union** → `tsc` помилка при імпорті JSON.
- **iframe не рендериться** → зовнішній сайт блокує вбудовування. Fallback: `displayMode: "external"`.
