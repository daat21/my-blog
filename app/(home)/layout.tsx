import NavigationBar from '@/components/home/NavigationBar'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <NavigationBar />
      <div className="mx-auto my-2 max-w-7xl px-10">{children}</div>
    </>
  )
}
