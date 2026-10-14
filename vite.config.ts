import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base 用相对路径，便于本地直接打开构建产物（file:// 或任意子目录部署）
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5199,
    host: '127.0.0.1',
  },
})
