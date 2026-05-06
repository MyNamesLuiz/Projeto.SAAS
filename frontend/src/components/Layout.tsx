import { useState, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '../services/api'
import { Section, Field, inputCls } from './FormHelpers'
import { Button } from './ui/Button'

// ─── Ícones SVG ───────────────────────────────────────────────────────────────
function IconGrid({ active }: { active: boolean }) {
  const c = active ? '#FF6B00' : '#6C757D'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" stroke={c} strokeWidth="1.5"/>
    </svg>
  )
}

function IconKanban({ active }: { active: boolean }) {
  const c = active ? '#FF6B00' : '#6C757D'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="1" y="1" width="4" height="13" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <rect x="7" y="1" width="4" height="10" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <rect x="13" y="1" width="4" height="7" rx="1.5" stroke={c} strokeWidth="1.5"/>
    </svg>
  )
}

function IconList({ active }: { active: boolean }) {
  const c = active ? '#FF6B00' : '#6C757D'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="1.5" y="2" width="15" height="14" rx="2" stroke={c} strokeWidth="1.5"/>
      <line x1="5" y1="6.5" x2="13" y2="6.5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="5" y1="9"   x2="13" y2="9"   stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="5" y1="11.5" x2="9" y2="11.5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconSettings({ active }: { active: boolean }) {
  const c = active ? '#FF6B00' : '#6C757D'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="2.5" stroke={c} strokeWidth="1.4"/>
      <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M3.93 3.93l1.06 1.06M13.01 13.01l1.06 1.06M3.93 14.07l1.06-1.06M13.01 4.99l1.06-1.06"
        stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Logo SVG (fiel ao design) ─────────────────────────────────────────────────
function ApexLogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="APEX logo mark">
      {/* Chevron esquerdo */}
      <path d="M4 38 L16 10 L22 10 L14 30 L24 30 L18 38 Z" fill="#FF6B00"/>
      {/* Chevron direito sobreposto */}
      <path d="M18 38 L28 10 L34 10 L22 38 Z" fill="#FF6B00"/>
      {/* Perna direita */}
      <path d="M26 10 L38 38 L32 38 L22 14 Z" fill="#FF6B00" opacity="0.85"/>
    </svg>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const hideTimer = setTimeout(() => setLeaving(true), 2800)
    const doneTimer = setTimeout(onDone, 3000)
    return () => { clearTimeout(hideTimer); clearTimeout(doneTimer) }
  }, [onDone])

  return (
    <div
      className={`apex-toast${leaving ? ' leaving' : ''}`}
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 18px',
        borderRadius: 10,
        background: 'var(--bg-card)',
        border: '1px solid var(--green-border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 20, height: 20, borderRadius: '50%',
        background: 'var(--green-dim)', flexShrink: 0,
      }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
          <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="var(--green)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
        {message}
      </span>
    </div>
  )
}

// ─── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  Icon: IconGrid },
  { to: '/kanban',    label: 'Kanban',     Icon: IconKanban },
  { to: '/os',        label: 'OS',         Icon: IconList },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/kanban':    'Kanban',
  '/os':        'Ordens de Serviço',
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout() {
  const location  = useLocation()
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast]         = useState<string | null>(null)
  const title = PAGE_TITLES[location.pathname] ?? 'APEX'

  const handleSuccess = useCallback(() => {
    setShowModal(false)
    setToast('OS criada com sucesso!')
  }, [])

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Sidebar desktop ──────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 w-[210px]"
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <ApexLogoMark size={38} />
          <div>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-primary)', lineHeight: 1 }}>
              APEX
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', color: 'var(--text-secondary)', lineHeight: 1, marginTop: 3 }}>
              AUTOBODY
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2" aria-label="Navegação principal">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <div
                  className="apex-nav-item flex items-center gap-3 py-3 rounded-lg mb-1 cursor-pointer"
                  style={{
                    background:  isActive ? 'var(--orange-dim)' : undefined,
                    borderLeft:  `3px solid ${isActive ? 'var(--orange)' : 'transparent'}`,
                    paddingLeft: isActive ? 13 : 16,
                    paddingRight: 16,
                  }}
                >
                  <Icon active={isActive} />
                  <span style={{
                    fontFamily:    'var(--font-heading)',
                    fontSize:      13,
                    fontWeight:    700,
                    letterSpacing: '0.06em',
                    color:         isActive ? 'var(--orange)' : 'var(--text-secondary)',
                    textTransform: 'uppercase',
                  }}>
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Configurações */}
        <div className="px-2 pb-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div className="apex-nav-item flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer">
            <IconSettings active={false} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Configurações
            </span>
          </div>
        </div>
      </aside>

      {/* ── Área principal ───────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar */}
        <header
          className="flex items-center justify-between flex-shrink-0 px-6 py-0 h-[64px]"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <ApexLogoMark size={30} />
            </div>
            <div className="flex items-center gap-3">
              <h1 style={{
                fontFamily:    'var(--font-heading)',
                fontSize:      20,
                fontWeight:    800,
                letterSpacing: '0.06em',
                color:         'var(--text-primary)',
                textTransform: 'uppercase',
                lineHeight:    1,
              }}>
                {title}
              </h1>
              <span
                className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-widest uppercase"
                style={{ background: 'var(--orange-dim)', color: 'var(--orange)', border: '1px solid var(--orange-border)', fontFamily: 'var(--font-heading)' }}
              >
                {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase().replace('.', '.')}
              </span>
            </div>
          </div>

          {/* Nova OS */}
          <button
            onClick={() => setShowModal(true)}
            className="apex-topbar-btn flex items-center gap-2 px-4 h-9 rounded-lg font-bold tracking-wide uppercase cursor-pointer"
            style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-heading)', fontSize: 13, letterSpacing: '0.06em' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Nova OS
          </button>
        </header>

        {/* Content */}
        <main
          className="flex-1 overflow-auto p-5 pb-[calc(1.25rem+70px)] md:pb-5"
          style={{ background: 'var(--bg-base)' }}
        >
          <Outlet />
        </main>
      </div>

      {/* ── Bottom nav mobile ─────────────────────────────────────────────── */}
      <nav
        aria-label="Navegação mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background:    'var(--bg-card)',
          borderTop:     '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <div
                className="relative flex flex-col items-center justify-center gap-1.5 py-3"
                style={{ color: isActive ? 'var(--orange)' : 'var(--text-muted)' }}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full"
                    style={{ background: 'var(--orange)' }}
                  />
                )}
                <Icon active={isActive} />
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'inherit' }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {showModal && (
        <NovaOSModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

// ─── Modal Nova OS ────────────────────────────────────────────────────────────
function NovaOSModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    cliente_nome: '', cliente_telefone: '',
    veiculo_placa: '', veiculo_modelo: '',
    veiculo_ano: String(new Date().getFullYear()),
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
      onSuccess()
    },
    onError: (e: Error) => setError(e.message),
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const canSubmit = ['cliente_nome','veiculo_placa','veiculo_modelo','descricao_servico'].every(k => form[k as keyof typeof form].trim())

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(11,14,17,0.90)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            Nova Ordem de Serviço
          </h2>
          <button
            onClick={onClose}
            className="apex-icon-btn w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer border-none"
            style={{ background: 'transparent', color: 'var(--text-muted)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
        {/* Form */}
        <div className="p-6 flex flex-col gap-5">
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
          {error && <p className="text-[11px]" style={{ color: 'var(--red)' }}>{error}</p>}
          <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
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