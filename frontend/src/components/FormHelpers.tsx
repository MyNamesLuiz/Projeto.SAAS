import React, { useId } from 'react'

export function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-none p-0 m-0 min-w-0">
      <legend
        className="block w-full mb-3 pb-2 text-[10px] font-semibold tracking-widest uppercase"
        style={{
          fontFamily:   'var(--font-heading)',
          color:        'var(--text-muted)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {label}
      </legend>
      {children}
    </fieldset>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId()
  const child = React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)
    ? React.cloneElement(children, { id })
    : children
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-medium tracking-wide"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
      >
        {label}
      </label>
      {child}
    </div>
  )
}

export const inputCls =
  'w-full rounded-lg px-3 py-2 text-[12px] outline-none ' +
  'border transition-all duration-150 bg-[var(--bg-card)] ' +
  'text-[var(--text-primary)] placeholder-[var(--text-muted)] ' +
  'border-[var(--border-strong)] focus:border-[var(--orange)] ' +
  'focus:ring-2 focus:ring-[var(--orange-dim)]'
