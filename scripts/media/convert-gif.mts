import { spawn } from 'node:child_process'
import path from 'node:path'

import { fileExists, isNotFound } from './files.mts'

const FFMPEG_MISSING =
  'ffmpeg is not installed or not on your PATH. Install it, for example ' +
  'with `brew install ffmpeg`, `sudo apt install ffmpeg` or ' +
  '`sudo pacman -S ffmpeg`, and try again.'

/** Returns `input` with its extension replaced by `.mp4`. */
export function defaultMp4Path(input: string): string {
  const { dir, name } = path.parse(input)
  return path.join(dir, `${name}.mp4`)
}

/** Returns the ffmpeg arguments that turn a GIF into a web-friendly MP4. */
export function ffmpegArgs(input: string, output: string): string[] {
  return [
    ...['-hide_banner', '-loglevel', 'error', '-nostdin'],
    ...['-i', input],
    // H.264 in 4:2:0 plays everywhere, but needs even dimensions. Keep the
    // pixels square, or scaling to even dimensions stretches the frame and
    // the display size drifts from the stored one.
    ...['-c:v', 'libx264', '-preset', 'slow', '-crf', '23'],
    ...['-pix_fmt', 'yuv420p'],
    ...['-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1'],
    // No audio track, and the index first so playback starts at once.
    '-an',
    ...['-movflags', '+faststart'],
    // Never overwrite an existing file.
    '-n',
    output,
  ]
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    child.once('error', error => {
      reject(isNotFound(error) ? new Error(FFMPEG_MISSING) : error)
    })
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolve()
      } else {
        const reason = signal ?? `exit code ${String(code)}`
        reject(new Error(`ffmpeg failed (${reason}).`))
      }
    })
  })
}

export interface ConvertOptions {
  /** The ffmpeg executable; defaults to `ffmpeg` on the PATH. */
  ffmpeg?: string
}

/** Converts an animated GIF to an H.264 MP4 with the system ffmpeg. */
export async function convertGifToMp4(
  input: string,
  output: string,
  { ffmpeg = 'ffmpeg' }: ConvertOptions = {}
): Promise<void> {
  if (path.extname(input).toLowerCase() !== '.gif') {
    throw new Error(`Expected a .gif file, got ${input}.`)
  }
  if (path.extname(output).toLowerCase() !== '.mp4') {
    throw new Error(`The output must be an .mp4 file, got ${output}.`)
  }
  if (!(await fileExists(input))) {
    throw new Error(`${input} does not exist.`)
  }
  if (await fileExists(output)) {
    throw new Error(
      `${output} already exists. Delete it first, or pass another output path.`
    )
  }
  // Absolute paths, so that a file name starting with "-" is not read as
  // an ffmpeg option.
  await run(ffmpeg, ffmpegArgs(path.resolve(input), path.resolve(output)))
}
