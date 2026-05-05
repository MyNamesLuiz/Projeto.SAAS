import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'font-bold uppercase tracking-widest',
    'px-2 py-0.5 border whitespace-nowrap',
    'rounded-[4px]',
    'text-[8px]',
  ],
  {
    variants: {
      intent: {
        // status primário da marca
        gold:    [
          'bg-[--apex-gold-bg] text-[--apex-gold-bright] border-[--apex-gold-border]',
        ],
        white:   [
          'bg-[rgba(245,240,232,0.08)] text-[#F5F0E8] border-[rgba(245,240,232,0.15)]',
        ],
        alert:   ['bg-[--apex-danger-bg]  text-[--apex-danger]  border-[--apex-danger-b]'],
        warning: ['bg-[--apex-gold-bg]    text-[--apex-gold-bright] border-[--apex-gold-border]'],
        ok:      ['bg-[--apex-green-bg]   text-[--apex-green]   border-[rgba(0,229,160,0.2)]'],
        info:    ['bg-[--apex-blue-bg]    text-[--apex-blue]    border-[rgba(77,159,255,0.2)]'],
        neutral: ['bg-[--apex-card]       text-[--apex-muted]   border-[--apex-border-2]'],
        purple:  ['bg-[--apex-purple-bg]  text-[--apex-purple]  border-[rgba(191,128,255,0.2)]'],
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