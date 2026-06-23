'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

interface NavbarProps {
  userEmail?: string | null
}

export function Navbar({ userEmail }: NavbarProps) {
  const { theme, toggle } = useTheme()

  return (
    <header
      className="h-12 flex items-center justify-between px-4 sticky top-0 z-10"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
    >
      <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
        Forge Docs
      </span>
      <div className="flex items-center gap-2">
        {userEmail && (
          <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {userEmail}
          </span>
        )}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="h-8 w-8 rounded-md flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
          }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="gap-1.5"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  )
}
