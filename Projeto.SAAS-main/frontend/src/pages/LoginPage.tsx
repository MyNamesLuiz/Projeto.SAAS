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

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab]           = useState<'login' | 'register'>('login')
  const [email, setEmail]       = useState('')
  const [nome, setNome]         = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t) }, [])

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
    <div style={{
      minHeight:       '100vh',
      background:      'var(--bg-base)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '24px',
      position:        'relative',
      overflow:        'hidden',
    }}>
      {/* Grid decorativo */}
      <svg aria-hidden style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', opacity: 0.025,
      }}>
        <defs>
          <pattern id="login-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#FF6B00" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-grid)" />
      </svg>

      {/* Glow central */}
      <div style={{
        position:      'fixed',
        top:           '35%',
        left:          '50%',
        transform:     'translate(-50%, -50%)',
        width:         520,
        height:        340,
        borderRadius:  '50%',
        background:    'radial-gradient(ellipse, rgba(255,107,0,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter:        'blur(30px)',
      }} />

      {/* Card */}
      <div style={{
        width:     '100%',
        maxWidth:  400,
        opacity:   mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition:'opacity 0.35s ease, transform 0.35s ease',
        position:  'relative',
      }}>
        {/* Linha laranja no topo */}
        <div style={{
          position:   'absolute',
          top:        0,
          left:       '50%',
          transform:  'translateX(-50%)',
          width:      '55%',
          height:     '1px',
          background: 'linear-gradient(90deg, transparent, var(--orange-border), transparent)',
        }} />

        <div style={{
          background:   'var(--bg-card)',
          border:       '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          padding:      '36px 32px 28px',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.50)',
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          54,
              height:         54,
              borderRadius:   'var(--radius-xl)',
              background:     'var(--orange-dim)',
              border:         '1px solid var(--orange-border)',
              marginBottom:   16,
            }}>
              <ApexMark size={30} />
            </div>
            <div style={{
              fontFamily:    'var(--font-heading)',
              fontSize:      'var(--text-lg)',
              fontWeight:    800,
              letterSpacing: '0.14em',
              color:         'var(--text-primary)',
              textTransform: 'uppercase',
              lineHeight:    1,
            }}>
              <span style={{ color: 'var(--orange)' }}>APEX</span>{' '}AUTOBODY
            </div>
            <div style={{
              fontFamily:    'var(--font-body)',
              fontSize:      'var(--text-xs)',
              color:         'var(--text-muted)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop:     6,
            }}>
              Sistema de Gestão
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display:      'flex',
            background:   'var(--bg-base)',
            borderRadius: 'var(--radius-md)',
            padding:      3,
            marginBottom: 24,
            border:       '1px solid var(--border)',
          }}>
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                style={{
                  flex:          1,
                  padding:       '8px 12px',
                  borderRadius:  'var(--radius-sm)',
                  border:        'none',
                  cursor:        'pointer',
                  fontSize:      'var(--text-xs)',
                  fontWeight:    700,
                  fontFamily:    'var(--font-heading)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition:    'all 0.18s',
                  background:    tab === t ? 'var(--orange)' : 'transparent',
                  color:         tab === t ? '#fff' : 'var(--text-muted)',
                  boxShadow:     tab === t ? '0 2px 10px rgba(255,107,0,0.28)' : 'none',
                }}
              >
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
            {tab === 'register' && (
              <div style={{ marginBottom: 14 }}>
                <FieldLabel>Nome completo</FieldLabel>
                <input
                  type="text" value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome completo" required
                  style={inputStyle}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <FieldLabel>E-mail</FieldLabel>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <FieldLabel>Senha</FieldLabel>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={tab === 'register' ? 'Mínimo 6 caracteres' : '••••••••'} required
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: 16,
                padding:      '10px 14px',
                borderRadius: 'var(--radius-md)',
                background:   'var(--red-dim)',
                border:       '1px solid var(--red-border)',
                color:        '#fc8181',
                fontSize:     'var(--text-sm)',
                fontFamily:   'var(--font-body)',
                display:      'flex',
                alignItems:   'center',
                gap:          8,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden style={{ flexShrink: 0 }}>
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
              className="apex-btn apex-btn--primary apex-btn--lg"
              style={{
                width:         '100%',
                opacity:       loading ? 0.6 : 1,
                cursor:        loading ? 'not-allowed' : 'pointer',
                justifyContent:'center',
                borderRadius:  'var(--radius-md)',
              }}
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

          <div style={{
            textAlign:   'center',
            marginTop:   20,
            fontSize:    'var(--text-2xs)',
            color:       'var(--text-ghost)',
            fontFamily:  'var(--font-body)',
            letterSpacing:'0.06em',
            paddingTop:  16,
            borderTop:   '1px solid var(--border)',
          }}>
            Ambiente seguro — APEX Autobody © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display:       'block',
      fontSize:      'var(--text-xs)',
      fontWeight:    600,
      color:         'var(--text-secondary)',
      marginBottom:  6,
      fontFamily:    'var(--font-body)',
      letterSpacing: '0.03em',
    }}>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '9px 13px',
  background:   'var(--bg-base)',
  border:       '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  color:        'var(--text-primary)',
  fontSize:     'var(--text-base)',
  outline:      'none',
  boxSizing:    'border-box',
  fontFamily:   'var(--font-body)',
}