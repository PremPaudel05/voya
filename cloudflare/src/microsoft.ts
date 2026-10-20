import { createLocalJWKSet, decodeJwt, jwtVerify } from 'jose';
import type { JWK } from 'jose';
import { authProviders, digest, pkceChallenge, randomToken } from './auth.ts';
import type { AuthEnv, Services } from './auth.ts';
import { ApiError } from './planner.ts';

const authority = 'https://login.microsoftonline.com';
const scope = 'openid profile email';
const now = () => Math.floor(Date.now() / 1000);
const invalid = () => new ApiError(400, 'INVALID_MICROSOFT_LOGIN', 'Microsoft sign-in expired or could not be verified. Please start again.');

async function identity(token: string, audience: string, nonceHash: string) {
  // The decoded tenant is untrusted until signature, audience and issuer verification.
  const { tid } = decodeJwt(token);
  if (typeof tid !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(tid)) throw invalid();
  const issuer = `${authority}/${tid}/v2.0`;
  // Always use Microsoft's fixed endpoint, never a URL supplied by a token.
  const response = await fetch(`${authority}/common/discovery/v2.0/keys`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw invalid();
  const jwks = await response.json() as { keys: (JWK & { issuer?: string })[] };
  if (!Array.isArray(jwks.keys)) throw invalid();
  // Microsoft's tenant-independent keys carry an issuer restriction of their own.
  const keys = jwks.keys.filter(key => key.issuer?.replace('{tenantid}', tid) === issuer);
  const { payload } = await jwtVerify(token, createLocalJWKSet({ keys }), {
    issuer, audience, algorithms: ['RS256'], requiredClaims: ['exp', 'iat', 'sub', 'tid', 'nonce'], maxTokenAge: '10m',
  });
  if (payload.ver !== '2.0' || payload.tid !== tid || !payload.sub || typeof payload.nonce !== 'string' || await digest(payload.nonce) !== nonceHash) throw invalid();
  // Email is display data, never an account identifier or proof for account linking.
  const email = [payload.email, payload.preferred_username].find(value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) as string | undefined;
  if (!email) throw new ApiError(400, 'MICROSOFT_EMAIL_REQUIRED', 'This Microsoft account did not share an email address. Please use another account or sign-in option.');
  return { id: await digest(`microsoft:${tid}:${payload.sub}`), name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.slice(0, 100) : 'Traveler', email: email.toLowerCase() };
}

export async function microsoftAuth(request: Request, env: AuthEnv, ip: string, services: Services): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (request.method !== 'POST' || !['/auth/microsoft/start', '/auth/microsoft/exchange'].includes(path)) return null;
  if (!authProviders(env).microsoft) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'Microsoft sign-in is not available yet. Please choose another option.');
  const body = await services.bodyOf(request, 16384);
  const origin = request.headers.get('Origin')!;
  if (path.endsWith('/start')) {
    await services.throttle(env, `microsoft-start:${ip}`, 10, 900);
    if (typeof body.challenge !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.challenge)) throw invalid();
    await services.verifyBot(request, env, body.turnstileToken, 'login');
    const state = randomToken();
    const nonce = randomToken();
    await env.DB.prepare('INSERT INTO microsoft_logins(state_hash,challenge,nonce_hash,origin,expires_at) VALUES(?,?,?,?,?)')
      .bind(await digest(state), body.challenge, await digest(nonce), origin, now() + 600).run();
    const url = new URL(`${authority}/common/oauth2/v2.0/authorize`);
    url.search = new URLSearchParams({ client_id: env.MICROSOFT_CLIENT_ID!, response_type: 'code', response_mode: 'query', redirect_uri: `${origin}/account`, scope, state, nonce, code_challenge: body.challenge, code_challenge_method: 'S256', prompt: 'select_account' }).toString();
    return Response.json({ url: url.href, state });
  }
  await services.throttle(env, `microsoft-exchange:${ip}`, 10, 900);
  if (typeof body.state !== 'string' || !/^[a-f0-9]{64}$/.test(body.state) || typeof body.verifier !== 'string' || !/^[A-Za-z0-9_-]{43,128}$/.test(body.verifier) || typeof body.code !== 'string' || !body.code || body.code.length > 8192) throw invalid();
  // Atomic consumption prevents concurrent requests and replay; separate provider table prevents mix-ups.
  const flow = await env.DB.prepare('DELETE FROM microsoft_logins WHERE state_hash=? AND challenge=? AND origin=? AND expires_at>? RETURNING nonce_hash')
    .bind(await digest(body.state), await pkceChallenge(body.verifier), origin, now()).first<{ nonce_hash: string }>();
  if (!flow) throw invalid();
  let user: Awaited<ReturnType<typeof identity>>;
  try {
    const response = await fetch(`${authority}/common/oauth2/v2.0/token`, {
      method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: env.MICROSOFT_CLIENT_ID!, client_secret: env.MICROSOFT_CLIENT_SECRET!, grant_type: 'authorization_code', code: body.code, redirect_uri: `${origin}/account`, code_verifier: body.verifier, scope }),
    });
    const result = await response.json() as { id_token?: string };
    if (!response.ok || typeof result.id_token !== 'string') throw invalid();
    user = await identity(result.id_token, env.MICROSOFT_CLIENT_ID!, flow.nonce_hash);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw invalid();
  }
  return services.session(env, user.id, user.name, user.email);
}
