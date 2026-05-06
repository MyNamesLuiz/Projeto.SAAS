import { createHash, randomBytes } from 'crypto';
import { getDB, persistDB } from '../database/database.js';

export interface UserPayload {
    id: number;
    email: string;
    nome: string;
    role: 'admin' | 'user';
}

// JWT-like token generation (not secure for production)
function signToken(payload: UserPayload, secret: string): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 * 7 })).toString('base64url');
    const sig = createHash('sha256').update(`${header}.${body}${secret}`).digest('base64url');
    return `${header}.${body}.${sig}`;
}
function verifyToken(token: string, secret: string): (UserPayload & { exp: number }) | null {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = createHash('sha256').update(`${header}.${body}.${secret}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${password}:${salt}`).digest('hex');
}

export function createUser(email: string, nome: string, password: string, role: 'admin' | 'user' = 'user') {
  const db = getDB();
  const salt = randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  
  db.run(
    `INSERT INTO users (email, nome, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)`,
    [email.toLowerCase(), nome, hash, salt, role]
  );
  persistDB();

  const result = db.exec(`SELECT id, email, nome, role FROM users WHERE email = ?`, [email.toLowerCase()]);
  if (!result.length) throw new Error('Erro ao criar usuário');
  const [{ columns, values }] = result;
  return Object.fromEntries(columns.map((c, i) => [c, values[0][i]])) as UserPayload;
}

export function loginUser(email: string, password: string): { token: string; user: UserPayload } | null {
  const db = getDB();
  const result = db.exec(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()]);
  if (!result.length || !result[0].values.length) return null;
  
  const [{ columns, values }] = result;
  const row = Object.fromEntries(columns.map((c, i) => [c, values[0][i]])) as Record<string, unknown>;
  
  const expectedHash = hashPassword(password, row.salt as string);
  if (expectedHash !== (row.password_hash as string)) return null;

  const user: UserPayload = {
    id: row.id as number,
    email: row.email as string,
    nome: row.nome as string,
    role: row.role as 'admin' | 'user',
  };

  const secret = process.env.JWT_SECRET ?? 'apex-secret-dev-2024';
  const token = signToken(user, secret);
  return { token, user };
}

export function validateToken(token: string): UserPayload | null {
  const secret = process.env.JWT_SECRET ?? 'apex-secret-dev-2024';
  const payload = verifyToken(token, secret);
  if (!payload) return null;
  return { id: payload.id, email: payload.email, nome: payload.nome, role: payload.role };
}
