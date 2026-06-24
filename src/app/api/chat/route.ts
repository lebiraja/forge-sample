import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages } = (await req.json()) as { messages: Message[] }

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
            'You are a helpful writing assistant built into Forge Docs. Help users write, edit, and improve their documentation. Be concise and direct.',
        },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[chat] Groq error:', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 })
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
  }

  return NextResponse.json({ content: data.choices[0]?.message?.content ?? '' })
}
