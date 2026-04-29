# Agents guide

Коротка точка входу для AI-агентів і контриб'юторів, які працюють з цим репо.

## Project

Static Next.js (App Router) сайт для каталогу інженерних калькуляторів. Контент — JSON-driven ([`data/content.json`](data/content.json)), TypeScript, Vitest. Деталі стеку, локальний dev і деплой — у [README.md](README.md).

## Editing content

Майже весь видимий контент сайту (калькулятори, категорії, IVapps top bar, сторінка `/author`, бренд-копія) живе в одному файлі: [`data/content.json`](data/content.json).

Як додавати/редагувати — див. **[docs/content-editing.md](docs/content-editing.md)**. Гайд містить:

- схему запису калькулятора з описом усіх полів
- таблицю display modes (`embed` / `external` / `modal`) і коли який обрати
- як додати категорію (включно з оновленням `CategorySlug` union у [`lib/calculators.ts`](lib/calculators.ts))
- де редагувати IVapps top bar, утилітарні посилання, тексти `/author` і бренд-копію
- іконки (lucide-react)
- перевірочні команди й найчастіші помилки

## Verification

Перед комітом:

```bash
npm run typecheck
npm run build
```

Для візуальної перевірки — `npm run dev` і http://localhost:3000.

## Deployment

Static export → Cloudflare Pages. Деталі: [docs/cloudflare-pages-ivapps-pro.md](docs/cloudflare-pages-ivapps-pro.md).
