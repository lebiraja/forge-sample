import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { AGENT_TOOLS, runTool } from '@/lib/agent-tools'

interface ClientMessage {
  role: 'user' | 'assistant'
  content: string
}

// Groq message shape (superset — includes tool roles)
interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface DocRef {
  id: string
  title: string
  action: 'created' | 'updated'
}

const SYSTEM_PROMPT = `You are an autonomous writing agent built into Forge Docs, a markdown documentation app.

You have direct access to the user's documents through tools. Use them proactively to fulfill requests end-to-end:
- To answer questions about existing docs, use search_docs or list_docs, then read_doc.
- When the user asks you to write/draft/generate a document, write the full markdown yourself and call create_doc to save it.
- When the user asks to edit/revise/append to a doc, read it first, then call update_doc with the new content.
- For summaries across multiple docs, list or search them, read the relevant ones, then synthesize.

Always take action rather than telling the user how to do it themselves. After using tools, give a short, friendly confirmation of what you did. Keep chat replies concise and use markdown. Do not invent document ids — only use ids returned by tools.`

const MAX_TOOL_ROUNDS = 6

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callGroq(messages: GroqMessage[], attempt = 0): Promise<GroqMessage> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
      max_tokens: 2048,
      temperature: 0.6,
    }),
  })

  // Retry on rate limit (free tier TPM) — respect Retry-After, up to 3 attempts
  if (res.status === 429 && attempt < 3) {
    const retryAfter = Number(res.headers.get('retry-after')) || 2
    await sleep(retryAfter * 1000 + 250)
    return callGroq(messages, attempt + 1)
  }

  if (!res.ok) {
    throw new Error(`Groq error ${res.status}: ${await res.text()}`)
  }

  const data = (await res.json()) as {
    choices: { message: GroqMessage }[]
  }
  return data.choices[0].message
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const { messages: clientMessages } = (await req.json()) as { messages: ClientMessage[] }

  // Keep only the recent turns to stay within free-tier token limits
  const recentClient = clientMessages.slice(-6)

  const messages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...recentClient.map((m) => ({ role: m.role, content: m.content })),
  ]

  const toolsUsed: string[] = []
  const docRefs: DocRef[] = []

  try {
    let rounds = 0
    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++
      const assistantMsg = await callGroq(messages)

      // No tool calls → final answer
      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        return NextResponse.json({
          content: assistantMsg.content ?? '',
          toolsUsed,
          docRefs,
        })
      }

      // Record the assistant's tool-call message, then execute each tool
      messages.push({
        role: 'assistant',
        content: assistantMsg.content ?? '',
        tool_calls: assistantMsg.tool_calls,
      })

      for (const tc of assistantMsg.tool_calls) {
        let parsedArgs: Record<string, unknown> = {}
        try {
          parsedArgs = JSON.parse(tc.function.arguments || '{}')
        } catch {
          parsedArgs = {}
        }

        toolsUsed.push(tc.function.name)
        const { result, docRef } = await runTool(tc.function.name, parsedArgs, userId)
        if (docRef) docRefs.push(docRef)

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: tc.function.name,
          content: result,
        })
      }
    }

    // Hit the round cap — ask for a final summary without tools
    const finalMsg = await callGroq([
      ...messages,
      { role: 'user', content: 'Summarize what you did for me in one short message.' },
    ])
    return NextResponse.json({
      content: finalMsg.content ?? 'Done.',
      toolsUsed,
      docRefs,
    })
  } catch (err) {
    console.error('[chat] agent error:', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 })
  }
}
