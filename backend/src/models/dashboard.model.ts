import { getDB } from '../db/database.js';
import type { DashboardMetrics } from '../types/index.js';

function stmtToRows(result: ReturnType<typeof getDB>['exec']): Record<string, unknown>[] {
  if (!result.length) return [];
  const [{ columns, values }] = result;
  return values.map((row: { [x: string]: any; }) =>
    Object.fromEntries(columns.map((col: any, i: string | number) => [col, row[i]]))
  );
}

export function getDashboardMetrics(): DashboardMetrics {
  const db = getDB();

  // OSs abertas (tudo que não é Entregue)
  const abertasResult = db.exec(
    `SELECT COUNT(*) as count FROM ordens_servico WHERE status != 'Entregue'`
  );
  const osAbertas = (stmtToRows(abertasResult)[0]?.count as number) ?? 0;

  // OSs concluídas no mês corrente
  const concluidasResult = db.exec(
    `SELECT COUNT(*) as count FROM ordens_servico
     WHERE status = 'Entregue'
       AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')`
  );
  const osConcluidas = (stmtToRows(concluidasResult)[0]?.count as number) ?? 0;

  // Receita do mês (soma do valor_final das OSs entregues no mês)
  const receitaResult = db.exec(
    `SELECT COALESCE(SUM(valor_final), 0) as total FROM ordens_servico
     WHERE status = 'Entregue'
       AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')
       AND valor_final IS NOT NULL`
  );
  const receitaMes = (stmtToRows(receitaResult)[0]?.total as number) ?? 0;

  // OSs com prazo vencido
  const prazoResult = db.exec(
    `SELECT COUNT(*) as count FROM ordens_servico
     WHERE status != 'Entregue'
       AND prazo_estimado IS NOT NULL
       AND prazo_estimado < date('now')`
  );
  const osPrazoVencido = (stmtToRows(prazoResult)[0]?.count as number) ?? 0;

  // OSs paradas há mais de 3 dias (calculado com updated_at)
  const paradasResult = db.exec(
    `SELECT COUNT(*) as count FROM ordens_servico
     WHERE status != 'Entregue'
       AND julianday('now') - julianday(updated_at) > 3`
  );
  const osParadas = (stmtToRows(paradasResult)[0]?.count as number) ?? 0;

  return {
    os_abertas: osAbertas,
    os_concluidas_mes: osConcluidas,
    receita_mes: receitaMes,
    os_prazo_vencido: osPrazoVencido,
    os_paradas: osParadas,
  };
}
