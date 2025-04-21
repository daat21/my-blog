import NavigationBar from '@/components/home/navigation-bar'
import { ScrollProgress } from '@/components/magicui/scroll-progress'
import { Footer } from '@/components/home/Footer'
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ScrollProgress />
      <NavigationBar />
      <main>
        <div className="mt-5 flex min-h-[calc(100vh-190px)] max-w-7xl flex-col gap-2 px-6 md:mx-auto md:mt-20 md:px-10">
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}
