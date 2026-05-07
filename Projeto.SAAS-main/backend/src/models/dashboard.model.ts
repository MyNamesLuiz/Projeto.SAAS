import db from '../database/database.js';

export function getDashboardMetrics() {

  // Usa lower() em todas as comparações para tolerar status em maiúsculo/minúsculo
  const osAbertas = (db.prepare(
    `SELECT COUNT(*) as count FROM os WHERE lower(status) != 'entregue'`
  ).get() as any)?.count ?? 0;

  const osConcluidas = (db.prepare(
    `SELECT COUNT(*) as count FROM os
     WHERE lower(status) = 'entregue'
       AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')`
  ).get() as any)?.count ?? 0;

  // Receita = soma de valor_final apenas de OSs entregues no mês corrente.
  // Status "entregue" garante que o serviço foi concluído e a receita é real.
  const receitaMes = (db.prepare(
    `SELECT COALESCE(SUM(valor_final), 0) as total FROM os
     WHERE lower(status) = 'entregue'
       AND valor_final IS NOT NULL
       AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')`
  ).get() as any)?.total ?? 0;

  const osPrazoVencido = (db.prepare(
    `SELECT COUNT(*) as count FROM os
     WHERE lower(status) != 'entregue'
       AND prazo_estimado IS NOT NULL
       AND prazo_estimado < date('now')`
  ).get() as any)?.count ?? 0;

  const osParadas = (db.prepare(
    `SELECT COUNT(*) as count FROM os
     WHERE lower(status) != 'entregue'
       AND julianday('now') - julianday(updated_at) > 3`
  ).get() as any)?.count ?? 0;

  return {
    os_abertas:        osAbertas        as number,
    os_concluidas_mes: osConcluidas     as number,
    receita_mes:       receitaMes       as number,
    os_prazo_vencido:  osPrazoVencido   as number,
    os_paradas:        osParadas        as number,
  };
}