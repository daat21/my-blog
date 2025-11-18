import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

async function optimizeImage(inputPath, outputPath, options = {}) {
  const { width, height, quality = 85 } = options

  try {
    const image = sharp(inputPath)

    if (width || height) {
      image.resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
    }

    await image
      .webp({ quality })
      .toFile(outputPath)

    const inputStats = await stat(inputPath)
    const outputStats = await stat(outputPath)

    console.log(`✓ Optimized: ${inputPath}`)
    console.log(`  ${(inputStats.size / 1024 / 1024).toFixed(2)}MB → ${(outputStats.size / 1024).toFixed(2)}KB`)
    console.log(`  Saved: ${((1 - outputStats.size / inputStats.size) * 100).toFixed(1)}%`)

    return { input: inputStats.size, output: outputStats.size }
  } catch (error) {
    console.error(`✗ Failed to optimize ${inputPath}:`, error.message)
    throw error
  }
}

async function main() {
  console.log('🖼️  Starting image optimization...\n')

  const optimizations = [
    {
      input: 'public/img/selfie.jpg',
      output: 'public/img/selfie.webp',
      width: 200,
      height: 200,
      quality: 90,
    },
    // login-bg.jpeg 没有被使用，稍后会删除
  ]

  let totalSaved = 0

  for (const opt of optimizations) {
    const result = await optimizeImage(opt.input, opt.output, opt)
    totalSaved += (result.input - result.output)
    console.log()
  }

  console.log(`\n✅ Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`)
}

main().catch(console.error)
