import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'destructive'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', style, ...props }, ref) => {
    const variantStyle: React.CSSProperties =
      variant === 'default'
        ? { background: 'var(--accent)', color: '#fff' }
        : variant === 'ghost'
        ? { background: 'transparent', color: 'var(--text-muted)' }
        : { background: 'rgba(153,27,27,0.15)', color: '#f87171', border: '1px solid rgba(153,27,27,0.3)' }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'hover:opacity-90': variant === 'default',
            'hover:bg-[var(--surface-2)] hover:!text-[var(--text)]': variant === 'ghost',
            'hover:opacity-80': variant === 'destructive',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-9 px-4 text-sm': size === 'md',
          },
          className
        )}
        style={{ ...variantStyle, ...style }}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
