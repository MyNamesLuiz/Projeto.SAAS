// ─── Hook: Dashboard ─────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.metrics(),
    staleTime: 1000 * 30,
    refetchInterval: 30_000,
  })
}
