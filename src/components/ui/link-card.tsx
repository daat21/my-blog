import { cva, type VariantProps } from 'class-variance-authority'
import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

const linkCardVariants = cva(
  'flex flex-col gap-1 rounded-md border px-4.5 py-4 transition-colors duration-150',
  {
    variants: {
      variant: {
        solid: 'border-border hover:border-border-strong',
        dashed:
          'justify-center border-dashed border-border-strong hover:border-fg-muted',
      },
      align: {
        start: '',
        end: 'sm:items-end sm:text-right',
      },
    },
    defaultVariants: {
      variant: 'solid',
      align: 'start',
    },
  }
)

interface LinkCardProps<T extends string> extends VariantProps<
  typeof linkCardVariants
> {
  /** Generic like next/link's href, so a dynamic path is type-checked. */
  href: Route<T>
  /** A short mono line above the title. */
  label: ReactNode
  title: ReactNode
  rel?: string
  className?: string
}

/** A bordered link: a small mono label above a title. */
export function LinkCard<T extends string>({
  href,
  label,
  title,
  rel,
  variant,
  align,
  className,
}: LinkCardProps<T>) {
  return (
    <Link
      href={href}
      rel={rel}
      className={cn(linkCardVariants({ variant, align }), className)}
    >
      <span className="font-mono text-meta text-fg-muted">{label}</span>
      <span className="text-ui leading-[1.45] font-medium text-fg">
        {title}
      </span>
    </Link>
  )
}
