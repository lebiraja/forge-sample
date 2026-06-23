import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Doc from '@/models/Doc'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'

interface Props {
  params: { id: string }
}

function markdownToDocxParagraphs(markdown: string): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const lines = markdown.split('\n')

  for (const line of lines) {
    if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }))
    } else if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }))
    } else if (line.startsWith('# ')) {
      paragraphs.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }))
    } else if (line.startsWith('> ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.slice(2), italics: true, color: '666666' })],
          indent: { left: 720 },
        })
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      paragraphs.push(
        new Paragraph({
          text: line.slice(2),
          bullet: { level: 0 },
        })
      )
    } else if (/^\d+\. /.test(line)) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^\d+\. /, ''),
          numbering: { reference: 'default-numbering', level: 0 },
        })
      )
    } else if (line.trim() === '' ) {
      paragraphs.push(new Paragraph({ text: '' }))
    } else {
      // inline bold/italic/code parsing
      const runs: TextRun[] = []
      const remaining = line
      const parts = remaining.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g)

      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          runs.push(new TextRun({ text: part.slice(2, -2), bold: true }))
        } else if (part.startsWith('_') && part.endsWith('_')) {
          runs.push(new TextRun({ text: part.slice(1, -1), italics: true }))
        } else if (part.startsWith('`') && part.endsWith('`')) {
          runs.push(new TextRun({ text: part.slice(1, -1), font: 'Courier New', color: '7c3aed' }))
        } else if (part) {
          runs.push(new TextRun({ text: part }))
        }
      }

      paragraphs.push(new Paragraph({ children: runs }))
    }
  }

  return paragraphs
}

export async function GET(_req: Request, { params }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const doc = await Doc.findOne({ _id: params.id, author: session.user.id })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const contentParagraphs = markdownToDocxParagraphs(doc.content || '')

  const docxDoc = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        children: [
          new Paragraph({
            text: doc.title,
            heading: HeadingLevel.TITLE,
          }),
          ...(doc.tags.length > 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Tags: ${doc.tags.join(', ')}`,
                      italics: true,
                      color: '666666',
                      size: 20,
                    }),
                  ],
                }),
              ]
            : []),
          new Paragraph({ text: '' }),
          ...contentParagraphs,
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(docxDoc)
  const filename = `${doc.slug || doc.title.toLowerCase().replace(/\s+/g, '-')}.docx`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
