'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type DocListItem } from '@/types'
import { formatRelativeTime, cn } from '@/lib/utils'

interface SidebarProps {
  docs: DocListItem[]
}

export function Sidebar({ docs }: SidebarProps) {
  const [search, setSearch] = useState('')
  const pathname = usePathname()

  const filtered = docs.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className="w-[260px] shrink-0 border-r border-[#222222] h-full flex flex-col bg-[#0a0a0a]">
      <div className="p-3 border-b border-[#222222]">
        <Link href="/docs/new">
          <Button className="w-full gap-2" size="sm">
            <PlusIcon size={14} />
            New document
          </Button>
        </Link>
      </div>

      <div className="p-3 border-b border-[#222222]">
        <div className="relative">
          <SearchIcon
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#444444] pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search docs..."
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-1.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-[#444444] px-2 py-3 text-center">
            {search ? 'No results' : 'No documents yet'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((doc) => {
              const href = `/docs/${doc._id}`
              const isActive = pathname === href || pathname === `${href}/edit`

              return (
                <li key={doc._id}>
                  <Link
                    href={href}
                    className={cn(
                      'flex flex-col gap-0.5 px-2.5 py-2 rounded-md text-sm transition-colors group',
                      isActive
                        ? 'bg-[#1a1130] text-white'
                        : 'text-[#999999] hover:bg-[#141414] hover:text-[#e5e5e5]'
                    )}
                  >
                    <span className="truncate text-[13px] font-medium leading-tight">
                      {doc.title}
                    </span>
                    <span className="text-[11px] text-[#555555]">
                      {formatRelativeTime(doc.updatedAt)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>
    </aside>
  )
}
