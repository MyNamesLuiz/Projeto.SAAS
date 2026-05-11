import { useState, useEffect } from 'react'
import '../style-preloader/preloader.css'

interface PreloaderProps {
  minDuration?: number
  onDone?: () => void // Callback opcional para quando o preloader terminar
}

// Floating micro-particles
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 7.5) % 84}%`,
  top: `${20 + (i * 13) % 60}%`,
  dur: `${2.5 + (i % 4) * 0.7}s`,
  delay: `${(i * 0.35) % 2.8}s`,
  rise: `${-60 - (i % 3) * 30}px`,
}))

export default function Preloader({ minDuration = 2400, onDone }: PreloaderProps) {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    // Animate percent counter
    const steps = [
      { val: 18, delay: 300 },
      { val: 52, delay: 700 },
      { val: 78, delay: 1300 },
      { val: 91, delay: 1800 },
      { val: 100, delay: minDuration - 300 },
    ]
    const timers: ReturnType<typeof setTimeout>[] = []
    steps.forEach(({ val, delay }) => {
      timers.push(setTimeout(() => setPercent(val), delay))
    })

    // Trigger fade-out then unmount
    const fadeTimer = setTimeout(() => setFadeOut(true), minDuration)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, minDuration + 650)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [minDuration, onDone])

  if (!visible) return null

  return (
    <div className={`preloader-overlay${fadeOut ? ' fade-out' : ''}`} aria-label="Carregando APEX Autobody">
      {/* Floating particles */}
      <div className="preloader-particles" aria-hidden>
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="preloader-particle"
            style={{
              left: p.left,
              top: p.top,
              '--dur': p.dur,
              '--delay': p.delay,
              '--rise': p.rise,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="preloader-logo">
        <div className="preloader-brand">
          <span>APEX</span> AUTOBODY
        </div>
        <div className="preloader-sub">Sistema de Gestão Automotiva</div>
      </div>

      {/* Spinner */}
      <div className="preloader-spinner-wrap" aria-hidden>
        <div className="preloader-spinner" />
        <div className="preloader-spinner-inner" />
      </div>

      {/* Progress */}
      <div className="preloader-progress-wrap">
        <div className="preloader-progress-track">
          <div className="preloader-progress-bar" />
        </div>
        <div className="preloader-status">
          <span className="preloader-status-text">Carregando sistema...</span>
          <span className="preloader-percent">{percent}%</span>
        </div>
      </div>
    </div>
  )
}
