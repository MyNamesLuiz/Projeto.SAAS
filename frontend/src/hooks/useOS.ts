// ─── Hooks: Ordens de Serviço ─────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { UpdateOSBody } from '../types/os'

export function useOSList(search?: string) {
  return useQuery({
    queryKey: ['os', search ?? ''],
    queryFn: () => api.os.list(search),
    staleTime: 1000 * 20,
    refetchInterval: 30_000,
  })
}

export function useOS(id: number) {
  return useQuery({
    queryKey: ['os', id],
    queryFn: () => api.os.get(id),
    enabled: id > 0,
  })
}

export function useUpdateOS() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateOSBody }) =>
      api.os.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['os'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteOS() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.os.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['os'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
