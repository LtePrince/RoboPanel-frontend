import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // listen on 0.0.0.0 so the VSCode SSH tunnel / LAN can reach it
    port: 5180, // dedicated port (5173 is taken by another user on this shared box)
  },
})
