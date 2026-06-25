'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  Maximize2,
  Minimize2,
  Expand,
  FileText,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isDocument?: boolean
}

type PanelSize = 'normal' | 'expanded' | 'fullscreen'

const PANEL_SIZES: Record<PanelSize, React.CSSProperties> = {
  normal: { width: 380, height: 520, bottom: 80, right: 16, borderRadius: 16 },
  expanded: {
    width: 680,
    height: 600,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bottom: 'auto',
    right: 'auto',
    borderRadius: 16,
  },
  fullscreen: {
    inset: 0,
    width: '100%',
    height: '100%',
    bottom: 'auto',
    right: 'auto',
    borderRadius: 0,
  },
}

export function ChatBubble() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [size, setSize] = useState<PanelSize>('normal')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [creatingDoc, setCreatingDoc] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      inputRef.current?.focus()
    }
  }, [open, messages])

  // ESC closes fullscreen first, then panel
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (size === 'fullscreen') setSize('normal')
        else if (size === 'expanded') setSize('normal')
        else setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [size, open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto'

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      })
      const data = (await res.json()) as { content?: string; isDocument?: boolean; error?: string }
      if (data.content) {
        setMessages([...next, { role: 'assistant', content: data.content, isDocument: data.isDocument }])
      }
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  async function createDocFromMessage(content: string, index: number) {
    setCreatingDoc(index)
    try {
      // Extract title from first # heading or first line
      const firstLine = content.split('\n').find((l) => l.trim())?.replace(/^#+\s*/, '') ?? 'Untitled'
      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: firstLine.slice(0, 100), content }),
      })
      const data = (await res.json()) as { data?: { _id: string }; error?: string }
      if (data.data?._id) {
        router.push(`/docs/${data.data._id}/edit`)
      }
    } finally {
      setCreatingDoc(null)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const iconButtonStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    color: 'var(--text-muted)',
    background: 'transparent',
    ...extra,
  })

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden shadow-2xl"
          style={{
            ...PANEL_SIZES[size],
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            transition: 'width 0.2s, height 0.2s, inset 0.2s',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                <Bot size={13} color="#fff" />
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Writing Assistant
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              {/* Expand / fullscreen toggle */}
              {size === 'normal' && (
                <button
                  onClick={() => setSize('expanded')}
                  title="Expand"
                  className="rounded-md p-1.5 transition-colors"
                  style={iconButtonStyle()}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                >
                  <Maximize2 size={13} />
                </button>
              )}
              {size === 'expanded' && (
                <>
                  <button
                    onClick={() => setSize('fullscreen')}
                    title="Fullscreen"
                    className="rounded-md p-1.5 transition-colors"
                    style={iconButtonStyle()}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                  >
                    <Expand size={13} />
                  </button>
                  <button
                    onClick={() => setSize('normal')}
                    title="Minimize"
                    className="rounded-md p-1.5 transition-colors"
                    style={iconButtonStyle()}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                  >
                    <Minimize2 size={13} />
                  </button>
                </>
              )}
              {size === 'fullscreen' && (
                <button
                  onClick={() => setSize('normal')}
                  title="Exit fullscreen"
                  className="rounded-md p-1.5 transition-colors"
                  style={iconButtonStyle()}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                >
                  <Minimize2 size={13} />
                </button>
              )}
              <button
                onClick={() => { setOpen(false); setSize('normal') }}
                title="Close"
                className="rounded-md p-1.5 transition-colors"
                style={iconButtonStyle()}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border)' }}
                >
                  <Bot size={22} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Ask me anything
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    I can help you write, edit, or improve your docs.<br />
                    Try: <em>&quot;Write a doc about REST APIs&quot;</em>
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className="max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { background: 'var(--accent)', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }
                  }
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="chat-prose">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Create doc button for document responses */}
                {msg.role === 'assistant' && msg.isDocument && (
                  <button
                    onClick={() => createDocFromMessage(msg.content, i)}
                    disabled={creatingDoc === i}
                    className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-60"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', border: '1px solid var(--border)' }}
                  >
                    {creatingDoc === i ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <FileText size={12} />
                    )}
                    {creatingDoc === i ? 'Creating…' : 'Open in Editor →'}
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-2.5 flex items-center gap-2"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <Loader2 size={13} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Thinking…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="px-4 py-3 shrink-0"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything… (Enter to send)"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
                style={{ color: 'var(--text)', maxHeight: size === 'fullscreen' ? 200 : 96, overflow: 'auto' }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = `${Math.min(el.scrollHeight, size === 'fullscreen' ? 200 : 96)}px`
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="rounded-lg p-1.5 shrink-0 transition-opacity disabled:opacity-30"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                <Send size={14} />
              </button>
            </div>
            <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--text-faint)' }}>
              Powered by Groq · Shift+Enter for new line · ESC to close
            </p>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'var(--accent)', color: '#fff' }}
        title="Writing Assistant"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  )
}
