import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SITE_URL = new URL(process.env.SITE_URL ?? 'https://suminagashi-ink.pages.dev').origin;
const notices = () => readFileSync(new URL('./THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8');

function siteFiles(): Plugin {
  return {
    name: 'site-files',
    transformIndexHtml: html => html.replaceAll('%SITE_URL%', SITE_URL),
    configureServer(server) {
      server.middlewares.use('/licenses.txt', (_req, res) => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(notices());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'licenses.txt', source: notices() });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/</loc></url>\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), siteFiles()],
  server: { port: 5173 },
  build: {
    // fonts as files, not data-URIs inside the render-blocking CSS
    assetsInlineLimit: 0,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
});
