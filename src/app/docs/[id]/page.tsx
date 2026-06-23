import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import Doc, { type IDocDocument } from '@/models/Doc'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Edit2 } from 'lucide-react'
import { type DocListItem } from '@/types'
import { ViewDocActions } from '@/components/ViewDocActions'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { FlattenMaps } from 'mongoose'

interface Props {
  params: { id: string }
}

type LeanDoc = FlattenMaps<IDocDocument> & { _id: { toString(): string } }

export default async function ViewDocPage({ params }: Props) {
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar userEmail={session.user.email} />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
        <Sidebar docs={docList} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-white mb-2">{doc.title}</h1>
                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Link href={`/docs/${params.id}/edit`}>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Edit2 size={13} />
                    Edit
                  </Button>
                </Link>
                <ViewDocActions docId={params.id} />
              </div>
            </div>

            <div className="prose-dark max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {doc.content || '*No content yet. Click Edit to start writing.*'}
              </ReactMarkdown>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
