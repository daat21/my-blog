import { describe, expect, it } from 'vitest'

import type { Project } from '@/lib/content'

import { pickHomeProjects } from './pick-home-projects'

function project(slug: string, featured = false): Project {
  return {
    slug,
    title: slug,
    description: `About ${slug}.`,
    stack: [],
    featured,
    order: 100,
  }
}

const slugs = (projects: Project[]) => projects.map(p => p.slug)

describe('pickHomeProjects', () => {
  it('puts featured projects first and keeps the source order otherwise', () => {
    const projects = [
      project('a'),
      project('b', true),
      project('c'),
      project('d', true),
    ]
    expect(slugs(pickHomeProjects(projects))).toEqual(['b', 'd', 'a', 'c'])
  })

  it('shows at most four by default', () => {
    const projects = ['a', 'b', 'c', 'd', 'e', 'f'].map(slug => project(slug))
    expect(slugs(pickHomeProjects(projects))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('lets a featured project displace a later one', () => {
    const projects = [
      ...['a', 'b', 'c', 'd'].map(slug => project(slug)),
      project('e', true),
    ]
    expect(slugs(pickHomeProjects(projects))).toEqual(['e', 'a', 'b', 'c'])
  })

  it('returns fewer when there are fewer', () => {
    expect(slugs(pickHomeProjects([project('a')]))).toEqual(['a'])
    expect(pickHomeProjects([])).toEqual([])
  })

  it('does not change the input', () => {
    const projects = [project('a'), project('b', true)]
    pickHomeProjects(projects)
    expect(slugs(projects)).toEqual(['a', 'b'])
  })
})
