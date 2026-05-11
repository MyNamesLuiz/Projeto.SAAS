import { db } from '../database/database.js'
import type { DashboardMetrics } from '../types/index.js'

interface CountRow { count: number }
interface SumRow   { total: number }

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [abertas, concluidas, receita, vencido, paradas] = await Promise.all([
    db.execute(`SELECT COUNT(*) as count FROM os WHERE lower(status) != 'entregue'`),
    db.execute(`SELECT COUNT(*) as count FROM os
                WHERE lower(status) = 'entregue'
                  AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')`),
    db.execute(`SELECT COALESCE(SUM(valor_final), 0) as total FROM os
                WHERE lower(status) = 'entregue'
                  AND valor_final IS NOT NULL
                  AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')`),
    db.execute(`SELECT COUNT(*) as count FROM os
                WHERE lower(status) != 'entregue'
                  AND prazo_estimado IS NOT NULL
                  AND prazo_estimado < date('now')`),
    db.execute(`SELECT COUNT(*) as count FROM os
                WHERE lower(status) != 'entregue'
                  AND julianday('now') - julianday(updated_at) > 3`),
  ])

  return {
    os_abertas:        Number((abertas.rows[0]    as unknown as CountRow)?.count ?? 0),
    os_concluidas_mes: Number((concluidas.rows[0] as unknown as CountRow)?.count ?? 0),
    receita_mes:       Number((receita.rows[0]    as unknown as SumRow)?.total   ?? 0),
    os_prazo_vencido:  Number((vencido.rows[0]    as unknown as CountRow)?.count ?? 0),
    os_paradas:        Number((paradas.rows[0]    as unknown as CountRow)?.count ?? 0),
  }
}