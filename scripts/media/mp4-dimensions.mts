// Reads a video's display size from the MP4 container (ISO/IEC 14496-12)
// without ffprobe, which is not available on the build machine.

export interface VideoDimensions {
  width: number
  height: number
}

interface Box {
  type: string
  /** Offset of the box payload, after the header. */
  start: number
  /** Offset just past the end of the box. */
  end: number
}

/** Yields the boxes laid out back to back between `start` and `end`. */
function* boxes(view: DataView, start: number, end: number): Generator<Box> {
  let offset = start
  while (offset + 8 <= end) {
    const type = fourCC(view, offset + 4)
    let size = view.getUint32(offset)
    let headerSize = 8
    if (size === 1) {
      if (offset + 16 > end) throw malformed(`box "${type}" is truncated`)
      const largeSize = view.getBigUint64(offset + 8)
      if (largeSize > BigInt(end - offset)) {
        throw malformed(`box "${type}" at byte ${offset} overruns its parent`)
      }
      size = Number(largeSize)
      headerSize = 16
    } else if (size === 0) {
      // A size of zero means the box extends to the end of its parent.
      size = end - offset
    }
    if (size < headerSize || offset + size > end) {
      throw malformed(`box "${type}" at byte ${offset} overruns its parent`)
    }
    yield { type, start: offset + headerSize, end: offset + size }
    offset += size
  }
}

function findChild(view: DataView, parent: Box, type: string): Box | undefined {
  for (const box of boxes(view, parent.start, parent.end)) {
    if (box.type === type) return box
  }
  return undefined
}

function fourCC(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  )
}

function malformed(detail: string): Error {
  return new Error(`Malformed MP4: ${detail}.`)
}

/** Reads `handler_type` from an `hdlr` box, e.g. `vide` or `soun`. */
function readHandlerType(view: DataView, hdlr: Box): string {
  // version/flags (4 bytes) and pre_defined (4 bytes) come first.
  const offset = hdlr.start + 8
  if (offset + 4 > hdlr.end) throw malformed('"hdlr" box is truncated')
  return fourCC(view, offset)
}

/** Reads the presentation size from a `tkhd` box, applying quarter turns. */
function readTrackHeader(view: DataView, tkhd: Box): VideoDimensions {
  const version = view.getUint8(tkhd.start)
  if (version !== 0 && version !== 1) {
    throw malformed(`unsupported "tkhd" version ${version}`)
  }
  // Version 1 widens creation time, modification time and duration to
  // 64 bits, which moves the matrix 12 bytes further in.
  const matrix = tkhd.start + (version === 1 ? 52 : 40)
  const size = matrix + 36
  if (size + 8 > tkhd.end) throw malformed('"tkhd" box is truncated')

  // Width and height are 16.16 fixed-point numbers.
  const width = Math.round(view.getUint32(size) / 0x10000)
  const height = Math.round(view.getUint32(size + 4) / 0x10000)

  // The matrix is { a, b, u, c, d, v, x, y, w }. Phones store portrait
  // video as landscape frames plus a 90° rotation, which zeroes a and d.
  const a = view.getInt32(matrix)
  const b = view.getInt32(matrix + 4)
  const c = view.getInt32(matrix + 12)
  const d = view.getInt32(matrix + 16)
  const quarterTurn = a === 0 && d === 0 && b !== 0 && c !== 0
  return quarterTurn ? { width: height, height: width } : { width, height }
}

/**
 * Returns the display size of the first video track with non-zero
 * dimensions, read from `moov/trak/tkhd`. Throws if there is none.
 */
export function readMp4Dimensions(data: Uint8Array): VideoDimensions {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const file: Box = { type: 'file', start: 0, end: data.byteLength }

  const moov = findChild(view, file, 'moov')
  if (!moov) throw malformed('no "moov" box found')

  for (const trak of boxes(view, moov.start, moov.end)) {
    if (trak.type !== 'trak') continue
    const mdia = findChild(view, trak, 'mdia')
    const hdlr = mdia && findChild(view, mdia, 'hdlr')
    // Without a handler, fall back to the dimensions alone: audio tracks
    // always have a zero width and height.
    if (hdlr && readHandlerType(view, hdlr) !== 'vide') continue
    const tkhd = findChild(view, trak, 'tkhd')
    if (!tkhd) continue
    const dimensions = readTrackHeader(view, tkhd)
    if (dimensions.width > 0 && dimensions.height > 0) return dimensions
  }
  throw new Error('No video track with non-zero dimensions in the MP4 file.')
}
