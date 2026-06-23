import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-[#1e1130] text-[#a78bfa] border border-[#3d2166]',
        className
      )}
    >
      {children}
    </span>
  )
}
