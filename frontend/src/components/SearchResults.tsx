import type { OS } from "../types/OS";

// depois dá pra transformar em tabela bonitinha igual ao PRD.

interface Props {
  loading: boolean;
  results: OS[];
}

export default function SearchResults({ loading, results }: Props) {
  if (loading) {
    return <p className="text-gray-500 mt-4">Buscando...</p>;
  }

  if (results.length === 0) {
    return <p className="text-gray-400 mt-4">Nenhuma OS encontrada.</p>;
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {results.map((os) => (
        <div
          key={os.id}
          className="bg-white p-4 rounded shadow border border-gray-200"
        >
          <p className="font-semibold">{os.cliente_nome}</p>
          <p className="text-sm text-gray-600">{os.veiculo_placa}</p>
          <p className="text-sm text-gray-600">{os.status}</p>

          {/* só pra debug, depois dá pra remover */}
          <p className="text-xs text-gray-400">
            atualizado: {os.updated_at}
          </p>
        </div>
      ))}
    </div>
  );
}
