import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { OS } from "../types/OS";

export function useSearchOS(query: string) {
  return useQuery({
    queryKey: ["os-search", query],
    queryFn: async () => {
      if (!query || query.trim() === "") return [];
      const res = await api.get<OS[]>("/os", {
        params: { q: query },
      });
      return res.data;
    },
    enabled: query.length > 0,
  });
}
