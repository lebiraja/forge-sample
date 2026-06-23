import mongoose, { Schema, type Document } from 'mongoose'

export interface IUserDocument extends Document {
  email: string
  password: string
  name: string
  createdAt: Date
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export default mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema)
