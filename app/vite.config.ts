import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Vendor chunks are large but cached separately — suppress warnings for known libraries
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Vendor: Charting library
          'vendor-recharts': ['recharts'],
          // Vendor: Map library
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          // Vendor: Icons
          'vendor-icons': ['lucide-react'],
          // Vendor: Firebase
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Vendor: 3D rendering (used by ExplorePage — lazy loaded)
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
})
