
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    port: 3000
  }
});
