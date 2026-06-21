# Calculator feedback email design

**Status:** Agreed design

**Date:** 2026-06-21

## Goal

Replace the top-bar `mailto:` link with a reusable modal form that reliably sends calculator feedback to `ivapps.pro@gmail.com` without exposing the Resend API key to the browser or the public GitHub repository.

The form supports two explicit modes:

- `suggestion` for proposing a calculator;
- `bug-report` for reporting an error in a specific calculator.

Only the existing top-bar calculator-suggestion entry point is connected in this task. The calculator-level `Повідомити про помилку` button is a separate task. The shared modal API, server endpoint, attachment handling, and automated tests must already support `bug-report` so that the later task only needs to add the trigger with calculator context.

## User interface

The existing top-bar control keeps the label `Запропонувати калькулятор` and opens the modal directly in `suggestion` mode. There is no mode switch inside the form.

Shared fields in both modes are:

- `Ім’я` — required text input;
- `Email для відповіді` — required email input;
- a submit button;
- a visually hidden honeypot input that normal users do not fill.

`suggestion` mode adds:

- `Опишіть калькулятор` — required multiline input.

`bug-report` mode adds:

- `Опишіть, що сталося` — required multiline input;
- the current page URL and calculator name, supplied as audit context rather than user-editable fields;
- one optional screenshot.

The screenshot control accepts one PNG, JPEG, or WebP image up to 5 MB. A user can paste it from the clipboard or choose a file. The form shows a preview, file name, size, and remove action. Unsupported or oversized files show a validation error and are not submitted.

The modal supports keyboard focus, Escape-to-close, backdrop close, and a visible close control. While a request is in flight, repeat submission is disabled. On success, the modal shows a confirmation. On failure, it shows an actionable error and preserves the entered values.

## Architecture and data flow

1. The caller opens the modal with an explicit `suggestion` or `bug-report` mode. A bug-report caller also supplies the calculator name and current page URL.
2. The browser records when the form became available.
3. The user submits the form as `multipart/form-data` to a same-origin Cloudflare Pages Function endpoint.
4. The Function parses and validates the mode-specific request before contacting Resend.
5. Valid requests are sent through the Resend REST API.
6. The Function returns only a success or safe error response; it never returns or logs the API key.

The email envelope is:

- **From:** `IVapps feedback <suggestions@ivapps.pro>`;
- **To:** `ivapps.pro@gmail.com`;
- **Reply-To:** the validated email entered by the user;
- **Subject:** identifies the message as either a calculator suggestion or an error report;
- **Body:** contains the submitted name, reply email, and mode-specific message as escaped plain text or safely encoded HTML;
- **Bug-report context:** includes the calculator name and page URL;
- **Attachment:** includes the validated screenshot only for `bug-report`.

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
- the mode is unknown or required mode-specific context is missing;
- a screenshot is supplied for `suggestion` mode;
- a screenshot is larger than 5 MB or is not a valid PNG, JPEG, or WebP image;
- the payload has an unexpected content type or malformed structure.

Screenshot validation checks the declared MIME type, filename extension, and file signature. The screenshot is passed directly to Resend as an email attachment and is not stored in the repository, Cloudflare R2, or another persistent store.

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
- explicit `suggestion` and `bug-report` rendering without an in-form mode switch;
- file selection, clipboard paste, preview, validation, and removal;
- validation of required fields, email shape, field limits, honeypot, and completion time;
- validation of screenshot size, MIME type, extension, and file signature;
- construction of mode-specific Resend requests and the bug-report attachment without exposing secrets;
- safe handling of Resend failures and malformed requests.

Implementation follows test-driven development. Final repository verification runs:

```bash
npm test
npm run typecheck
npm run build
```

A production smoke test submits one real suggestion and confirms receipt at `ivapps.pro@gmail.com` after `RESEND_API_KEY` is configured in Cloudflare Pages. A production bug-report smoke test is deferred until the separate calculator-level trigger is implemented; the server path is covered by automated tests in this task.

## Out of scope

- more than one screenshot or attachments other than PNG, JPEG, and WebP;
- user accounts or submission history;
- a database or admin interface;
- the calculator-level `Повідомити про помилку` button;
- Cloudflare Turnstile;
- durable IP-based rate limiting;
- exposing the Resend API key to GitHub or browser code.
