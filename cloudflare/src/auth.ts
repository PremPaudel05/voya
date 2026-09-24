import { ApiError } from './planner.ts';

type AuthEnv = Env & { RESEND_API_KEY?: string; EMAIL_FROM?: string; GITHUB_CLIENT_ID?: string; GITHUB_CLIENT_SECRET?: string };
type Services = {
  bodyOf: (request: Request, max?: number) => Promise<Record<string, unknown>>;
  throttle: (env: Env, key: string, max: number, window?: number) => Promise<void>;
  verifyBot: (request: Request, env: Env, token: unknown, action: string) => Promise<void>;
  session: (env: Env, id: string, name: string, email: string) => Promise<Response>;
};
const now = () => Math.floor(Date.now() / 1000);
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
export const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
export async function digest(value: string) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))); }
export async function pkceChallenge(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function authProviders(env: AuthEnv) {
  const security = Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.IP_HASH_SECRET);
  return { google: security && Boolean(env.GOOGLE_CLIENT_ID), email: security && Boolean(env.RESEND_API_KEY && env.EMAIL_FROM), github: security && Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) };
}
function emailAddress(value: unknown) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new ApiError(400, 'INVALID_EMAIL', 'Enter a valid email address.');
  return value.trim().toLowerCase();
}
async function emailHash(env: AuthEnv, value: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.IP_HASH_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`email-login:${value}`)));
}
const invalidCode = () => new ApiError(400, 'INVALID_CODE', 'That code is incorrect or expired. Try again or request a new code.');
const invalidOAuth = () => new ApiError(400, 'INVALID_OAUTH', 'GitHub sign-in expired or could not be verified. Please start again.');

export async function extraAuth(request: Request, env: AuthEnv, ip: string, services: Services): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (request.method !== 'POST' || !['/auth/email/start', '/auth/email/verify', '/auth/github/start', '/auth/github/exchange'].includes(path)) return null;
  const providers = authProviders(env);
  if ((path.startsWith('/auth/email/') && !providers.email) || (path.startsWith('/auth/github/') && !providers.github)) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'This sign-in option is not available yet. Please use another option.');
  const body = await services.bodyOf(request);
  const origin = request.headers.get('Origin')!;
  if (path === '/auth/email/start') {
    const email = emailAddress(body.email);
    await services.throttle(env, `email-send:${ip}`, 10, 3600);
    await services.verifyBot(request, env, body.turnstileToken, 'login');
    await services.throttle(env, `email-address:${await emailHash(env, email)}`, 3, 900);
    await services.throttle(env, 'email-site', 100, 86400);
    const id = randomToken();
    // Rejection sampling avoids modulo bias in the eight-digit code.
    let value: number;
    do { value = crypto.getRandomValues(new Uint32Array(1))[0]; } while (value >= 4200000000);
    const code = String(value % 100000000).padStart(8, '0');
    await env.DB.prepare('INSERT INTO email_logins(id,email,code_hash,origin,expires_at) VALUES(?,?,?,?,?)').bind(id, email, await emailHash(env, `${id}:${code}`), origin, now() + 600).run();
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': id },
        body: JSON.stringify({ from: env.EMAIL_FROM, to: [email], subject: 'Your Voya sign-in code', text: `Your Voya sign-in code is ${code}.\n\nEnter it on Voya to sign in. It expires in 10 minutes and can be used once. Never share this code. If you did not request it, you can ignore this email.` }),
      });
      if (!response.ok) throw new Error('Email delivery failed');
    } catch {
      await env.DB.prepare('DELETE FROM email_logins WHERE id=?').bind(id).run();
      throw new ApiError(503, 'EMAIL_UNAVAILABLE', 'We could not send your code. Please try again later or use another sign-in option.');
    }
    return Response.json({ challengeId: id, expiresIn: 600 });
  }
  if (path === '/auth/email/verify') {
    await services.throttle(env, `email-verify:${ip}`, 20, 900);
    if (typeof body.challengeId !== 'string' || !/^[a-f0-9]{64}$/.test(body.challengeId) || typeof body.code !== 'string' || !/^\d{8}$/.test(body.code)) throw invalidCode();
    // The attempt counter is atomic across devices and Worker instances.
    const row = await env.DB.prepare('UPDATE email_logins SET attempts=attempts+1 WHERE id=? AND origin=? AND expires_at>? AND attempts<5 RETURNING email,code_hash').bind(body.challengeId, origin, now()).first<{ email: string; code_hash: string }>();
    const hash = await emailHash(env, `${body.challengeId}:${body.code}`);
    if (!row || row.code_hash !== hash) throw invalidCode();
    const used = await env.DB.prepare('DELETE FROM email_logins WHERE id=? AND code_hash=? AND expires_at>? RETURNING id').bind(body.challengeId, hash, now()).first();
    if (!used) throw invalidCode();
    return services.session(env, await digest(`email:${row.email}`), row.email.split('@')[0].slice(0, 100), row.email);
  }
  if (path === '/auth/github/start') {
    await services.throttle(env, `github-start:${ip}`, 10, 900);
    if (typeof body.challenge !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.challenge)) throw invalidOAuth();
    await services.verifyBot(request, env, body.turnstileToken, 'login');
    const state = randomToken();
    await env.DB.prepare('INSERT INTO oauth_logins(state_hash,challenge,origin,expires_at) VALUES(?,?,?,?)').bind(await digest(state), body.challenge, origin, now() + 600).run();
    const url = new URL('https://github.com/login/oauth/authorize');
    url.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID!, redirect_uri: `${origin}/account`, scope: 'read:user user:email', state, code_challenge: body.challenge, code_challenge_method: 'S256' }).toString();
    return Response.json({ url: url.href, state });
  }
  await services.throttle(env, `github-exchange:${ip}`, 10, 900);
  if (typeof body.state !== 'string' || !/^[a-f0-9]{64}$/.test(body.state) || typeof body.verifier !== 'string' || !/^[A-Za-z0-9_-]{43,128}$/.test(body.verifier) || typeof body.code !== 'string' || !body.code || body.code.length > 512) throw invalidOAuth();
  const state = await env.DB.prepare('DELETE FROM oauth_logins WHERE state_hash=? AND challenge=? AND origin=? AND expires_at>? RETURNING state_hash').bind(await digest(body.state), await pkceChallenge(body.verifier), origin, now()).first();
  if (!state) throw invalidOAuth();
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST', signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID!, client_secret: env.GITHUB_CLIENT_SECRET!, code: body.code, redirect_uri: `${origin}/account`, code_verifier: body.verifier }),
  });
  const result = await response.json() as { access_token?: string };
  if (!response.ok || !result.access_token) throw invalidOAuth();
  const headers = { Authorization: `Bearer ${result.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Voya-World' };
  const [profileResponse, emailsResponse] = await Promise.all([
    fetch('https://api.github.com/user', { headers, signal: AbortSignal.timeout(10000) }),
    fetch('https://api.github.com/user/emails', { headers, signal: AbortSignal.timeout(10000) }),
  ]);
  if (!profileResponse.ok || !emailsResponse.ok) throw invalidOAuth();
  const profile = await profileResponse.json() as { id?: number; name?: string; login?: string };
  const emails = await emailsResponse.json() as { email: string; primary: boolean; verified: boolean }[];
  const email = Array.isArray(emails) && emails.find(item => item.primary === true && item.verified === true)?.email;
  if (!Number.isSafeInteger(profile.id) || !profile.id || !email) throw new ApiError(400, 'VERIFIED_EMAIL_REQUIRED', 'Add and verify a primary email address on GitHub, then try again.');
  // Provider IDs stay separate: an email match never silently links accounts.
  return services.session(env, await digest(`github:${profile.id}`), String(profile.name || profile.login || 'Traveler').slice(0, 100), emailAddress(email));
}
