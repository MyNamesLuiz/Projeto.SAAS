import { useState } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { useDebounce } from "../hooks/useDebounce";
import { useSearchOS } from "../hooks/useSearchOS";
import DashboardCards from "../components/DashboardCards";
import SearchBar from "../components/SearchBar";
import SearchResults from "../components/SearchResults";

// tentei deixar essa página simples, mas ainda assim organizada.

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 400);

  const dashboard = useDashboard();
  const search = useSearchOS(debounced);

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* cards do topo */}
      <DashboardCards data={dashboard.data} loading={dashboard.isLoading} />

      {/* barra de busca */}
      <SearchBar value={query} onChange={setQuery} />

      {/* resultados da busca */}
      {debounced.length > 0 && (
        <SearchResults
          loading={search.isLoading}
          results={search.data ?? []}
        />
      )}
    </div>
  );
}
