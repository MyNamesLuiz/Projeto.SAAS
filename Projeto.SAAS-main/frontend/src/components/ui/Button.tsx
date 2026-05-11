import clsx from 'clsx'

type Intent = 'primary' | 'ghost' | 'danger' | 'subtle'
type Size   = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?:  Intent
  size?:    Size
  leftIcon?: React.ReactNode
}

const sizeClass: Record<Size, string> = {
  xs: 'apex-btn--xs',
  sm: 'apex-btn--sm',
  md: 'apex-btn--md',
  lg: 'apex-btn--lg',
}

const intentClass: Record<Intent, string> = {
  primary: 'apex-btn--primary',
  ghost:   'apex-btn--ghost',
  danger:  'apex-btn--danger',
  subtle:  'apex-btn--subtle',
}

/**
 * Button — hover gerenciado via CSS (.apex-btn--*:hover em index.css).
 * Sem useState, sem re-render por hover.
 */
export function Button({
  intent = 'ghost',
  size   = 'sm',
  leftIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx('apex-btn', sizeClass[size], intentClass[intent], className)}
      {...props}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
    </button>
  )
}