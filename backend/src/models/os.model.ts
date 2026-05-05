import { getDB, persistDB } from '../db/database.js';
import type { OS, CreateOSBody, UpdateOSBody, StatusOS, HistoricoOS } from '../types/index.js';

// helpers

function rowToOS(row: Record<string, unknown>): OS {
  const updatedAt = row.updated_at as string;
  const status = row.status as StatusOS;
  const prazoEstimado = row.prazo_estimado as string | null;

  const updatedDate = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updatedDate.getTime();
  const diasNaEtapa = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const alertaParada = diasNaEtapa > 3;

  const prazoVencido =
    prazoEstimado !== null &&
    status !== 'Entregue' &&
    new Date(prazoEstimado) < new Date(new Date().toISOString().split('T')[0]);

  return {
    id: row.id as number,
    cliente_nome: row.cliente_nome as string,
    cliente_telefone: row.cliente_telefone as string,
    veiculo_placa: row.veiculo_placa as string,
    veiculo_modelo: row.veiculo_modelo as string,
    veiculo_ano: row.veiculo_ano as number,
    descricao_servico: row.descricao_servico as string,
    valor_estimado: row.valor_estimado as number | null,
    valor_final: row.valor_final as number | null,
    status,
    prazo_estimado: prazoEstimado,
    data_entrada: row.data_entrada as string,
    updated_at: updatedAt,
    dias_na_etapa: diasNaEtapa,
    alerta_parada: alertaParada,
    prazo_vencido: prazoVencido,
  };
}

function stmtToRows(result: ReturnType<typeof getDB>['exec']): Record<string, unknown>[] {
  if (!result.length) return [];
  const [{ columns, values }] = result;
  return values.map((row: { [x: string]: any; }) =>
    Object.fromEntries(columns.map((col: any, i: string | number) => [col, row[i]]))
  );
}

// ─── queries ──────────────────────────────────────────────────────────────────

export function findAllOS(search?: string): OS[] {
  const db = getDB();
  let sql: string;
  let params: unknown[];

  if (search && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    sql = `
      SELECT * FROM ordens_servico
      WHERE lower(cliente_nome)     LIKE ?
         OR lower(veiculo_placa)    LIKE ?
         OR lower(cliente_telefone) LIKE ?
      ORDER BY updated_at DESC
    `;
    params = [q, q, q];
  } else {
    sql = `SELECT * FROM ordens_servico ORDER BY updated_at DESC`;
    params = [];
  }

  const result = db.exec(sql, params);
  return stmtToRows(result).map(rowToOS);
}

export function findOSById(id: number): OS | null {
  const db = getDB();
  const result = db.exec(
    `SELECT * FROM ordens_servico WHERE id = ?`,
    [id]
  );
  const rows = stmtToRows(result);
  return rows.length ? rowToOS(rows[0]) : null;
}

export function createOS(body: CreateOSBody): OS {
  const db = getDB();

  db.run(
    `INSERT INTO ordens_servico
      (cliente_nome, cliente_telefone, veiculo_placa, veiculo_modelo,
       veiculo_ano, descricao_servico, valor_estimado, valor_final, prazo_estimado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      body.cliente_nome,
      body.cliente_telefone,
      body.veiculo_placa.toUpperCase(),
      body.veiculo_modelo,
      body.veiculo_ano,
      body.descricao_servico,
      body.valor_estimado ?? null,
      body.valor_final ?? null,
      body.prazo_estimado ?? null,
    ]
  );

  const idResult = db.exec(`SELECT last_insert_rowid() as id`);
  const id = stmtToRows(idResult)[0].id as number;

  // Registra no histórico como entrada inicial
  db.run(
    `INSERT INTO os_historico (os_id, status_anterior, status_novo)
     VALUES (?, NULL, 'Orcamento')`,
    [id]
  );

  persistDB();

  return findOSById(id)!;
}

export function updateOS(id: number, body: UpdateOSBody): OS | null {
  const db = getDB();
  const current = findOSById(id);
  if (!current) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.cliente_nome !== undefined) { fields.push('cliente_nome = ?'); values.push(body.cliente_nome); }
  if (body.cliente_telefone !== undefined) { fields.push('cliente_telefone = ?'); values.push(body.cliente_telefone); }
  if (body.veiculo_placa !== undefined) { fields.push('veiculo_placa = ?'); values.push(body.veiculo_placa.toUpperCase()); }
  if (body.veiculo_modelo !== undefined) { fields.push('veiculo_modelo = ?'); values.push(body.veiculo_modelo); }
  if (body.veiculo_ano !== undefined) { fields.push('veiculo_ano = ?'); values.push(body.veiculo_ano); }
  if (body.descricao_servico !== undefined) { fields.push('descricao_servico = ?'); values.push(body.descricao_servico); }
  if (body.valor_estimado !== undefined) { fields.push('valor_estimado = ?'); values.push(body.valor_estimado); }
  if (body.valor_final !== undefined) { fields.push('valor_final = ?'); values.push(body.valor_final); }
  if (body.prazo_estimado !== undefined) { fields.push('prazo_estimado = ?'); values.push(body.prazo_estimado); }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }

  if (!fields.length) return current;

  // Atualiza updated_at sempre que algo muda
  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.run(
    `UPDATE ordens_servico SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  // Se mudou de status → registra histórico
  if (body.status && body.status !== current.status) {
    db.run(
      `INSERT INTO os_historico (os_id, status_anterior, status_novo)
       VALUES (?, ?, ?)`,
      [id, current.status, body.status]
    );
  }

  persistDB();
  return findOSById(id)!;
}

export function deleteOS(id: number): boolean {
  const db = getDB();
  const current = findOSById(id);
  if (!current) return false;

  db.run(`DELETE FROM ordens_servico WHERE id = ?`, [id]);
  persistDB();
  return true;
}

export function findHistoricoByOS(osId: number): HistoricoOS[] {
  const db = getDB();
  const result = db.exec(
    `SELECT * FROM os_historico WHERE os_id = ? ORDER BY criado_em ASC`,
    [osId]
  );
  return stmtToRows(result).map((row) => ({
    id: row.id as number,
    os_id: row.os_id as number,
    status_anterior: (row.status_anterior ?? null) as StatusOS | null,
    status_novo: row.status_novo as StatusOS,
    criado_em: row.criado_em as string,
  }));
}
