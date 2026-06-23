import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium', className)}
      style={{
        background: 'var(--accent-subtle)',
        color: 'var(--accent-text)',
        border: '1px solid var(--accent)',
        borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
      }}
    >
      {children}
    </span>
  )
}
