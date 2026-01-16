import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env variables from frontend directory
    const env = process.env;
    
    return {
      // Point envDir to frontend directory
      envDir: './frontend',
      root: './frontend',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Vite automatically exposes .env variables prefixed with VITE_ via import.meta.env
        // We also define process.env for compatibility with the geminiService
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'frontend'),
        }
      },
      build: {
        outDir: '../dist',
        emptyOutDir: true,
      }
    };
});
