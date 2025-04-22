import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export default function AvatarComponent({
  src = 'https://github.com/shadcn.png',
  fallback = 'Guest',
  className = 'size-10',
}: {
  src?: string
  fallback?: string
  className?: string
}) {
  return (
    <Avatar className={cn(className, 'border-2')}>
      <AvatarImage src={src} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
