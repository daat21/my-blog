export interface Project {
  id: number
  name: string
  description: string
  project_url: string
  cover_image_url: string
  tech_stack: string[]
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

export interface Blog {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  cover_image_url: string
  published_at: string
  last_modified_at: string
  visibility: string
  created_at: string
  updated_at: string
  tags?: Tag[]
}
