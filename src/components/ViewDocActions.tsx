'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Download } from 'lucide-react'

interface ViewDocActionsProps {
  docId: string
}

export function ViewDocActions({ docId }: ViewDocActionsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

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

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/docs/${docId}/download`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? 'document.docx'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={downloading}
        className="gap-1.5"
      >
        <Download size={13} />
        {downloading ? 'Downloading...' : 'Download'}
      </Button>
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
    </div>
  )
}
