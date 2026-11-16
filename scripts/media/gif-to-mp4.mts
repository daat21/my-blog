// Converts an animated GIF to an MP4 that `pnpm media:build` accepts, using
// the ffmpeg installed on this machine. Run it before adding the clip to the
// content repository; the build itself never needs ffmpeg.
//
// Usage: pnpm media:gif2mp4 <input.gif> [output.mp4]
// The output defaults to the input path with an .mp4 extension.

import { convertGifToMp4, defaultMp4Path } from './convert-gif.mts'

const USAGE = 'Usage: pnpm media:gif2mp4 <input.gif> [output.mp4]'

const [input, output, ...extra] = process.argv.slice(2)

if (input === '--help' || input === '-h') {
  console.log(USAGE)
} else if (!input || extra.length > 0) {
  console.error(USAGE)
  process.exitCode = 1
} else {
  const target = output ?? defaultMp4Path(input)
  try {
    await convertGifToMp4(input, target)
    console.log(
      `Wrote ${target}. Embed it as a video, and delete the GIF from the media folder.`
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
