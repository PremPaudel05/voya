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
