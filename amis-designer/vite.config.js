import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    host: '127.0.0.1',
    cors: true,
    // 允许被主应用 iframe 嵌入
    headers: {
      'X-Frame-Options': 'ALLOWALL',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['amis', 'amis-editor', 'amis-formula'],
  },
});
