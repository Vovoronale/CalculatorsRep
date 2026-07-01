# Content editing guide

Майже весь видимий контент сайту (калькулятори, категорії, IVapps top bar, сторінка `/author`, юридичні сторінки, бренд-копія) живе в одному файлі: [`data/content.json`](../data/content.json). Зміни підхоплюються Next.js при наступному `npm run build` (статичний експорт) або при гарячій перезагрузці `npm run dev`.

Цей гайд описує всі секції JSON, схему запису калькулятора, як додавати нові категорії і де редагувати інший контент.

---

## 1. Структура `data/content.json`

| Top-level key | Що контролює | Loader |
|---|---|---|
| `site.brand` | Назви, монограма, ім'я автора, роль | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.navigation.utilityLinks` | Утилітарні посилання у footer | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.topbar` | IVapps top bar: products dropdown, мови, CTA | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.workspace` | Тексти hero/каталогу/детальної сторінки | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.footer` | Текст футера | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.support` | Плашка підтримки, сторінка `/support`, CTA і Patreon URL | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.authorPage` | Усі тексти `/author` | [`lib/site-content.ts`](../lib/site-content.ts) |
| `site.legalPages` | Тексти `/disclaimer`, `/terms`, `/privacy` | [`lib/site-content.ts`](../lib/site-content.ts), [`lib/legal-pages.ts`](../lib/legal-pages.ts) |
| `categories` | Категорії калькуляторів (бічна панель) | [`lib/calculators.ts`](../lib/calculators.ts) |
| `calculators` | Записи калькуляторів | [`lib/calculators.ts`](../lib/calculators.ts) |
| `products` | Окремі сторінки продуктів `/products/<slug>` | [`lib/products.ts`](../lib/products.ts) |
| `projectCategories` | Блок «Екосистема продуктів» на `/author` | [`lib/projects.ts`](../lib/projects.ts) |
| `aiAssistants` | Блок AI-асистентів на `/author` | [`lib/projects.ts`](../lib/projects.ts) |

**Усі loader-файли імпортують `data/content.json` напряму** — окремих джерел даних немає.

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
  "seoContent": {
    "task": "Коротко пояснює, яку інженерну задачу розв'язує калькулятор.",
    "applications": ["Перевірка рішення у проекті", "Підбір параметрів конструкції"],
    "inputParameters": ["Геометрія конструкції", "Матеріали та розрахункова схема"],
    "formulas": ["R = ... — символічний запис або короткий опис методики"],
    "example": "Короткий приклад застосування з типовими вихідними даними.",
    "limitations": ["Не замінює повний проектний розрахунок."],
    "standards": ["ДБН / ДСТУ або інше джерело методики"]
  },
  "standard": "ДСТУ 9191:2022 / ДБН В.2.6-31:2021",
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
| `displayMode` | так | `"embed"` \| `"external"` \| `"modal"` \| `"native"` \| `"product"` — див. таблицю нижче. |
| `accessLabel` | так | Підпис типу доступу на картці (наприклад, «Вбудований розрахунок»). |
| `embedUrl` | для `embed` / `modal` | URL, який вантажиться в iframe. |
| `openUrl` | так | URL для кнопки «відкрити окремо» / зовнішнього переходу. Може збігатися з `embedUrl`. |
| `order` | так | Сортування за зростанням у каталозі. |
| `seoTitle` | ні | Legacy-поле для сумісності зі старими записами. Поточний `<title>` генерується автоматично з `title`, основної категорії та `site.brand.umbrella`. |
| `seoDescription` | ні | Legacy-поле для сумісності зі старими записами. Поточний `<meta name="description">` генерується автоматично з `title`, основної категорії та `shortDescription`. |
| `seoContent` | ні | Розгорнуті SEO-блоки детальної сторінки: задача, застосування, вхідні параметри, формули, приклад, обмеження, нормативна база. Якщо поля немає, сторінка показує fallback з `shortDescription`, `description`, `useCases` і `standard`. |
| `standard` | так | Нормативний документ або контекстний стандарт для таблиці категорії (`"ДБН В.2.6-31:2021"`, `"ДСТУ 8855:2019"`, `"GIS / GeoJSON"`). |
| `editorialLabel` | ні | `"Популярний"` або `"Новий"` — бейдж у таблиці категорії й на детальній сторінці. |
| `useCases` | так | Масив сценаріїв для сторінки калькулятора та пошуку. |
| `tags` | ні | Масив тегів (≤3 показуються на картці). |
| `tools` | ні | Масив інструментів/джерел. |
| `icon` | ні | Назва іконки [lucide-react](https://lucide.dev/icons/). |

### Display modes

| Режим | Що бачить користувач | Коли використовувати |
|---|---|---|
| `embed` | Детальна сторінка `/calculator/<slug>` з iframe-ом усередині макету | Якщо зовнішній сайт **дозволяє** iframe (немає `X-Frame-Options: DENY/SAMEORIGIN` і `frame-ancestors` дозволяє). |
| `external` | Натиск картки → відкриває `openUrl` у новій вкладці. Детальна сторінка теж є, але без iframe. | Зовнішні сервіси, які блокують iframe; інструменти, що мають власний UX (логін, файли). |
| `modal` | Швидке iframe-вікно поверх каталогу, без переходу на детальну сторінку | Маленькі/швидкі калькулятори, які не потребують повної сторінки. |
| `native` | Локальний React-калькулятор із формою, результатом і за потреби покроковим звітом | Розрахунки, реалізовані без зовнішнього iframe у цьому репозиторії. |
| `product` | Картка каталогу відкриває внутрішню сторінку `/products/<slug>` через `openUrl`. Запис не входить до статичних маршрутів `/calculator/<slug>`. | Продукти з окремою сторінкою завантаження, описом та інструкцією. |

**Якщо iframe не вантажиться** (видно лише білий блок або помилку у devtools console) — переключи `displayMode` на `"external"`. Це найчастіше через `X-Frame-Options` чи CSP `frame-ancestors`.

### SEO-блоки сторінки калькулятора

Кожна detail-сторінка автоматично отримує:

- один `h1` з `title`;
- `<title>` у форматі `Назва калькулятора | Основна категорія | IVapps.pro`;
- `<meta name="description">` у форматі `Назва калькулятора у категорії «...»: короткий опис`;
- JSON-LD `BreadcrumbList`;
- JSON-LD `SoftwareApplication`;
- блок «Методика та нормативний контекст» із підрозділами `Короткий опис задачі`, `Де застосовується`, `Вхідні параметри`, `Формули та методика`, `Приклад розрахунку`, `Обмеження`, `Нормативна база`.

Для точного інженерного SEO-тексту додавай `seoContent`. Усі ключі optional; відсутні секції заповнюються fallback-текстом із наявних полів калькулятора. `FAQ Schema` не додається як базовий SEO-механізм.

---

## 3. Як додати категорію

1. Додай запис у `categories[]` у [`data/content.json`](../data/content.json):
   ```json
   {
     "slug": "energoefektyvnist-teplotekhnika",
     "title": "Теплотехніка",
     "note": "Тепловий розрахунок огороджувальних конструкцій.",
     "icon": "Thermometer"
   }
   ```
2. Для підкатегорії додай `parentSlug` із slug батьківського напряму:
   ```json
   {
     "slug": "pidlohy",
     "parentSlug": "energoefektyvnist-teplotekhnika",
     "title": "Підлоги",
     "note": "Теплопередача та теплозасвоєння підлог.",
     "icon": "Layers"
   }
   ```
3. Додай новий `slug` у union `CategorySlug` у [`lib/calculators.ts`](../lib/calculators.ts):
   ```ts
   export type CategorySlug =
     | "pidlohy"
     | ...
     | "energoefektyvnist-teplotekhnika";
   ```
   TypeScript типізує JSON суворо — без цього кроку білд впаде.
4. Додай fallback-іконку у `FALLBACK_CATEGORY_ICONS` у [`lib/icons.ts`](../lib/icons.ts):
   ```ts
   const FALLBACK_CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
     ...
     pidlohy: Layers,
   };
   ```
   Це резервна іконка, якщо `icon` у JSON не задано або не знайдено в `iconRegistry`.

Батьківські категорії агрегують калькулятори всіх дочірніх підкатегорій через `getCalculatorsForCategory()`. Наприклад, `energoefektyvnist-teplotekhnika` показує всі розрахунки з `pidlohy`, `teplovi-mistky-fem`, `povitropronyknist` тощо. Leaf-категорія показує тільки власні калькулятори.

`categories[]` без жодного калькулятора показується як порожній клікабельний розділ у бічній панелі — це нормально, поки наповнення не з'явилось.

---

## 4. Іконки

Використовуємо [lucide-react](https://lucide.dev/icons/). Поле `icon` приймає назву іконки (PascalCase). Уже задіяні в проекті: `Box`, `Layers`, `BrickWall`, `Home`, `Thermometer`, `Paintbrush`. Якщо додаєш нову — переконайся, що вона експортується з `lucide-react`.

---

## 5. Інший контент

### Сторінки продуктів

Масив `products[]` керує сторінками `/products/<slug>`. Обов'язкові поля запису задають hero, можливості, опис, блок завантажень, інструкцію встановлення та ліцензію.

- `factsHeading` + `facts[]` (`{ label, value }`) — необов'язковий блок коротких фактів про продукт;
- `usageHeading` + `usageSteps[]` — необов'язковий блок із порядком використання;
- `warningHeading` + `warningParagraphs[]` — необов'язковий блок важливого попередження;
- `screenshotsHeading`, `screenshotsIntro`, `screenshots[]` — необов'язкова галерея; рендериться лише коли одночасно задані `screenshotsHeading`, `screenshotsIntro` і непорожній `screenshots[]`, інакше не показується;
- `downloads[]` — `{ label, ctaLabel, ariaLabel, href }`; назву продукту й версію не хардкодь у компонентах.

Локальні файли клади в `public/downloads/<group>/`; коренева URL-адреса має вигляд `/downloads/autocad-lisp/XRef2Current.lsp`. Для запису цього продукту в каталозі калькуляторів використовуй `displayMode: "product"` та `openUrl: "/products/<slug>"`.

### IVapps top bar (продуктовий dropdown)

`site.topbar.products` у [`data/content.json`](../data/content.json). Кожен запис: `{ label, href, external, tagline?, active? }`. Рендериться у [`components/products-dropdown.tsx`](../components/products-dropdown.tsx).

`site.topbar.cta` містить тільки `{ label }`. Кнопка відкриває форму «Запропонувати калькулятор»; для неї не потрібно і не можна додавати `href`, email одержувача або API-ключ у `content.json`. Відправлення виконує Cloudflare Pages Function, а секрет `RESEND_API_KEY` зберігається в налаштуваннях Cloudflare.

### Утилітарні посилання у footer

`site.navigation.utilityLinks`. Прості `{ label, href, external }`. Рендеряться у [`components/site-footer.tsx`](../components/site-footer.tsx). Для зовнішніх посилань став `external: true`, для внутрішніх сторінок — `false`.

### Бренд і workspace-копія

`site.brand`, `site.workspace`, `site.footer` — одиничні текстові поля. `site.footer.contactEmail` рендериться у footer як `mailto:`-посилання біля юридичних сторінок.

### Сторінка `/author`

- `site.authorPage` — заголовки, інтро, фокус роботи, описи блоків.
- `site.authorPage.socialLinks[]` — зовнішні профілі автора у форматі `{ label, href }`; усі відкриваються в новій вкладці.
- `projectCategories[]` — групи продуктів у блоці «Екосистема продуктів». Кожна група має `slug`, `title`, `description`, `projects[]` (`{ slug, title, description, href }`).
- `aiAssistants[]` — асистенти.

Рендериться у [`components/author-view.tsx`](../components/author-view.tsx).

### Підтримка проєкту

`site.support` є єдиним джерелом контенту для тонкої плашки на сторінках калькуляторів і сторінки `/support`:

- `stripLabel` — текст внутрішнього посилання на `/support`;
- `eyebrow`, `title`, `paragraphs[]` — тексти сторінки підтримки;
- `ctaLabel` — підпис кнопки Patreon;
- `patreonHref` — повна зовнішня URL-адреса Patreon.

Плашку рендерить [`components/support-strip.tsx`](../components/support-strip.tsx), сторінку — [`components/support-view.tsx`](../components/support-view.tsx). Patreon-кнопка відкривається в новій вкладці.

### Юридичні сторінки

`site.legalPages[]` містить тексти для `/disclaimer`, `/terms`, `/privacy`.

Кожен запис:

```json
{
  "slug": "privacy",
  "title": "Політика конфіденційності",
  "metaTitle": "Політика конфіденційності | IVapps.pro",
  "metaDescription": "Короткий SEO-опис сторінки.",
  "eyebrow": "Дані та аналітика",
  "lead": "Вступний абзац сторінки.",
  "updatedAt": "14 червня 2026 року",
  "sections": [
    {
      "title": "Інженерний контекст",
      "body": ["Один або кілька абзаців."]
    }
  ]
}
```

Рендериться у [`components/legal-page-view.tsx`](../components/legal-page-view.tsx). Список slug-ів і пошук сторінки — у [`lib/legal-pages.ts`](../lib/legal-pages.ts). Якщо додаєш нову юридичну сторінку, також створи route у `app/<slug>/page.tsx` і додай її до sitemap.

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
