/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE')

  // VITE_IMAGE_BASE_URL が設定されている場合、dev server で /images/portrait を
  // R2 origin にプロキシする。これにより .env.local に VITE_IMAGE_BASE_URL を
  // 設定するだけでローカル開発でも画像が表示される。
  let imageProxy: Record<string, object> | undefined
  if (env.VITE_IMAGE_BASE_URL) {
    try {
      const origin = new URL(env.VITE_IMAGE_BASE_URL).origin
      imageProxy = {
        '/images/portrait': { target: origin, changeOrigin: true },
      }
    } catch {
      // VITE_IMAGE_BASE_URL が有効な URL でない場合は proxy しない
    }
  }

  return {
    plugins: [react()],
    server: {
      port: Number(process.env.PORT) || 5173,
      proxy: imageProxy,
    },
    test: {
      globals: true,
      environment: 'node',
    },
  }
})
