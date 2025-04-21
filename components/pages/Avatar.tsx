import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function AvatarComponent({
  src = 'https://github.com/shadcn.png',
  fallback = 'Guest',
}: {
  src?: string
  fallback?: string
}) {
  return (
    <Avatar className="size-10">
      <AvatarImage src={src} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
