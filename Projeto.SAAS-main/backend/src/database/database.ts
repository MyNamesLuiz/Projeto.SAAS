import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'

// Usa /tmp no Render (filesystem efêmero) ou local em dev
const DB_PATH = process.env.RENDER
  ? '/tmp/apex_autobody.db'
  : 'apex_autobody.db'

const db: DatabaseType = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS os (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_nome TEXT NOT NULL,
    cliente_telefone TEXT NOT NULL,
    veiculo_placa TEXT NOT NULL,
    veiculo_modelo TEXT NOT NULL,
    veiculo_ano INTEGER NOT NULL,
    descricao_servico TEXT NOT NULL,
    valor_estimado REAL,
    valor_final REAL,
    status TEXT NOT NULL DEFAULT 'orcamento',
    data_entrada TEXT NOT NULL,
    prazo_estimado TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS os_historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    os_id INTEGER NOT NULL,
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (os_id) REFERENCES os(id)
  );
`)

export function getDB(): DatabaseType { return db }
export const persistDB = () => {}

export default db