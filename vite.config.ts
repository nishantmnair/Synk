import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env variables from frontend directory
    const env = { ...process.env };
    
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
        // SECURITY: Do NOT expose API keys to the frontend!
        // API keys should only be used server-side via the Django backend
        // The geminiService should call backend endpoints instead of making direct API calls
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
