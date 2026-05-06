import initSqlJs, { type Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'apex.db');

let db: Database;

export async function initDB(): Promise<Database> {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`PRAGMA journal_mode=WAL;`);
  db.run(`PRAGMA foreign_keys=ON;`);

  runMigrations();
  persistDB();

  return db;
}

export function getDB(): Database {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

export function persistDB(): void {
  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

function runMigrations(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS ordens_servico (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_nome     TEXT    NOT NULL,
      cliente_telefone TEXT    NOT NULL,
      veiculo_placa    TEXT    NOT NULL,
      veiculo_modelo   TEXT    NOT NULL,
      veiculo_ano      INTEGER NOT NULL,
      descricao_servico TEXT   NOT NULL,
      valor_estimado   REAL,
      valor_final      REAL,
      status           TEXT    NOT NULL DEFAULT 'Orcamento',
      prazo_estimado   TEXT,
      data_entrada     TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS os_historico (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      os_id           INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
      status_anterior TEXT,
      status_novo     TEXT    NOT NULL,
      criado_em       TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Índices para buscas frequentes
  db.run(`CREATE INDEX IF NOT EXISTS idx_os_status     ON ordens_servico(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_os_placa      ON ordens_servico(veiculo_placa);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_os_cliente    ON ordens_servico(cliente_nome);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_os_telefone   ON ordens_servico(cliente_telefone);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_historico_os  ON os_historico(os_id);`);
}
