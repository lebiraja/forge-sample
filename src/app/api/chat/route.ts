import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const DOC_TRIGGERS = /\b(write|create|draft|generate|make)\b.{0,40}\b(doc|document|page|article|guide|readme|spec|notes?)\b/i

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages } = (await req.json()) as { messages: Message[] }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  const isDocRequest = DOC_TRIGGERS.test(lastUserMessage)

  const systemPrompt = isDocRequest
    ? `You are a writing assistant built into Forge Docs. The user wants you to write a document.
Output a complete, well-structured markdown document with a clear # Title at the top, followed by sections with ## headings, bullet lists, and code blocks where appropriate.
Be thorough and detailed. Return ONLY the markdown document, no preamble or explanation.`
    : `You are a helpful writing assistant built into Forge Docs. Help users write, edit, and improve their documentation. Be concise and direct.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: isDocRequest ? 4096 : 1024,
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

  const content = data.choices[0]?.message?.content ?? ''

  return NextResponse.json({ content, isDocument: isDocRequest })
}
