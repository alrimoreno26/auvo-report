import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // react-pdf (~1,2 MB) y xlsx (~0,5 MB) van en chunks aparte que solo se descargan
    // al generar un PDF o subir un Excel; no afectan la carga inicial.
    chunkSizeWarningLimit: 1300,
  },
})
