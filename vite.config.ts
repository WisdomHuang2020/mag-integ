import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

// 版本号单一来源：package.json。
// 页脚渲染 __APP_VERSION__，线上核验只需 grep 该串（站群通行做法）。
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}

// base 用相对路径，便于本地直接打开构建产物（file:// 或任意子目录部署）
// ⚠️ 不可改为 '/' —— 同一份 dist 要同时服务自有域名根路径与 Pages 子路径(/mag-integ/)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5199,
    host: '127.0.0.1',
  },
})
