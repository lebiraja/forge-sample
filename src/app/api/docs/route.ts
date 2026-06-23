import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Doc from '@/models/Doc'
import { generateSlug } from '@/lib/utils'

const createDocSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  content: z.string().default(''),
  tags: z.array(z.string().trim()).default([]),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const docs = await Doc.find({ author: session.user.id })
    .select('title tags updatedAt slug')
    .sort({ updatedAt: -1 })
    .lean()

  return NextResponse.json({ data: docs })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: unknown = await req.json()
    const parsed = createDocSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    await connectDB()

    const baseSlug = generateSlug(parsed.data.title) || 'untitled'
    let slug = baseSlug
    let counter = 1

    while (await Doc.findOne({ author: session.user.id, slug })) {
      slug = `${baseSlug}-${counter++}`
    }

    const doc = await Doc.create({
      title: parsed.data.title,
      content: parsed.data.content,
      tags: parsed.data.tags,
      author: session.user.id,
      slug,
    })

    return NextResponse.json({ data: doc }, { status: 201 })
  } catch (err) {
    console.error('[docs/POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
