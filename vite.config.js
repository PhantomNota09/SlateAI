import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Same fallback as src/core/config/site.ts. Keep the two in sync (or set VITE_SITE_URL).
const DEFAULT_SITE_URL = 'https://slate-ai-nu.vercel.app'

// Public, indexable pages. /app/* is signed-in UI and stays out of the sitemap.
const SITEMAP_PATHS = ['/', '/terms', '/privacy']

// Fills the site URL into the places a static file needs it: %SITE_URL% in index.html (Open Graph
// image, canonical, structured data) and generated sitemap.xml / robots.txt. Moving to a custom
// domain is then a one-env-var change. No dependency, just Vite hooks.
function siteUrlPlugin(siteUrl) {
  return {
    name: 'slate-site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml')
          return res.end(sitemap(siteUrl))
        }
        if (req.url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain')
          return res.end(robots(siteUrl))
        }
        next()
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(siteUrl) })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots(siteUrl) })
    },
  }
}

const sitemap = (siteUrl) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SITEMAP_PATHS.map(
    (p) => `  <url><loc>${siteUrl}${p}</loc></url>`,
  ).join('\n')}\n</urlset>\n`

const robots = (siteUrl) => `User-agent: *\nAllow: /\nDisallow: /app/\n\nSitemap: ${siteUrl}/sitemap.xml\n`

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
  return { plugins: [react(), siteUrlPlugin(siteUrl)] }
})
