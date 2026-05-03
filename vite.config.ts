/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      // ローカル開発時に data/images/ を /images/ として配信する。
      // 本番は VITE_IMAGE_BASE_URL (Cloudflare R2) を使うためビルドには影響しない。
      name: 'local-images',
      configureServer(server) {
        server.middlewares.use('/images', (req, res, next) => {
          const filePath = join(process.cwd(), 'data/images', req.url ?? '/')
          try {
            if (statSync(filePath).isFile()) {
              const ext = extname(filePath).slice(1).toLowerCase()
              res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
              res.setHeader('Cache-Control', 'public, max-age=3600')
              createReadStream(filePath).pipe(res)
              return
            }
          } catch { /* ファイルが存在しない場合は next() へ */ }
          next()
        })
      },
    },
  ],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
