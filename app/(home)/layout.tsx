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
      <div className="mx-auto my-2 max-w-7xl px-10">{children}</div>
    </>
  )
}
