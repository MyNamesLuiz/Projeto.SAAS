import React from 'react'
import clsx from 'clsx'

type Intent = 'primary' | 'ghost' | 'danger' | 'subtle'
type Size   = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: Intent
  size?:   Size
  leftIcon?: React.ReactNode
}

const sizeMap: Record<Size, string> = {
  xs: 'h-6  px-2   text-[10px]',
  sm: 'h-7  px-3   text-[11px]',
  md: 'h-9  px-4   text-[12px]',
  lg: 'h-10 px-5   text-[13px]',
}

export function Button({ intent = 'ghost', size = 'sm', leftIcon, className, children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-wide uppercase transition-all duration-150 cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed select-none'

  const styles: Record<Intent, React.CSSProperties> = {
    primary: { background: 'var(--orange)',   color: '#fff',                  border: 'none' },
    ghost:   { background: 'transparent',     color: 'var(--text-secondary)', borderColor: 'var(--border-strong)' },
    danger:  { background: 'transparent',     color: 'var(--red)',            borderColor: 'var(--red-border)' },
    subtle:  { background: 'var(--orange-dim)', color: 'var(--orange)',       borderColor: 'var(--orange-border)' },
  }

  const hoverStyles: Record<Intent, React.CSSProperties> = {
    primary: { background: 'var(--orange-hover)' },
    ghost:   { background: 'var(--bg-hover)', color: 'var(--text-primary)' },
    danger:  { background: 'var(--red-dim)' },
    subtle:  { background: 'rgba(255,107,0,0.20)' },
  }

  const [hovered, setHovered] = React.useState(false)

  return (
    <button
      className={clsx(base, sizeMap[size], className)}
      style={{ ...styles[intent], ...(hovered ? hoverStyles[intent] : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
    </button>
  )
}
