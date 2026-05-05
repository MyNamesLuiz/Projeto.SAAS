import React, { useId } from 'react'

export function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-none p-0 m-0 min-w-0">
      <legend
        className="mb-2 w-full"
        style={{
          fontFamily: 'var(--f-body)',
          fontSize: 9, fontWeight: 700,
          color: 'var(--apex-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
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
    <div>
      <label
        htmlFor={id}
        className="block mb-1 cursor-pointer"
        style={{
          fontFamily: 'var(--f-body)',
          fontSize: 10, fontWeight: 600,
          color: 'var(--apex-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </label>
      {child}
    </div>
  )
}

export const inputCls =
  'w-full rounded-[6px] px-3 py-2 ' +
  'text-[12px] outline-none transition-all duration-150 ' +
  'font-[family-name:var(--f-body)] ' +
  '[background:var(--apex-card)] ' +
  '[border:1px_solid_var(--apex-border-2)] ' +
  '[color:var(--apex-text)] ' +
  'placeholder:[color:var(--apex-muted-2)] ' +
  'focus:[border-color:var(--apex-lime)] ' +
  'focus-visible:ring-1 focus-visible:ring-[var(--apex-lime)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--apex-bg)]'