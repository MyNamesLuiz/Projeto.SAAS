import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

function ApexMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M4 38 L16 10 L22 10 L14 30 L24 30 L18 38 Z" fill="#FF6B00"/>
      <path d="M18 38 L28 10 L34 10 L22 38 Z" fill="#FF6B00"/>
      <path d="M26 10 L38 38 L32 38 L22 14 Z" fill="#FF6B00" opacity="0.85"/>
    </svg>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-apex-xs font-semibold text-secondary font-body-apex tracking-[0.03em] mb-1.5">
      {children}
    </label>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab]           = useState<'login' | 'register'>('login')
  const [email, setEmail]       = useState('')
  const [nome, setNome]         = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.login(email, password)
      localStorage.setItem('apex_token', result.token)
      localStorage.setItem('apex_user', JSON.stringify(result.user))
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.auth.register(email, nome, password)
      const result = await api.auth.login(email, password)
      localStorage.setItem('apex_token', result.token)
      localStorage.setItem('apex_user', JSON.stringify(result.user))
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">

      {/* Grid decorativo */}
      <svg aria-hidden className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.025]">
        <defs>
          <pattern id="login-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#FF6B00" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-grid)" />
      </svg>

      {/* Glow central */}
      <div className="fixed pointer-events-none"
        style={{
          top: '35%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 520, height: 340,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,107,0,0.06) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      {/* Card animado */}
      <div
        className="w-full max-w-sm sm:max-w-md relative"
        style={{
          opacity:   mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >
        {/* Linha laranja no topo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-[55%]"
          style={{ background: 'linear-gradient(90deg, transparent, var(--orange-border), transparent)' }}
        />

        <div className="bg-card border border-apex-strong rounded-apex-xl px-6 sm:px-8 pt-8 sm:pt-9 pb-6 sm:pb-7 shadow-[0_20px_60px_rgba(0,0,0,0.50)]">

          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="flex items-center justify-center w-14 h-14 rounded-apex-xl bg-orange-dim border border-orange mb-4">
              <ApexMark size={30} />
            </div>
            <h1 className="font-heading text-apex-lg font-extrabold tracking-[0.14em] text-primary uppercase leading-none">
              <span className="text-orange">APEX</span>{' '}AUTOBODY
            </h1>
            <p className="font-body-apex text-apex-xs text-muted tracking-[0.2em] uppercase mt-1.5">
              Sistema de Gestão
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-base rounded-apex-md p-[3px] mb-6 border border-apex">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={[
                  'flex-1 py-2 px-3 rounded-apex-sm border-none cursor-pointer',
                  'text-apex-xs font-bold font-heading tracking-[0.08em] uppercase',
                  'transition-all duration-200',
                  tab === t
                    ? 'bg-orange text-white shadow-[0_2px_10px_rgba(255,107,0,0.28)]'
                    : 'bg-transparent text-muted hover:text-secondary',
                ].join(' ')}
              >
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-3.5">
            {tab === 'register' && (
              <div>
                <FieldLabel>Nome completo</FieldLabel>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full px-3.5 py-2.5 rounded-apex-md text-apex-base outline-none font-body-apex"
                />
              </div>
            )}

            <div>
              <FieldLabel>E-mail</FieldLabel>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3.5 py-2.5 rounded-apex-md text-apex-base outline-none font-body-apex"
              />
            </div>

            <div>
              <FieldLabel>Senha</FieldLabel>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                required
                className="w-full px-3.5 py-2.5 rounded-apex-md text-apex-base outline-none font-body-apex"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-apex-md bg-red-dim border border-red font-body-apex text-apex-sm text-[#fc8181]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0">
                  <circle cx="7" cy="7" r="6" stroke="#fc8181" strokeWidth="1.4"/>
                  <line x1="7" y1="4" x2="7" y2="7.5" stroke="#fc8181" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="7" cy="9.5" r="0.65" fill="#fc8181"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="apex-btn apex-btn--primary apex-btn--lg w-full justify-center rounded-apex-md mt-1"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden
                    style={{ animation: 'apex-spin 0.9s linear infinite', transformOrigin: 'center' }}>
                    <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Aguarde...
                </>
              ) : (
                tab === 'login' ? 'Entrar no sistema' : 'Criar minha conta'
              )}
            </button>
          </form>

          <p className="text-center mt-5 pt-4 border-t border-apex text-2xs text-ghost font-body-apex tracking-[0.06em]">
            Ambiente seguro — APEX Autobody © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}