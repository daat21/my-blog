export interface Project {
  id: number
  name: string
  description: string
  project_url: string
  github_url: string
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

export interface BlogsFromNotion {
  id: string
  title: string
  slug: string
  date: string
  created_time: string
  last_edited_time: string
  tags: { id: string; name: string; color: string }[]
  description: string
  cover_image_url: string
}
