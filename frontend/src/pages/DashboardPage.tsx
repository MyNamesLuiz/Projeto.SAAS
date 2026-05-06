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
  if (!col) return 'var(--apex-muted)'
  return col.color.replace(/rgba?\((\d+),(\d+),(\d+).*/, 'rgb($1,$2,$3)')
}
function statusLabel(backendStatus: string): string {
  return KANBAN_COLUMNS.find((c) => c.id === STATUS_MAP[backendStatus])?.label ?? backendStatus
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--f-mono)',
  fontSize: 9,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: 'var(--apex-muted)',
}

const divider: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: 'var(--apex-border)',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const debouncedSearch = useDebounce(search, 400)
  const isTyping = search !== debouncedSearch
  const { data: searchResult = [], isFetching: fetchingSearch } = useSearchOS(debouncedSearch)
  const hasQuery = debouncedSearch.trim().length > 0

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

      {/* ── Busca rápida ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span style={sectionLabel}>Busca rápida</span>
          <div style={divider} />
        </div>

        <div
          className="flex items-center gap-2 h-9 px-3 transition-colors"
          style={{
            background: 'var(--apex-card)',
            border: `1px solid ${search ? 'var(--apex-gold-border)' : 'var(--apex-border)'}`,
            borderRadius: 6,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--apex-muted)' }} aria-hidden>
            {isTyping || (hasQuery && fetchingSearch) ? '⟳' : '⌕'}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa, nome ou telefone..."
            aria-label="Busca rápida de ordens de serviço"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--f-mono)',
              fontSize: 11,
              color: 'var(--apex-text)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--f-mono)', fontSize: 10,
                color: 'var(--apex-muted)',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Resultado da busca */}
        {hasQuery && (
          <div style={{
            background: 'var(--apex-card)',
            border: '1px solid var(--apex-border)',
            borderRadius: 6,
            overflow: 'hidden',
          }}>
            {fetchingSearch || isTyping ? (
              <div className="flex flex-col gap-px p-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-[4px]"
                    style={{ background: 'var(--apex-surface)' }} />
                ))}
              </div>
            ) : searchResult.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <span style={{ ...sectionLabel }}>
                  Nenhuma OS encontrada para "{debouncedSearch}"
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-2"
                  style={{ borderBottom: '1px solid var(--apex-border)', background: 'var(--apex-surface)' }}>
                  <span style={sectionLabel}>
                    {searchResult.length} resultado{searchResult.length !== 1 ? 's' : ''}
                  </span>
                  <button onClick={() => navigate('/os')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--f-mono)', fontSize: 9,
                      color: 'var(--apex-gold-bright)',
                    }}>
                    ver todos →
                  </button>
                </div>

                {searchResult.slice(0, 6).map((os) => {
                  const color = statusColor(os.status)
                  const valor = os.valor_final ?? os.valor_estimado
                  return (
                    <div key={os.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{ borderBottom: '1px solid var(--apex-border)', cursor: 'default' }}
                    >
                      <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--apex-muted)', width: 56, flexShrink: 0 }}>
                        OS-{String(os.id).padStart(3, '0')}
                      </span>
                      <span style={{ fontFamily: 'var(--f-display)', fontSize: 13, fontWeight: 700, color: 'var(--apex-text)', width: 80, flexShrink: 0 }}>
                        {os.veiculo_placa}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--apex-text)', margin: 0 }} className="truncate">{os.cliente_nome}</p>
                        <p style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--apex-muted)', margin: 0 }} className="truncate">{os.veiculo_modelo} {os.veiculo_ano}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {os.prazo_vencido && (
                          <span style={{
                            fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.06em',
                            padding: '2px 6px', borderRadius: 3,
                            color: 'var(--apex-danger)',
                            background: 'var(--apex-danger-bg)',
                            border: '1px solid var(--apex-danger-b)',
                          }}>vencido</span>
                        )}
                        {os.alerta_parada && (
                          <span style={{
                            fontFamily: 'var(--f-mono)', fontSize: 8,
                            padding: '2px 6px', borderRadius: 3,
                            color: 'var(--apex-danger)',
                            background: 'var(--apex-danger-bg)',
                            border: '1px solid var(--apex-danger-b)',
                          }}>+{os.dias_na_etapa}d</span>
                        )}
                      </div>
                      <span style={{
                        fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.06em',
                        textTransform: 'uppercase', padding: '2px 8px', borderRadius: 3,
                        color, background: `${color}18`, border: `1px solid ${color}30`,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {statusLabel(os.status)}
                      </span>
                      <span style={{
                        fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 700, flexShrink: 0,
                        color: valor ? 'var(--apex-gold-bright)' : 'var(--apex-muted)',
                      }}>
                        {valor ? `R$ ${valor.toLocaleString('pt-BR')}` : '—'}
                      </span>
                    </div>
                  )
                })}

                {searchResult.length > 6 && (
                  <div className="px-4 py-2" style={{ background: 'var(--apex-surface)', borderTop: '1px solid var(--apex-border)' }}>
                    <button onClick={() => navigate('/os')}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--f-mono)', fontSize: 9,
                        color: 'var(--apex-muted)',
                      }}>
                      + {searchResult.length - 6} mais → ver em Ordens de Serviço
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Métricas ── */}
      {!hasQuery && (
        <>
          <div className="flex items-center gap-3">
            <span style={sectionLabel}>Visão geral do mês</span>
            <div style={divider} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="OSs abertas"   value={loadingMetrics ? '—' : String(metrics?.os_abertas ?? 0)}       sub="em andamento"       accent="var(--apex-gold)" />
            <MetricCard label="Receita"        value={loadingMetrics ? '—' : receitaFmt}                             sub="este mês"           accent="var(--apex-gold)" highlight valueSm />
            <MetricCard label="Concluídas"     value={loadingMetrics ? '—' : String(metrics?.os_concluidas_mes ?? 0)} sub="este mês"          accent="var(--apex-green)" subColor="var(--apex-green)" />
            <MetricCard label="Prazo vencido"  value={loadingMetrics ? '—' : String(metrics?.os_prazo_vencido ?? 0)} sub="OS atrasadas"       accent="var(--apex-danger)" subColor="var(--apex-danger)" />
            <MetricCard label="Paradas"        value={loadingMetrics ? '—' : String(metrics?.os_paradas ?? 0)}       sub="+3 dias sem mover"  accent="var(--apex-danger)" subColor="var(--apex-danger)" />
          </div>

          {/* OSs recentes + paradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Recentes */}
            <div style={{
              background: 'var(--apex-card)',
              border: '1px solid var(--apex-border)',
              borderRadius: 8, padding: 16,
            }}>
              <div className="flex justify-between items-center mb-3 pb-3"
                style={{ borderBottom: '1px solid var(--apex-border)' }}>
                <span style={sectionLabel}>OSs recentes</span>
                <button onClick={() => navigate('/os')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--f-mono)', fontSize: 9,
                    color: 'var(--apex-gold-bright)',
                  }}>
                  ver todas →
                </button>
              </div>
              {loadingOS ? <Skeleton rows={4} /> : recentes.length === 0 ? (
                <Empty msg="Nenhuma OS cadastrada" />
              ) : recentes.map((os) => {
                const color = statusColor(os.status)
                return (
                  <div key={os.id} className="flex items-center gap-3 py-2"
                    style={{ borderBottom: '1px solid var(--apex-border)' }}>
                    <span style={{ fontFamily: 'var(--f-display)', fontSize: 13, fontWeight: 700, color: 'var(--apex-text)', minWidth: 80 }}>
                      {os.veiculo_placa}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--apex-text)', margin: 0 }} className="truncate">{os.cliente_nome}</p>
                      <p style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--apex-muted)', margin: 0 }} className="truncate">{os.veiculo_modelo} {os.veiculo_ano}</p>
                    </div>
                    {(os.alerta_parada || os.prazo_vencido) && (
                      <span style={{
                        fontFamily: 'var(--f-mono)', fontSize: 8,
                        padding: '2px 6px', borderRadius: 3, flexShrink: 0,
                        color: 'var(--apex-danger)',
                        background: 'var(--apex-danger-bg)',
                        border: '1px solid var(--apex-danger-b)',
                      }}>
                        {os.prazo_vencido ? 'vencido' : `+${os.dias_na_etapa}d`}
                      </span>
                    )}
                    <span style={{
                      fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.06em',
                      textTransform: 'uppercase', padding: '2px 8px', borderRadius: 3,
                      color, background: `${color}18`, border: `1px solid ${color}30`,
                      whiteSpace: 'nowrap',
                    }}>
                      {statusLabel(os.status)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Paradas */}
            <div style={{
              background: 'var(--apex-card)',
              border: '1px solid var(--apex-border)',
              borderRadius: 8, padding: 16,
            }}>
              <div className="flex justify-between items-center mb-3 pb-3"
                style={{ borderBottom: '1px solid var(--apex-border)' }}>
                <span style={{ ...sectionLabel, color: 'var(--apex-danger)' }}>
                  ⚠ OSs paradas {metrics?.os_paradas ? `(${metrics.os_paradas})` : ''}
                </span>
                <button onClick={() => navigate('/kanban')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--f-mono)', fontSize: 9,
                    color: 'var(--apex-gold-bright)',
                  }}>
                  ver kanban →
                </button>
              </div>
              {loadingOS ? <Skeleton rows={4} /> : paradas.length === 0 ? (
                <Empty msg="Nenhuma OS parada" ok />
              ) : paradas.map((os) => (
                <div key={os.id}
                  className="flex items-center gap-3 px-3 py-2 mb-2 last:mb-0"
                  style={{
                    background: 'var(--apex-danger-bg)',
                    border: '1px solid var(--apex-danger-b)',
                    borderLeft: '2px solid var(--apex-danger)',
                    borderRadius: 4,
                  }}
                >
                  <span style={{ fontFamily: 'var(--f-display)', fontSize: 13, fontWeight: 700, color: 'var(--apex-text)', minWidth: 80 }}>
                    {os.veiculo_placa}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--apex-text)', margin: 0 }} className="truncate">{os.cliente_nome}</p>
                    <p style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--apex-muted)', margin: 0 }} className="truncate">{statusLabel(os.status)}</p>
                  </div>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 700, color: 'var(--apex-danger)', flexShrink: 0 }}>
                    +{os.dias_na_etapa}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Componentes internos ──────────────────────────────────────────────────────

function MetricCard({ label, value, sub, accent, subColor, valueSm, highlight }: {
  label: string; value: string; sub: string; accent: string
  subColor?: string; valueSm?: boolean; highlight?: boolean
}) {
  return (
    <div style={{
      background: highlight ? 'var(--apex-gold-bg)' : 'var(--apex-card)',
      border: `1px solid ${highlight ? 'var(--apex-gold-border)' : 'var(--apex-border)'}`,
      borderTop: `2px solid ${accent}`,
      borderRadius: 8,
      padding: 16,
    }}>
      <p style={{
        fontFamily: 'var(--f-mono)', fontSize: 8,
        letterSpacing: '0.10em', textTransform: 'uppercase',
        color: 'var(--apex-muted)', marginBottom: 8,
      }}>{label}</p>
      <p style={{
        fontFamily: 'var(--f-display)', fontWeight: 700,
        fontSize: valueSm ? 20 : 28, lineHeight: 1,
        paddingTop: valueSm ? 4 : 0,
        color: highlight ? 'var(--apex-gold-bright)' : 'var(--apex-text)',
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: 'var(--f-mono)', fontSize: 9, marginTop: 6,
        color: subColor ?? 'var(--apex-muted)',
      }}>{sub}</p>
    </div>
  )
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Carregando ordens de serviço">
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded-[4px]"
            style={{ background: 'var(--apex-surface)' }} />
        ))}
      </div>
    </div>
  )
}

function Empty({ msg, ok }: { msg: string; ok?: boolean }) {
  return (
    <div role="status" className="flex items-center justify-center py-8">
      <span style={{
        fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.08em',
        color: ok ? 'var(--apex-green)' : 'var(--apex-muted)',
      }}>
        {ok ? '✓ ' : ''}{msg}
      </span>
    </div>
  )
}