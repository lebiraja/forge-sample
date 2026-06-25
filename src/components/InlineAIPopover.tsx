'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Sparkles, X, Check, Wand2 } from 'lucide-react'

interface InlineAIPopoverProps {
  selectedText: string
  cursorX: number
  cursorY: number
  onAccept: (result: string) => void
  onCancel: () => void
}

export function InlineAIPopover({
  selectedText,
  cursorX,
  cursorY,
  onAccept,
  onCancel,
}: InlineAIPopoverProps) {
  const [cmd, setCmd] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Position popover just below the cursor, clamped to viewport
  const POPOVER_WIDTH = 420
  const OFFSET_Y = 24 // px below the cursor line
  const viewW = typeof window !== 'undefined' ? window.innerWidth : 1200
  const viewH = typeof window !== 'undefined' ? window.innerHeight : 800
  const left = Math.max(8, Math.min(cursorX, viewW - POPOVER_WIDTH - 8))
  // If cursor is in the bottom half, show above instead
  const showAbove = cursorY > viewH * 0.6
  const top = showAbove ? cursorY - OFFSET_Y - 320 : cursorY + OFFSET_Y

  async function runAI() {
    if (!cmd.trim()) return
    setLoading(true)
    setError('')
    setPreview(null)

    try {
      const res = await fetch('/api/ai-inline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText: selectedText || 'the current paragraph',
          instruction: cmd.trim(),
        }),
      })
      const data = (await res.json()) as { result?: string; error?: string }
      if (!res.ok || !data.result) {
        setError(data.error ?? 'AI request failed')
      } else {
        setPreview(data.result)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); void runAI() }
    if (e.key === 'Escape') { e.stopPropagation(); onCancel() }
  }

  const hasContext = selectedText.trim().length > 0

  return (
    <>
      {/* Backdrop — clicking outside cancels */}
      <div className="fixed inset-0 z-[99]" onClick={onCancel} />

      <div
        className="fixed z-[100] flex flex-col overflow-hidden shadow-2xl"
        style={{
          top,
          left,
          width: POPOVER_WIDTH,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Selected text context chip */}
        {hasContext && (
          <div
            className="px-3 pt-3 pb-2"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <p className="text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: 'var(--text-faint)' }}>
              Selected text
            </p>
            <p
              className="text-xs leading-relaxed line-clamp-3 rounded-md px-2 py-1.5 font-mono"
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent-text)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
            >
              {selectedText.length > 200 ? selectedText.slice(0, 200) + '…' : selectedText}
            </p>
          </div>
        )}

        {/* Prompt input */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Wand2 size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={handleKey}
            placeholder={hasContext ? 'Improve this, make it formal, simplify…' : 'What should I write here?'}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text)' }}
            disabled={loading}
          />
          {loading
            ? <Loader2 size={14} className="animate-spin shrink-0" style={{ color: 'var(--accent)' }} />
            : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => void runAI()}
                  disabled={!cmd.trim()}
                  className="text-xs px-2.5 py-1 rounded-md disabled:opacity-40 transition-opacity"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  Run
                </button>
                <button onClick={onCancel} className="rounded p-1" style={{ color: 'var(--text-faint)' }}>
                  <X size={13} />
                </button>
              </div>
            )
          }
        </div>

        {/* Preview */}
        {preview && (
          <div className="px-3 pb-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[10px] uppercase tracking-wider font-medium pt-2" style={{ color: 'var(--text-faint)' }}>
              Preview
            </p>
            <div
              className="text-sm leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md px-2.5 py-2 font-mono"
              style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              {preview}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancel}
                className="text-xs px-3 py-1.5 rounded-md"
                style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                Discard
              </button>
              <button
                onClick={() => onAccept(preview)}
                className="text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                <Check size={12} />
                Accept & Replace
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="px-3 pb-3">
            <p className="text-xs text-red-400 flex items-center gap-1">
              <Sparkles size={11} /> {error}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
