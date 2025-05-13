import { createClient } from '@/lib/supabase/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { CodeBlockWrapper } from '@/components/blogs/CodeBlockWrapper'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/formatDate'
import Tag from '@/components/blogs/Tag'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BlogDetailSkeleton } from '@/components/pages/Skeleton'
import { TableOfContents } from '@/components/blogs/TableOfContent'

async function getBlog(slug: string) {
  const supabase = await createClient()
  const { data: blog, error } = await supabase
    .from('posts')
    .select(
      `id, title, content, published_at, excerpt, cover_image_url, last_modified_at`
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error) console.error(error)
  if (!blog) notFound()

  return blog
}

type Tag = {
  id: number
  name: string
  color: string
}

async function getBlogTags(post_id: number): Promise<Tag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('post_tags')
    .select(
      `
      tag_id,
      tags:tags(*)
    `
    )
    .eq('post_id', post_id)

  if (error) {
    console.error(error)
    return []
  }
  if (!data) return []

  return data.map(item => item.tags) as unknown as Tag[]
}

const customComponents = {
  pre: CodeBlockWrapper,
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlog(slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: post.cover_image_url,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  }
}

async function BlogContent({ slug }: { slug: string }) {
  const post = await getBlog(slug)
  const tags = await getBlogTags(post.id)

  return (
    <>
      <TableOfContents content={post.content ?? ''} />
      <article className="prose dark:prose-invert lg:prose-lg mx-auto w-full p-4">
        <h1>{post.title}</h1>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Tag key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
        <p className="text-ring text-sm">
          {post.published_at === post.last_modified_at
            ? `Published: ${formatDate(post.published_at)}`
            : `Modified: ${formatDate(post.last_modified_at)}`}
        </p>
        <p className="text-muted-foreground text-base italic">{post.excerpt}</p>
        <Image
          src={post.cover_image_url}
          alt={post.title}
          width={1000}
          height={1000}
        />
        <hr />
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            ...customComponents,
            h1: ({ node, ...props }) => (
              <h1
                id={props.children
                  ?.toString()
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')}
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                id={props.children
                  ?.toString()
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')}
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                id={props.children
                  ?.toString()
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')}
                {...props}
              />
            ),
            h4: ({ node, ...props }) => (
              <h4
                id={props.children
                  ?.toString()
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')}
                {...props}
              />
            ),
            h5: ({ node, ...props }) => (
              <h5
                id={props.children
                  ?.toString()
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')}
                {...props}
              />
            ),
            h6: ({ node, ...props }) => (
              <h6
                id={props.children
                  ?.toString()
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')}
                {...props}
              />
            ),
          }}
        >
          {post.content ?? ''}
        </ReactMarkdown>
      </article>
    </>
  )
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <Suspense fallback={<BlogDetailSkeleton />}>
      <BlogContent slug={slug} />
    </Suspense>
  )
}
