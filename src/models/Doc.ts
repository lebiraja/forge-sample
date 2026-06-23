import mongoose, { Schema, type Document, type Types } from 'mongoose'

export interface IDocDocument extends Document {
  title: string
  content: string
  tags: string[]
  author: Types.ObjectId
  slug: string
  createdAt: Date
  updatedAt: Date
}

const DocSchema = new Schema<IDocDocument>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    slug: { type: String, required: true },
  },
  { timestamps: true }
)

DocSchema.index({ author: 1, updatedAt: -1 })
DocSchema.index({ author: 1, slug: 1 }, { unique: true })

export default mongoose.models.Doc ?? mongoose.model<IDocDocument>('Doc', DocSchema)
