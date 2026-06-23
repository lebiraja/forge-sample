import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import Doc from '@/models/Doc'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { DocEditor } from '@/components/DocEditor'
import { type DocListItem } from '@/types'

export default async function NewDocPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  await connectDB()
  const docs = await Doc.find({ author: session.user.id })
    .select('title tags updatedAt slug')
    .sort({ updatedAt: -1 })
    .lean()

  const docList: DocListItem[] = docs.map((d) => ({
    _id: (d._id as { toString(): string }).toString(),
    title: d.title,
    tags: d.tags,
    updatedAt: d.updatedAt.toISOString(),
    slug: d.slug,
  }))

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar userEmail={session.user.email} />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
        <Sidebar docs={docList} />
        <main className="flex-1 overflow-hidden">
          <DocEditor />
        </main>
      </div>
    </div>
  )
}
