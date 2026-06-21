# Cloudflare Pages deployment for ivapps.pro

This repository is configured to deploy to Cloudflare Pages from GitHub Actions on every push to `main`.
It also includes a minimal [wrangler.jsonc](/I:/CalculatorsRep/wrangler.jsonc) for Pages deployment compatibility.

## 1. Create the Pages project

In Cloudflare Dashboard:

1. Open `Workers & Pages`.
2. Create a new `Pages` project.
3. Use the project name you want to keep permanently, for example `ivapps-pro`.

This workflow uses Direct Upload, so the Cloudflare Pages project must already exist before the first GitHub Actions deployment.
The committed Wrangler config currently expects the Pages project name `ivapps-pro`.

## 2. Add GitHub repository secrets

In GitHub repository settings, add these Actions secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Required API token permission:

- `Account` -> `Cloudflare Pages` -> `Edit`

## 3. Add GitHub repository variable

In GitHub repository settings, add this Actions variable:

- `CLOUDFLARE_PAGES_PROJECT_NAME`

Recommended value for this project:

```text
ivapps-pro
```

The workflow falls back to `ivapps-pro` if this variable is not set, but keeping the variable configured makes the deployed Pages project explicit in GitHub.

If you choose a different Cloudflare Pages project name, update [wrangler.jsonc](/I:/CalculatorsRep/wrangler.jsonc) so its `name` matches.

## 4. Deployment failure diagnostics

If the GitHub Actions run fails in `Deploy to Cloudflare Pages`, first expand the preceding `Validate Cloudflare deployment configuration` step.

That step checks:

- `CLOUDFLARE_API_TOKEN` repository secret is present.
- `CLOUDFLARE_ACCOUNT_ID` repository secret is present.
- `CLOUDFLARE_PAGES_PROJECT_NAME` repository variable is present or the workflow fallback is available.
- `out/` exists after `npm run build`.

If those checks pass but Wrangler still fails, verify in Cloudflare that:

- the Pages project already exists;
- the project name matches `CLOUDFLARE_PAGES_PROJECT_NAME` or `ivapps-pro`;
- the token has `Account` -> `Cloudflare Pages` -> `Edit` permission for the account that owns the project.

## 5. Configure calculator feedback email

The top-bar feedback form posts to the Cloudflare Pages Function at `/api/feedback`. The Function sends email through Resend; the API key is never part of the static export or browser bundle.

Prerequisites:

- `ivapps.pro` has status **Verified** in Resend;
- the Resend API key has permission to send email from `suggestions@ivapps.pro`.

Add the production secret:

1. Open `Workers & Pages` in Cloudflare Dashboard.
2. Select the `ivapps-pro` Pages project.
3. Open `Settings` -> `Variables and Secrets`.
4. Add an encrypted Production secret named `RESEND_API_KEY`.
5. Set its value to the existing Resend key beginning with `re_` and save the deployment settings.
6. Redeploy the current production commit if Cloudflare does not create a deployment automatically.

Do not add this key to `data/content.json`, a `NEXT_PUBLIC_*` variable, the GitHub repository, or GitHub Actions secrets. GitHub deploys the code, but only the Cloudflare Function calls Resend.

For local Function testing, copy `.dev.vars.example` to `.dev.vars`, replace the placeholder only in that ignored file, then run:

```bash
npm run build
npx wrangler pages dev out
```

After production deployment, submit one real top-bar suggestion and confirm:

- the message reaches `ivapps.pro@gmail.com`;
- the sender is `IVapps feedback <suggestions@ivapps.pro>`;
- Reply-To contains the address entered in the form;
- the API key is absent from page source, browser bundles, requests, responses, DOM, and console output.

The server and shared dialog already support a `bug-report` mode with one optional PNG/JPEG/WebP screenshot up to 5 MB. Adding the calculator-level `Повідомити про помилку` button and performing its production smoke test are a separate task.

## 6. Attach the custom domain

After the first successful deployment:

1. Open your Pages project in Cloudflare.
2. Go to `Custom domains`.
3. Add `ivapps.pro`.

Because `ivapps.pro` is already managed in the same Cloudflare account, Cloudflare should create or adjust the required DNS record automatically during domain setup.

## 7. Optional redirect

If you want only `https://ivapps.pro` to be public, configure a redirect from the default `*.pages.dev` URL to `https://ivapps.pro`.

## Notes

- Production deploys run only from the `main` branch.
- The workflow runs tests, typecheck, and build before deployment.
- Static build output is deployed from the `out/` directory.
