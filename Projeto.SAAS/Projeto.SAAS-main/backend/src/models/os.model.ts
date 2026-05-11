import { db } from '../database/database.js'
import type { OS, CreateOSBody, UpdateOSBody, HistoricoOS } from '../types/index.js'

interface HistoricoRow {
  id: number
  os_id: number
  status_anterior: string | null
  status_novo: string
  created_at: string
}

function rowToOS(row: Record<string, unknown>): OS {
  const updatedAt     = row.updated_at as string
  const status        = (row.status as string).toLowerCase()
  const prazoEstimado = (row.prazo_estimado as string | null) ?? null

  const diasNaEtapa = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  const alertaParada = diasNaEtapa > 3 && status !== 'entregue'

  const hoje = new Date().toISOString().slice(0, 10)
  const prazoVencido =
    prazoEstimado !== null &&
    status !== 'entregue' &&
    new Date(prazoEstimado) < new Date(hoje)

  return {
    id:                row.id as number,
    cliente_nome:      row.cliente_nome as string,
    cliente_telefone:  row.cliente_telefone as string,
    veiculo_placa:     row.veiculo_placa as string,
    veiculo_modelo:    row.veiculo_modelo as string,
    veiculo_ano:       row.veiculo_ano as number,
    descricao_servico: row.descricao_servico as string,
    valor_estimado:    (row.valor_estimado as number | null) ?? null,
    valor_final:       (row.valor_final as number | null) ?? null,
    status,
    prazo_estimado:    prazoEstimado,
    data_entrada:      row.data_entrada as string,
    updated_at:        updatedAt,
    dias_na_etapa:     diasNaEtapa,
    alerta_parada:     alertaParada,
    prazo_vencido:     !!prazoVencido,
  }
}

export async function findAllOS(search?: string): Promise<OS[]> {
  let sql = `SELECT * FROM os`
  const args: (string | number)[] = []

  if (search && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`
    sql += ` WHERE lower(cliente_nome) LIKE ?
             OR lower(veiculo_placa) LIKE ?
             OR lower(cliente_telefone) LIKE ?`
    args.push(q, q, q)
  }

  sql += ` ORDER BY updated_at DESC`

  const rs = await db.execute({ sql, args })
  return rs.rows.map((r) => rowToOS(r as unknown as Record<string, unknown>))
}

export async function findOSById(id: number): Promise<OS | null> {
  const rs = await db.execute({ sql: `SELECT * FROM os WHERE id = ?`, args: [id] })
  if (rs.rows.length === 0) return null
  return rowToOS(rs.rows[0] as unknown as Record<string, unknown>)
}

export async function createOS(body: CreateOSBody): Promise<OS> {
  const rs = await db.execute({
    sql: `INSERT INTO os
            (cliente_nome, cliente_telefone, veiculo_placa, veiculo_modelo,
             veiculo_ano, descricao_servico, valor_estimado, valor_final,
             prazo_estimado, data_entrada)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [
      body.cliente_nome,
      body.cliente_telefone,
      body.veiculo_placa.toUpperCase(),
      body.veiculo_modelo,
      body.veiculo_ano,
      body.descricao_servico,
      body.valor_estimado ?? null,
      body.valor_final    ?? null,
      body.prazo_estimado ?? null,
    ],
  })

  const id = Number(rs.lastInsertRowid)

  await db.execute({
    sql:  `INSERT INTO os_historico (os_id, status_anterior, status_novo) VALUES (?, NULL, 'orcamento')`,
    args: [id],
  })

  return (await findOSById(id))!
}

export async function updateOS(id: number, body: UpdateOSBody): Promise<OS | null> {
  const current = await findOSById(id)
  if (!current) return null

  const fields: string[] = []
  const values: (string | number | null)[] = []

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue
    let val: string | number | null = value as string | number | null
    if (key === 'veiculo_placa') val = String(value).toUpperCase()
    if (key === 'status')        val = String(value).toLowerCase()
    fields.push(`${key} = ?`)
    values.push(val)
  }

  if (fields.length === 0) return current

  fields.push(`updated_at = datetime('now')`)
  values.push(id)

  await db.execute({ sql: `UPDATE os SET ${fields.join(', ')} WHERE id = ?`, args: values })

  if (body.status && body.status.toLowerCase() !== current.status) {
    await db.execute({
      sql:  `INSERT INTO os_historico (os_id, status_anterior, status_novo) VALUES (?, ?, ?)`,
      args: [id, current.status, body.status.toLowerCase()],
    })
  }

  return findOSById(id)
}

export async function deleteOS(id: number): Promise<boolean> {
  const rs = await db.execute({ sql: `DELETE FROM os WHERE id = ?`, args: [id] })
  return rs.rowsAffected > 0
}

export async function findHistoricoByOS(osId: number): Promise<HistoricoOS[]> {
  const rs = await db.execute({
    sql:  `SELECT * FROM os_historico WHERE os_id = ? ORDER BY created_at ASC`,
    args: [osId],
  })

  return rs.rows.map((row) => {
    const r = row as unknown as HistoricoRow
    return {
      id:              r.id,
      os_id:           r.os_id,
      status_anterior: r.status_anterior ?? null,
      status_novo:     r.status_novo,
      criado_em:       r.created_at,
    }
  })
}