import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import { useSearchOS } from '../hooks/useSearchOS'
import { KANBAN_COLUMNS, STATUS_MAP } from '../types/os'
import type { OS, DashboardMetrics } from '../types/os'

// ── Helpers ────────────────────────────────────────────────────────────────────
function getCol(s: string) { return KANBAN_COLUMNS.find(c => c.id === STATUS_MAP[s]) }
function statusColor(s: string) { return getCol(s)?.color ?? 'var(--text-secondary)' }
function statusLabel(s: string) { return getCol(s)?.label ?? s }
function fmtBRL(v: number) {
  return v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toLocaleString('pt-BR')}`
}

// ── Contexto real por card ────────────────────────────────────────────────────
// Texto + cor derivados dos valores da API, sem inventar dados históricos.
type CardKey = 'abertas' | 'receita' | 'concluidas' | 'vencido' | 'paradas'

function cardContext(key: CardKey, m: DashboardMetrics): { text: string; color: string } {
  const total = (m.os_abertas ?? 0) + (m.os_concluidas_mes ?? 0)

  switch (key) {
    case 'abertas': {
      if (total === 0) return { text: 'nenhuma OS no sistema', color: 'var(--text-muted)' }
      const pct = Math.round(((m.os_abertas ?? 0) / total) * 100)
      return { text: `${pct}% do volume total`, color: 'var(--orange)' }
    }
    case 'receita': {
      if (!m.receita_mes) return { text: 'sem receita registrada', color: 'var(--text-muted)' }
      const media = m.os_concluidas_mes
        ? `${fmtBRL(m.receita_mes / m.os_concluidas_mes)} / OS`
        : 'nenhuma OS concluída'
      return { text: `média ${media}`, color: 'var(--text-secondary)' }
    }
    case 'concluidas': {
      if (!m.os_concluidas_mes) return { text: 'nenhuma concluída ainda', color: 'var(--text-muted)' }
      const pct = total > 0 ? Math.round((m.os_concluidas_mes / total) * 100) : 0
      return { text: `${pct}% do volume concluído`, color: 'var(--green)' }
    }
    case 'vencido': {
      if (!m.os_prazo_vencido) return { text: 'todas no prazo ✓', color: 'var(--green)' }
      const pct = m.os_abertas ? Math.round((m.os_prazo_vencido / m.os_abertas) * 100) : 100
      return { text: `${pct}% das OS abertas`, color: 'var(--red)' }
    }
    case 'paradas': {
      if (!m.os_paradas) return { text: 'fluxo normal ✓', color: 'var(--green)' }
      const pct = m.os_abertas ? Math.round((m.os_paradas / m.os_abertas) * 100) : 100
      return { text: `${pct}% das OS abertas`, color: 'var(--amber)' }
    }
  }
}

// ── Metric Card ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  label:        string
  value:        string
  accentColor:  string
  icon:         React.ReactNode
  isLoading?:   boolean
  contextText:  string
  contextColor: string
}

function MetricCard({ label, value, accentColor, icon, isLoading, contextText, contextColor }: MetricCardProps) {
  return (
    <div
      className="flex flex-col p-5 rounded-xl transition-all duration-200"
      style={{
        background: 'var(--bg-card)',
        border:     '1px solid var(--border)',
        borderTop:  `3px solid ${accentColor}`,
      }}
    >
      {/* Ícone */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl mb-4 flex-shrink-0"
        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
      >
        {icon}
      </div>

      {/* Label */}
      <p style={{
        fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xs)',
        fontWeight: 700, letterSpacing: '0.16em', color: 'var(--text-muted)',
        textTransform: 'uppercase', marginBottom: 6,
      }}>
        {label}
      </p>

      {/* Valor principal */}
      {isLoading ? (
        <div className="apex-shimmer h-8 w-16 rounded-lg mb-3" />
      ) : (
        <p style={{
          fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)',
          fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 12,
        }}>
          {value}
        </p>
      )}

      {/* Divisor */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 10 }} />

      {/* Contexto — texto real, sem gráfico sintético */}
      {isLoading ? (
        <div className="apex-shimmer h-3 w-28 rounded" />
      ) : (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
          color: contextColor, fontWeight: 500,
        }}>
          {contextText}
        </p>
      )}
    </div>
  )
}

// ── Ícones ────────────────────────────────────────────────────────────────────
function IconClipboard({ color }: { color: string }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <rect x="3" y="4" width="14" height="14" rx="2" stroke={color} strokeWidth="1.6"/>
    <path d="M7 2h6v4H7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    <line x1="7" y1="10" x2="13" y2="10" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="7" y1="13" x2="11" y2="13" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
}
function IconDollar({ color }: { color: string }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.6"/>
    <path d="M10 5v10M7.5 7.5c0-1 1.12-1.5 2.5-1.5s2.5.5 2.5 1.5-1.12 1.5-2.5 1.5S7.5 9.5 7.5 10.5 8.62 12 10 12s2.5.5 2.5 1.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
}
function IconCheck({ color }: { color: string }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.6"/>
    <path d="M6 10l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
function IconClock({ color }: { color: string }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.6"/>
    <path d="M10 6v4l2.5 2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
function IconCalendar({ color }: { color: string }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <rect x="2" y="4" width="16" height="14" rx="2" stroke={color} strokeWidth="1.6"/>
    <line x1="2" y1="8" x2="18" y2="8" stroke={color} strokeWidth="1.4"/>
    <line x1="6" y1="2" x2="6" y2="6" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="14" y1="2" x2="14" y2="6" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
}
function IconWarning({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M9 2L16.5 15H1.5L9 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="9" y1="7" x2="9" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="13" r="0.75" fill={color}/>
  </svg>
}
function IconRecentClock({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.5"/>
    <path d="M9 5.5V9l2.5 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}

// ── Panel ─────────────────────────────────────────────────────────────────────
function Panel({ title, titleColor, icon, action, children }: {
  title: string; titleColor?: string; icon: React.ReactNode
  action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          {icon}
          <span style={{
            fontFamily: 'var(--font-heading)', fontSize: 'var(--text-sm)', fontWeight: 700,
            letterSpacing: '0.12em', color: titleColor ?? 'var(--text-secondary)', textTransform: 'uppercase',
          }}>
            {title}
          </span>
        </div>
        {action}
      </div>
      <div>{children}</div>
    </div>
  )
}

function NavLink2({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="cursor-pointer border-none bg-transparent" style={{
      fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xs)',
      fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--orange)',
    }}>
      {children}
    </button>
  )
}

// ── OS Row ────────────────────────────────────────────────────────────────────
function OSRow({ os }: { os: OS }) {
  const color = statusColor(os.status)
  const label = statusLabel(os.status)
  const valor = os.valor_final ?? os.valor_estimado

  return (
    <div className="apex-row-hover flex items-center gap-3 px-5 py-3 cursor-default"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', width: 48, flexShrink: 0 }}>
        OS-{String(os.id).padStart(3,'0')}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', width: 80, flexShrink: 0, letterSpacing: '0.06em' }}>
        {os.veiculo_placa}
      </span>
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 500 }} className="truncate">
          {os.cliente_nome}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }} className="truncate">
          {os.veiculo_modelo} {os.veiculo_ano}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {os.prazo_vencido && (
          <span className="px-2 py-0.5 rounded-md" style={{
            background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red-border)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 600, textTransform: 'uppercase',
          }}>vencido</span>
        )}
        {os.alerta_parada && !os.prazo_vencido && (
          <span className="px-2 py-0.5 rounded-md" style={{
            background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid var(--amber-border)',
            fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 600,
          }}>+{os.dias_na_etapa}d</span>
        )}
      </div>
      <span className="px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0" style={{
        color, background: `${color}18`, border: `1px solid ${color}28`,
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 600, textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700,
        color: valor ? 'var(--green)' : 'var(--text-ghost)', width: 72, textAlign: 'right', flexShrink: 0,
      }}>{valor ? fmtBRL(valor) : '—'}</span>
    </div>
  )
}

// ── OS Parada ─────────────────────────────────────────────────────────────────
function OSParada({ os }: { os: OS }) {
  // Urgência: >7 dias = crítico (vermelho vivo), 4-7 = alerta (âmbar), <=3 = normal
  const urgencia = os.dias_na_etapa > 7 ? 'critico' : os.dias_na_etapa > 3 ? 'alerta' : 'normal'
  const urgColor = urgencia === 'critico' ? 'var(--red)' : urgencia === 'alerta' ? 'var(--amber)' : 'var(--text-muted)'
  const urgBg    = urgencia === 'critico' ? 'var(--red-dim)' : urgencia === 'alerta' ? 'var(--amber-dim)' : 'var(--bg-hover)'
  const urgBorder= urgencia === 'critico' ? 'var(--red-border)' : urgencia === 'alerta' ? 'var(--amber-border)' : 'var(--border)'

  return (
    <div className="apex-row-hover flex items-center gap-3 px-5 py-3"
      style={{ borderBottom: '1px solid var(--border)', borderLeft: `3px solid ${urgColor}` }}>
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0${urgencia === 'critico' ? ' apex-pulse' : ''}`}
        style={{ background: urgBg, border: `1px solid ${urgBorder}` }}>
        <IconWarning color={urgColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.06em' }}>{os.veiculo_placa}</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }} className="truncate">{os.cliente_nome} · {statusLabel(os.status)}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-md)', fontWeight: 800, color: urgColor }}>
          +{os.dias_na_etapa}d
        </span>
        {os.prazo_vencido && (
          <span className="px-1.5 py-0.5 rounded" style={{
            background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red-border)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 600, textTransform: 'uppercase',
          }}>prazo vencido</span>
        )}
      </div>
    </div>
  )
}

// ── Skeleton / Empty ──────────────────────────────────────────────────────────
function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="apex-shimmer h-10 rounded-lg" />)}
    </div>
  )
}

function Empty({ msg, ok = false }: { msg: string; ok?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: ok ? 'var(--green-dim)' : 'var(--bg-hover)', border: ok ? '1px solid var(--green-border)' : 'none' }}>
        {ok
          ? <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="var(--green)" strokeWidth="1.6"/><path d="M7 11l3 3 5-5" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          : <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="4" y="5" width="14" height="14" rx="2" stroke="var(--text-muted)" strokeWidth="1.5"/><path d="M8 3h6v4H8z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        }
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: ok ? 'var(--green)' : 'var(--text-muted)' }}>
        {msg}
      </p>
    </div>
  )
}

// ── Indicador de atualização ──────────────────────────────────────────────────
function RefreshDot({ fetching }: { fetching: boolean }) {
  if (!fetching) return null
  return (
    <span
      title="Atualizando..."
      style={{
        display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
        background: 'var(--orange)', opacity: 0.8,
        animation: 'pulse 1s ease-in-out infinite',
        verticalAlign: 'middle', marginLeft: 6,
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════
// DashboardPage
// ═══════════════════════════════════════════════════════════
export default function DashboardPage() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const clearSearch = useCallback(() => setSearch(''), [])

  // Invalida dados quando a aba volta ao foco (garante métricas sempre frescas)
  useEffect(() => {
    const onFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['os', ''] })
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [queryClient])

  const debouncedSearch = useDebounce(search, 400)
  const isTyping        = search !== debouncedSearch
  const hasQuery        = debouncedSearch.trim().length > 0
  const { data: searchResult = [], isFetching: fetchingSearch } = useSearchOS(debouncedSearch)

  // Atualização a cada 10s, staleTime 0 = sempre considera dado como "velho"
  // refetchOnWindowFocus = ao voltar para a aba, atualiza imediatamente
  const queryOptions = {
    staleTime: 0,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  }

  const { data: metrics, isLoading: loadingMetrics, isFetching: fetchingMetrics } =
    useQuery<DashboardMetrics>({
      queryKey: ['dashboard'],
      queryFn:  () => api.dashboard.metrics(),
      ...queryOptions,
    })

  const { data: osList = [], isLoading: loadingOS, isFetching: fetchingOS } =
    useQuery<OS[]>({
      queryKey: ['os', ''],
      queryFn:  () => api.os.list(),
      enabled:  !hasQuery,
      ...queryOptions,
    })

  const recentes = [...osList]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6)
  const paradas = osList
    .filter(o => o.alerta_parada)
    .sort((a, b) => b.dias_na_etapa - a.dias_na_etapa)
    .slice(0, 5)

  const receita    = metrics?.receita_mes ?? 0
  const receitaFmt = receita >= 1000 ? `R$ ${(receita / 1000).toFixed(1)}k` : `R$ ${receita.toLocaleString('pt-BR')}`
  const ctx        = metrics ? {
    abertas:    cardContext('abertas',    metrics),
    receita:    cardContext('receita',    metrics),
    concluidas: cardContext('concluidas', metrics),
    vencido:    cardContext('vencido',    metrics),
    paradas:    cardContext('paradas',    metrics),
  } : null

  const isBgFetching = !loadingMetrics && (fetchingMetrics || fetchingOS)

  return (
    <div className="flex flex-col gap-6 max-w-[1280px]">

      {/* ── Busca ───────────────────────────────────────────────────────── */}
      <div>
        <p style={{
          fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xs)',
          fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-muted)',
          textTransform: 'uppercase', marginBottom: 8,
        }}>
          Busca Rápida
        </p>
        <div className="flex items-center gap-3 h-12 px-4 rounded-xl transition-all duration-200"
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${search ? 'var(--orange)' : 'var(--border-strong)'}`,
            boxShadow: search ? '0 0 0 3px var(--orange-dim)' : 'none',
          }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0 }}>
            {isTyping || (hasQuery && fetchingSearch)
              ? <circle cx="7" cy="7" r="5.5" stroke="var(--orange)" strokeWidth="1.5" strokeDasharray="4 2" className="apex-pulse"/>
              : <><circle cx="7" cy="7" r="5" stroke="var(--text-muted)" strokeWidth="1.5"/><line x1="11" y1="11" x2="15" y2="15" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/></>
            }
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por placa, nome ou telefone..."
            aria-label="Busca rápida de ordens de serviço"
            className="flex-1 bg-transparent border-none outline-none"
            style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
          />
          {search && (
            <button onClick={clearSearch}
              className="w-6 h-6 flex items-center justify-center cursor-pointer border-none"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)' }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <line x1="1" y1="1" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="7" y1="1" x2="1" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {hasQuery && (
          <div className="mt-2 rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}>
            {fetchingSearch || isTyping ? (
              <Skeleton rows={3} />
            ) : searchResult.length === 0 ? (
              <Empty msg={`Nenhuma OS encontrada para "${debouncedSearch}"`} />
            ) : (
              <>
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {searchResult.length} resultado{searchResult.length !== 1 ? 's' : ''}
                  </span>
                  <NavLink2 onClick={() => navigate('/os')}>ver todos →</NavLink2>
                </div>
                {searchResult.slice(0, 7).map(os => <OSRow key={os.id} os={os} />)}
                {searchResult.length > 7 && (
                  <div className="px-5 py-3">
                    <NavLink2 onClick={() => navigate('/os')}>+ {searchResult.length - 7} resultados — ver em Ordens de Serviço</NavLink2>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {!hasQuery && (
        <>
          {/* ── Métricas ─────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p style={{
                fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xs)',
                fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase',
              }}>
                Visão Geral do Mês
              </p>
              {/* Pulsing dot — aparece só durante background refetch, não no loading inicial */}
              <RefreshDot fetching={isBgFetching} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricCard
                label="OSS Abertas"
                value={String(metrics?.os_abertas ?? 0)}
                accentColor="#FF6B00"
                icon={<IconClipboard color="#FF6B00" />}
                isLoading={loadingMetrics}
                contextText={ctx?.abertas.text ?? '—'}
                contextColor={ctx?.abertas.color ?? 'var(--text-muted)'}
              />
              <MetricCard
                label="Receita"
                value={receitaFmt}
                accentColor="#FF6B00"
                icon={<IconDollar color="#FF6B00" />}
                isLoading={loadingMetrics}
                contextText={ctx?.receita.text ?? '—'}
                contextColor={ctx?.receita.color ?? 'var(--text-muted)'}
              />
              <MetricCard
                label="Concluídas"
                value={String(metrics?.os_concluidas_mes ?? 0)}
                accentColor="#28A745"
                icon={<IconCheck color="#28A745" />}
                isLoading={loadingMetrics}
                contextText={ctx?.concluidas.text ?? '—'}
                contextColor={ctx?.concluidas.color ?? 'var(--text-muted)'}
              />
              <MetricCard
                label="Prazo Vencido"
                value={String(metrics?.os_prazo_vencido ?? 0)}
                accentColor="#DC3545"
                icon={<IconClock color="#DC3545" />}
                isLoading={loadingMetrics}
                contextText={ctx?.vencido.text ?? '—'}
                contextColor={ctx?.vencido.color ?? 'var(--text-muted)'}
              />
              <MetricCard
                label="Paradas"
                value={String(metrics?.os_paradas ?? 0)}
                accentColor="#FFC107"
                icon={<IconCalendar color="#FFC107" />}
                isLoading={loadingMetrics}
                contextText={ctx?.paradas.text ?? '—'}
                contextColor={ctx?.paradas.color ?? 'var(--text-muted)'}
              />
            </div>
          </div>

          {/* ── Painéis ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel
              title="OSS Recentes"
              icon={<IconRecentClock color="var(--text-muted)" />}
              action={<NavLink2 onClick={() => navigate('/os')}>Ver Todas →</NavLink2>}
            >
              {loadingOS ? <Skeleton rows={4} /> : recentes.length === 0 ? <Empty msg="Nenhuma OS cadastrada" /> : recentes.map(os => <OSRow key={os.id} os={os} />)}
            </Panel>

            <Panel
              title={`OSS Paradas${(metrics?.os_paradas ?? 0) > 0 ? ` · ${metrics?.os_paradas}` : ''}`}
              titleColor={paradas.length > 0 ? 'var(--red)' : undefined}
              icon={<IconWarning color={paradas.length > 0 ? 'var(--red)' : 'var(--text-muted)'} />}
              action={<NavLink2 onClick={() => navigate('/kanban')}>Ver Kanban →</NavLink2>}
            >
              {loadingOS ? <Skeleton rows={3} /> : paradas.length === 0 ? <Empty msg="Nenhuma OS parada" ok /> : paradas.map(os => <OSParada key={os.id} os={os} />)}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}