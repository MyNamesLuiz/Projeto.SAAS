//Dashboard 

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import { useSearchOS } from '../hooks/useSearchOS'
import { KANBAN_COLUMNS, STATUS_MAP } from '../types/os'
import type { OS } from '../types/os'

function statusColor(backendStatus: string): string {
  const col = KANBAN_COLUMNS.find((c) => c.id === STATUS_MAP[backendStatus])
  if (!col) return '#525875'
  return col.color.replace(/rgba?\((\d+),(\d+),(\d+).*/, 'rgb($1,$2,$3)')
}
function statusLabel(backendStatus: string): string {
  return KANBAN_COLUMNS.find((c) => c.id === STATUS_MAP[backendStatus])?.label ?? backendStatus
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  //Busca rápida com debounce (Thayane) 
  const debouncedSearch = useDebounce(search, 400)
  const isTyping = search !== debouncedSearch
  const { data: searchResult = [], isFetching: fetchingSearch } = useSearchOS(debouncedSearch)
  const hasQuery = debouncedSearch.trim().length > 0

  // Métricas e lista (APEX) — refetch a cada 30s 
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.metrics(),
    refetchInterval: 30_000,
  })
  const { data: osList = [], isLoading: loadingOS } = useQuery({
    queryKey: ['os'],
    queryFn: () => api.os.list(),
    refetchInterval: 30_000,
    enabled: !hasQuery,
  })

  const recentes: OS[] = [...osList]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  const paradas: OS[] = osList
    .filter((o) => o.alerta_parada)
    .sort((a, b) => b.dias_na_etapa - a.dias_na_etapa)
    .slice(0, 5)

  const receita = metrics?.receita_mes ?? 0
  const receitaFmt = receita >= 1000
    ? `R$ ${(receita / 1000).toFixed(1)}k`
    : `R$ ${receita.toLocaleString('pt-BR')}`

  return (
    <div className="flex flex-col gap-5">

      {/* Barra de busca rápida (Thayane)  */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="font-mono text-[9px] tracking-widest text-[#2a2f42] uppercase">
            Busca rápida
          </h2>
          <div className="flex-1 h-px bg-[#1a1e2e]" />
        </div>

        <div
          className="flex items-center gap-2 h-9 px-3 rounded-[3px] bg-[#0a0c12] border transition-colors"
          style={{ borderColor: search ? '#00e5d4' : '#1a1e2e' }}
        >
          <span className="text-[11px]" style={{ color: '#2a2f42' }} aria-hidden>
            {isTyping || (hasQuery && fetchingSearch) ? '⟳' : '⌕'}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa, nome ou telefone..."
            aria-label="Busca rápida de ordens de serviço"
            className="flex-1 bg-transparent border-none outline-none font-mono text-[11px] text-[#8890a8] placeholder-[#525875]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="font-mono text-[10px] text-[#525875] hover:text-[#8890a8] bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Resultado da busca em tempo real */}
        {hasQuery && (
          <div className="bg-[#0a0c12] border border-[#1a1e2e] rounded-[4px] overflow-hidden">
            {fetchingSearch || isTyping ? (
              <div className="flex flex-col gap-px p-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-[#13151c] animate-pulse rounded-[2px]" />
                ))}
              </div>
            ) : searchResult.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <span className="font-mono text-[10px] text-[#525875] tracking-widest">
                  Nenhuma OS encontrada para "{debouncedSearch}"
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1e2e] bg-[#13151c]">
                  <span className="font-mono text-[8px] tracking-widest text-[#2a2f42] uppercase">
                    {searchResult.length} resultado{searchResult.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => { navigate('/os') }}
                    className="font-mono text-[9px] text-[#00e5d4] bg-transparent border-none cursor-pointer hover:opacity-70"
                  >
                    ver todos →
                  </button>
                </div>
                {searchResult.slice(0, 6).map((os) => {
                  const color = statusColor(os.status)
                  const valor = os.valor_final ?? os.valor_estimado
                  return (
                    <div
                      key={os.id}
                      className="flex items-center gap-3 px-4 py-2.5 border-b border-[#13151c] last:border-none hover:bg-[#0d0f17] transition-colors"
                    >
                      <span className="font-mono text-[9px] text-[#525875] w-14 flex-shrink-0">
                        OS-{String(os.id).padStart(3, '0')}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#e8ecf5] w-20 flex-shrink-0">
                        {os.veiculo_placa}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[11px] text-[#8890a8] truncate">{os.cliente_nome}</p>
                        <p className="font-mono text-[9px] text-[#525875] truncate">{os.veiculo_modelo} {os.veiculo_ano}</p>
                      </div>

                      {/* Indicadores visuais de atraso (Fase 2 Thayane) */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {os.prazo_vencido && (
                          <span
                            className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded-[2px]"
                            style={{ color: '#ff3d5a', background: 'rgba(255,61,90,0.1)', border: '1px solid rgba(255,61,90,0.3)' }}
                          >
                            vencido
                          </span>
                        )}
                        {os.alerta_parada && (
                          <span
                            className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded-[2px]"
                            style={{ color: '#ff3d5a', background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.2)' }}
                          >
                            +{os.dias_na_etapa}d
                          </span>
                        )}
                      </div>

                      <span
                        className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-[2px] whitespace-nowrap flex-shrink-0"
                        style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
                      >
                        {statusLabel(os.status)}
                      </span>
                      <span className="font-mono text-[10px] font-bold flex-shrink-0" style={{ color: valor ? '#00e5a0' : '#525875' }}>
                        {valor ? `R$ ${valor.toLocaleString('pt-BR')}` : '—'}
                      </span>
                    </div>
                  )
                })}
                {searchResult.length > 6 && (
                  <div className="px-4 py-2 bg-[#13151c] border-t border-[#1a1e2e]">
                    <button
                      onClick={() => navigate('/os')}
                      className="font-mono text-[9px] text-[#525875] hover:text-[#8890a8] bg-transparent border-none cursor-pointer"
                    >
                      + {searchResult.length - 6} mais → ver em Ordens de Serviço
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Métricas*/}
      {!hasQuery && (
        <>
          <div className="flex items-center gap-3">
            <h2 className="font-mono text-[9px] tracking-widest text-[#2a2f42] uppercase">
              Visão geral do mês
            </h2>
            <div className="flex-1 h-px bg-[#1a1e2e]" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="OSs abertas"  accent="#00e5d4"
              value={loadingMetrics ? '—' : String(metrics?.os_abertas ?? 0)}
              sub="em andamento" />
            <MetricCard label="Receita" accent="#00e5d4" subColor="#00e5a0" valueSm
              value={loadingMetrics ? '—' : receitaFmt}
              sub="este mês" />
            <MetricCard label="Concluídas" accent="#00e5a0" subColor="#00e5a0"
              value={loadingMetrics ? '—' : String(metrics?.os_concluidas_mes ?? 0)}
              sub="este mês" />
            {/* Indicadores Fase 2 (Thayane) */}
            <MetricCard label="Prazo vencido" accent="#ff3d5a" subColor="#ff3d5a"
              value={loadingMetrics ? '—' : String(metrics?.os_prazo_vencido ?? 0)}
              sub="OS atrasadas" />
            <MetricCard label="Paradas" accent="#ff3d5a" subColor="#ff3d5a"
              value={loadingMetrics ? '—' : String(metrics?.os_paradas ?? 0)}
              sub="+3 dias sem mover" />
          </div>

          {/* OSs recentes + paradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="bg-[#0a0c12] border border-[#1a1e2e] rounded-[4px] p-4">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#1a1e2e]">
                <h3 className="font-mono text-[9px] tracking-widest text-[#2a2f42] uppercase">OSs recentes</h3>
                <button onClick={() => navigate('/os')}
                  className="font-mono text-[9px] text-[#00e5d4] cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-none">
                  ver todas →
                </button>
              </div>
              {loadingOS ? <Skeleton rows={4} /> : recentes.length === 0 ? (
                <Empty msg="Nenhuma OS cadastrada" />
              ) : recentes.map((os) => {
                const color = statusColor(os.status)
                return (
                  <div key={os.id} className="flex items-center gap-3 py-2 border-b border-[#13151c] last:border-none">
                    <span className="font-mono text-[10px] font-bold text-[#e8ecf5] min-w-[80px]">{os.veiculo_placa}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[11px] text-[#8890a8] truncate">{os.cliente_nome}</p>
                      <p className="font-mono text-[9px] text-[#525875] truncate">{os.veiculo_modelo} {os.veiculo_ano}</p>
                    </div>
                    {/* Indicador de atraso inline (Fase 2 Thayane) */}
                    {(os.alerta_parada || os.prazo_vencido) && (
                      <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-[2px] flex-shrink-0"
                        style={{ color: '#ff3d5a', background: 'rgba(255,61,90,0.1)', border: '1px solid rgba(255,61,90,0.25)' }}>
                        {os.prazo_vencido ? 'vencido' : `+${os.dias_na_etapa}d`}
                      </span>
                    )}
                    <span
                      className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-[2px] whitespace-nowrap"
                      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
                    >
                      {statusLabel(os.status)}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="bg-[#0a0c12] border border-[#1a1e2e] rounded-[4px] p-4">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#1a1e2e]">
                <h3 className="font-mono text-[9px] tracking-widest text-[#ff3d5a] uppercase">
                  ⚠ OSs paradas {metrics?.os_paradas ? `(${metrics.os_paradas})` : ''}
                </h3>
                <button onClick={() => navigate('/kanban')}
                  className="font-mono text-[9px] text-[#00e5d4] cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-none">
                  ver kanban →
                </button>
              </div>
              {loadingOS ? <Skeleton rows={4} /> : paradas.length === 0 ? (
                <Empty msg="Nenhuma OS parada" ok />
              ) : paradas.map((os) => (
                <div key={os.id}
                  className="flex items-center gap-3 px-3 py-2 mb-2 last:mb-0 rounded-[3px]"
                  style={{ background: 'rgba(255,61,90,0.05)', border: '1px solid rgba(255,61,90,0.15)', borderLeft: '2px solid #ff3d5a' }}
                >
                  <span className="font-mono text-[10px] font-bold text-[#e8ecf5] min-w-[80px]">{os.veiculo_placa}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[11px] text-[#8890a8] truncate">{os.cliente_nome}</p>
                    <p className="font-mono text-[9px] text-[#525875] truncate">{statusLabel(os.status)}</p>
                  </div>
                  <span className="font-mono text-[10px] text-[#ff3d5a] font-bold flex-shrink-0">+{os.dias_na_etapa}d</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

//Componentes internos 

function MetricCard({ label, value, sub, accent, subColor, valueSm }: {
  label: string; value: string; sub: string; accent: string; subColor?: string; valueSm?: boolean
}) {
  return (
    <div className="bg-[#0a0c12] border border-[#1a1e2e] rounded-[4px] p-4"
      style={{ borderTop: `2px solid ${accent}` }}>
      <p className="font-mono text-[8px] tracking-widest text-[#2a2f42] uppercase mb-2">{label}</p>
      <p className="font-mono font-bold text-[#e8ecf5] leading-none"
        style={{ fontSize: valueSm ? 20 : 28, paddingTop: valueSm ? 4 : 0 }}>
        {value}
      </p>
      <p className="font-mono text-[9px] mt-1.5" style={{ color: subColor ?? '#525875' }}>{sub}</p>
    </div>
  )
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Carregando ordens de serviço">
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-9 rounded-[3px] bg-[#13151c] animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function Empty({ msg, ok }: { msg: string; ok?: boolean }) {
  return (
    <div role="status" className="flex items-center justify-center py-8">
      <span className="font-mono text-[10px] tracking-widest" style={{ color: ok ? '#00e5a0' : '#525875' }}>
        {ok ? '✓ ' : ''}{msg}
      </span>
    </div>
  )
}