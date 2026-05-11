import { createClient } from '@libsql/client'

const url       = process.env.TURSO_DATABASE_URL ?? 'file:./apex_autobody.db'
const authToken = process.env.TURSO_AUTH_TOKEN

export const db = createClient({ url, ...(authToken ? { authToken } : {}) })

// Compatibilidade com código que chama getDB()
export function getDB() { return db }

export const persistDB = () => {}

// ─── Schema ──────────────────────────────────────────────────────────────────
await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    nome          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS os (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_nome      TEXT NOT NULL,
    cliente_telefone  TEXT NOT NULL,
    veiculo_placa     TEXT NOT NULL,
    veiculo_modelo    TEXT NOT NULL,
    veiculo_ano       INTEGER NOT NULL,
    descricao_servico TEXT NOT NULL,
    valor_estimado    REAL,
    valor_final       REAL,
    status            TEXT NOT NULL DEFAULT 'orcamento',
    data_entrada      TEXT NOT NULL,
    prazo_estimado    TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS os_historico (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    os_id           INTEGER NOT NULL,
    status_anterior TEXT,
    status_novo     TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (os_id) REFERENCES os(id)
  );
`)