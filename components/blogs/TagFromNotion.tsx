import { Badge } from '../ui/badge'
import { cn } from '@/lib/utils'

const NOTION_COLOR_HEX: Record<string, string> = {
  default: '#ffe0c2',
  gray: '#9B9A97',
  brown: '#64473A',
  orange: '#D9730D',
  yellow: '#fde047',
  green: '#15803d',
  blue: '#0B6E99',
  purple: '#7c3aed',
  pink: '#ec4899',
  red: '#c2410c',
}

export default function Tag({
  name,
  color,
  className,
}: {
  name: string
  color: string
  className?: string
}) {
  const hex = NOTION_COLOR_HEX[color] ?? NOTION_COLOR_HEX.default

  return (
    <Badge
      variant="outline"
      className={cn('rounded-2xl px-3 py-1.5 text-sm', className)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={hex}
        stroke={hex}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-circle-small-icon lucide-circle-small"
      >
        <circle cx="12" cy="12" r="6" />
      </svg>
      {name}
    </Badge>
  )
}
