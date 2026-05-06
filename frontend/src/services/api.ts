// API Client 

import type { OS, HistoricoOS, DashboardMetrics, CreateOSBody, UpdateOSBody } from '../types/os'

const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

//Ordens de Serviço

export const api = {
  os: {
    list: (search?: string): Promise<OS[]> => {
      const qs = search ? `?q=${encodeURIComponent(search)}` : ''
      return request(`/os${qs}`)
    },

    get: (id: number): Promise<OS> =>
      request(`/os/${id}`),

    create: (body: CreateOSBody): Promise<OS> =>
      request('/os', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: number, body: UpdateOSBody): Promise<OS> =>
      request(`/os/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    updateStatus: (id: number, status: string): Promise<OS> =>
      request(`/os/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    delete: (id: number): Promise<void> =>
      request(`/os/${id}`, { method: 'DELETE' }),

    historico: (id: number): Promise<HistoricoOS[]> =>
      request(`/os/${id}/historico`),
  },

  dashboard: {
    metrics: (): Promise<DashboardMetrics> =>
      request('/dashboard'),
  },
}