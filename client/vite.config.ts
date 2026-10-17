import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // Consume @cufc/shared's TypeScript source directly instead of its
      // CommonJS dist build. The CJS build can't be served as native ESM in
      // dev (named value imports fail), and pointing at source gives hot
      // reload on shared changes with no rebuild. The server still uses dist.
      { find: /^@cufc\/shared$/, replacement: path.resolve(__dirname, '../packages/shared/src/index.ts') },
    ],
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
