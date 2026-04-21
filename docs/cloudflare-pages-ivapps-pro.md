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

If you choose a different Cloudflare Pages project name, update [wrangler.jsonc](/I:/CalculatorsRep/wrangler.jsonc) so its `name` matches.

## 4. Attach the custom domain

After the first successful deployment:

1. Open your Pages project in Cloudflare.
2. Go to `Custom domains`.
3. Add `ivapps.pro`.

Because `ivapps.pro` is already managed in the same Cloudflare account, Cloudflare should create or adjust the required DNS record automatically during domain setup.

## 5. Optional redirect

If you want only `https://ivapps.pro` to be public, configure a redirect from the default `*.pages.dev` URL to `https://ivapps.pro`.

## Notes

- Production deploys run only from the `main` branch.
- The workflow runs tests, typecheck, and build before deployment.
- Static build output is deployed from the `out/` directory.
