import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      // Auto-login after register
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
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 600px 400px at 50% 40%, rgba(255,107,0,0.06) 0%, transparent 70%)',
      }} />

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '36px 32px',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22, fontWeight: 800, letterSpacing: '0.15em',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
          }}>
            <span style={{ color: 'var(--orange)' }}>APEX</span> AUTOBODY
          </div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'var(--text-muted)', letterSpacing: '0.25em',
            textTransform: 'uppercase', marginTop: 6,
          }}>
            Sistema de Gestão v2
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'var(--bg-base)',
          borderRadius: 8, padding: 4, marginBottom: 28,
          border: '1px solid var(--border)',
        }}>
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 6,
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s',
                background: tab === t ? 'var(--orange)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-muted)',
              }}
            >
              {t === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
          {tab === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                Nome completo
              </label>
              <input
                type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Seu nome" required
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              E-mail
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Senha
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={tab === 'register' ? 'Mínimo 6 caracteres' : '••••••••'} required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 8,
              background: 'var(--red-dim)', border: '1px solid var(--red-border)',
              color: '#fc8181', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? 'rgba(255,107,0,0.5)' : 'var(--orange)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.05em', transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,0,0.35)',
            }}
          >
            {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar no sistema' : 'Criar minha conta'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-muted)' }}>
          Ambiente seguro — APEX Autobody © 2025
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'var(--bg-base)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
  fontFamily: 'var(--font-body)',
}
