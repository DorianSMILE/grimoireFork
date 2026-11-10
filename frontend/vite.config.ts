import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/app/' : '/',
  build: {
    outDir: '../src/main/resources/static/app',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/styles': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/js': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/sons': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/favicon.svg': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '^/(?!index\\.html|login\\.html|register\\.html|armory\\.html|dungeons\\.html|vault\\.html|shop\\.html|alchemy\\.html|hunting\\.html|shop-admin\\.html|pve-admin\\.html|alchemy-admin\\.html|secrets\\.html|dungeon-stats\\.html).*\\.html$': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
}));
