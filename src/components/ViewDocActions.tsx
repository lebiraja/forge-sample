'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface ViewDocActionsProps {
  docId: string
}

export function ViewDocActions({ docId }: ViewDocActionsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this document? This cannot be undone.')) return
    setDeleting(true)

    const res = await fetch(`/api/docs/${docId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/docs')
      router.refresh()
    } else {
      setDeleting(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className="gap-1.5"
    >
      <Trash2 size={13} />
      {deleting ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
