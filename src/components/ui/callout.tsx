import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type CalloutVariant = 'note' | 'warning'

const LABELS: Record<CalloutVariant, string> = {
  note: 'Note.',
  warning: 'Warning.',
}

function CalloutIcon({ variant }: { variant: CalloutVariant }) {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.75 size-4.5 shrink-0 text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {variant === 'note' ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.5v.1" />
        </>
      ) : (
        <>
          <path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9.5v4M12 17v.1" />
        </>
      )}
    </svg>
  )
}

interface CalloutProps {
  variant: CalloutVariant
  children: ReactNode
  className?: string
}

/** A note or warning set apart from the text, with a bold inline label. */
export function Callout({ variant, children, className }: CalloutProps) {
  return (
    <aside
      role="note"
      className={cn(
        'my-8 flex gap-3 rounded-md border border-border bg-sunken px-4 py-3.5 text-ui leading-relaxed',
        className
      )}
    >
      <CalloutIcon variant={variant} />
      {/* The label floats so it reads inline with the first paragraph.
          Children lose their own margins and are spaced here instead. */}
      <div className="min-w-0 flex-1 [&_:not(pre)>code]:bg-canvas [&>*]:my-0 [&>*:not(strong)+*]:mt-3">
        <strong className="float-left mr-1.5 font-semibold text-fg">
          {LABELS[variant]}
        </strong>
        {children}
      </div>
    </aside>
  )
}
