import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    // Never inline assets as data URIs: the unicode-range font chunks must
    // stay separate files, or the small ones get baked into the
    // render-blocking CSS and every visitor downloads all of them at once.
    assetsInlineLimit: 0,
    // Split Three.js and React into their own long-cached chunks so app
    // changes don't force a re-download of them, and the app chunk stays small.
    // (advancedChunks is Rolldown's replacement for manualChunks in Vite 8+.)
    rollupOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
});

