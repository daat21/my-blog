import { Globe } from '@/components/magicui/globe'

export default function GlobeCard() {
  return (
    <div className="w-max-[348.25px] relative flex h-[400px] overflow-hidden rounded-lg border md:h-full">
      <div className="m-4 flex flex-col gap-2">
        <p className="mt-0">📍 Current Location: Adelaide, SA, Australia</p>
        <p className="mt-0">✈️ Lived in Guangdong, China in past</p>
      </div>
      <Globe className="top-23" />
      <div className="pointer-events-none absolute inset-0 h-full" />
    </div>
  )
}
