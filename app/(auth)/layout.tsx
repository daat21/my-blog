import { BackgroundLines } from '@/components/ui/background-lines'
import Link from 'next/link'
import { GalleryVerticalEnd } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BackgroundLines
      svgOptions={{ duration: 10 }}
      className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
    >
      <div className="relative flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Daming&apos;s Blog
        </Link>
        {children}
      </div>
    </BackgroundLines>
  )
}
