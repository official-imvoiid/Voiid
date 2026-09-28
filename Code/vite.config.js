import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
// the contact form, admin, uploaded images and the notes library come from server.js (npm run server)
const proxy = {
  '/api': 'http://localhost:5001',
  '/uploads': 'http://localhost:5001',
  '/files': 'http://localhost:5001',
}

/* Content-Security-Policy for the built site (the dev server injects its own
   inline scripts, so it's only added on build). Scripts may come from this
   site only - plus the JavaScript game's sandbox page, which is an inline
   script allowed by its hash, and needs 'unsafe-eval' to run visitor code. */
const csp = () => ({
  name: 'voiid-csp',
  apply: 'build',
  transformIndexHtml() {
    const runner = readFileSync('src/common/pages/gameSandbox.js', 'utf8').replace(/\r\n?/g, '\n')
    const hash = createHash('sha256').update(runner).digest('base64')
    const policy = [
      "default-src 'self'",
      `script-src 'self' 'sha256-${hash}' 'unsafe-eval'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://i.ytimg.com",
      "media-src 'self' blob:",
      "font-src 'self'",
      "connect-src 'self' blob: https://api.github.com",
      "worker-src 'self' blob:",
      "frame-src 'self' https://www.youtube-nocookie.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
    return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }]
  },
})

export default defineConfig({
  plugins: [react(), csp()],
  server: {
    port: 5000,
    // the dev server stays on this machine unless asked for: VITE_HOST=1 npm run dev
    // opens it to the LAN (to test on a phone)
    host: process.env.VITE_HOST === '1',
    proxy,
  },
  preview: { proxy },   // npm run preview works against the same server.js
})
