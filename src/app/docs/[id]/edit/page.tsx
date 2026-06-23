import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import Doc, { type IDocDocument } from '@/models/Doc'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { DocEditor } from '@/components/DocEditor'
import { type DocListItem, type IDoc } from '@/types'
import type { FlattenMaps } from 'mongoose'

interface Props {
  params: { id: string }
}

type LeanDoc = FlattenMaps<IDocDocument> & { _id: { toString(): string } }

export default async function EditDocPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  await connectDB()

  const [doc, allDocs] = await Promise.all([
    Doc.findOne({ _id: params.id, author: session.user.id }).lean<LeanDoc>(),
    Doc.find({ author: session.user.id })
      .select('title tags updatedAt slug')
      .sort({ updatedAt: -1 })
      .lean<LeanDoc[]>(),
  ])

  if (!doc) notFound()

  const docList: DocListItem[] = allDocs.map((d) => ({
    _id: d._id.toString(),
    title: d.title,
    tags: d.tags,
    updatedAt: (d.updatedAt as Date).toISOString(),
    slug: d.slug,
  }))

  const docData: IDoc = {
    _id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    tags: doc.tags,
    author: session.user.id,
    slug: doc.slug,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Navbar userEmail={session.user.email} />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
        <Sidebar docs={docList} />
        <main className="flex-1 overflow-hidden">
          <DocEditor doc={docData} />
        </main>
      </div>
    </div>
  )
}
