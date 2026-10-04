import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { markdown } from './plugins/markdown.ts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    markdown({ base: '/graph/docs' }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
})
