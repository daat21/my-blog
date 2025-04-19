import HeroSection from '@/components/home/HeroSection'
import MySkills from '@/components/home/MySkills'
import RecentlyUpdated from '@/components/home/RecentlyUpdated'
import { Footer } from '@/components/home/Footer'
export default function Home() {
  return (
    <>
      <HeroSection />
      <MySkills />
      <RecentlyUpdated />
      <Footer />
    </>
  )
}
