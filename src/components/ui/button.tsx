import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'destructive'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-[#7c3aed] text-white hover:bg-[#6d28d9]': variant === 'default',
            'text-[#999999] hover:text-white hover:bg-[#1a1a1a]': variant === 'ghost',
            'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50':
              variant === 'destructive',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-9 px-4 text-sm': size === 'md',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
