import { Badge } from '../ui/badge'
import { cn } from '@/lib/utils'
export default function Tag({
  name,
  color,
  className,
}: {
  name: string
  color: string
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn('px-3 py-1.5 text-sm', className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={color}
        stroke={color}
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
