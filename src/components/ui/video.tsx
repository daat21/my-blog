'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export interface VideoSource {
  src: string
  /** A media type such as `video/mp4`. */
  type: string
}

interface VideoProps {
  sources: VideoSource[]
  width: number
  height: number
  poster?: string
  className?: string
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/**
 * A short, silent clip that stands in for an animated GIF: it loops muted
 * and inline. It shows native controls until it is known to be playing, so
 * it still works without JavaScript and when motion is reduced, in which
 * case it never starts on its own. While it plays, a button can pause it.
 */
export function Video({
  sources,
  width,
  height,
  poster,
  className,
}: VideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [autoplay, setAutoplay] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    // React does not render the `muted` attribute on the server, and
    // browsers only autoplay muted video, so set it before playing.
    video.muted = true
    const motion = matchMedia(REDUCED_MOTION)

    function update() {
      if (!video) return
      if (motion.matches) {
        video.pause()
        setAutoplay(false)
        return
      }
      video.play().then(
        () => {
          setAutoplay(true)
        },
        () => {
          // Autoplay was refused; the native controls stay.
          setAutoplay(false)
        }
      )
    }

    update()
    motion.addEventListener('change', update)
    return () => {
      motion.removeEventListener('change', update)
      // Hidden routes stay mounted, so stop playing in the background.
      video.pause()
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      <video
        ref={ref}
        width={width}
        height={height}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        controls={!autoplay}
        onPlay={() => {
          setPlaying(true)
        }}
        onPause={() => {
          setPlaying(false)
        }}
        className="block h-auto w-full"
      >
        {sources.map(source => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </video>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-3 left-3 rounded bg-fg px-2 py-0.5 font-mono text-label font-medium text-canvas uppercase"
      >
        Clip
      </span>
      {autoplay && (
        <button
          type="button"
          aria-label={playing ? 'Pause clip' : 'Play clip'}
          onClick={() => {
            const video = ref.current
            if (!video) return
            if (video.paused) void video.play()
            else video.pause()
          }}
          className="absolute right-1 bottom-1 inline-flex size-11 items-center justify-center rounded-full text-canvas"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-fg/80">
            <svg
              aria-hidden="true"
              className="size-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {playing ? (
                <path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" />
              ) : (
                <path d="M7 4.5v15l12.5-7.5z" />
              )}
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}
