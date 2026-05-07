import Database from 'better-sqlite3';

export const db = new Database('database.db');

// Tabela OS

db.exec(`
CREATE TABLE IF NOT EXISTS os (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomeCliente TEXT,
    telefone TEXT,
    placa TEXT,
    modelo TEXT,
    cor TEXT,
    ano INTEGER,
    descricao TEXT,
    valorEstimado REAL,
    valorFinal REAL,
    status TEXT
    dataEntrada TEXT,
    prazoEntrega TEXT,
    observacoesInternas TEXT,
    deleted INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now') 
);
`);

// Histórico
db.exec(`
CREATE TABLE IF NOT EXISTS os_historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    osId INTEGER,
    campoAlterado TEXT,
    valorAnterior TEXT,
    valorNovo TEXT,
    dataAlteracao TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (osId) REFERENCES os(id)
);
`);