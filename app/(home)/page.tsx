import dynamic from 'next/dynamic'
import HeroSection from '@/components/home/HeroSection'

// Lazy load below-the-fold sections to improve initial page load
const MySkills = dynamic(() => import('@/components/home/MySkills'), {
  ssr: true,
})

const RecentlyUpdated = dynamic(
  () => import('@/components/home/RecentlyUpdated'),
  {
    ssr: true,
  }
)

export default async function Home() {
  return (
    <>
      <HeroSection />
      <MySkills />
      <RecentlyUpdated />
    </>
  )
}
