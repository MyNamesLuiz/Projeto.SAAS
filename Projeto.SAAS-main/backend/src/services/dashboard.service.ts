import db from '../database/database';

export class DashboardService {
    static getMetrics() {
        const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        const stats = db.prepare(`
            SELECT
                COUNT(*) FILTER (WHERE status = 'ENTREGUE') as abertas,
                COUNT(*) FILTER (WHERE status = 'ENTREGUE' AND updatedAt >= ?) as concluidas,
                COUNT(*) FILTER (WHERE status = 'ENTREGUE' AND updatedAt < ?) as receitas,
                COUNT(*) FILTER (WHERE status = 'ENTREGUE' AND prazo_estimado < date('now')) as vencidas,
            FROM os
        `).get(inicioMes, inicioMes) as any;

        const porStatus = db.prepare(`
            "SELECT status, COUNT(*) as qtd FROM os GROUP BY status").all();
        return {
        totalOSAbertas: stats.abertas,
        totalOSConcluidasMes: stats.concluidas,
        receitaTotalMes: stats.receitas || 0,
        osComPrazoVencido: stats.vencidas,
        quantidadePorStatus: porStatus
        };
    }
}