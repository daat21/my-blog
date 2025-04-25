import { BackgroundLines } from '@/components/ui/background-lines'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Image from 'next/image'

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
          className="flex items-center gap-2 self-center pr-8 font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center overflow-hidden rounded-md">
            <Image
              src="/icon1.png"
              alt="Blog Logo"
              width={16}
              height={16}
              className="size-4"
            />
          </div>
          Daming&apos;s Blog
        </Link>
        <div className={cn('flex flex-col gap-6')}>{children}</div>
        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          By clicking continue, you agree to our{' '}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </div>
      </div>
    </BackgroundLines>
  )
}
