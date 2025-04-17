export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="mx-auto my-2 max-w-7xl px-10">{children}</div>
}
