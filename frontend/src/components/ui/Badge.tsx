import React from 'react'

type BadgeIntent = 'orange' | 'green' | 'red' | 'amber' | 'blue' | 'neutral'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  intent?: BadgeIntent
  dot?: boolean
}

const intentMap: Record<BadgeIntent, React.CSSProperties> = {
  orange:  { background: 'var(--orange-dim)',  color: 'var(--orange)',  borderColor: 'var(--orange-border)' },
  green:   { background: 'var(--green-dim)',   color: 'var(--green)',   borderColor: 'var(--green-border)' },
  red:     { background: 'var(--red-dim)',     color: 'var(--red)',     borderColor: 'var(--red-border)' },
  amber:   { background: 'var(--amber-dim)',   color: 'var(--amber)',   borderColor: 'var(--amber-border)' },
  blue:    { background: 'var(--blue-dim)',    color: 'var(--blue)',    borderColor: 'var(--blue-border)' },
  neutral: { background: 'var(--bg-hover)',    color: 'var(--text-secondary)', borderColor: 'var(--border-strong)' },
}

export function Badge({ intent = 'neutral', dot, className, children, style, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border whitespace-nowrap ${className ?? ''}`}
      style={{ fontFamily: 'var(--font-body)', ...intentMap[intent], ...style }}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'currentColor' }} />
      )}
      {children}
    </span>
  )
}
