import { Globe } from '@/components/magicui/globe'

export default function GlobeCard() {
  return (
    <div className="relative flex max-h-[450px] w-full max-w-[380px] overflow-hidden rounded-lg border">
      <div className="m-4 flex flex-col gap-2">
        <p className="mt-0">📍 Current Location: Adelaide, SA, Australia</p>
        <p className="mt-0">✈️ Lived in Guangdong, China in past</p>
      </div>
      <Globe className="top-20" />
      <div className="pointer-events-none absolute inset-0 h-full" />
    </div>
  )
}
