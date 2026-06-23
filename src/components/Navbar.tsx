'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface NavbarProps {
  userEmail?: string | null
}

export function Navbar({ userEmail }: NavbarProps) {
  return (
    <header className="h-12 border-b border-[#222222] flex items-center justify-between px-4 bg-[#0a0a0a] sticky top-0 z-10">
      <span className="text-sm font-semibold text-white tracking-tight">Forge Docs</span>
      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="text-xs text-[#666666] hidden sm:block">{userEmail}</span>
        )}
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
