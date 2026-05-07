import db from '../database/database.js';

// ─── Tipos inline ─────────────────────────────────────────────────────────────
type StatusOS = string;

interface OS {
  id:                number
  cliente_nome:      string
  cliente_telefone:  string
  veiculo_placa:     string
  veiculo_modelo:    string
  veiculo_ano:       number
  descricao:         string
  valor_estimado:    number | null
  valor_final:       number | null
  status:            StatusOS
  prazo_estimado:    string | null
  data_entrada:      string
  updated_at:        string
  dias_na_etapa:     number
  alerta_parada:     boolean
  prazo_vencido:     boolean
}

interface CreateOSBody {
  cliente_nome:      string
  cliente_telefone:  string
  veiculo_placa:     string
  veiculo_modelo:    string
  veiculo_ano:       number
  descricao_servico: string
  valor_estimado?:   number
  valor_final?:      number
  prazo_estimado?:   string
}

interface UpdateOSBody {
  cliente_nome?:      string
  cliente_telefone?:  string
  veiculo_placa?:     string
  veiculo_modelo?:    string
  veiculo_ano?:       number
  descricao_servico?: string
  valor_estimado?:    number
  valor_final?:       number
  status?:            string
  prazo_estimado?:    string
}

interface HistoricoOS {
  id:              number
  os_id:           number
  status_anterior: string | null
  status_novo:     string
  criado_em:       string
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function rowToOS(row: any): OS {
  const updatedAt = row.updated_at as string;
  // Normaliza status para minúsculo — banco pode ter dados legados em maiúsculo
  const status = (row.status as string).toLowerCase() as StatusOS;
  const prazoEstimado: string | null = row.prazo_estimado ?? null;

  const updatedDate = new Date(updatedAt);
  const now = new Date();
  const diasNaEtapa = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));

  // ✅ Status minúsculo igual ao schema
  const alertaParada = diasNaEtapa > 3 && status !== 'entregue';

  const hoje = new Date().toISOString().slice(0, 10);
  const prazoVencido =
    prazoEstimado !== null &&
    status !== 'entregue' &&
    new Date(prazoEstimado) < new Date(hoje);

  return {
    id:               row.id as number,
    cliente_nome:     row.cliente_nome as string,
    cliente_telefone: row.cliente_telefone as string,
    veiculo_placa:    row.veiculo_placa as string,
    veiculo_modelo:   row.veiculo_modelo as string,
    veiculo_ano:      row.veiculo_ano as number,
    descricao:        row.descricao_servico as string,
    valor_estimado:   row.valor_estimado as number | null,
    valor_final:      row.valor_final as number | null,
    status,
    prazo_estimado:   prazoEstimado,
    data_entrada:     row.data_entrada as string,
    updated_at:       updatedAt,
    dias_na_etapa:    diasNaEtapa,
    alerta_parada:    alertaParada,
    prazo_vencido:    !!prazoVencido,
  };
}

// ─── QUERIES ─────────────────────────────────────────────────────────────────

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

  const rows = db.prepare(sql).all(...params);
  return rows.map(rowToOS);
}

export function findOSById(id: number): OS | null {
  const row = db.prepare(`SELECT * FROM os WHERE id = ?`).get(id);
  return row ? rowToOS(row) : null;
}

export function createOS(body: CreateOSBody): OS {
  const result = db.prepare(`
    INSERT INTO os (cliente_nome, cliente_telefone, veiculo_placa, veiculo_modelo,
                    veiculo_ano, descricao_servico, valor_estimado, valor_final,
                    prazo_estimado, data_entrada)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
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

  // ✅ Histórico com status minúsculo
  db.prepare(`
    INSERT INTO os_historico (os_id, status_anterior, status_novo)
    VALUES (?, NULL, 'orcamento')
  `).run(id);

  return findOSById(id)!;
}

export function updateOS(id: number, body: UpdateOSBody): OS | null {
  const current = findOSById(id);
  if (!current) return null;

  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined) {
      let val = value
      if (key === 'veiculo_placa') val = String(value).toUpperCase()
      // Normaliza status para minúsculo antes de gravar
      if (key === 'status') val = String(value).toLowerCase()
      fields.push(`${key} = ?`)
      values.push(val)
    }
  });

  if (fields.length === 0) return current;

  fields.push(`updated_at = datetime('now')`);
  values.push(id);

  db.prepare(`UPDATE os SET ${fields.join(', ')} WHERE id = ?`).run(...values);

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
    id:              row.id as number,
    os_id:           row.os_id as number,
    status_anterior: (row.status_anterior ?? null) as string | null,
    status_novo:     row.status_novo as string,
    criado_em:       row.created_at as string,
  }));
}