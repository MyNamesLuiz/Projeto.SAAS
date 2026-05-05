import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-bold uppercase tracking-widest',
    'cursor-pointer transition-all duration-150 border select-none',
    'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      intent: {
        primary: [
          'bg-[--apex-lime] text-[#090909] border-transparent',
          'hover:bg-[--apex-lime-dim] active:scale-[0.97]',
          'focus-visible:ring-[--apex-lime] focus-visible:ring-offset-[--apex-bg]',
          'rounded-[6px]',
        ],
        danger: [
          'bg-transparent text-[--apex-danger] border-[--apex-danger-b]',
          'hover:bg-[--apex-danger-bg] active:scale-[0.97]',
          'focus-visible:ring-[--apex-danger] focus-visible:ring-offset-[--apex-bg]',
          'rounded-[6px]',
        ],
        ghost: [
          'bg-transparent text-[--apex-muted] border-[--apex-border-2]',
          'hover:text-[--apex-text] hover:bg-[--apex-card] active:scale-[0.97]',
          'focus-visible:ring-[--apex-muted] focus-visible:ring-offset-[--apex-bg]',
          'rounded-[6px]',
        ],
        subtle: [
          'bg-[--apex-lime-bg] text-[--apex-lime] border-[--apex-lime-border]',
          'hover:bg-[rgba(200,245,0,0.12)] active:scale-[0.97]',
          'focus-visible:ring-[--apex-lime] focus-visible:ring-offset-[--apex-bg]',
          'rounded-[6px]',
        ],
      },
      size: {
        xs: ['text-[9px]',  'px-2',  'h-[24px]'],
        sm: ['text-[10px]', 'px-3',  'h-[30px]'],
        md: ['text-[11px]', 'px-4',  'h-[34px]'],
      },
    },
    defaultVariants: {
      intent: 'ghost',
      size: 'sm',
    },
  }
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({ intent, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(buttonVariants({ intent, size }), className)}
      {...props}
    />
  )
}