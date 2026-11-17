import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function syncTargetStaticPlugin() {
  return {
    name: 'sync-target-static',
    closeBundle() {
      const staticRoot = path.resolve(__dirname, '../src/main/resources/static');
      const targetStaticRoot = path.resolve(__dirname, '../target/classes/static');
      if (!fs.existsSync(targetStaticRoot)) return;

      for (const dir of ['app', 'js', 'styles']) {
        const srcDir = path.join(staticRoot, dir);
        const destDir = path.join(targetStaticRoot, dir);
        if (!fs.existsSync(srcDir)) continue;
        if (dir === 'app' && fs.existsSync(destDir)) {
          fs.rmSync(destDir, { recursive: true, force: true });
        }
        fs.cpSync(srcDir, destDir, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), syncTargetStaticPlugin()],
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
      '^/(?!index\\.html|login\\.html|register\\.html|armory\\.html|dungeons\\.html|vault\\.html|shop\\.html|alchemy\\.html|hunting\\.html|shop-admin\\.html|pve-admin\\.html|alchemy-admin\\.html|secrets\\.html|dungeon-stats\\.html|achievements\\.html|combat\\.html).*\\.html$': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
}));
