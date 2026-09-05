import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ApiError, DAILY_LIMIT, MAX_DAYS, MAX_TOKENS, MODEL, canonicalCountry, parsePlan, promptFor, validateInput, validateSettings } from './planner.ts';
import type { Settings } from './planner.ts';
import { ipKey } from './ip.ts';

// Only the public signing-key cache is shared between requests.
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
type User = { id: string; name: string; email: string; settings: string };
type Job = { id: string; status: string; result: string | null; input: string; fingerprint: string; created_at: number };
const seconds = () => Math.floor(Date.now() / 1000);
const dayStart = (now: number) => now - now % 86400;
export async function digest(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}
async function bodyOf(request: Request, max = 4096): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415, 'JSON_REQUIRED', 'Send a JSON request.');
  if (Number(request.headers.get('content-length')) > max) throw new ApiError(413, 'BODY_TOO_LARGE', 'The request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'INVALID_BODY', 'The request is empty.');
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > max) { await reader.cancel(); throw new ApiError(413, 'BODY_TOO_LARGE', 'The request is too large.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch { throw new ApiError(400, 'INVALID_BODY', 'Send a valid JSON object.'); }
}
async function ipHash(request: Request, env: Env) {
  // Never trust X-Forwarded-For or a client-provided user/IP identifier.
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip || !env.IP_HASH_SECRET) throw new ApiError(503, 'UNAVAILABLE', 'The account service is temporarily unavailable.');
  // Group IPv6 privacy addresses within a /64. Cloudflare supplies the real IP.
  return digest(`${env.IP_HASH_SECRET}:${ipKey(ip)}`);
}
async function throttle(env: Env, key: string, max: number, window = 60) {
  const now = seconds(); const expires = now - now % window + window;
  const row = await env.DB.prepare(`INSERT INTO request_limits(bucket,count,expires_at) VALUES(?,1,?)
    ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count`)
    .bind(`${key}:${expires}`, expires, max).first();
  if (!row) throw new ApiError(429, 'REQUEST_LIMIT', 'Too many requests. Please wait a minute and try again.', expires - now);
}
async function verifyBot(request: Request, env: Env, token: unknown, action: string) {
  if (!env.TURNSTILE_SECRET_KEY || typeof token !== 'string' || token.length < 1 || token.length > 2048) throw new ApiError(403, 'BOT_CHECK_REQUIRED', 'Please complete the security check and try again.');
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: request.headers.get('CF-Connecting-IP') }),
  });
  const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
  const hostname = new URL(request.headers.get('Origin')!).hostname;
  if (!response.ok || !result.success || result.hostname !== hostname || result.action !== action) throw new ApiError(403, 'BOT_CHECK_FAILED', 'The security check expired or failed. Please try again.');
}
async function authenticated(request: Request, env: Env): Promise<User> {
  const token = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new ApiError(401, 'SIGN_IN_REQUIRED', 'Sign in to save your travels and create a plan.');
  const user = await env.DB.prepare('SELECT u.id,u.name,u.email,u.settings FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token), seconds()).first<User>();
  if (!user) throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
  return user;
}
async function usage(env: Env, user: User) {
  const now = seconds();
  const row = await env.DB.prepare('SELECT count(*) AS used, max(created_at) AS last FROM plan_jobs WHERE user_id=? AND day_start=?').bind(user.id, dayStart(now)).first<{ used: number; last: number | null }>();
  return { limit: DAILY_LIMIT, used: row?.used ?? 0, remaining: Math.max(0, DAILY_LIMIT - (row?.used ?? 0)), resetsAt: (dayStart(now) + 86400) * 1000, cooldownUntil: ((row?.last ?? 0) + 60) * 1000 };
}
async function account(env: Env, user: User) {
  return { user: { name: user.name, email: user.email }, settings: JSON.parse(user.settings), usage: await usage(env, user) };
}
function quotaError(error: unknown) {
  const message = String(error);
  const retry = dayStart(seconds()) + 86400 - seconds();
  for (const [code, text] of Object.entries({ USER_DAILY_LIMIT: 'You have used your 3 daily plan attempts. Your allowance resets at midnight UTC.', IP_DAILY_LIMIT: 'This network has reached its daily plan limit. Try again after midnight UTC.', SITE_DAILY_LIMIT: 'Today’s free planning capacity is full. Saved plans are still available. Please return after midnight UTC.', COOLDOWN: 'Please wait 60 seconds between new plans.', PLAN_IN_PROGRESS: 'A plan is already being generated. Please wait for it to finish.' })) {
    if (message.includes(code)) return new ApiError(429, code, text, code === 'COOLDOWN' || code === 'PLAN_IN_PROGRESS' ? 60 : retry);
  }
  return error;
}
async function generate(request: Request, env: Env, user: User, ip: string) {
  const body = await bodyOf(request);
  const input = validateInput(body);
  if (typeof body.requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.requestId)) throw new ApiError(400, 'INVALID_REQUEST_ID', 'Please retry from the trip planner.');
  const fingerprint = await digest(JSON.stringify(input));
  const id = await digest(`${user.id}:${body.requestId}`);
  const previous = await env.DB.prepare('SELECT id,status,result,fingerprint FROM plan_jobs WHERE id=? AND user_id=?').bind(id, user.id).first<Job>();
  if (previous) {
    if (previous.fingerprint !== fingerprint) throw new ApiError(409, 'REQUEST_CHANGED', 'Start a new request after changing your preferences.');
    if (previous.status === 'complete' && previous.result) return json({ plan: JSON.parse(previous.result), saved: true, usage: await usage(env, user) });
    throw new ApiError(409, 'REQUEST_ALREADY_USED', previous.status === 'pending' ? 'Your plan is still processing. Check Saved plans shortly.' : 'That attempt did not finish. Start a new request to try again.', 30);
  }
  const cached = await env.DB.prepare("SELECT result FROM plan_jobs WHERE user_id=? AND fingerprint=? AND status='complete' AND result IS NOT NULL AND hidden=0 AND created_at>? ORDER BY created_at DESC LIMIT 1").bind(user.id, fingerprint, seconds() - 7 * 86400).first<{ result: string }>();
  if (cached) return json({ plan: JSON.parse(cached.result), saved: true, usage: await usage(env, user) });
  await verifyBot(request, env, body.turnstileToken, 'plan');
  const now = seconds();
  try {
    await env.DB.prepare("INSERT INTO plan_jobs(id,user_id,ip_hash,fingerprint,country_name,input,day_start,created_at,status) VALUES(?,?,?,?,?,?,?,?,'pending')").bind(id, user.id, ip, fingerprint, input.countryName, JSON.stringify(input), dayStart(now), now).run();
  } catch (error) { throw quotaError(error); }
  try {
    const prompt = promptFor(input);
    if (new TextEncoder().encode(prompt).length > 6000) throw new Error('PROMPT_TOO_LONG');
    // One capped call per reservation. No retries/fallback providers that silently
    // multiply usage. Account-level Free-plan exhaustion remains a hard stop.
    const result = await env.AI.run(MODEL, { messages: [{ role: 'system', content: 'You create concise travel itineraries as valid JSON.' }, { role: 'user', content: prompt }], max_tokens: MAX_TOKENS, temperature: 0.5, response_format: { type: 'json_object' } });
    const plan = parsePlan(result.response, input.days);
    await env.DB.prepare("UPDATE plan_jobs SET status='complete',result=? WHERE id=?").bind(JSON.stringify(plan), id).run();
    return json({ plan, saved: false, usage: await usage(env, user) });
  } catch (error) {
    await env.DB.prepare("UPDATE plan_jobs SET status='failed' WHERE id=?").bind(id).run();
    console.warn(JSON.stringify({ event: 'plan_failed', requestId: id, category: String(error).includes('limit') ? 'provider_limit' : 'generation_failed' }));
    throw new ApiError(503, 'GENERATION_FAILED', 'The planner could not complete this attempt. It counts toward today’s allowance. Please check Saved plans before trying again.', 60);
  }
}

export async function handle(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin');
  const allowed = env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
  const headers: Record<string, string> = { Vary: 'Origin' };
  if (!origin || !allowed.includes(origin)) return json({ error: 'Origin not allowed.', code: 'ORIGIN_DENIED' }, 403);
  headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Expose-Headers'] = 'Retry-After';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Max-Age': '600' } });
  try {
    const url = new URL(request.url); const path = url.pathname;
    if (path === '/config' && request.method === 'GET') return json({ googleClientId: env.GOOGLE_CLIENT_ID, turnstileSiteKey: env.TURNSTILE_SITE_KEY, ready: Boolean(env.GOOGLE_CLIENT_ID && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.IP_HASH_SECRET), dailyLimit: DAILY_LIMIT, maxDays: MAX_DAYS }, 200, headers);
    const ip = await ipHash(request, env);
    await throttle(env, `api:${ip}`, 120);
    let response: Response;
    if (path === '/auth/challenge' && request.method === 'POST') {
      if (!env.GOOGLE_CLIENT_ID) throw new ApiError(503, 'SIGN_IN_UNAVAILABLE', 'Sign-in is being set up. Please check back shortly.');
      await throttle(env, `login:${ip}`, 10);
      const nonce = randomToken();
      await env.DB.prepare('INSERT INTO login_nonces(nonce,expires_at) VALUES(?,?)').bind(nonce, seconds() + 300).run();
      response = json({ nonce });
    } else if (path === '/auth/google' && request.method === 'POST') {
      await throttle(env, `login:${ip}`, 10);
      const body = await bodyOf(request, 12288);
      await verifyBot(request, env, body.turnstileToken, 'login');
      if (!env.GOOGLE_CLIENT_ID || typeof body.credential !== 'string' || body.credential.length > 8192) throw new ApiError(401, 'INVALID_LOGIN', 'Google sign-in could not be verified.');
      let payload;
      try { ({ payload } = await jwtVerify(body.credential, googleKeys, { algorithms: ['RS256'], issuer: ['https://accounts.google.com', 'accounts.google.com'], audience: env.GOOGLE_CLIENT_ID, maxTokenAge: '5m', clockTolerance: 5 })); }
      catch { throw new ApiError(401, 'INVALID_LOGIN', 'Google sign-in expired or could not be verified. Please try again.'); }
      if (!payload.sub || payload.email_verified !== true || typeof payload.nonce !== 'string' || typeof payload.email !== 'string') throw new ApiError(401, 'INVALID_LOGIN', 'Use a verified Google account.');
      const nonce = await env.DB.prepare('DELETE FROM login_nonces WHERE nonce=? AND expires_at>? RETURNING nonce').bind(payload.nonce, seconds()).first();
      if (!nonce) throw new ApiError(401, 'LOGIN_EXPIRED', 'This sign-in request expired. Please try again.');
      const id = await digest(`google:${payload.sub}`);
      const token = randomToken();
      await env.DB.batch([
        env.DB.prepare('INSERT INTO users(id,name,email,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email').bind(id, String(payload.name || 'Traveler').slice(0, 100), payload.email.slice(0, 254), seconds()),
        env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await digest(token), id, seconds() + 7 * 86400),
        env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash NOT IN (SELECT token_hash FROM sessions WHERE user_id=? ORDER BY expires_at DESC LIMIT 5)').bind(id, id),
      ]);
      const user = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first<User>();
      response = json({ token, ...await account(env, user!) });
    } else {
      const user = await authenticated(request, env);
      if (path === '/me' && request.method === 'GET') response = json(await account(env, user));
      else if (path === '/auth/logout' && request.method === 'POST') {
        await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(request.headers.get('Authorization')!.slice(7))).run();
        response = json({ ok: true });
      } else if (path === '/settings' && request.method === 'PUT') {
        const settings = validateSettings(await bodyOf(request));
        await env.DB.prepare('UPDATE users SET settings=? WHERE id=?').bind(JSON.stringify(settings), user.id).run();
        response = json({ settings });
      } else if (path === '/history' && request.method === 'GET') {
        response = json({ history: (await env.DB.prepare('SELECT country_name AS countryName,searched_at*1000 AS searchedAt FROM search_history WHERE user_id=? ORDER BY searched_at DESC LIMIT 100').bind(user.id).all()).results });
      } else if (path === '/history' && request.method === 'POST') {
        const country = canonicalCountry((await bodyOf(request)).countryName);
        const settings = JSON.parse(user.settings) as Settings;
        if (settings.saveHistory) await env.DB.batch([
          env.DB.prepare('INSERT INTO search_history(user_id,country_name,searched_at) VALUES(?,?,?) ON CONFLICT(user_id,country_name) DO UPDATE SET searched_at=excluded.searched_at').bind(user.id, country, seconds()),
          env.DB.prepare('DELETE FROM search_history WHERE user_id=? AND country_name NOT IN (SELECT country_name FROM search_history WHERE user_id=? ORDER BY searched_at DESC LIMIT 100)').bind(user.id, user.id),
        ]);
        response = json({ ok: true });
      } else if (path === '/history' && request.method === 'DELETE') {
        await env.DB.prepare('DELETE FROM search_history WHERE user_id=?').bind(user.id).run(); response = json({ ok: true });
      } else if (path === '/plans' && request.method === 'GET') {
        response = json({ plans: (await env.DB.prepare("SELECT id,country_name AS countryName,input,created_at*1000 AS createdAt FROM plan_jobs WHERE user_id=? AND status='complete' AND result IS NOT NULL AND hidden=0 ORDER BY created_at DESC LIMIT 30").bind(user.id).all()).results.map(row => ({ ...row, input: JSON.parse(String(row.input)) })) });
      } else if (/^\/plans\/[a-f0-9]{64}$/.test(path) && ['GET', 'DELETE'].includes(request.method)) {
        const id = path.split('/')[2];
        if (request.method === 'DELETE') {
          // Keep minimal accounting rows until retention cleanup; deleting a saved
          // result must never restore quota or let a user reset the daily cap.
          await env.DB.prepare("UPDATE plan_jobs SET hidden=1,result=NULL,input='{}' WHERE id=? AND user_id=?").bind(id, user.id).run();
          response = json({ ok: true });
        } else {
          const job = await env.DB.prepare("SELECT result,input FROM plan_jobs WHERE id=? AND user_id=? AND status='complete' AND hidden=0 AND result IS NOT NULL").bind(id, user.id).first<Job>();
          if (!job) throw new ApiError(404, 'NOT_FOUND', 'Saved plan not found.');
          response = json({ plan: JSON.parse(job.result!), input: JSON.parse(job.input) });
        }
      } else if (path === '/plan' && request.method === 'POST') response = await generate(request, env, user, ip);
      else throw new ApiError(404, 'NOT_FOUND', 'Endpoint not found.');
    }
    for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
    return response;
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message, code: error.code, retryAfter: error.retryAfter }, error.status, { ...headers, ...(error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}) });
    console.error(JSON.stringify({ event: 'account_request_failed' }));
    return json({ error: 'The service is temporarily unavailable. Please try again later.', code: 'SERVICE_UNAVAILABLE' }, 503, headers);
  }
}
export default {
  fetch: handle,
  async scheduled(_controller: ScheduledController, env: Env) {
    const now = seconds();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM request_limits WHERE expires_at<?').bind(now),
      env.DB.prepare('DELETE FROM login_nonces WHERE expires_at<?').bind(now),
      env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now),
      env.DB.prepare('DELETE FROM plan_jobs WHERE created_at<?').bind(now - 30 * 86400),
      env.DB.prepare('DELETE FROM search_history WHERE searched_at<?').bind(now - 90 * 86400),
      env.DB.prepare("UPDATE plan_jobs SET status='failed' WHERE status='pending' AND created_at<?").bind(now - 120),
    ]);
  },
} satisfies ExportedHandler<Env>;
