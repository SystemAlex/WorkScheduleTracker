import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/vipsrl/' : '/',
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    // visualizer({ filename: 'stats.html', open: false }), // te ayuda a visualizar qué pesa más
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
  root: path.resolve(import.meta.dirname, 'client'),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500, // aumentamos el límite para evitar warnings innecesarios
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('react')) return 'react';
            if (id.includes('zod')) return 'zod';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('swagger')) return 'swagger';
            if (id.includes('pdfkit') || id.includes('exceljs')) return 'docs';
            return 'vendor'; // fallback general
          }
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
  },
});
