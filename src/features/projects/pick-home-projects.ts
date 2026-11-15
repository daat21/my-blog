import type { Project } from '@/lib/content'

/** How many projects the home page shows: one 2×2 grid. */
export const HOME_PROJECT_COUNT = 4

/**
 * The projects for the home page: featured ones first, then the rest, each
 * group keeping the source's order, capped at `limit`.
 */
export function pickHomeProjects(
  projects: readonly Project[],
  limit = HOME_PROJECT_COUNT
): Project[] {
  const featured = projects.filter(project => project.featured)
  const others = projects.filter(project => !project.featured)
  return [...featured, ...others].slice(0, limit)
}
