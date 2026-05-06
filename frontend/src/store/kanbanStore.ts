// ─── Kanban Store (Zustand) ───────────────────────────────────────────────────
// Estado global de UI do Kanban — posição dos cards por coluna.
// Não persiste no servidor; use api.os.updateStatus() para persistir.

import { create } from 'zustand'
import type { OSStatus } from '../types/os'

interface KanbanState {
  // Mapa de osId → coluna atual (optimistic update)
  positions: Record<number, OSStatus>
  moveOS: (osId: number, toStatus: OSStatus) => void
  resetPosition: (osId: number, originalStatus: OSStatus) => void
}

export const useKanbanStore = create<KanbanState>((set) => ({
  positions: {},

  moveOS: (osId, toStatus) =>
    set((state) => ({
      positions: { ...state.positions, [osId]: toStatus },
    })),

  resetPosition: (osId, originalStatus) =>
    set((state) => ({
      positions: { ...state.positions, [osId]: originalStatus },
    })),
}))
