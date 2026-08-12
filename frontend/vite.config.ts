import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const legacyTarget = env.LEGACY_API_PROXY_TARGET ?? 'http://localhost:3000';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: legacyTarget, changeOrigin: true },
        '/uploads': { target: legacyTarget, changeOrigin: true },
      },
    },
  };
});
