import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5174,
    proxy: {
      "/v1": {
        target: "http://localhost:5000", // Your backend port
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:5000", // For viewing uploaded photos
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
});
