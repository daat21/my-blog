import { cva, type VariantProps } from 'class-variance-authority'
import type { AnchorHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4.5 text-ui font-medium transition-colors duration-150',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent hover:bg-accent/90',
        secondary: 'border border-border-strong text-fg hover:bg-sunken',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
)

interface ButtonLinkProps
  extends
    AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  href: string
}

/**
 * A link styled as a button, for calls to action that navigate: mail, a
 * download, another page. Actions that change state use a real <button>.
 */
export function ButtonLink({ variant, className, ...props }: ButtonLinkProps) {
  return <a className={cn(buttonVariants({ variant }), className)} {...props} />
}
