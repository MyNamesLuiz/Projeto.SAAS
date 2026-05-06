// ─── Hook: Busca de OS via API ────────────────────────────────────────────────
// Originalmente criado pela Thayane (Dashboard & Busca)
// Adaptado para usar o cliente fetch nativo do APEX (api.ts) em vez de axios

import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { OS } from '../types/os'

export function useSearchOS(query: string) {
  return useQuery<OS[]>({
    queryKey: ['os-search', query],
    queryFn: () => api.os.list(query),
    // Só dispara quando houver ao menos 1 caractere
    enabled: query.trim().length > 0,
    // Mantém o resultado anterior enquanto busca o próximo (evita flicker)
    placeholderData: (prev) => prev,
    staleTime: 1000 * 15,
  })
}
