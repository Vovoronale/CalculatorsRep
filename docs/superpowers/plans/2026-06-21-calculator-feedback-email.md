# Calculator Feedback Email Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the top-bar `mailto:` link with a tested modal that sends calculator suggestions through a Cloudflare Pages Function and Resend, while preparing an unconnected bug-report mode with validated screenshot attachments.

**Architecture:** Keep browser UI, submission validation, Resend payload construction, and the Cloudflare entry point in separate focused modules. The client sends `multipart/form-data` to a same-origin `/api/feedback` Function; the Function performs authoritative anti-spam and input checks, then calls Resend with a server-only `RESEND_API_KEY`. The shared modal exposes explicit `suggestion` and `bug-report` modes, but this plan connects only `suggestion` to the existing top-bar button.

**Tech Stack:** Next.js 15 static export, React 19, TypeScript, Cloudflare Pages Functions, Resend REST API, Vitest, Testing Library, CSS.

**Design source:** [`docs/superpowers/specs/2026-06-21-calculator-suggestion-email-design.md`](../specs/2026-06-21-calculator-suggestion-email-design.md)

---

## File structure

- Create `lib/feedback.ts`: shared modes, limits, normalized submission types, multipart validation, honeypot/timing checks, and screenshot signature validation.
- Create `lib/feedback.test.ts`: pure validation coverage for suggestion and bug-report payloads.
- Create `lib/feedback-resend.ts`: build Resend request bodies, encode screenshot content, and perform the injected HTTP call.
- Create `lib/feedback-resend.test.ts`: verify exact email envelopes, attachment encoding, and safe provider failures.
- Create `functions/api/feedback.ts`: thin Cloudflare Pages Function adapter for request checks, secret access, validation, and safe HTTP responses.
- Create `functions/api/feedback.test.ts`: node-environment integration tests around the Function boundary.
- Create `components/feedback-dialog.tsx`: accessible two-mode modal, form state, paste/file screenshot handling, preview, submit state, and result UI.
- Create `components/feedback-dialog.test.tsx`: interaction coverage for both modes, including screenshot behavior.
- Create `components/ivapps-topbar.test.tsx`: top-bar regression test proving the CTA is a button and opens suggestion mode.
- Modify `components/ivapps-topbar.tsx`: own the suggestion-dialog open state and replace the `mailto:` anchor.
- Modify `lib/site-content.ts` and `data/content.json`: make the top-bar CTA label-only and remove the obsolete public email URL.
- Modify `app/globals.css`: feedback modal, form, status, screenshot preview, and responsive styles.
- Modify `.gitignore`: ignore local `.dev.vars` secrets while allowing an example file.
- Create `.dev.vars.example`: document the secret name with a non-secret placeholder.
- Modify `docs/content-editing.md`: explain that the top-bar CTA label opens the feedback form and no longer has an `href`.
- Modify `docs/cloudflare-pages-ivapps-pro.md`: document Resend domain/key prerequisites, Cloudflare secret setup, and production smoke testing.

## Chunk 1: Server-side feedback pipeline

### Task 1: Define and validate feedback submissions

**Files:**
- Create: `lib/feedback.test.ts`
- Create: `lib/feedback.ts`

- [ ] **Step 1: Write failing tests for a valid suggestion and anti-spam rejection**

Start with a wished-for async API that accepts `FormData` and an injected current time:

```ts
const now = 1_750_000_010_000;
const form = new FormData();
form.set("mode", "suggestion");
form.set("name", "Іван");
form.set("email", "ivan@example.com");
form.set("message", "Калькулятор прогину балки");
form.set("website", "");
form.set("startedAt", String(now - 10_000));

await expect(validateFeedbackForm(form, now)).resolves.toEqual({
  ok: true,
  value: {
    mode: "suggestion",
    name: "Іван",
    email: "ivan@example.com",
    message: "Калькулятор прогину балки",
  },
});
```

Add separate tests proving that a populated `website` honeypot and a completion interval below `MIN_COMPLETION_MS` return validation failures.

- [ ] **Step 2: Run the validation test and verify RED**

Run: `npm test -- lib/feedback.test.ts`

Expected: FAIL because `@/lib/feedback` does not exist.

- [ ] **Step 3: Implement the minimal shared types and text validation**

Export:

```ts
export type FeedbackMode = "suggestion" | "bug-report";
export const MIN_COMPLETION_MS = 3_000;
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

export type FeedbackSubmission =
  | { mode: "suggestion"; name: string; email: string; message: string }
  | {
      mode: "bug-report";
      name: string;
      email: string;
      message: string;
      calculatorName: string;
      pageUrl: string;
      screenshot?: File;
    };

export async function validateFeedbackForm(
  form: FormData,
  now = Date.now(),
): Promise<{ ok: true; value: FeedbackSubmission } | { ok: false; code: string }>;
```

Use explicit limits: name 100 characters, email 254, message 5,000, calculator name 200, and URL 2,048. Trim text fields, use a conservative email-shaped check, require `http:` or `https:` for bug-report URLs, reject unknown modes, and reject screenshots in suggestion mode.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm test -- lib/feedback.test.ts`

Expected: PASS for suggestion, honeypot, timing, required-field, length, email, and mode cases.

- [ ] **Step 5: Add failing bug-report screenshot tests**

Use real `File` instances to cover:

```ts
const png = new File(
  [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "screen.png",
  { type: "image/png" },
);
```

Assert acceptance of matching PNG, JPEG, and WebP files. Assert rejection for files over 5 MB, mismatched MIME/extension/signature combinations, missing calculator context, and any screenshot on a suggestion.

- [ ] **Step 6: Run the new cases and verify RED**

Run: `npm test -- lib/feedback.test.ts`

Expected: FAIL because screenshot signatures and bug-report context are not implemented yet.

- [ ] **Step 7: Implement minimal signature validation**

Read only the first 12 bytes and recognize:

```ts
const isPng = bytes starts with 89 50 4e 47 0d 0a 1a 0a;
const isJpeg = bytes starts with ff d8 ff;
const isWebp = bytes[0..3] is "RIFF" && bytes[8..11] is "WEBP";
```

Require the expected MIME, extension (`.png`, `.jpg`, `.jpeg`, `.webp`), and signature to agree. Return stable error codes rather than provider or stack details.

- [ ] **Step 8: Run tests and commit the validation unit**

Run: `npm test -- lib/feedback.test.ts`

Expected: PASS.

```bash
git add lib/feedback.ts lib/feedback.test.ts
git commit -m "Add feedback submission validation"
```

### Task 2: Build and send Resend messages

**Files:**
- Create: `lib/feedback-resend.test.ts`
- Create: `lib/feedback-resend.ts`

- [ ] **Step 1: Write failing tests for exact suggestion and bug-report envelopes**

Specify this public API:

```ts
export async function buildResendEmail(
  submission: FeedbackSubmission,
): Promise<ResendEmailPayload>;

export async function sendFeedbackEmail(args: {
  apiKey: string;
  submission: FeedbackSubmission;
  fetchImpl?: typeof fetch;
}): Promise<void>;
```

Assert common fields:

```ts
expect(payload).toMatchObject({
  from: "IVapps feedback <suggestions@ivapps.pro>",
  to: ["ivapps.pro@gmail.com"],
  reply_to: "ivan@example.com",
});
```

Assert a fixed suggestion subject and plain-text body. For bug reports, assert a different fixed subject, calculator name and page URL in `text`, and `attachments: [{ filename, content }]` with base64 content.

- [ ] **Step 2: Run the Resend tests and verify RED**

Run: `npm test -- lib/feedback-resend.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement payload construction and byte-safe base64 encoding**

Use a chunked `Uint8Array` to binary-string conversion before `btoa`; do not spread a multi-megabyte byte array into one function call. Use Resend's REST shape:

```ts
type ResendEmailPayload = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
  attachments?: Array<{ filename: string; content: string }>;
};
```

Keep all user content in the `text` field, not HTML. Do not include the API key in this object.

- [ ] **Step 4: Add a failing transport test**

Inject a test fetch function and assert one POST to `https://api.resend.com/emails` with `Authorization: Bearer <key>` and JSON content. Add a separate case where Resend returns non-2xx and assert `sendFeedbackEmail` throws a generic provider error without including response bodies or the key.

- [ ] **Step 5: Implement the minimal transport and verify GREEN**

Run: `npm test -- lib/feedback-resend.test.ts`

Expected: PASS with no real network calls.

- [ ] **Step 6: Commit the Resend unit**

```bash
git add lib/feedback-resend.ts lib/feedback-resend.test.ts
git commit -m "Add Resend feedback email delivery"
```

### Task 3: Add the Cloudflare Pages Function boundary

**Files:**
- Create: `functions/api/feedback.test.ts`
- Create: `functions/api/feedback.ts`

- [ ] **Step 1: Write failing Function integration tests**

Use `// @vitest-environment node` so Node 22's Request, Response, FormData, and File implementations are tested. Import `onRequest` directly and construct contexts containing `{ request, env: { RESEND_API_KEY } }`.

Cover:

- valid same-origin multipart POST returns `200 { ok: true }` and invokes injected/provider fetch once;
- honeypot returns a neutral success response without invoking Resend;
- too-fast, malformed, non-multipart, cross-origin, and non-POST requests are rejected without invoking Resend;
- missing `RESEND_API_KEY` returns a safe 500 response;
- Resend failure returns a safe 502 response without provider details or the key.

- [ ] **Step 2: Run the Function tests and verify RED**

Run: `npm test -- functions/api/feedback.test.ts`

Expected: FAIL because the Pages Function does not exist.

- [ ] **Step 3: Implement a thin Function adapter**

Define only the local structural types needed by the file; do not add a large Cloudflare type dependency:

```ts
type FeedbackFunctionContext = {
  request: Request;
  env: { RESEND_API_KEY?: string };
};

export async function onRequest(
  context: FeedbackFunctionContext,
): Promise<Response>;
```

The handler must:

1. require `POST`;
2. require `multipart/form-data`;
3. require `Origin` to match `new URL(request.url).origin`;
4. parse `request.formData()` safely;
5. call `validateFeedbackForm`;
6. return neutral success for the honeypot code and safe Ukrainian errors for other validation codes;
7. read `RESEND_API_KEY` only from `context.env`;
8. call `sendFeedbackEmail` and map provider failures to a generic response;
9. add `Cache-Control: no-store` to every response.

Do not log request bodies, screenshots, email addresses, provider bodies, or secrets.

- [ ] **Step 4: Run server tests and all chunk tests**

Run:

```bash
npm test -- functions/api/feedback.test.ts lib/feedback.test.ts lib/feedback-resend.test.ts
npm run typecheck
```

Expected: all tests pass and TypeScript accepts the Function file.

- [ ] **Step 5: Commit the Function boundary**

```bash
git add functions/api/feedback.ts functions/api/feedback.test.ts
git commit -m "Add Cloudflare feedback endpoint"
```

## Chunk 2: Feedback modal and top-bar integration

### Task 4: Build the two-mode feedback modal

**Files:**
- Create: `components/feedback-dialog.test.tsx`
- Create: `components/feedback-dialog.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing accessibility and suggestion-mode tests**

Specify the component contract:

```ts
type FeedbackDialogProps = {
  open: boolean;
  mode: "suggestion" | "bug-report";
  onClose: () => void;
  calculatorContext?: { calculatorName: string; pageUrl: string };
};
```

Assert that suggestion mode:

- renders nothing when closed;
- opens a `dialog` named `Запропонувати калькулятор`;
- focuses the name input and restores prior focus on close;
- closes from Escape, backdrop, and the close button;
- renders name, reply email, and `Опишіть калькулятор` fields;
- does not render a mode switch, calculator context, or screenshot control.

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test -- components/feedback-dialog.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the accessible modal shell and suggestion fields**

Follow the existing `CalculatorModal` conventions for `role="dialog"`, `aria-modal`, body scroll lock, Escape handling, backdrop click, and previous-focus restoration. Keep form values in component state and set `startedAt` each time `open` changes from false to true.

- [ ] **Step 4: Add failing bug-report rendering and screenshot tests**

Render the component directly with `mode="bug-report"` and context. Assert:

- heading `Повідомити про помилку` and textarea `Опишіть, що сталося`;
- context is included in submitted `FormData` but is not editable;
- file input accepts `.png,.jpg,.jpeg,.webp`;
- selecting a valid file shows preview/name/size/remove controls;
- pasting one valid image produces the same state;
- invalid type or a file over 5 MB shows an error and does not replace a previously valid file;
- object URLs are revoked on replacement, removal, and unmount.

Stub only `URL.createObjectURL`/`URL.revokeObjectURL`; use real `File`, clipboard, and user-event objects for behavior.

- [ ] **Step 5: Run new tests and verify RED**

Run: `npm test -- components/feedback-dialog.test.tsx`

Expected: FAIL because bug-report attachment behavior is missing.

- [ ] **Step 6: Implement bug-report fields and one-file paste/select behavior**

Client checks are for immediate feedback only; always append the file to `FormData` and rely on the Function for authoritative signature validation. Do not read or serialize the Resend key in this component.

- [ ] **Step 7: Add failing submit-state tests**

Stub global `fetch` only at the network boundary. Assert:

- submit posts `multipart/form-data` to `/api/feedback` without manually setting `Content-Type`;
- mode, fields, honeypot, started time, context, and optional screenshot are present;
- duplicate submission is disabled while pending;
- success replaces the form with a confirmation;
- safe API/network errors remain visible and preserve text and selected screenshot for retry.

- [ ] **Step 8: Implement submission and result states**

Use `aria-live="polite"` for success and `role="alert"` for failures. Parse error JSON defensively and fall back to a fixed Ukrainian message. Clear values only after success or a completed close/reset, never on failed submission.

- [ ] **Step 9: Add focused responsive styles**

Create feedback-specific classes instead of overloading calculator iframe modal sizing. Cover modal width, labels, inputs, textarea, actions, pending state, error/success status, hidden honeypot positioning, screenshot drop/paste area, preview containment, and mobile stacking. Reuse existing color and typography variables.

- [ ] **Step 10: Run component tests and commit**

Run: `npm test -- components/feedback-dialog.test.tsx`

Expected: PASS with no React act warnings, leaked object URLs, or unhandled promises.

```bash
git add components/feedback-dialog.tsx components/feedback-dialog.test.tsx app/globals.css
git commit -m "Add calculator feedback dialog"
```

### Task 5: Connect suggestion mode to the top bar

**Files:**
- Create: `components/ivapps-topbar.test.tsx`
- Modify: `components/ivapps-topbar.tsx`
- Modify: `lib/site-content.ts`
- Modify: `data/content.json`

- [ ] **Step 1: Write the failing top-bar integration test**

Render `IVappsTopbar`, assert `Запропонувати калькулятор` is a button rather than a `mailto:` link, click it, and assert the suggestion dialog opens. Close it and assert focus returns to the CTA. Assert there is no `Повідомити про помилку` trigger in this task.

- [ ] **Step 2: Run the integration test and verify RED**

Run: `npm test -- components/ivapps-topbar.test.tsx`

Expected: FAIL because the CTA is still an anchor and no dialog is rendered.

- [ ] **Step 3: Replace the link with stateful modal integration**

In `IVappsTopbar`, add local open state, render the CTA as:

```tsx
<button type="button" className="topbar-cta" onClick={() => setOpen(true)}>
  {cta.label}
</button>
```

Render `FeedbackDialog` with `mode="suggestion"`. Remove `href` from `TopbarCta` and from `site.topbar.cta` in `data/content.json`; do not move either email address into client content.

- [ ] **Step 4: Run focused UI and content tests**

Run:

```bash
npm test -- components/ivapps-topbar.test.tsx components/feedback-dialog.test.tsx app/layout.test.tsx
npm run typecheck
```

Expected: PASS. TypeScript confirms content data matches the label-only CTA type.

- [ ] **Step 5: Commit the integration**

```bash
git add components/ivapps-topbar.tsx components/ivapps-topbar.test.tsx lib/site-content.ts data/content.json
git commit -m "Connect calculator suggestion form"
```

## Chunk 3: Secret hygiene, deployment documentation, and verification

### Task 6: Document and protect Resend configuration

**Files:**
- Modify: `.gitignore`
- Create: `.dev.vars.example`
- Modify: `docs/content-editing.md`
- Modify: `docs/cloudflare-pages-ivapps-pro.md`

- [ ] **Step 1: Add secret-file ignore rules and a placeholder example**

Add:

```gitignore
.dev.vars
.dev.vars.*
!.dev.vars.example
```

Create `.dev.vars.example` containing only:

```text
RESEND_API_KEY=re_replace_with_local_key
```

Verify no real key matching `re_[A-Za-z0-9_]` appears in tracked files.

- [ ] **Step 2: Update content editing documentation**

Document `site.topbar.cta` as `{ label }`. Explain that the label is rendered as a button that opens suggestion mode; email routing, recipients, and secrets do not belong in `content.json`.

- [ ] **Step 3: Update Cloudflare deployment documentation**

Add exact operator steps:

1. confirm `ivapps.pro` is verified in Resend;
2. open `Workers & Pages -> ivapps-pro -> Settings -> Variables and Secrets`;
3. add encrypted Production secret `RESEND_API_KEY` with the existing `re_...` value;
4. do not add this key to GitHub Secrets because GitHub does not call Resend;
5. deploy/redeploy and submit one real top-bar suggestion;
6. confirm delivery to `ivapps.pro@gmail.com`, correct `Reply-To`, and no secret in page source/network responses.

Also document local testing with a copied, untracked `.dev.vars` and `npx wrangler pages dev out` after `npm run build`. State that the calculator-level bug-report button and its production smoke test remain a separate task.

- [ ] **Step 4: Check docs and secret hygiene, then commit**

Run:

```powershell
git check-ignore .dev.vars
git ls-files | Select-String -Pattern '\.dev\.vars$'
git grep -n -E 'RESEND_API_KEY\s*=\s*re_[A-Za-z0-9_]+'
git diff --check
```

Expected: `.dev.vars` is ignored; only `.dev.vars.example` is tracked; no command prints a real key assignment; diff check is clean.

```bash
git add .gitignore .dev.vars.example docs/content-editing.md docs/cloudflare-pages-ivapps-pro.md
git commit -m "Document Resend feedback configuration"
```

### Task 7: Full verification and deployment smoke checks

**Files:**
- Modify only if a verification step exposes a concrete defect.

- [ ] **Step 1: Run all automated repository checks**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all commands exit successfully; static pages are exported to `out/`; no test warnings or unhandled errors are introduced.

- [ ] **Step 2: Verify Pages Function discovery locally**

Copy `.dev.vars.example` to ignored `.dev.vars`, replace the placeholder only in that ignored file, then run:

```bash
npx wrangler pages dev out
```

Expected: Wrangler reports the `/api/feedback` Pages Function and serves the static export. Do not print the secret. Stop the local server after verification and leave `.dev.vars` untracked.

- [ ] **Step 3: Run browser smoke tests**

At the local Wrangler URL, verify desktop and mobile behavior:

- top-bar CTA remains `Запропонувати калькулятор`;
- the modal opens, focuses correctly, closes by button/Escape/backdrop, and restores focus;
- validation and pending states are readable;
- a real valid suggestion reaches the endpoint;
- page source, browser bundles, requests, responses, console, and rendered DOM do not contain `RESEND_API_KEY` or the `re_...` value;
- there is no calculator-level `Повідомити про помилку` button yet.

- [ ] **Step 4: Inspect final scope and repository state**

Run:

```bash
git diff --check
git status --short
git log --oneline -7
```

Expected: only intended changes remain, no `.dev.vars` is tracked, and the implementation commits are present.

- [ ] **Step 5: Complete the production-only operator check after deployment**

Once `RESEND_API_KEY` is configured in the Cloudflare Pages Production environment and the branch is deployed, submit one real suggestion. Confirm receipt at `ivapps.pro@gmail.com`, sender `IVapps feedback <suggestions@ivapps.pro>`, and `Reply-To` equal to the submitted address. Do not claim this check passed until the deployed environment and mailbox have actually been observed.
