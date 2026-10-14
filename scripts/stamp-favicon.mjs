/**
 * 构建后给 dist/index.html 的 favicon 引用追加内容哈希戳。
 *
 * 为什么必须做：favicon 的 URL 恒定不变、nginx 又不发 Cache-Control 时，
 * 浏览器会启用启发式缓存（有效期 ≈ 距 Last-Modified 的 10%），
 * 且 favicon 是缓存最顽固的资源（Ctrl+F5 也常不生效）。
 * 内容变 → 哈希变 → URL 变 → 必然重新请求。
 *
 * ⚠️ 三条纪律（站群踩坑记录）：
 *   1. 用 throw new Error 而非 process.exit(1) —— 避免 eslint 在 scripts/ 下报 no-undef；
 *   2. 剥旧戳的正则必须收窄到「属性值内」，否则会吃掉注释里的 ?v= 片段与紧随的标签；
 *   3. 戳只写进构建产物 dist/index.html，源 index.html 保持 ./favicon.svg 不带戳。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const faviconPath = resolve(root, 'dist', 'favicon.svg')
const indexPath = resolve(root, 'dist', 'index.html')

if (!existsSync(faviconPath)) throw new Error('未找到 dist/favicon.svg，请先执行 vite build')
if (!existsSync(indexPath)) throw new Error('未找到 dist/index.html，请先执行 vite build')

const hash = createHash('sha256').update(readFileSync(faviconPath)).digest('hex').slice(0, 8)

let html = readFileSync(indexPath, 'utf-8')

// ① 幂等：先剥掉属性值内的旧戳（收窄到 src=/href= 之后、引号之前，不碰注释）
html = html.replace(/((?:href|src)="[^"]*?)\?v=[^"'&]*/g, '$1')

// ② 只给 favicon 引用加新戳
const before = html
html = html.replace(/(href="[^"]*?favicon\.svg)"/, `$1?v=${hash}"`)

if (html === before) throw new Error('未能匹配 favicon 引用 —— 请检查 index.html 里的 <link rel="icon">')
if (html.includes('favicon.svg"')) throw new Error('favicon 版本戳未生效，仍存在无戳引用')

writeFileSync(indexPath, html)
console.log(`[stamp-favicon] dist/index.html ← ./favicon.svg?v=${hash}`)
