import type { StackGroup } from '@/lib/content'

interface StackGridProps {
  groups: readonly StackGroup[]
}

/** Tools grouped into cards: one column on phones, three from medium up. */
export function StackGrid({ groups }: StackGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {groups.map(group => (
        <li
          key={group.group}
          className="rounded-lg border border-border bg-surface px-5 py-4.5"
        >
          <h3 className="mb-2 font-mono text-label text-accent uppercase">
            {group.group}
          </h3>
          <ul className="text-ui leading-loose text-fg">
            {group.items.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
