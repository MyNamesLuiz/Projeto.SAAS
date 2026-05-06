import db from '../database/database.js';
import type { OS, CreateOSBody, UpdateOSBody, StatusOS, HistoricoOS } from '../@types/index.js';

// ─── HELPERS (Conversores de Dados) ──────────────────────────────────────────

function rowToOS(row: any): OS {
  const updatedAt = row.updated_at as string;
  const status = row.status as StatusOS;
  const prazoEstimado = row.prazo_estimado as string | null;

  const updatedDate = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updatedDate.getTime();
  const diasNaEtapa = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Regra de Negócio: OS Parada > 3 dias
  const alertaParada = diasNaEtapa > 3 && status !== 'ENTREGUE';

  // Regra de Negócio: Prazo Vencido
  const prazoVencido =
    prazoEstimado !== null &&
    status !== 'ENTREGUE' &&
    new Date(prazoEstimado) < new Date(new Date().toISOString().split('T')[0]);

  return {
    id: row.id as number,
    cliente_nome: row.cliente_nome as string,
    cliente_telefone: row.cliente_telefone as string,
    veiculo_placa: row.veiculo_placa as string,
    veiculo_modelo: row.veiculo_modelo as string,
    veiculo_ano: row.veiculo_ano as number,
    descricao: row.descricao as string,
    valor_estimado: row.valor_estimado as number | null,
    valor_final: row.valor_final as number | null,
    status,
    prazo_estimado: prazoEstimado,
    data_entrada: row.data_entrada as string,
    updated_at: updatedAt,
    dias_na_etapa: diasNaEtapa,
    alerta_parada: alertaParada,
    prazo_vencido: !!prazoVencido,
  };
}

// ─── QUERIES (Better-SQLite3) ────────────────────────────────────────────────

export function findAllOS(search?: string): OS[] {
  let sql = `SELECT * FROM os`;
  const params: any[] = [];

  if (search && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    sql += ` WHERE lower(cliente_nome) LIKE ? 
             OR lower(veiculo_placa) LIKE ? 
             OR lower(cliente_telefone) LIKE ?`;
    params.push(q, q, q);
  }

  sql += ` ORDER BY updated_at DESC`;

  // No better-sqlite3 usamos prepare().all() para buscar vários
  const rows = db.prepare(sql).all(params);
  return rows.map(rowToOS);
}

export function findOSById(id: number): OS | null {
  const row = db.prepare(`SELECT * FROM os WHERE id = ?`).get(id);
  return row ? rowToOS(row) : null;
}

export function createOS(body: CreateOSBody): OS {
  const stmt = db.prepare(`
    INSERT INTO os (cliente_nome, cliente_telefone, veiculo_placa, veiculo_modelo,
                    veiculo_ano, descricao_servico, valor_estimado, valor_final, 
                    prazo_estimado, data_entrada)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const result = stmt.run(
    body.cliente_nome,
    body.cliente_telefone,
    body.veiculo_placa.toUpperCase(),
    body.veiculo_modelo,
    body.veiculo_ano,
    body.descricao_servico,
    body.valor_estimado ?? null,
    body.valor_final ?? null,
    body.prazo_estimado ?? null
  );

  const id = result.lastInsertRowid as number;

  // Histórico inicial
  db.prepare(`
    INSERT INTO os_historico (os_id, status_anterior, status_novo)
    VALUES (?, NULL, 'ORCAMENTO')
  `).run(id);

  return findOSById(id)!;
}

export function updateOS(id: number, body: UpdateOSBody): OS | null {
  const current = findOSById(id);
  if (!current) return null;

  const fields: string[] = [];
  const values: any[] = [];

  // Mapeamento dinâmico de campos para o UPDATE
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'veiculo_placa' ? String(value).toUpperCase() : value);
    }
  });

  if (fields.length === 0) return current;

  fields.push("updated_at = datetime('now')");
  values.push(id); // Parâmetro para o WHERE id = ?

  db.prepare(`UPDATE os SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  // Registro de histórico se o status mudar
  if (body.status && body.status !== current.status) {
    db.prepare(`
      INSERT INTO os_historico (os_id, status_anterior, status_novo)
      VALUES (?, ?, ?)
    `).run(id, current.status, body.status);
  }

  return findOSById(id);
}

export function deleteOS(id: number): boolean {
  const result = db.prepare(`DELETE FROM os WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function findHistoricoByOS(osId: number): HistoricoOS[] {
  const rows = db.prepare(`
    SELECT * FROM os_historico 
    WHERE os_id = ? 
    ORDER BY created_at ASC
  `).all(osId);

  return rows.map((row: any) => ({
    id: row.id as number,
    os_id: row.os_id as number,
    status_anterior: (row.status_anterior ?? null) as StatusOS | null,
    status_novo: row.status_novo as StatusOS,
    criado_em: row.created_at as string,
  }));
}