import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import Doc, { type IDocDocument } from '@/models/Doc'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { type DocListItem } from '@/types'
import type { FlattenMaps } from 'mongoose'

type LeanDoc = FlattenMaps<IDocDocument> & { _id: { toString(): string } }

export default async function DocsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  await connectDB()
  const docs = await Doc.find({ author: session.user.id })
    .select('title tags updatedAt slug')
    .sort({ updatedAt: -1 })
    .lean<LeanDoc[]>()

  const docList: DocListItem[] = docs.map((d) => ({
    _id: d._id.toString(),
    title: d.title,
    tags: d.tags,
    updatedAt: (d.updatedAt as Date).toISOString(),
    slug: d.slug,
  }))

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Navbar userEmail={session.user.email} />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
        <Sidebar docs={docList} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <FileText size={20} style={{ color: 'var(--text-faint)' }} />
            </div>
            <h2 className="font-medium mb-1" style={{ color: 'var(--text)' }}>
              {docList.length === 0 ? 'No documents yet' : 'Select a document'}
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-faint)' }}>
              {docList.length === 0
                ? 'Create your first document to get started'
                : 'Pick one from the sidebar or create a new one'}
            </p>
            <Link href="/docs/new">
              <Button size="sm">Create your first document</Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
