import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

import { readMp4Dimensions } from './mp4-dimensions.mts'

const FIXTURE = new URL('fixtures/video-48x32.mp4', import.meta.url)

const ONE = 0x0001_0000 // 1.0 in 16.16 fixed point
const MINUS_ONE = -ONE
const IDENTITY = [ONE, 0, 0, 0, ONE, 0, 0, 0, 0x4000_0000]
const ROTATE_90 = [0, ONE, 0, MINUS_ONE, 0, 0, 0, 0, 0x4000_0000]

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function ints(...values: number[]): Uint8Array {
  const out = new Uint8Array(values.length * 4)
  const view = new DataView(out.buffer)
  values.forEach((value, index) => {
    view.setInt32(index * 4, value | 0)
  })
  return out
}

function ascii(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function box(type: string, ...payload: Uint8Array[]): Uint8Array {
  const body = concat(...payload)
  return concat(ints(8 + body.length), ascii(type), body)
}

/** A box with a 64-bit `largesize` header. */
function largeBox(type: string, ...payload: Uint8Array[]): Uint8Array {
  const body = concat(...payload)
  const size = new Uint8Array(8)
  new DataView(size.buffer).setBigUint64(0, BigInt(16 + body.length))
  return concat(ints(1), ascii(type), size, body)
}

interface TrackHeader {
  width: number
  height: number
  version?: 0 | 1
  matrix?: number[]
}

function tkhd({
  width,
  height,
  version = 0,
  matrix = IDENTITY,
}: TrackHeader): Uint8Array {
  const times =
    version === 1
      ? ints(0, 0, 0, 0, 1, 0, 0, 0) // 64-bit times, track ID, reserved, 64-bit duration
      : ints(0, 0, 1, 0, 0) // 32-bit times, track ID, reserved, duration
  return box(
    'tkhd',
    ints(version << 24), // version and flags
    times,
    ints(0, 0), // reserved
    ints(0, 0), // layer, alternate group, volume, reserved
    ints(...matrix),
    ints(width * ONE, height * ONE)
  )
}

function hdlr(handler: string): Uint8Array {
  return box('hdlr', ints(0, 0), ascii(handler), ints(0, 0, 0), ascii('\0'))
}

function trak(header: TrackHeader, handler?: string): Uint8Array {
  const parts = [tkhd(header)]
  if (handler) parts.push(box('mdia', hdlr(handler)))
  return box('trak', ...parts)
}

const ftyp = box('ftyp', ascii('isom'), ints(0x200), ascii('isomavc1'))

describe('readMp4Dimensions', () => {
  it('reads a real MP4 file written by ffmpeg', async () => {
    const data = await readFile(FIXTURE)
    expect(readMp4Dimensions(data)).toEqual({ width: 48, height: 32 })
  })

  it('reads a minimal ftyp + moov/trak/tkhd file', () => {
    const data = concat(ftyp, box('moov', trak({ width: 640, height: 360 })))
    expect(readMp4Dimensions(data)).toEqual({ width: 640, height: 360 })
  })

  it('reads a version 1 track header', () => {
    const data = concat(
      ftyp,
      box('moov', trak({ width: 1280, height: 720, version: 1 }))
    )
    expect(readMp4Dimensions(data)).toEqual({ width: 1280, height: 720 })
  })

  it('skips audio tracks and video tracks without dimensions', () => {
    const data = concat(
      ftyp,
      box(
        'moov',
        box('mvhd', ints(0)),
        trak({ width: 0, height: 0 }, 'soun'),
        trak({ width: 0, height: 0 }, 'vide'),
        trak({ width: 300, height: 200 }, 'text'),
        trak({ width: 1920, height: 1080 }, 'vide')
      )
    )
    expect(readMp4Dimensions(data)).toEqual({ width: 1920, height: 1080 })
  })

  it('swaps width and height for video rotated by a quarter turn', () => {
    const data = concat(
      ftyp,
      box('moov', trak({ width: 1920, height: 1080, matrix: ROTATE_90 }))
    )
    expect(readMp4Dimensions(data)).toEqual({ width: 1080, height: 1920 })
  })

  it('finds moov after media data and inside 64-bit boxes', () => {
    const data = concat(
      ftyp,
      largeBox('mdat', new Uint8Array(32)),
      largeBox('moov', trak({ width: 320, height: 240 }))
    )
    expect(readMp4Dimensions(data)).toEqual({ width: 320, height: 240 })
  })

  it('accepts a subarray of a larger buffer', () => {
    const file = concat(ftyp, box('moov', trak({ width: 64, height: 48 })))
    const padded = concat(new Uint8Array(5), file, new Uint8Array(3))
    const data = padded.subarray(5, 5 + file.length)
    expect(readMp4Dimensions(data)).toEqual({ width: 64, height: 48 })
  })

  it('rejects a file without a moov box', () => {
    expect(() => readMp4Dimensions(ftyp)).toThrow(/no "moov" box/)
  })

  it('rejects a file without a video track', () => {
    const data = concat(
      ftyp,
      box('moov', trak({ width: 0, height: 0 }, 'soun'))
    )
    expect(() => readMp4Dimensions(data)).toThrow(/No video track/)
  })

  it('rejects a truncated file', () => {
    const data = concat(ftyp, box('moov', trak({ width: 640, height: 360 })))
    expect(() => readMp4Dimensions(data.subarray(0, data.length - 10))).toThrow(
      /Malformed MP4/
    )
  })

  it('rejects data that is not an MP4 file', () => {
    expect(() => readMp4Dimensions(ascii('GIF89a, not a video'))).toThrow(
      /Malformed MP4/
    )
  })
})
