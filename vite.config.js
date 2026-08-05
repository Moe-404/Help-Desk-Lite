import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // This tells Vite to load assets from the root domain
  plugins: [react()],
})
