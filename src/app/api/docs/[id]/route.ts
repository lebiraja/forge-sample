import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Doc from '@/models/Doc'
import { generateSlug } from '@/lib/utils'

const updateDocSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  content: z.string().optional(),
  tags: z.array(z.string().trim()).optional(),
})

interface Params {
  params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const doc = await Doc.findOne({ _id: params.id, author: session.user.id }).lean()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: doc })
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: unknown = await req.json()
    const parsed = updateDocSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    await connectDB()

    const updates: Record<string, unknown> = { ...parsed.data }

    if (parsed.data.title) {
      const baseSlug = generateSlug(parsed.data.title) || 'untitled'
      let slug = baseSlug
      let counter = 1

      while (await Doc.findOne({ author: session.user.id, slug, _id: { $ne: params.id } })) {
        slug = `${baseSlug}-${counter++}`
      }

      updates.slug = slug
    }

    const doc = await Doc.findOneAndUpdate(
      { _id: params.id, author: session.user.id },
      { $set: updates },
      { new: true }
    ).lean()

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: doc })
  } catch (err) {
    console.error('[docs/PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const doc = await Doc.findOneAndDelete({ _id: params.id, author: session.user.id })

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: { deleted: true } })
}
