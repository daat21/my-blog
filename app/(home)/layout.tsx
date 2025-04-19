import NavigationBar from '@/components/home/NavigationBar'
import { ScrollProgress } from '@/components/magicui/scroll-progress'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ScrollProgress />
      <NavigationBar />
      <div className="mt-10 flex max-w-7xl flex-col gap-2 px-6 md:mx-auto md:px-10">
        {children}
      </div>
    </>
  )
}
