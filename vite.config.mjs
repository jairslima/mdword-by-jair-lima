import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function safeGitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: process.cwd() }).toString().trim();
  } catch {
    return 'dev';
  }
}

const { version } = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));

export default defineConfig({
  base: './',
  plugins: [react()],
  root: resolve(process.cwd(), 'src/renderer'),
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_HASH__: JSON.stringify(safeGitHash()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10))
  },
  build: {
    outDir: resolve(process.cwd(), 'dist'),
    emptyOutDir: true
  }
});
