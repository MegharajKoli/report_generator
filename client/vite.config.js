import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: [
          ['@babel/preset-env', { 
            targets: 'defaults',
            modules: false // Preserve ES modules (do not transpile to CommonJS)
          }],
          '@babel/preset-react',
        ],
        plugins: [
          '@babel/plugin-transform-runtime',
        ],
      },
    }),
  ],
  build: {
    target: 'esnext', // Build for modern JavaScript environments
  },
});