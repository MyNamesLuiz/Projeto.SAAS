import type { DashboardMetrics } from "../types/Dashboard";

interface Props {
  data?: DashboardMetrics;
  loading: boolean;
}

export default function DashboardCards({ data, loading }: Props) {
  if (loading) {
    return <p className="text-gray-500">Carregando métricas...</p>;
  }

  if (!data) {
    return <p className="text-red-500">Não foi possível carregar o dashboard.</p>;
  }

  const cards = [
    { label: "OS Abertas", value: data.os_abertas },
    { label: "Concluídas no Mês", value: data.os_concluidas_mes },
    { label: "Receita do Mês", value: `R$ ${data.receita_mes}` },
    { label: "Prazo Vencido", value: data.os_prazo_vencido },
    { label: "Paradas +3 dias", value: data.os_paradas },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className="bg-white shadow p-4 rounded border border-gray-200"
        >
          <p className="text-sm text-gray-500">{c.label}</p>
          <p className="text-2xl font-semibold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
