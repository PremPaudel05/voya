import { scrypt, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { authProviders, digest, randomToken } from './auth.ts';
import type { AuthEnv, Services } from './auth.ts';
import { ApiError } from './planner.ts';

// OWASP's 16 MiB scrypt configuration, supported by Workers' native crypto.
export const passwordHash = (password: string, salt: string): Promise<string> => new Promise((resolve, reject) => {
  scrypt(password, salt, 32, { N: 16384, r: 8, p: 5, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(Buffer.from(key).toString('hex')));
});
const invalidLogin = () => new ApiError(400, 'INVALID_PASSWORD_LOGIN', 'The email or password is incorrect. Try again or use your recovery code.');
const invalidRecovery = () => new ApiError(400, 'INVALID_RECOVERY', 'The email or recovery code is incorrect.');
type Credential = { user_id: string; email: string; password_hash: string; salt: string; recovery_hash: string; name: string };

export async function passwordAuth(request: Request, env: AuthEnv, ip: string, services: Services): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (request.method !== 'POST' || !['/auth/password/signup', '/auth/password/login', '/auth/password/recover'].includes(path)) return null;
  if (!authProviders(env).password) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'Account registration is temporarily unavailable. Please try again shortly.');
  const body = await services.bodyOf(request);
  await services.throttle(env, `password-ip:${ip}`, 15, 900);
  await services.verifyBot(request, env, body.turnstileToken, 'login');
  if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) throw new ApiError(400, 'INVALID_EMAIL', 'Enter a valid email address.');
  const email = body.email.trim().toLowerCase();
  await services.throttle(env, `password-email:${await digest(email)}`, 10, 900);
  const signup = path.endsWith('/signup');
  const recover = path.endsWith('/recover');
  if (typeof body.password !== 'string' || body.password.length > 128 || body.password.length < (signup || recover ? 15 : 1)) throw new ApiError(400, 'INVALID_PASSWORD', 'Use a password between 15 and 128 characters. A few unrelated words work well.');
  if (signup && (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 100)) throw new ApiError(400, 'INVALID_NAME', 'Enter your name (up to 100 characters).');
  const row = await env.DB.prepare('SELECT p.*,u.name FROM password_credentials p JOIN users u ON u.id=p.user_id WHERE p.email=?').bind(email).first<Credential>();

  if (!signup && !recover) {
    // Equal-cost dummy work avoids a fast path for unknown addresses.
    const hash = await passwordHash(body.password, row?.salt ?? 'voya-unknown-account-dummy-salt');
    if (!row || !timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(row.password_hash, 'hex'))) throw invalidLogin();
    return services.session(env, row.user_id, row.name, row.email, row.password_hash);
  }
  if (signup) {
    await services.throttle(env, `password-signup:${ip}`, 5, 3600);
    await services.throttle(env, 'password-signup-site', 200, 86400);
    if (row) throw new ApiError(400, 'REGISTRATION_UNAVAILABLE', 'Unable to create this account. Try signing in or use a different email.');
  } else {
    if (typeof body.recoveryCode !== 'string' || body.recoveryCode.length > 100) throw invalidRecovery();
    const code = body.recoveryCode.replace(/[\s-]/g, '').toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(code) || !row || await digest(`recovery:${code}`) !== row.recovery_hash) throw invalidRecovery();
  }
  const salt = randomToken();
  const hash = await passwordHash(body.password, salt);
  const recoveryCode = randomToken();
  const recoveryHash = await digest(`recovery:${recoveryCode}`);
  // Stable namespace preserves usage limits across account deletion/re-registration.
  const id = signup ? await digest(`password:${email}`) : row!.user_id;
  const name = signup ? (body.name as string).trim() : row!.name;
  if (signup) {
    try {
      await env.DB.batch([
        env.DB.prepare('INSERT INTO users(id,name,email,created_at) VALUES(?,?,?,?)').bind(id, name, email, Math.floor(Date.now() / 1000)),
        env.DB.prepare('INSERT INTO password_credentials(user_id,email,password_hash,salt,recovery_hash,created_at) VALUES(?,?,?,?,?,?)').bind(id, email, hash, salt, recoveryHash, Math.floor(Date.now() / 1000)),
      ]);
    } catch (error) {
      if (String(error).includes('UNIQUE')) throw new ApiError(400, 'REGISTRATION_UNAVAILABLE', 'Unable to create this account. Try signing in or use a different email.');
      throw error;
    }
  } else {
    // Compare-and-swap plus session revocation is one transaction. Only one reset wins.
    await env.DB.batch([
      env.DB.prepare('UPDATE password_credentials SET password_hash=?,salt=?,recovery_hash=? WHERE user_id=? AND recovery_hash=?').bind(hash, salt, recoveryHash, id, row!.recovery_hash),
      env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND EXISTS(SELECT 1 FROM password_credentials WHERE user_id=? AND password_hash=?)').bind(id, id, hash),
    ]);
  }
  const response = await services.session(env, id, name, email, hash);
  if (!response.ok) return response;
  return Response.json({ ...await response.json() as object, recoveryCode: recoveryCode.match(/.{8}/g)!.join('-') });
}
