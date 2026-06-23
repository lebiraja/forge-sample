'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { type DocListItem } from '@/types'

export function DocList() {
  const [docs, setDocs] = useState<DocListItem[]>([])

  useEffect(() => {
    fetch('/api/docs')
      .then((r) => r.json() as Promise<{ data: DocListItem[] }>)
      .then(({ data }) => setDocs(data ?? []))
      .catch(console.error)
  }, [])

  return <Sidebar docs={docs} />
}
