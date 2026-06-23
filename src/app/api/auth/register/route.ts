import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

const registerSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(6).max(128),
})

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    await connectDB()

    const existing = await User.findOne({ email: parsed.data.email })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(parsed.data.password, 12)
    await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashed,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
