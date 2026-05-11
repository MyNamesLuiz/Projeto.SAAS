import { createHash, randomBytes } from 'crypto'
import { getDB } from '../database/database.js'
import type { UserPayload } from '../types/index.js'

function toBase64url(str: string): string {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function hashBase64url(data: string): string {
  return createHash('sha256').update(data).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function signToken(payload: UserPayload, secret: string): string {
  const header = toBase64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = toBase64url(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 * 7 }))
  const sig    = hashBase64url(`${header}.${body}${secret}`)
  return `${header}.${body}.${sig}`
}

function verifyToken(token: string, secret: string): (UserPayload & { exp: number }) | null {
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null
    const expectedSig = hashBase64url(`${header}.${body}${secret}`)
    if (sig !== expectedSig) return null
    const base64  = body.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'))
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${password}:${salt}`).digest('hex')
}

export async function createUser(
  email: string,
  nome: string,
  password: string,
  role: 'admin' | 'user' = 'user'
): Promise<UserPayload> {
  const db   = getDB()
  const salt = randomBytes(16).toString('hex')
  const hash = hashPassword(password, salt)

  await db.execute({
    sql:  `INSERT INTO users (email, nome, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)`,
    args: [email.toLowerCase(), nome, hash, salt, role],
  })

  const rs   = await db.execute({ sql: `SELECT id, email, nome, role FROM users WHERE email = ?`, args: [email.toLowerCase()] })
  const user = rs.rows[0] as unknown as UserPayload | undefined
  if (!user) throw new Error('Erro ao criar usuário')
  return user
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string; user: UserPayload } | null> {
  const db  = getDB()
  const rs  = await db.execute({ sql: `SELECT * FROM users WHERE email = ?`, args: [email.toLowerCase()] })
  const row = rs.rows[0] as Record<string, unknown> | undefined
  if (!row) return null

  const expectedHash = hashPassword(password, row.salt as string)
  if (expectedHash !== (row.password_hash as string)) return null

  const user: UserPayload = {
    id:    row.id as number,
    email: row.email as string,
    nome:  row.nome as string,
    role:  row.role as 'admin' | 'user',
  }

  const secret = process.env.JWT_SECRET ?? 'apex-secret-dev-2024'
  const token  = signToken(user, secret)
  return { token, user }
}

export function validateToken(token: string): UserPayload | null {
  const secret  = process.env.JWT_SECRET ?? 'apex-secret-dev-2024'
  const payload = verifyToken(token, secret)
  if (!payload) return null
  return { id: payload.id, email: payload.email, nome: payload.nome, role: payload.role }
}