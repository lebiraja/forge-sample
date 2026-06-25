import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  selectedText: z.string().min(1),
  instruction: z.string().min(1),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { selectedText, instruction } = parsed.data

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content:
            'You are a writing assistant. Rewrite ONLY the provided text according to the instruction. Return ONLY the rewritten text — no explanations, no preamble, no quotes around the output.',
        },
        {
          role: 'user',
          content: `Instruction: ${instruction}\n\nText to rewrite:\n${selectedText}`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.5,
    }),
  })

  if (!res.ok) {
    console.error('[ai-inline] Groq error:', await res.text())
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 })
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
  }

  return NextResponse.json({ result: data.choices[0]?.message?.content ?? '' })
}
