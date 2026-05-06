import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'

const db: DatabaseType = new Database('apex_autobody.db')

db.exec(`
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

export const getDB = () => db;
export const persistDB = () => {};

export default db