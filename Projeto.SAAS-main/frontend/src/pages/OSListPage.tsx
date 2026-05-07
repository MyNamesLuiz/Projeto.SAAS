//Ordens de Serviço — Lista com Busca via API

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { api } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import { useSearchOS } from '../hooks/useSearchOS'
import { KANBAN_COLUMNS, STATUS_MAP } from '../types/os'
import type { OS } from '../types/os'

const HEADERS = ['OS', 'Placa', 'Cliente / Veículo', 'Serviço', 'Entrada', 'Prazo', 'Valor', 'Status', '']

function statusColor(s: string) {
  return (
    KANBAN_COLUMNS.find((c) => c.id === STATUS_MAP[s])
      ?.color.replace(/rgba?\((\d+),(\d+),(\d+).*/, 'rgb($1,$2,$3)') ?? 'var(--text-secondary)'
  )
}
function statusLabel(s: string) {
  return KANBAN_COLUMNS.find((c) => c.id === STATUS_MAP[s])?.label ?? s
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function fmtValor(v: number | null) {
  if (!v) return '—'
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

export default function OSListPage() {
  const queryClient = useQueryClient()
  const [search, setSearch]               = useState('')
  const [confirmDelete, setConfirmDelete] = useState<OS | null>(null)

  const debouncedSearch = useDebounce(search, 400)
  const isSearching     = search !== debouncedSearch

  const { data: allOS = [], isLoading: loadingAll } = useQuery({
    queryKey: ['os', ''],
    queryFn: () => api.os.list(),
    enabled: debouncedSearch.trim().length === 0,
    staleTime: 0,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  })

  const { data: searchResult = [], isFetching: fetchingSearch } = useSearchOS(debouncedSearch)

  const hasQuery  = debouncedSearch.trim().length > 0
  const osList    = hasQuery ? searchResult : allOS
  const isLoading = hasQuery ? fetchingSearch : loadingAll
  const filtered  = osList

  const deleteOS = useMutation({
    mutationFn: (id: number) => api.os.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os'] })
      queryClient.invalidateQueries({ queryKey: ['os-search'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setConfirmDelete(null)
    },
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <h2 className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] uppercase">
          Todas as ordens de serviço
        </h2>
        <div className="flex-1 h-px bg-[var(--border)]" />

        <div className="flex items-center gap-2 h-[28px] px-3 transition-colors"
          style={{ borderColor: search ? 'var(--orange)' : undefined }}>
          <span className="text-[var(--text-muted)] text-[11px]" aria-hidden>
            {isSearching || (hasQuery && isLoading) ? '⟳' : '⌕'}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa, nome ou telefone..."
            aria-label="Buscar ordens de serviço"
            className="bg-transparent border-none outline-none font-mono text-[10px] text-[var(--text-secondary)] placeholder-[var(--text-secondary)] w-52"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="font-mono text-[10px] text-[var(--text-secondary)] bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Badge resultado busca */}
      {hasQuery && !isLoading && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-widest text-[var(--orange)]">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{debouncedSearch}"
          </span>
          <button
            onClick={() => setSearch('')}
            className="font-mono text-[9px] text-[var(--text-secondary)] bg-transparent border-none cursor-pointer"
          >
            limpar busca
          </button>
        </div>
      )}

      {/* ── TABELA — desktop only ─────────────────────────────────────── */}
      <div className="hidden md:block bg-[var(--bg-base)] border border-[var(--border)] rounded-[4px] overflow-hidden overflow-x-auto">
        <div
          className="grid px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-card)] min-w-[900px]"
          style={{ gridTemplateColumns: '56px 90px 1fr 160px 90px 90px 100px 120px 36px' }}
        >
          {HEADERS.map((h) => (
            <span key={h} className="font-mono text-[8px] tracking-widest text-[var(--text-muted)] uppercase">{h}</span>
          ))}
        </div>

        {isLoading || isSearching ? (
          <div className="flex flex-col gap-px min-w-[900px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 bg-[var(--bg-card)] animate-pulse m-1 rounded-[2px]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={hasQuery} />
        ) : (
          <div className="min-w-[900px]">
            {filtered.map((os) => {
              const color = statusColor(os.status)
              const valor = os.valor_final ?? os.valor_estimado
              return (
                <div
                  key={os.id}
                  className="grid items-center px-4 py-2.5 border-b border-[var(--bg-card)] last:border-none hover:bg-[var(--bg-base)] transition-colors"
                  style={{ gridTemplateColumns: '56px 90px 1fr 160px 90px 90px 100px 120px 36px' }}
                >
                  <span className="font-mono text-[9px] text-[var(--text-secondary)]">OS-{String(os.id).padStart(3, '0')}</span>
                  <span className="font-mono text-[10px] font-bold text-[var(--text-primary)]">{os.veiculo_placa}</span>
                  <div className="min-w-0 pr-2">
                    <p className="font-mono text-[11px] text-[var(--text-secondary)] truncate">{os.cliente_nome}</p>
                    <p className="font-mono text-[9px] text-[var(--text-secondary)] truncate">{os.veiculo_modelo} {os.veiculo_ano}</p>
                  </div>
                  <p className="font-mono text-[10px] text-[var(--text-secondary)] truncate pr-2">{os.descricao_servico}</p>
                  <span className="font-mono text-[9px] text-[var(--text-secondary)]">{fmtDate(os.data_entrada)}</span>
                  <span className="font-mono text-[9px]" style={{ color: os.prazo_vencido ? 'var(--red)' : 'var(--text-secondary)' }}>
                    {fmtDate(os.prazo_estimado)}
                  </span>
                  <span className="font-mono text-[10px] font-bold" style={{ color: valor ? 'var(--green)' : 'var(--text-secondary)' }}>
                    {fmtValor(valor)}
                  </span>
                  <Badge
                    intent={
                      os.alerta_parada ? 'red'
                      : os.prazo_vencido ? 'amber'
                      : os.status === 'entregue' ? 'green'
                      : 'neutral'
                    }
                    className="justify-self-start"
                    style={{ color, background: `${color}18`, borderColor: `${color}30` }}
                  >
                    {statusLabel(os.status)}
                  </Badge>
                  <Button
                    intent="danger"
                    size="xs"
                    onClick={() => setConfirmDelete(os)}
                    title="Remover OS"
                    aria-label={`Remover OS de ${os.cliente_nome}`}
                  >
                    ✕
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── CARDS — mobile only ───────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:hidden">
        {isLoading || isSearching ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-[5px] bg-[var(--bg-card)] animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={hasQuery} />
        ) : (
          filtered.map((os) => {
            const color = statusColor(os.status)
            const valor = os.valor_final ?? os.valor_estimado
            return (
              <div
                key={os.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[5px] p-3 flex flex-col gap-2"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                {/* Linha topo: OS id + placa + botão remover */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-[var(--text-muted)]">
                      OS-{String(os.id).padStart(3, '0')}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[var(--text-primary)] bg-[var(--bg-base)] border border-[var(--border)] px-1.5 py-0.5 rounded-[2px]">
                      {os.veiculo_placa}
                    </span>
                    {os.prazo_vencido && (
                      <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-[2px]"
                        style={{ color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid var(--red-border)' }}>
                        vencido
                      </span>
                    )}
                    {os.alerta_parada && (
                      <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-[2px] flex items-center gap-1"
                        style={{ color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid var(--red-border)' }}>
                        <span className="w-1 h-1 rounded-full bg-[var(--red)]" />
                        +{os.dias_na_etapa}d
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmDelete(os)}
                    className="font-mono text-[10px] text-[var(--text-muted)] hover:text-[var(--red)] bg-transparent border-none cursor-pointer p-1"
                    aria-label={`Remover OS de ${os.cliente_nome}`}
                  >
                    ✕
                  </button>
                </div>

                {/* Cliente + veículo */}
                <div>
                  <p className="font-mono text-[12px] font-bold text-[var(--text-primary)] leading-tight truncate">
                    {os.cliente_nome}
                  </p>
                  <p className="font-mono text-[9px] text-[var(--text-secondary)]">
                    {os.veiculo_modelo} {os.veiculo_ano}
                  </p>
                </div>

                {/* Serviço */}
                <p className="font-mono text-[10px] text-[var(--text-secondary)] truncate">
                  {os.descricao_servico}
                </p>

                {/* Linha rodapé: status + datas + valor */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-[2px]"
                      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
                      {statusLabel(os.status)}
                    </span>
                    {os.prazo_estimado && (
                      <span className="font-mono text-[8px]"
                        style={{ color: os.prazo_vencido ? 'var(--red)' : 'var(--text-muted)' }}>
                        até {fmtDate(os.prazo_estimado)}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] font-bold"
                    style={{ color: valor ? 'var(--green)' : 'var(--text-muted)' }}>
                    {fmtValor(valor)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Rodapé contagem */}
      {!isLoading && !isSearching && (
        <span className="font-mono text-[9px] text-[var(--text-secondary)] tracking-widest self-end">
          {hasQuery
            ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`
            : `${filtered.length} de ${allOS.length} OS${allOS.length !== 1 ? 's' : ''}`}
        </span>
      )}

      {confirmDelete && (
        <ConfirmModal
          msg={`Remover OS de ${confirmDelete.cliente_nome} (${confirmDelete.veiculo_placa})?`}
          loading={deleteOS.isPending}
          onConfirm={() => deleteOS.mutate(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

//Empty State

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-[4px] bg-[var(--orange)]/10 border border-[var(--orange)]/20">
        <span className="font-mono text-[13px] font-bold text-[var(--orange)]">OS</span>
      </div>
      <p className="font-mono text-[12px] text-[var(--text-secondary)]">
        {hasSearch ? 'Nenhuma OS encontrada para essa busca' : 'Nenhuma ordem de serviço cadastrada'}
      </p>
      {!hasSearch && (
        <p className="font-mono text-[10px] text-[var(--text-muted)]">
          Use o botão <span style={{ color: 'var(--orange)' }}>+ Nova OS</span> no topo para criar
        </p>
      )}
    </div>
  )
}

//Confirm Modal

function ConfirmModal({ msg, loading, onConfirm, onCancel }: {
  msg: string; loading: boolean; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-[var(--bg-base)] border border-[var(--red)]/30 rounded-[6px] w-full max-w-sm p-5 flex flex-col gap-4">
        <p className="font-mono text-[11px] text-[var(--text-primary)]">{msg}</p>
        <div className="flex gap-2 justify-end">
          <Button intent="ghost" size="md" onClick={onCancel}>Cancelar</Button>
          <Button intent="danger" size="md" onClick={onConfirm} disabled={loading}>
            {loading ? 'Removendo...' : 'Remover'}
          </Button>
        </div>
      </div>
    </div>
  )
}