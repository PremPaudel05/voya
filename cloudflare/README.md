# Voya accounts and free trip planning

Voya's React website and country API remain on **Vercel**. A separate Cloudflare
Worker serves Google sign-in, account data, and Workers AI inference. The browser
calls this Worker directly so IP protection uses Cloudflare's real client IP,
not Vercel's proxy IP or an untrusted forwarding header. No API key goes into
the website bundle.

## Current activation status

The code and local checks are prepared. Production has **not** been switched.
Cloudflare account reads succeeded, but database, Turnstile, and Workers subdomain
creation each returned authentication error `10000`. The connection needs edit
access to Workers, D1, Turnstile, and Workers AI. A Google web Client ID is also
needed. Do not merge the website change until the backend is configured and
tested with a real Google account and production Turnstile token.

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

## Deploy after access is enabled

1. Confirm the account's Workers plan is **Free** in the dashboard. Do not upgrade
   or add prepaid AI Gateway credits. Read access to account settings alone does
   not prove billing status.
2. Create a D1 database called `voya-accounts`, leave read replication disabled,
   and put its ID in `wrangler.jsonc`. Apply `migrations/0001_accounts.sql` with
   `npx wrangler d1 migrations apply voya-accounts --remote` from this directory.
3. Create a managed Turnstile widget for `voyatravel.vercel.app` and `localhost`.
   Set its public site key in `TURNSTILE_SITE_KEY`. Store the secret using
   `npx wrangler secret put TURNSTILE_SECRET_KEY`.
4. In Google Auth Platform, create an External app called Voya and a Web client.
   Authorized JavaScript origins: `https://voyatravel.vercel.app`,
   `http://localhost`, and `http://localhost:5173`. Use only identity scopes
   (`openid`, `email`, `profile`); the callback-based flow needs no redirect URI
   or client secret. Put the public Client ID in `GOOGLE_CLIENT_ID`. Check audience
   availability for real travelers before launch; a testing configuration may
   restrict who can sign in.
5. Generate 32 random bytes for `IP_HASH_SECRET` and store them with
   `npx wrangler secret put IP_HASH_SECRET`. Keep the same value across deploys.
6. Run `npm ci`, copy `.dev.vars.example` to `.dev.vars` for local dummy values,
   then run `npm run types`, `npm run check`, `npm test`, and
   `npx wrangler deploy --dry-run`. Deploy the Worker with `npm run deploy`.
7. Set **Vercel** `VITE_ACCOUNT_API_URL` to the actual HTTPS `workers.dev` URL,
   with no trailing slash. No Vercel migration is needed. Add any exact additional
   production origins to the Worker allowlist, Google Client ID, and Turnstile
   widget together. Do not allow every `*.vercel.app` hostname.
8. Verify Google login, sign-out, reload, history/privacy toggle, preferences,
   saved plan retrieval, a real seven-day plan, duplicate reuse, and all quota
   errors. Then deploy the Vercel website from the PR. Remove obsolete
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
