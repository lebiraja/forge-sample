import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-md bg-[#111111] border border-[#222222] text-[#e5e5e5] placeholder:text-[#444444] px-3 py-2 text-sm outline-none transition-colors focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
