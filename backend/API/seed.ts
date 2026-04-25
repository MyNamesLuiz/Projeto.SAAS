/**
 * Seed — popula o banco com OSs de exemplo para desenvolvimento.
 * Execute com: npx tsx src/db/seed.ts
 */
import { initDB, getDB, persistDB } from './database.js';

const OSS_SEED = [
  {
    cliente_nome: 'Carlos Mendes',
    cliente_telefone: '31991234567',
    veiculo_placa: 'ABC1D23',
    veiculo_modelo: 'Fiat Strada',
    veiculo_ano: 2021,
    descricao_servico: 'Reparo de amassado lateral dianteira esquerda + pintura',
    valor_estimado: 1800.0,
    valor_final: null,
    status: 'Em Funilaria',
    prazo_estimado: '2026-04-28',
    updated_at_offset_days: -5, // parado há 5 dias → alerta
  },
  {
    cliente_nome: 'Ana Paula Ribeiro',
    cliente_telefone: '31998765432',
    veiculo_placa: 'MNO4P56',
    veiculo_modelo: 'Honda HR-V',
    veiculo_ano: 2023,
    descricao_servico: 'Polimento completo + cristalização',
    valor_estimado: 650.0,
    valor_final: 650.0,
    status: 'Pronto para Entrega',
    prazo_estimado: '2026-04-26',
    updated_at_offset_days: -1,
  },
  {
    cliente_nome: 'Roberto Souza',
    cliente_telefone: '31912340987',
    veiculo_placa: 'QRS7T89',
    veiculo_modelo: 'VW Gol',
    veiculo_ano: 2019,
    descricao_servico: 'Substituição de para-choque traseiro + pintura',
    valor_estimado: 1200.0,
    valor_final: null,
    status: 'Aguardando Aprovacao',
    prazo_estimado: null,
    updated_at_offset_days: -4, // parado há 4 dias → alerta
  },
  {
    cliente_nome: 'Fernanda Lima',
    cliente_telefone: '31955557777',
    veiculo_placa: 'UVW0X12',
    veiculo_modelo: 'Toyota Corolla',
    veiculo_ano: 2022,
    descricao_servico: 'Martelinho de ouro + pintura capô',
    valor_estimado: 900.0,
    valor_final: 850.0,
    status: 'Entregue',
    prazo_estimado: '2026-04-20',
    updated_at_offset_days: -3,
  },
  {
    cliente_nome: 'Paulo Henrique Costa',
    cliente_telefone: '31944448888',
    veiculo_placa: 'YZA3B45',
    veiculo_modelo: 'Chevrolet Onix',
    veiculo_ano: 2020,
    descricao_servico: 'Funilaria lateral completa + repintura total',
    valor_estimado: 4500.0,
    valor_final: null,
    status: 'Em Pintura',
    prazo_estimado: '2026-04-30',
    updated_at_offset_days: -2,
  },
  {
    cliente_nome: 'Marcela Torres',
    cliente_telefone: '31933339999',
    veiculo_placa: 'CDE6F78',
    veiculo_modelo: 'Hyundai HB20',
    veiculo_ano: 2022,
    descricao_servico: 'Troca de retrovisor + pintura localizada',
    valor_estimado: 480.0,
    valor_final: null,
    status: 'Orcamento',
    prazo_estimado: null,
    updated_at_offset_days: 0,
  },
  {
    cliente_nome: 'Joao Batista Ferreira',
    cliente_telefone: '31922221111',
    veiculo_placa: 'GHI9J01',
    veiculo_modelo: 'Ford Ka',
    veiculo_ano: 2018,
    descricao_servico: 'Acabamento pós-funilaria + polimento',
    valor_estimado: 750.0,
    valor_final: null,
    status: 'Acabamento',
    prazo_estimado: '2026-04-27',
    updated_at_offset_days: -1,
  },
  {
    cliente_nome: 'Luciana Martins',
    cliente_telefone: '31911112222',
    veiculo_placa: 'KLM2N34',
    veiculo_modelo: 'Renault Kwid',
    veiculo_ano: 2023,
    descricao_servico: 'Reparo de arranhão porta dianteira direita',
    valor_estimado: 320.0,
    valor_final: 320.0,
    status: 'Entregue',
    prazo_estimado: '2026-04-22',
    updated_at_offset_days: -2,
  },
];

async function seed() {
  await initDB();
  const db = getDB();

  console.log('🌱 Limpando dados existentes...');
  db.run('DELETE FROM os_historico');
  db.run('DELETE FROM ordens_servico');
  db.run("DELETE FROM sqlite_sequence WHERE name IN ('ordens_servico', 'os_historico')");

  console.log('🌱 Inserindo OSs de exemplo...');

  for (const os of OSS_SEED) {
    const offsetDays = os.updated_at_offset_days;
    const updatedAt = `datetime('now', '${offsetDays} days')`;
    const dataEntrada = `datetime('now', '${offsetDays - 2} days')`;

    db.run(
      `INSERT INTO ordens_servico
        (cliente_nome, cliente_telefone, veiculo_placa, veiculo_modelo,
         veiculo_ano, descricao_servico, valor_estimado, valor_final,
         status, prazo_estimado, data_entrada, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${dataEntrada}, ${updatedAt})`,
      [
        os.cliente_nome,
        os.cliente_telefone,
        os.veiculo_placa,
        os.veiculo_modelo,
        os.veiculo_ano,
        os.descricao_servico,
        os.valor_estimado ?? null,
        os.valor_final ?? null,
        os.status,
        os.prazo_estimado ?? null,
      ]
    );

    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const id = idResult[0].values[0][0] as number;

    // Registra entrada inicial no histórico
    db.run(
      `INSERT INTO os_historico (os_id, status_anterior, status_novo, criado_em)
       VALUES (?, NULL, 'Orcamento', ${dataEntrada})`,
      [id]
    );

    // Se não está em Orçamento, registra transição de exemplo
    if (os.status !== 'Orcamento') {
      db.run(
        `INSERT INTO os_historico (os_id, status_anterior, status_novo, criado_em)
         VALUES (?, 'Orcamento', ?, ${updatedAt})`,
        [id, os.status]
      );
    }

    console.log(`  ✅ OS ${id} — ${os.veiculo_placa} (${os.cliente_nome}) → ${os.status}`);
  }

  persistDB();
  console.log('\n✅ Seed concluído! Banco populado com', OSS_SEED.length, 'OSs.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
