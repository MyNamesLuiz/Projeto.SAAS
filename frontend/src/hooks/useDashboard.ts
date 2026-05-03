import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { DashboardMetrics } from "../types/Dashboard";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<DashboardMetrics>("/dashboard");
      // só pra debug, depois removemos
      console.log("[dashboard] dados recebidos:", res.data);
      return res.data;
    },
    staleTime: 1000 * 60, // 1 min
  });
}
