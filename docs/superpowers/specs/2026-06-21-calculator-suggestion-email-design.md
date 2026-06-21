# Calculator suggestion email design

**Status:** Agreed design

**Date:** 2026-06-21

## Goal

Replace the top-bar `mailto:` link with a modal form that reliably sends calculator suggestions to `ivapps.pro@gmail.com` without exposing the Resend API key to the browser or the public GitHub repository.

## User interface

The existing `Запропонувати калькулятор` control opens an accessible modal over the catalog. The modal contains:

- `Ім’я` — required text input;
- `Email для відповіді` — required email input;
- `Опишіть калькулятор` — required multiline input;
- a submit button;
- a visually hidden honeypot input that normal users do not fill.

The modal supports keyboard focus, Escape-to-close, backdrop close, and a visible close control. While a request is in flight, repeat submission is disabled. On success, the modal shows a confirmation. On failure, it shows an actionable error and preserves the entered values.

## Architecture and data flow

1. The browser opens the modal and records when the form became available.
2. The user submits the form to a same-origin Cloudflare Pages Function endpoint.
3. The Function parses and validates the request before contacting Resend.
4. Valid requests are sent through the Resend REST API.
5. The Function returns only a success or safe error response; it never returns or logs the API key.

The email envelope is:

- **From:** `IVapps calculator suggestions <suggestions@ivapps.pro>`;
- **To:** `ivapps.pro@gmail.com`;
- **Reply-To:** the validated email entered by the user;
- **Subject:** identifies the message as a calculator suggestion;
- **Body:** contains the submitted name, reply email, and suggestion text as escaped plain text or safely encoded HTML.

## Secret management

`RESEND_API_KEY` is stored as a secret in the Cloudflare Pages project for the Production environment. It is read only inside the server-side Function. The key must not be placed in `data/content.json`, a `NEXT_PUBLIC_*` variable, committed environment files, or GitHub Actions configuration.

Local development may use `.dev.vars`; this file must be ignored by Git. A committed example file may contain only a placeholder.

## Minimal anti-spam and validation

The Function rejects a request without calling Resend when:

- the honeypot has a value;
- the reported form-completion interval is below the agreed minimum;
- required values are missing;
- the reply address is not a valid email-shaped value;
- any field exceeds its server-side length limit;
- the payload has an unexpected content type or malformed structure.

The browser may mirror these checks for immediate feedback, but the server is authoritative. These measures are intentionally minimal and do not claim to stop targeted abuse. Cloudflare Turnstile or durable rate limiting can be added later if real traffic shows they are needed.

## Configuration

The deployed Cloudflare Pages project requires:

- a Production secret named `RESEND_API_KEY` containing the existing Resend key;
- the already verified `ivapps.pro` domain in Resend;
- Pages Functions included in the existing direct-upload deployment.

The recipient and sender addresses remain server-side constants unless a later operational need justifies environment configuration.

## Testing and verification

Automated tests cover:

- opening, closing, submitting, success, and failure states of the modal;
- preservation of form values after a failed request;
- validation of required fields, email shape, field limits, honeypot, and completion time;
- construction of the Resend request without exposing secrets;
- safe handling of Resend failures and malformed requests.

Implementation follows test-driven development. Final repository verification runs:

```bash
npm test
npm run typecheck
npm run build
```

A production smoke test submits one real suggestion and confirms receipt at `ivapps.pro@gmail.com` after `RESEND_API_KEY` is configured in Cloudflare Pages.

## Out of scope

- attachments;
- user accounts or submission history;
- a database or admin interface;
- Cloudflare Turnstile;
- durable IP-based rate limiting;
- exposing the Resend API key to GitHub or browser code.
