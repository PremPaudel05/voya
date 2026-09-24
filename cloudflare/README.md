# Voya accounts and free trip planning

Voya's React website and country API remain on **Vercel**. A separate Cloudflare
Worker serves Google sign-in, account data, and Workers AI inference. The browser
calls this Worker directly so IP protection uses Cloudflare's real client IP,
not Vercel's proxy IP or an untrusted forwarding header. No API key goes into
the website bundle.

## Current activation status

The backend is deployed at
`https://voya-account-api.voya-prempaudel05.workers.dev` with its D1 database,
Google web Client ID, managed Turnstile widget, secrets, and daily cleanup.
The account owner confirmed **Workers Free** in the dashboard on 2026-09-05;
no billing subscription or paid AI Gateway was enabled.

The frontend defaults to this public API address; Vercel can override it with
`VITE_ACCOUNT_API_URL`. Live API checks verified account isolation, persisted
settings/history/usage, private saved-plan reuse, session revocation, request
bounds, and rejection of invalid Turnstile responses. A fourth daily database
reservation was rejected. A real seven-day Workers AI response passed the
production parser (1,198 tokens, about 28.08 Neurons). Temporary test accounts
and sessions were removed. A successful Google sign-in and fresh Turnstile
completion still need a check in the user's browser; automated browser access
was unavailable. No production authentication bypass was introduced.

## Limits and stored data

- 3 new generation attempts per account per UTC day, 15 per IP/network, 40 total.
- 60-second cooldown and only one active plan per account (120-second lease).
- A D1 `BEFORE INSERT` trigger checks all caps in one atomic reservation. Limits
  survive redeployments, new sessions, browsers, history clears, and deleted plans.
- Failed/interrupted attempts count. There are no automatic provider retries.
- Same-user matching results are reused for 7 days; retries with the same request
  ID never start another AI call. Notes are private and never cached across users.
- A fixed Llama 3.1 8B FP8 model, 4,096 output tokens, <=6,000 prompt bytes, <=500
  characters of notes, and 1–7 days bound cost and output size.
- Google's signature, audience, issuer, expiry, verified email and single-use
  nonce are verified server-side. Stable Google subject IDs determine accounts.
- Opaque 256-bit sessions last 7 days. Only token hashes are stored in D1; the
  bearer token is in browser local storage. Logout revokes it server-side. No
  cookies, client-selected user IDs, or browser-local quota counters are trusted.
- Turnstile is verified on the server, including action and exact hostname.
  Malformed/oversized input, bad origins, and unavailable storage fail closed.
- IPv6 addresses share a /64 quota; IPv4-mapped addresses normalize to IPv4.
  Salted IP hashes are retained with usage rows, never raw IP addresses.
- Preferences and Google name/email persist. Up to 100 distinct search-history
  entries last 90 days; generated plans and accounting rows last 30 days. A daily
  scheduled cleanup removes expired sessions, counters, nonces and old data.
- Country exploration uses bundled information and never calls AI. All old
  Groq and Hugging Face routes are retired with HTTP 410, including Express aliases.

The site cap reserves headroom in the Free allowance; it is not an exact Neuron
meter. Keep the account on Workers **Free** and do not configure paid AI Gateway
billing. Cloudflare's Free allowance is the final hard stop. Other applications
in the same account share it, so the provider can reject requests sooner.

## Maintain or recreate the deployment

1. Confirm the account's Workers plan is **Free** in the dashboard. Do not upgrade
   or add prepaid AI Gateway credits. Read access to account settings alone does
   not prove billing status.
2. Reuse the D1 database ID in `wrangler.jsonc`; initial migration is already
   applied and recorded in `d1_migrations`. Apply future migrations with
   `npx wrangler d1 migrations apply voya-accounts --remote`. For a new environment,
   create its own database and leave read replication disabled. Keep SQL files
   with LF endings and avoid unparenthesized CASE expressions in trigger bodies,
   because D1's statement splitter can reject SQL that local SQLite accepts.
3. Reuse the managed Turnstile widget for `voyatravel.vercel.app` and `localhost`.
   Set its public site key in `TURNSTILE_SITE_KEY`. Store the secret using
   `npx wrangler secret put TURNSTILE_SECRET_KEY`.
4. The Google Auth Platform web client is configured. Its
   Authorized JavaScript origins: `https://voyatravel.vercel.app`,
   `http://localhost`, and `http://localhost:5173`. Use only identity scopes
   (`openid`, `email`, `profile`); the callback-based flow needs no redirect URI
   or client secret. Put the public Client ID in `GOOGLE_CLIENT_ID`. Check audience
   availability for real travelers before launch; a testing configuration may
   restrict who can sign in.
5. Preserve the deployed `IP_HASH_SECRET` across redeployments. For a new
   environment, generate 32 random bytes and store them with
   `npx wrangler secret put IP_HASH_SECRET`.
6. Run `npm ci`, copy `.dev.vars.example` to `.dev.vars` for local dummy values,
   then run `npm run types`, `npm run check`, `npm test`, and
   `npx wrangler deploy --dry-run`. Deploy the Worker with `npm run deploy`.
7. The frontend already defaults to the deployed HTTPS `workers.dev` URL.
   To use another environment, set **Vercel** `VITE_ACCOUNT_API_URL` with no
   trailing slash. No Vercel migration is needed. Add any exact additional
   production origins to the Worker allowlist, Google Client ID, and Turnstile
   widget together. Do not allow every `*.vercel.app` hostname.
8. Verify Google login, sign-out, reload, history/privacy toggle, preferences,
   saved plan retrieval, a real seven-day plan, duplicate reuse, and all quota
   errors. Vercel deploys the website from the repository. Remove obsolete
   `GROQ_API_KEY` and `HF_API_TOKEN` Vercel variables after the switch is confirmed.

## Validation

`npm test` uses real SQLite with the production migration and Worker request
handler. Only external Google/Turnstile/AI responses are stubbed; signed Google
JWT tests use ephemeral RSA keys and actual signature verification. Tests cover
concurrency, quota boundaries, UTC reset, replay, output validation, failure
accounting, ownership isolation, settings/history persistence, and revocation.
`node --test --test-isolation=none server/*.test.mjs` also checks legacy-route
closure and the existing country-search regressions.

Sources: [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/),
[Google setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid),
[Google token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token),
[Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
# Account settings deployment

The account UI supports appearance, contrast, reduced motion, English/Spanish/French navigation, notification preferences, and account deletion. Apply `0002_account_deletion.sql` before deploying the new Worker. The frontend checks `settingsVersion: 2` before allowing account deletion or syncing new settings, so an older backend cannot silently discard them.

The **Deploy Voya account API** GitHub Actions workflow runs after relevant changes reach `main`, and can also be started manually. Configure repository Actions secrets `CLOUDFLARE_API_TOKEN` (Workers Scripts:Edit and D1:Edit, scoped to the Voya account) and `CLOUDFLARE_ACCOUNT_ID`. Existing Google and Turnstile secrets stay in the Worker. The workflow verifies the backend, applies migrations, deploys, and checks `/config`. Vercel continues to deploy the frontend through its existing GitHub integration.

For a local authenticated Cloudflare CLI, run `npx wrangler d1 migrations apply voya-accounts --remote` followed by `npm run deploy` from `cloudflare/` after the checks pass.

Deletion atomically removes the profile, sessions, search history, and plan content. Today's minimal usage ledger has no foreign key to the profile and is retained until the next daily cleanup; deleting and recreating an account cannot reset any AI quota. No deleted content is returned if generation was in flight. Notification preferences control in-app notices and foreground-site browser alerts, not email or background push. Language selection covers account UI and navigation; editorial country content remains English.

Local UI fixture (Node 24, no real user data or provider calls): run `node cloudflare/test/ui-server.mjs` from the repository root. In another terminal run `VITE_ACCOUNT_API_URL=/__ui_api npx vite --config test/ui.vite.config.ts --host 127.0.0.1`. Open `/test/preview.html` on that local Vite server. The fixture uses an isolated in-memory database and is not included in production builds.

## Email and GitHub sign-in (auth API v2)

Apply migration `0003_login_options.sql` before deploying this Worker. Google
continues to work with its existing configuration. `/config` advertises only
configured providers, so shipping the frontend before the backend or before
provider setup does not expose non-working buttons. `ready` means at least one
provider and the existing security keys are configured; it does not verify
provider credentials or email deliverability.

### Activate email codes

1. Configure a Resend account and verify a sending domain you control. A
   `vercel.app` site address is not a sending domain you control. Resend's test
   sender is not suitable for public sign-ups.
2. From `cloudflare/`, set `RESEND_API_KEY` with `npx wrangler secret put
   RESEND_API_KEY` and `EMAIL_FROM` with `npx wrangler secret put EMAIL_FROM`.
   Use a sender such as `Voya <signin@your-verified-domain>` and a key scoped to
   sending on that domain. Never put either credential in a `VITE_` variable,
   source file, issue, or pull request.
3. Check `/config` reports `providers.email: true`. Test delivery to a separate
   inbox, wrong and expired codes, a successful login, reload, and sign-out.

Email sign-in uses an eight-digit code, not a password. Codes expire after ten
minutes, allow five guesses per challenge, and are consumed atomically. Only
an HMAC of the code is stored, using the existing server secret with a separate
purpose prefix. Codes are never returned by the API or logged. Sending requires
Turnstile, is limited to 3 per recipient per 15-minute window, 10 per network per
hour, and 100 site-wide per UTC day. Verification is separately rate limited.
These application caps do not replace the provider's billing/usage settings.
Provider delivery failures remove the challenge. Expired challenges are cleaned
up daily.

### Activate GitHub

1. Create a GitHub **OAuth App** with homepage
   `https://voyatravel.vercel.app` and authorization callback URL
   `https://voyatravel.vercel.app/account`. Use a separate OAuth app for local
   development with the corresponding localhost callback.
2. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` through
   `npx wrangler secret put GITHUB_CLIENT_ID` and
   `npx wrangler secret put GITHUB_CLIENT_SECRET` from `cloudflare/`.
3. Check `/config` reports `providers.github: true`. Test a new login, returning
   login, cancellation, sign-out, and expired requests with your own account.

The redirect flow uses one-use state, an exact allowed origin, a ten-minute
expiry, and S256 PKCE. The initiating tab stores the verifier in sessionStorage.
Only the backend exchanges the authorization code; GitHub access tokens and the
client secret never reach the browser or D1. A verified primary GitHub email is
required. OAuth query parameters are removed when the sign-in component mounts.
The application requests only `read:user user:email`, with no repository scope.

Accounts are deliberately separate by sign-in method. Existing Google IDs,
settings, history, sessions, and quotas are preserved. Matching email addresses
do **not** automatically merge accounts; returning users are reminded to use
their original method. Explicit authenticated account linking is future work.

Google and Turnstile script downloads now start while configuration loads on
the sign-in page. Script failures have a 15-second timeout and retry; refreshing
configuration on window focus no longer recreates Google's button or nonce.
Google nonces renew after four minutes while the page stays open. One Turnstile
widget serves all methods and resets after a token is submitted. None of these
changes bypass security checks or guarantee third-party load times.

The backend tests stub external delivery/providers; they never send real emails.
Production provider setup and real end-to-end sign-in remain required before
claiming these methods are live.

Provider references: [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email),
[GitHub OAuth and PKCE](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).
