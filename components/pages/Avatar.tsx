import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
    <Avatar className={className}>
      <AvatarImage src={src} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
