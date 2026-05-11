// API Client

import type { OS, HistoricoOS, DashboardMetrics, CreateOSBody, UpdateOSBody } from '../types/os'

// Em dev: VITE_API_URL não definido → usa '/api' → proxy do Vite → localhost:3333
// Em prod: VITE_API_URL=https://funilaria-apex-autobody.onrender.com → URL absoluta
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('apex_token')
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  const json = await res.json()
  return (json?.data !== undefined ? json.data : json) as T
}

// Ordens de Serviço

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

  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: { id: number; email: string; nome: string; role: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),

    register: (email: string, nome: string, password: string) =>
      request<{ id: number; email: string; nome: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify({ email, nome, password }) }
      ),
  },
}