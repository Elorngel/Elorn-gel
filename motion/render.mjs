// Rendu de index.html en vidéo MP4 9:16 (1080 × 1920, 30 images/s).
// Usage, depuis le dossier motion/ :  npm run render
// Chrome (déjà installé sur la machine) photographie chaque image de
// l'animation, puis ffmpeg les assemble en H.264 compatible Instagram/TikTok.
// Le flou de mouvement est calculé dans la page (voir CONFIG.shutter).
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const puppeteer = require('puppeteer-core')
const ffmpegPath = require('ffmpeg-static')

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, process.argv[2] || 'bontin-motion-9x16.mp4')

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean)
const chrome = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!chrome) {
  console.error('Google Chrome introuvable. Indique son chemin avec CHROME_PATH=...')
  process.exit(1)
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--allow-file-access-from-files', '--force-color-profile=srgb', '--hide-scrollbars'],
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.error('Erreur dans la page :', e.message))
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 })
await page.goto(pathToFileURL(path.join(here, 'index.html')).href + '?render', { waitUntil: 'load' })
await page.waitForFunction('window.__ready === true', { timeout: 60000 })

const { duration, FPS } = await page.evaluate(() => ({ duration: window.__duration, FPS: window.__fps }))
const frames = Math.round(duration * FPS)

const ffmpeg = spawn(ffmpegPath, [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
  '-profile:v', 'high', '-level:v', '4.2',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-movflags', '+faststart',
  OUT,
], { stdio: ['pipe', 'inherit', 'inherit'] })
const done = new Promise((resolve, reject) => {
  ffmpeg.on('error', reject)
  ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error('ffmpeg a échoué (code ' + code + ')'))))
})

const started = Date.now()
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.__seek(t), i / FPS)
  const png = await page.screenshot({ type: 'png' })
  if (!ffmpeg.stdin.write(png)) await new Promise((r) => ffmpeg.stdin.once('drain', r))
  if (i % 15 === 0 || i === frames - 1) {
    process.stdout.write(`\rImage ${i + 1}/${frames}`)
  }
}
ffmpeg.stdin.end()
await done
await browser.close()
console.log(`\nVidéo prête (${((Date.now() - started) / 1000).toFixed(0)} s) : ${OUT}`)
