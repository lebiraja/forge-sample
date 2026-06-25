import { connectDB } from '@/lib/mongodb'
import Doc, { type IDocDocument } from '@/models/Doc'
import { generateSlug } from '@/lib/utils'
import type { FlattenMaps } from 'mongoose'

type LeanDoc = FlattenMaps<IDocDocument> & { _id: { toString(): string } }

// ── Tool schemas sent to Groq (OpenAI function-calling format) ──
export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_docs',
      description:
        "List all of the user's documents with their id, title, tags, and last-updated time. Use this to discover what docs exist before reading or summarizing.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_docs',
      description:
        'Search the user\'s documents by a keyword. Matches against title, content, and tags. Returns matching docs with id, title, and a content snippet.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The keyword or phrase to search for' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_doc',
      description:
        'Read the full content of a single document by its id. Use the id returned from list_docs or search_docs.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The document id (_id)' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_doc',
      description:
        'Create a new document with a title, markdown content, and optional tags. Returns the new document id. Use this when the user asks you to write, draft, or generate a new document.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The document title' },
          content: { type: 'string', description: 'The full markdown content of the document' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of tags',
          },
        },
        required: ['title', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_doc',
      description:
        "Update an existing document's content (and optionally title/tags) by its id. Use this when the user asks you to edit, revise, or append to an existing doc. Read the doc first if you need its current content.",
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The document id (_id) to update' },
          title: { type: 'string', description: 'New title (optional)' },
          content: { type: 'string', description: 'New full markdown content (optional)' },
          tags: { type: 'array', items: { type: 'string' }, description: 'New tags (optional)' },
        },
        required: ['id'],
      },
    },
  },
] as const

interface ToolResult {
  result: string
  // Surfaces an actionable doc to the client (e.g. for an "Open in Editor" link)
  docRef?: { id: string; title: string; action: 'created' | 'updated' }
}

// ── Tool executors — all scoped to the authenticated user ──
export async function runTool(
  name: string,
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  await connectDB()

  switch (name) {
    case 'list_docs': {
      const docs = await Doc.find({ author: userId })
        .select('title tags updatedAt')
        .sort({ updatedAt: -1 })
        .lean<LeanDoc[]>()
      if (docs.length === 0) return { result: 'The user has no documents yet.' }
      const list = docs.map((d) => ({
        id: String(d._id),
        title: d.title,
        tags: d.tags,
        updatedAt: (d.updatedAt as Date).toISOString(),
      }))
      return { result: JSON.stringify(list) }
    }

    case 'search_docs': {
      const query = String(args.query ?? '').trim()
      if (!query) return { result: 'No search query provided.' }
      const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const docs = await Doc.find({
        author: userId,
        $or: [{ title: rx }, { content: rx }, { tags: rx }],
      })
        .select('title content tags')
        .limit(10)
        .lean<LeanDoc[]>()
      if (docs.length === 0) return { result: `No documents matched "${query}".` }
      const results = docs.map((d) => ({
        id: String(d._id),
        title: d.title,
        tags: d.tags,
        snippet: d.content.slice(0, 300),
      }))
      return { result: JSON.stringify(results) }
    }

    case 'read_doc': {
      const id = String(args.id ?? '')
      const doc = await Doc.findOne({ _id: id, author: userId })
        .select('title content tags')
        .lean<LeanDoc>()
      if (!doc) return { result: `No document found with id ${id}.` }
      return {
        result: JSON.stringify({
          id,
          title: doc.title,
          tags: doc.tags,
          content: doc.content,
        }),
      }
    }

    case 'create_doc': {
      const title = String(args.title ?? '').trim()
      const content = String(args.content ?? '')
      const tags = Array.isArray(args.tags) ? (args.tags as string[]) : []
      if (!title) return { result: 'Cannot create a doc without a title.' }

      const baseSlug = generateSlug(title) || 'untitled'
      let slug = baseSlug
      let counter = 1
      while (await Doc.findOne({ author: userId, slug })) {
        slug = `${baseSlug}-${counter++}`
      }
      const doc = await Doc.create({ title, content, tags, author: userId, slug })
      return {
        result: `Created document "${title}" with id ${doc._id}.`,
        docRef: { id: String(doc._id), title, action: 'created' },
      }
    }

    case 'update_doc': {
      const id = String(args.id ?? '')
      const doc = await Doc.findOne({ _id: id, author: userId })
      if (!doc) return { result: `No document found with id ${id}.` }

      if (typeof args.title === 'string' && args.title.trim()) doc.title = args.title.trim()
      if (typeof args.content === 'string') doc.content = args.content
      if (Array.isArray(args.tags)) doc.tags = args.tags as string[]
      await doc.save()
      return {
        result: `Updated document "${doc.title}" (id ${id}).`,
        docRef: { id, title: doc.title, action: 'updated' },
      }
    }

    default:
      return { result: `Unknown tool: ${name}` }
  }
}
