import { db } from '../database/database.js'
import { findOSById } from '../models/os.model.js'
import type { UpdateOSBody } from '../types/index.js'

export class OSService {
  // Verifica se uma OS está parada há mais de 3 dias sem movimentação
  static checkIsStalled(updatedAt: string): boolean {
    const lastUpdate   = new Date(updatedAt).getTime()
    const tresDiasEmMs = 3 * 24 * 60 * 60 * 1000
    return (Date.now() - lastUpdate) > tresDiasEmMs
  }

  // Atualiza OS e grava histórico de status via db.batch() (transação atômica)
  static async updateWithHistory(id: number, body: Partial<UpdateOSBody>) {
    const current = await findOSById(id)
    if (!current) return null

    const statements: { sql: string; args: (string | number | null)[] }[] = []

    for (const [key, value] of Object.entries(body)) {
      const currentValue = current[key as keyof typeof current]
      if (currentValue === value) continue

      if (key === 'status') {
        statements.push({
          sql:  `INSERT INTO os_historico (os_id, status_anterior, status_novo) VALUES (?, ?, ?)`,
          args: [id, String(currentValue ?? ''), String(value).toLowerCase()],
        })
      }

      statements.push({
        sql:  `UPDATE os SET ${key} = ?, updated_at = datetime('now') WHERE id = ?`,
        args: [value as string | number | null, id],
      })
    }

    if (statements.length === 0) return current

    await db.batch(statements, 'write')
    return findOSById(id)
  }
}