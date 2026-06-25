'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Link2,
  Code,
  CodeSquare,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { InlineAIPopover } from '@/components/InlineAIPopover'
import { type IDoc } from '@/types'

interface DocEditorProps {
  doc?: IDoc
}

type SaveStatus = 'idle' | 'saving' | 'saved'

interface AIPopoverState {
  selectedText: string
  replaceStart: number
  replaceEnd: number
  // Pixel position of the cursor within the viewport
  cursorX: number
  cursorY: number
  triggerStart: number
}

export function DocEditor({ doc }: DocEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(doc?.title ?? '')
  const [content, setContent] = useState(doc?.content ?? '')
  const [tagsInput, setTagsInput] = useState(doc?.tags.join(', ') ?? '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState('')
  const [aiPopover, setAiPopover] = useState<AIPopoverState | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // We snapshot the selection the moment the user starts typing @ai
  const savedSelectionRef = useRef<{ start: number; end: number } | null>(null)

  // Returns the {x, y} viewport pixel coords of the character at `offset` in the textarea
  function getCaretCoords(textarea: HTMLTextAreaElement, offset: number): { x: number; y: number } {
    const mirror = document.createElement('div')
    const style = window.getComputedStyle(textarea)
    ;[
      'boxSizing','width','height','paddingTop','paddingRight','paddingBottom','paddingLeft',
      'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
      'fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','whiteSpace',
      'wordBreak','overflowWrap','tabSize',
    ].forEach((prop) => { mirror.style.setProperty(prop, style.getPropertyValue(prop)) })
    mirror.style.position = 'absolute'
    mirror.style.visibility = 'hidden'
    mirror.style.overflow = 'hidden'
    mirror.style.top = '-9999px'
    mirror.style.whiteSpace = 'pre-wrap'

    const text = textarea.value.slice(0, offset)
    mirror.textContent = text

    const caret = document.createElement('span')
    caret.textContent = '​'
    mirror.appendChild(caret)
    document.body.appendChild(mirror)

    const mirrorRect = mirror.getBoundingClientRect()
    const caretRect = caret.getBoundingClientRect()
    document.body.removeChild(mirror)

    const taRect = textarea.getBoundingClientRect()
    const x = taRect.left + (caretRect.left - mirrorRect.left)
    const y = taRect.top + (caretRect.top - mirrorRect.top) - textarea.scrollTop

    return { x, y }
  }

  const parsedTags = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const insertMarkdown = useCallback(
    (prefix: string, suffix = '') => {
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = content.slice(start, end)
      const replacement = `${prefix}${selected || 'text'}${suffix}`
      setContent(content.slice(0, start) + replacement + content.slice(end))
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + (selected || 'text').length
        )
      }, 0)
    },
    [content]
  )

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newContent = e.target.value
    const cursor = e.target.selectionEnd

    // Check if the text just typed ends with "@ai" (possibly with a space after)
    const textUpToCursor = newContent.slice(0, cursor)
    const atAiMatch = textUpToCursor.match(/@ai$/)

    if (atAiMatch && !aiPopover) {
      const triggerStart = cursor - 3 // position of '@'
      const textarea = e.target

      // Snapshot what was selected BEFORE the user typed @ai
      // (savedSelectionRef is set on keydown before the value changes)
      const savedSel = savedSelectionRef.current
      const hadSelection = savedSel && savedSel.start !== savedSel.end && savedSel.end <= triggerStart + 3

      let selectedText = ''
      let replaceStart = 0
      let replaceEnd = 0

      if (hadSelection && savedSel) {
        // Use the pre-existing selection as the target passage
        selectedText = content.slice(savedSel.start, savedSel.end)
        replaceStart = savedSel.start
        replaceEnd = savedSel.end
      } else {
        // Fall back to current paragraph (text between nearest newlines around cursor)
        const paraStart = newContent.lastIndexOf('\n', triggerStart - 1) + 1
        const paraEndRaw = newContent.indexOf('\n', triggerStart)
        const paraEnd = paraEndRaw === -1 ? newContent.length : paraEndRaw
        // Exclude the @ai trigger itself from the paragraph text
        selectedText = newContent.slice(paraStart, triggerStart).trimEnd()
        replaceStart = paraStart
        replaceEnd = paraEnd
      }

      const coords = getCaretCoords(textarea, triggerStart)

      setContent(newContent)
      setAiPopover({
        selectedText,
        replaceStart,
        replaceEnd,
        cursorX: coords.x,
        cursorY: coords.y,
        triggerStart,
      })
      return
    }

    setContent(newContent)
  }

  // Capture selection state before the key event changes the value
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      if (aiPopover) { setAiPopover(null); return }
    }
    const textarea = textareaRef.current
    if (textarea) {
      savedSelectionRef.current = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      }
    }
  }

  function handleAIAccept(result: string) {
    if (!aiPopover) return
    const { replaceStart, replaceEnd, triggerStart } = aiPopover

    // Remove everything from replaceStart to replaceEnd (the original passage),
    // then also strip the @ai trigger (which is between replaceEnd/triggerStart and cursor)
    const before = content.slice(0, replaceStart)
    const after = content.slice(replaceEnd)

    // Strip the @ai trigger from `after` if it appears at the start
    const afterStripped = after.replace(/^@ai\s*/, '')
    // Also handle case where @ai is appended directly after selected text
    const triggerInAfter = content.slice(replaceEnd, triggerStart + 3)
    const cleanAfter = triggerInAfter.startsWith('@ai')
      ? content.slice(triggerStart + 3)
      : afterStripped

    setContent(before + result + cleanAfter)
    setAiPopover(null)
    setTimeout(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.focus()
        const pos = before.length + result.length
        textarea.setSelectionRange(pos, pos)
      }
    }, 0)
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setError('')
    setSaveStatus('saving')
    const payload = { title: title.trim(), content, tags: parsedTags }
    try {
      let res: Response
      if (doc?._id) {
        res = await fetch(`/api/docs/${doc._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      const data = (await res.json()) as { data?: IDoc; error?: string }
      if (!res.ok) { setError(data.error ?? 'Save failed'); setSaveStatus('idle'); return }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
      if (!doc?._id && data.data?._id) router.push(`/docs/${data.data._id}/edit`)
    } catch {
      setError('Save failed')
      setSaveStatus('idle')
    }
  }

  const toolbarActions = [
    { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertMarkdown('_', '_') },
    { icon: Heading1, label: 'H1', action: () => insertMarkdown('# ') },
    { icon: Heading2, label: 'H2', action: () => insertMarkdown('## ') },
    { icon: Link2, label: 'Link', action: () => insertMarkdown('[', '](url)') },
    { icon: Code, label: 'Code', action: () => insertMarkdown('`', '`') },
    { icon: CodeSquare, label: 'Code block', action: () => insertMarkdown('```\n', '\n```') },
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Inline AI Popover */}
      {aiPopover && (
        <InlineAIPopover
          selectedText={aiPopover.selectedText}
          cursorX={aiPopover.cursorX}
          cursorY={aiPopover.cursorY}
          onAccept={handleAIAccept}
          onCancel={() => setAiPopover(null)}
        />
      )}

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title"
          className="text-base font-medium border-0 px-0 focus:ring-0 focus:border-0"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
        />
        <div className="flex items-center gap-2 shrink-0">
          {saveStatus === 'saving' && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Saving...</span>}
          {saveStatus === 'saved' && <span className="text-xs text-green-500">Saved</span>}
          {error && <span className="text-xs text-red-400">{error}</span>}
          <Button onClick={handleSave} size="sm" className="gap-1.5" disabled={saveStatus === 'saving'}>
            <Save size={13} />
            Save
          </Button>
        </div>
      </div>

      {/* Tags */}
      <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs shrink-0" style={{ color: 'var(--text-faint)' }}>Tags</span>
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="api, backend, notes (comma-separated)"
          className="border-0 text-xs px-0 focus:ring-0 h-6"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none', color: 'var(--text-muted)' }}
        />
        {parsedTags.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {parsedTags.slice(0, 4).map((tag) => <Badge key={tag}>{tag}</Badge>)}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="px-3 py-1.5 flex items-center gap-0.5" style={{ borderBottom: '1px solid var(--border)' }}>
        {toolbarActions.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            title={label}
            type="button"
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)' }}
            onMouseLeave={(e) => { ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
          >
            <Icon size={14} />
          </button>
        ))}
        <span className="ml-auto text-[11px] px-2" style={{ color: 'var(--text-faint)' }}>
          Select text then type{' '}
          <code className="font-mono px-1 rounded" style={{ color: 'var(--accent-text)', background: 'var(--accent-subtle)' }}>@ai</code>
          {' '}to rewrite
        </span>
      </div>

      {/* Split pane */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1" style={{ borderRight: '1px solid var(--border)' }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={'Start writing in Markdown...\n\nTip: Select text then type @ai to rewrite it with AI'}
            className="w-full h-full resize-none font-mono text-sm leading-relaxed p-4 outline-none"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
            spellCheck={false}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4" style={{ background: 'var(--surface)' }}>
          {content ? (
            <div className="prose-dark max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>
              Preview will appear here
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
