import HeroSection from '@/components/home/HeroSection'
import MySkills from '@/components/home/MySkills'
import RecentlyUpdated from '@/components/home/RecentlyUpdated'

export default async function Home() {
  return (
    <>
      <HeroSection />
      <MySkills />
      <RecentlyUpdated />
    </>
  )
}
