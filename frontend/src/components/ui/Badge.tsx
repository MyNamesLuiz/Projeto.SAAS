import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'font-bold uppercase tracking-widest',
    'px-2 py-0.5 border whitespace-nowrap',
    'rounded-[4px]',
  ],
  {
    variants: {
      intent: {
        alert:   ['bg-[--apex-danger-bg]  text-[--apex-danger]  border-[--apex-danger-b]',  'text-[8px]'],
        warning: ['bg-[--apex-warning-bg] text-[--apex-warning] border-[rgba(245,166,35,0.2)]', 'text-[8px]'],
        ok:      ['bg-[--apex-green-bg]   text-[--apex-green]   border-[rgba(0,229,160,0.2)]',  'text-[8px]'],
        info:    ['bg-[--apex-blue-bg]    text-[--apex-blue]    border-[rgba(77,159,255,0.2)]',  'text-[8px]'],
        neutral: ['bg-[--apex-card]       text-[--apex-muted]   border-[--apex-border-2]',       'text-[8px]'],
        lime:    ['bg-[--apex-lime-bg]    text-[--apex-lime]    border-[--apex-lime-border]',     'text-[8px]'],
      },
    },
    defaultVariants: {
      intent: 'neutral',
    },
  }
)

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>

export function Badge({ intent, className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(badgeVariants({ intent }), className)}
      {...props}
    />
  )
}