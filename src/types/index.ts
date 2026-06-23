export interface IDoc {
  _id: string
  title: string
  content: string
  tags: string[]
  author: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface IUser {
  _id: string
  email: string
  name: string
  createdAt: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface DocListItem {
  _id: string
  title: string
  tags: string[]
  updatedAt: string
  slug: string
}
