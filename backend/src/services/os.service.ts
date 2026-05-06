import { db } from '../database/database';
import { findOSById } from '../models/os.model.js';
import { v4 as uuidv4 } from 'uuid';

export class OSService {
    // REGRA 5.1: Busca OS com cálculo de "Parada" (se mais de 3 dias sem atualização, marca como parada)
    static chackIsStalled(updatedAt: string): boolean {
        const olastupdate = new Date(updatedAt).getTime();
        const tresDiasEmMs = 3 * 24 * 60 * 60 * 1000;
        return (Date.now() - olastupdate) > tresDiasEmMs;
    }

    // REGRA 5.2: Atualização com Histórico Atômico
    static updateWithHistory(id: number, body: any) {
        const current = findOSById(id);
        if (!current) return null;

        const trasaction = db.transaction((updates) => {
            for (const [key, value] of Object.entries(updates)) {
                if (current[key as keyof typeof current] !== value) {
                    // Grava histórico de mudança
                    db.prepare(`
                        INSERT INTO os_historico (id, os_id, status_anterior, status_novo, data_alteracao)
                        VALUES (?, ?, ?, ?, ?)
                    `).run(id, key, String(current[key as keyof typeof current]), String(value));

                    // Atualiza o campo de status se for o campo de status
                    db.prepare(`UPDATE os SET ${key} = ?, updatedAt =  datetime('now') WHERE id = ?`)
                        .run(value, id);
                }
            }
        });
        transaction(data);
        return this.getById(id);
    }
}