//Ordens de Serviço — Lista com Busca via API

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Section, Field, inputCls } from '../components/FormHelpers'
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
  const [search, setSearch]           = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<OS | null>(null)

  // Debounce 400ms (Thayane)
  const debouncedSearch = useDebounce(search, 400)
  const isSearching     = search !== debouncedSearch

  const { data: allOS = [], isLoading: loadingAll } = useQuery({
    queryKey: ['os'],
    queryFn: () => api.os.list(),
    enabled: debouncedSearch.trim().length === 0,
  })

  const { data: searchResult = [], isFetching: fetchingSearch } = useSearchOS(debouncedSearch)

  const hasQuery  = debouncedSearch.trim().length > 0
  const osList    = hasQuery ? searchResult : allOS
  const isLoading = hasQuery ? fetchingSearch : loadingAll

  // Filtra localmente só por alerta/prazo (não duplica a busca)
  const filtered = useMemo(() => osList, [osList])

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

        {/* Campo de busca com debounce */}
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
              className="font-mono text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-secondary)] bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <Button intent="primary" size="sm" onClick={() => setShowModal(true)}>
          + Nova OS
        </Button>
      </div>

      {/* Badge de resultado da busca */}
      {hasQuery && !isLoading && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-widest text-[var(--orange)]">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{debouncedSearch}"
          </span>
          <button
            onClick={() => setSearch('')}
            className="font-mono text-[9px] text-[var(--text-secondary)] hover:text-[var(--text-secondary)] bg-transparent border-none cursor-pointer"
          >
            limpar busca
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-[4px] overflow-hidden overflow-x-auto">
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
          <EmptyState hasSearch={hasQuery} onNew={() => setShowModal(true)} />
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
                      : os.status === 'Entregue' ? 'green'
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

      {/* Rodapé contagem */}
      {!isLoading && !isSearching && (
        <span className="font-mono text-[9px] text-[var(--text-secondary)] tracking-widest self-end">
          {hasQuery
            ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`
            : `${filtered.length} de ${allOS.length} OS${allOS.length !== 1 ? 's' : ''}`}
        </span>
      )}

      {showModal && <NovaOSModal onClose={() => setShowModal(false)} />}
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

function EmptyState({ hasSearch, onNew }: { hasSearch: boolean; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-[4px] bg-[var(--orange)]/10 border border-[var(--orange)]/20">
        <span className="font-mono text-[13px] font-bold text-[var(--orange)]">OS</span>
      </div>
      <p className="font-mono text-[12px] text-[var(--text-secondary)]">
        {hasSearch ? 'Nenhuma OS encontrada para essa busca' : 'Nenhuma ordem de serviço cadastrada'}
      </p>
      {!hasSearch && (
        <button
          onClick={onNew}
          className="font-mono text-[10px] text-[var(--orange)] bg-transparent border-none cursor-pointer hover:underline"
        >
          + Nova OS
        </button>
      )}
    </div>
  )
}

//Modal Nova OS

function NovaOSModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    cliente_nome: '', cliente_telefone: '',
    veiculo_placa: '', veiculo_modelo: '', veiculo_ano: new Date().getFullYear(),
    descricao_servico: '', valor_estimado: '', prazo_estimado: '',
  })
  const [error, setError] = useState('')

  const criar = useMutation({
    mutationFn: () => api.os.create({
      cliente_nome:      form.cliente_nome,
      cliente_telefone:  form.cliente_telefone,
      veiculo_placa:     form.veiculo_placa.toUpperCase(),
      veiculo_modelo:    form.veiculo_modelo,
      veiculo_ano:       Number(form.veiculo_ano),
      descricao_servico: form.descricao_servico,
      valor_estimado:    form.valor_estimado ? Number(form.valor_estimado) : undefined,
      prazo_estimado:    form.prazo_estimado || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const required = ['cliente_nome', 'veiculo_placa', 'veiculo_modelo', 'descricao_servico'] as const
  const canSubmit = required.every((k) => form[k].trim())

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-[6px] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <span className="font-mono text-[11px] tracking-widest text-[var(--text-primary)] uppercase">Nova Ordem de Serviço</span>
          <button onClick={onClose} className="font-mono text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer">✕</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <Section label="Cliente">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome *"><input className={inputCls} placeholder="João da Silva" value={form.cliente_nome} onChange={set('cliente_nome')} /></Field>
              <Field label="Telefone"><input className={inputCls} placeholder="(63) 99999-0000" value={form.cliente_telefone} onChange={set('cliente_telefone')} /></Field>
            </div>
          </Section>
          <Section label="Veículo">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Placa *"><input className={inputCls} placeholder="ABC-1234" value={form.veiculo_placa} onChange={set('veiculo_placa')} maxLength={8} /></Field>
              <Field label="Modelo *"><input className={inputCls} placeholder="Toyota Corolla" value={form.veiculo_modelo} onChange={set('veiculo_modelo')} /></Field>
              <Field label="Ano"><input className={inputCls} type="number" placeholder="2022" value={form.veiculo_ano} onChange={set('veiculo_ano')} /></Field>
            </div>
          </Section>
          <Section label="Serviço">
            <Field label="Descrição *">
              <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Descreva o serviço..." value={form.descricao_servico} onChange={set('descricao_servico')} />
            </Field>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Valor estimado (R$)"><input className={inputCls} type="number" placeholder="1500" value={form.valor_estimado} onChange={set('valor_estimado')} /></Field>
              <Field label="Prazo estimado"><input className={inputCls} type="date" value={form.prazo_estimado} onChange={set('prazo_estimado')} /></Field>
            </div>
          </Section>
          {error && <p className="font-mono text-[10px] text-[var(--red)] tracking-widest">{error}</p>}
          <div className="flex gap-2 justify-end pt-2 border-t border-[var(--border)]">
            <Button intent="ghost" size="md" onClick={onClose}>Cancelar</Button>
            <Button
              intent="primary"
              size="md"
              onClick={() => criar.mutate()}
              disabled={!canSubmit || criar.isPending}
            >
              {criar.isPending ? 'Criando...' : 'Criar OS'}
            </Button>
          </div>
        </div>
      </div>
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