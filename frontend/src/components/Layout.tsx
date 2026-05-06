import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import { Section, Field, inputCls } from './FormHelpers'
import { Button } from './ui/Button'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',        short: 'Dashboard' },
  { to: '/kanban',    label: 'Kanban',            short: 'Kanban'    },
  { to: '/os',        label: 'Ordens de Serviço', short: 'OS'        },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/kanban':    'Kanban',
  '/os':        'Ordens de Serviço',
}

function IconDashboard({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2"  y="2"  width="7" height="7" rx="2" fill="currentColor" />
      <rect x="11" y="2"  width="7" height="7" rx="2" fill="currentColor" opacity=".4" />
      <rect x="2"  y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".4" />
      <rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".4" />
    </svg>
  )
}

function IconKanban({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2"  y="3" width="4" height="14" rx="2" fill="currentColor" />
      <rect x="8"  y="3" width="4" height="10" rx="2" fill="currentColor" opacity=".6" />
      <rect x="14" y="3" width="4" height="7"  rx="2" fill="currentColor" opacity=".35" />
    </svg>
  )
}

function IconList({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4"  width="14" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="3" y="9"  width="14" height="2.5" rx="1.25" fill="currentColor" opacity=".6" />
      <rect x="3" y="14" width="9"  height="2.5" rx="1.25" fill="currentColor" opacity=".35" />
    </svg>
  )
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  '/dashboard': <IconDashboard />,
  '/kanban':    <IconKanban />,
  '/os':        <IconList />,
}

const NAV_ICONS_SM: Record<string, React.ReactNode> = {
  '/dashboard': <IconDashboard size={22} />,
  '/kanban':    <IconKanban size={22} />,
  '/os':        <IconList size={22} />,
}

// Chevron mark SVG (logo geométrico)
function ApexMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <polygon points="10,28 16,8 18,8 13,28"  fill="#EF9F27" />
      <polygon points="22,28 16,8 14,8 19,28"  fill="#BA7517" />
      <rect x="11.5" y="17" width="9" height="2.5" rx="1" fill="#FAC775" />
    </svg>
  )
}

export default function Layout() {
  const location = useLocation()
  const navigate  = useNavigate()
  const title     = PAGE_TITLES[location.pathname] ?? 'APEX'
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: 'var(--apex-bg)' }}>

      {/*Sidebar desktop*/}
      <aside
        className="hidden md:flex flex-col flex-shrink-0"
        style={{
          width: 80,
          background: 'var(--apex-surface)',
          borderRight: '1px solid var(--apex-border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ height: 64, borderBottom: '1px solid var(--apex-border)' }}
        >
          <div style={{
            width: 44, height: 44,
            background: '#1A1710',
            border: '1px solid var(--apex-gold-border)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ApexMark size={28} />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col items-center py-3 gap-1" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              {({ isActive }) => (
                <div
                  className="flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-150"
                  style={{
                    width: 56, padding: '10px 4px',
                    borderRadius: 12,
                    background: isActive ? 'var(--apex-gold-bg)' : 'transparent',
                  }}
                  title={item.label}
                >
                  <div style={{
                    width: 40, height: 40,
                    background: isActive ? 'rgba(186,117,23,0.12)' : 'var(--apex-card)',
                    border: `1px solid ${isActive ? 'var(--apex-gold-border)' : 'var(--apex-border-2)'}`,
                    borderRadius: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isActive ? 'var(--apex-gold-bright)' : 'var(--apex-muted)',
                    transition: 'all 0.15s',
                  }}>
                    {NAV_ICONS[item.to]}
                  </div>
                  <span style={{
                    fontFamily: 'var(--f-body)',
                    fontSize: 9, fontWeight: 600,
                    color: isActive ? 'var(--apex-gold-bright)' : 'var(--apex-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}>
                    {item.short}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Status online */}
        <div
          className="flex flex-col items-center justify-center gap-1 flex-shrink-0"
          style={{ height: 52, borderTop: '1px solid var(--apex-border)' }}
        >
          <div
            className="alert-pulse"
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--apex-green)' }}
          />
          <span style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 8, color: 'var(--apex-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Online
          </span>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">

        {/* Topbar */}
        <header
          className="flex items-center justify-between flex-shrink-0"
          style={{
            height: 52,
            padding: '0 20px',
            background: 'var(--apex-surface)',
            borderBottom: '1px solid var(--apex-border)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Logo mobile */}
            <div
              className="flex md:hidden items-center justify-center"
              style={{
                width: 32, height: 32,
                background: '#1A1710',
                border: '1px solid var(--apex-gold-border)',
                borderRadius: 8,
              }}
            >
              <ApexMark size={20} />
            </div>

            {/* Wordmark */}
            <div className="flex items-baseline gap-2">
              <h1 style={{
                fontFamily: 'var(--f-display)',
                fontSize: 18, fontWeight: 900,
                color: 'var(--apex-text)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {title}
              </h1>
              <span
                className="hidden sm:inline"
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: 9,
                  color: 'var(--apex-gold)',
                  background: 'var(--apex-gold-bg)',
                  border: '1px solid var(--apex-gold-border)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}
              </span>
            </div>
          </div>

          {/* CTA principal dourado */}
          <Button intent="primary" size="md" onClick={() => setShowModal(true)}>
            + Nova OS
          </Button>
        </header>

        {/* Content */}
        <main
          className="flex-1 overflow-auto pb-[calc(1.25rem+64px)] md:pb-5"
          style={{ background: 'var(--apex-bg)', padding: '20px' }}
        >
          <Outlet />
        </main>
      </div>

      {/* ── Bottom Nav mobile ── */}
      <nav
        aria-label="Navegação mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: 'var(--apex-surface)',
          borderTop: '1px solid var(--apex-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className="flex-1">
            {({ isActive }) => (
              <div
                className="relative flex flex-col items-center justify-center gap-1.5 py-3 transition-colors duration-150"
                style={{ color: isActive ? 'var(--apex-gold-bright)' : 'var(--apex-muted)' }}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                    style={{ width: 32, height: 2, background: 'var(--apex-gold)' }}
                  />
                )}
                {NAV_ICONS_SM[item.to]}
                <span style={{
                  fontFamily: 'var(--f-body)',
                  fontSize: 9, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {item.short}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Modal global Nova OS */}
      {showModal && (
        <NovaOSModal
          onClose={() => setShowModal(false)}
          onCreated={() => navigate('/os')}
        />
      )}
    </div>
  )
}

// ── Modal Nova OS ─────────────────────────────────────────────────────────────

function NovaOSModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    cliente_nome: '', cliente_telefone: '',
    veiculo_placa: '', veiculo_modelo: '', veiculo_ano: String(new Date().getFullYear()),
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
      onCreated()
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
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--apex-surface)',
        border: '1px solid var(--apex-gold-border)',
        borderRadius: 14,
        width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 0 0 1px rgba(186,117,23,0.08)',
      }}>
        {/* Header do modal com acento dourado */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--apex-border)',
          background: 'var(--apex-gold-bg)',
        }}>
          <div className="flex items-center gap-3">
            <ApexMark size={24} />
            <span style={{
              fontFamily: 'var(--f-display)',
              fontSize: 16, fontWeight: 900,
              color: 'var(--apex-text)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Nova Ordem de Serviço
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--apex-muted)', cursor: 'pointer', fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
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

          {error && (
            <p style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--apex-danger)', letterSpacing: '0.04em' }}>
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2" style={{ borderTop: '1px solid var(--apex-border)' }}>
            <Button intent="ghost" size="md" onClick={onClose}>Cancelar</Button>
            <Button intent="primary" size="md" onClick={() => criar.mutate()} disabled={!canSubmit || criar.isPending}>
              {criar.isPending ? 'Criando...' : 'Criar OS'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}