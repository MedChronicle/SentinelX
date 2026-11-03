import { defineConfig, loadEnv, type HtmlTagDescriptor, type Plugin, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

import siteConfiguration from './.figma/make/site.json'

export default defineConfig(async ({ mode, command }) => {
  // Load every env var (not only VITE_-prefixed ones) for use inside this config only.
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'
  const isProd = command === 'build' && !isDev
  const emitSourcemaps = isDev || env.SOURCEMAP === 'true'
  const port = parseInt(env.PORT || '8443')
  const host = env.FIGMA_DEV_SERVER_HOST || '0.0.0.0'

  const plugins: PluginOption[] = [
    react(),
    tailwindcss(),
    figmaSiteConfiguration(siteConfiguration),
    figmaErrorOverlayReplay(),
    figmaReactRefreshBoundaryFallback(),
    figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' }),
    securityHeaders(),
    buildInfo({ commit: env.GIT_COMMIT || env.VERCEL_GIT_COMMIT_SHA || env.GITHUB_SHA }),
  ]

  // Optional bundle report: ANALYZE=true npm run build (needs `npm i -D rollup-plugin-visualizer`)
  if (env.ANALYZE === 'true') {
    try {
      const { visualizer } = await import('rollup-plugin-visualizer')
      plugins.push(
        visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true, open: false }) as PluginOption,
      )
    } catch {
      console.warn('[vite] ANALYZE=true but rollup-plugin-visualizer is not installed; skipping.')
    }
  }

  return {
    base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',

    plugins,

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      // Prevent duplicate React copies from linked or hoisted packages.
      dedupe: ['react', 'react-dom'],
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    css: {
      devSourcemap: isDev,
    },

    esbuild: {
      // Strip debugging noise from production bundles.
      drop: isProd ? ['debugger'] : [],
      pure: isProd ? ['console.log', 'console.debug'] : [],
      legalComments: 'none',
    },

    optimizeDeps: {
      // Pre-bundle heavy deps up front so the first dev load isn't followed by a reload.
      include: ['react', 'react-dom', 'react-dom/client'],
    },

    build: {
      target: 'es2022',
      sourcemap: emitSourcemaps ? (isDev ? 'inline' : true) : false,
      minify: !isDev,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 700,
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          // Split stable vendor code so app changes don't bust the whole cache.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor'
            if (/[\\/]node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return 'router'
            if (/[\\/]node_modules[\\/](@radix-ui|lucide-react|cmdk|vaul|sonner)[\\/]/.test(id)) return 'ui-vendor'
            if (/[\\/]node_modules[\\/](motion|framer-motion)[\\/]/.test(id)) return 'motion'
            if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+)[\\/]/.test(id)) return 'charts'
            return undefined
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            const ext = name?.split('.').pop() ?? ''
            if (/png|jpe?g|svg|gif|webp|avif|ico/i.test(ext)) return 'assets/img/[name]-[hash][extname]'
            if (/woff2?|ttf|otf|eot/i.test(ext)) return 'assets/fonts/[name]-[hash][extname]'
            if (ext === 'css') return 'assets/css/[name]-[hash][extname]'
            return 'assets/[name]-[hash][extname]'
          },
        },
      },
    },

    server: {
      host,
      port,
      strictPort: true,
      // Optional API proxy: set API_PROXY_TARGET=https://api.example.com to forward /api in dev.
      proxy: env.API_PROXY_TARGET
        ? {
            '/api': {
              target: env.API_PROXY_TARGET,
              changeOrigin: true,
              secure: false,
              rewrite: (p: string) => p.replace(/^\/api/, ''),
            },
          }
        : undefined,
      warmup: {
        clientFiles: ['./src/main.tsx', './src/App.tsx'],
      },
      watch: {
        ignored: ['**/.figma/**'],
      },
    },

    preview: {
      host,
      port,
    },
  }
})

/* -------------------------------------------------------------------------- */
/*  Custom plugins                                                            */
/* -------------------------------------------------------------------------- */

/** Adds baseline security headers to the dev and preview servers. */
function securityHeaders(): Plugin {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
  const middleware = (_req: unknown, res: { setHeader(k: string, v: string): void }, next: () => void) => {
    for (const [key, value] of Object.entries(headers)) res.setHeader(key, value)
    next()
  }

  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use(middleware as never)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware as never)
    },
  }
}

/** Emits /version.json at build time so deployed builds can be identified and polled for updates. */
function buildInfo(options: { commit?: string }): Plugin {
  const info = {
    version: process.env.npm_package_version ?? '0.0.0',
    commit: options.commit ?? null,
    builtAt: new Date().toISOString(),
  }

  return {
    name: 'build-info',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(info, null, 2),
      })
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Figma plugins                                                             */
/* -------------------------------------------------------------------------- */

type FigmaSiteConfiguration = {
  title?: string
  description?: string
  language?: string
  robots?: {
    index?: boolean
  }
  icons?: {
    icon?: string
  }
  openGraph?: {
    image?: string
  }
  analytics?: {
    googleAnalyticsId?: string
  }
  customScripts?: {
    headStart?: string
    headEnd?: string
    bodyStart?: string
    bodyEnd?: string
  }
  accessibility?: {
    addBypassLinks?: boolean
  }
}

/** Applies /.figma/make/site.json to the generated document shell. */
function figmaSiteConfiguration(config: FigmaSiteConfiguration): Plugin {
  function sanitizeHtmlValue(value: string | undefined): string {
    return value?.replace(/[^a-zA-Z0-9_-]/g, '') || ''
  }
  function escapeHtmlText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  function replaceHtmlCommentSlot(html: string, slotName: string, content: string): string {
    // Function replacer so "$&" and similar sequences in user content are not interpreted.
    return html.replace(`<!-- ${slotName} -->`, () => content)
  }

  const title = config.title ?? 'Figma Make App'
  const description = config.description ?? ''
  const favicon = config.icons?.icon ?? ''
  const socialImage = config.openGraph?.image ?? ''
  const language = sanitizeHtmlValue(config.language) || 'en'
  const googleAnalyticsId = sanitizeHtmlValue(config.analytics?.googleAnalyticsId)
  const headStart = config.customScripts?.headStart ?? ''
  const headEnd = config.customScripts?.headEnd ?? ''
  const bodyStart = config.customScripts?.bodyStart ?? ''
  const bodyEnd = config.customScripts?.bodyEnd ?? ''
  const noIndex = config.robots?.index === false
  const robotsTxt = noIndex ? 'User-agent: *\nDisallow: /\n' : ''

  return {
    name: 'figma-site-configuration',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!robotsTxt || req.url?.split('?')[0] !== '/robots.txt') return next()

        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(robotsTxt)
      })
    },
    generateBundle() {
      if (!robotsTxt) return

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robotsTxt,
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let result = html
        result = replaceHtmlCommentSlot(result, 'figma:lang', language)
        result = replaceHtmlCommentSlot(result, 'figma:title', escapeHtmlText(title))
        result = replaceHtmlCommentSlot(result, 'figma:head-start', headStart)
        result = replaceHtmlCommentSlot(result, 'figma:head-end', headEnd)
        result = replaceHtmlCommentSlot(result, 'figma:body-start', bodyStart)
        result = replaceHtmlCommentSlot(result, 'figma:body-end', bodyEnd)

        const tags: HtmlTagDescriptor[] = []
        if (description) {
          tags.push({ tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' })
        }
        if (noIndex) {
          tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' })
        }
        if (favicon) {
          tags.push({ tag: 'link', attrs: { rel: 'icon', href: favicon }, injectTo: 'head' })
        }
        if (title) {
          tags.push({ tag: 'meta', attrs: { property: 'og:title', content: title }, injectTo: 'head' })
        }
        if (description) {
          tags.push({ tag: 'meta', attrs: { property: 'og:description', content: description }, injectTo: 'head' })
        }
        if (socialImage) {
          tags.push(
            { tag: 'meta', attrs: { property: 'og:image', content: socialImage }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:image', content: socialImage }, injectTo: 'head' },
          )
        }

        if (googleAnalyticsId) {
          tags.push(
            {
              tag: 'script',
              attrs: {
                async: true,
                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
              },
              injectTo: 'head',
            },
            {
              tag: 'script',
              children: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ${JSON.stringify(googleAnalyticsId)});
`,
              injectTo: 'head',
            },
          )
        }

        if (config.accessibility?.addBypassLinks) {
          tags.push(
            {
              tag: 'style',
              children: `
  .figma-bypass-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 2147483647;
    transform: translateY(-150%);
    border-radius: 6px;
    background: #111827;
    color: #fff;
    padding: 8px 12px;
    font: 600 14px/1.2 system-ui, sans-serif;
    text-decoration: none;
  }
  .figma-bypass-link:focus {
    transform: translateY(0);
  }
`,
              injectTo: 'head',
            },
            {
              tag: 'a',
              attrs: { class: 'figma-bypass-link', href: '#root' },
              children: 'Skip to content',
              injectTo: 'body-prepend',
            },
          )
        }

        return {
          html: result,
          tags,
        }
      },
    },
  }
}

/** Re-sends the last compile error to newly connected clients so the overlay survives reloads. */
function figmaErrorOverlayReplay(): Plugin {
  return {
    name: 'figma-error-overlay-replay',
    apply: 'serve',
    configureServer(server) {
      let lastError: object | null = null

      const origSend = server.ws.send.bind(server.ws) as (...args: any[]) => void
      server.ws.send = ((...args: any[]) => {
        const payload = args[0]
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const type = (payload as { type?: string }).type
          if (type === 'error') {
            lastError = payload as object
          } else if (type === 'update' || type === 'full-reload') {
            lastError = null
          }
        }
        return origSend(...args)
      }) as typeof server.ws.send

      server.ws.on('connection', (socket) => {
        if (lastError !== null) {
          socket.send(JSON.stringify(lastError))
        }
      })
    },
  }
}

/** Forces a full reload when a module loses its React Refresh boundary (e.g. a component export was removed). */
function figmaReactRefreshBoundaryFallback(): Plugin {
  const hadRefreshBoundary = new Map<string, boolean>()
  let sendFullReload: (() => void) | null = null

  return {
    name: 'figma-react-refresh-boundary-fallback',
    apply: 'serve',
    enforce: 'post',
    configureServer(server) {
      sendFullReload = () => server.ws.send({ type: 'full-reload', path: '*' })
    },
    transform(code, id) {
      if (!/\.[jt]sx?(?:\?|$)/.test(id) || id.includes('/node_modules/')) return null

      const moduleId = id.split('?')[0] ?? id
      const hasRefreshBoundary = code.includes('registerExportsForReactRefresh')
      const previousHadRefreshBoundary = hadRefreshBoundary.get(moduleId)
      hadRefreshBoundary.set(moduleId, hasRefreshBoundary)

      if (previousHadRefreshBoundary && !hasRefreshBoundary) {
        queueMicrotask(() => sendFullReload?.())
      }

      return null
    },
  }
}

/** Serves a virtual story index at /.figma/make/kit.html for Figma Make's component kit. */
function figmaMakeKitPlugin(options: { storiesGlob: string | string[] }): Plugin {
  const storiesGlob = Array.isArray(options.storiesGlob) ? options.storiesGlob : [options.storiesGlob]
  const ROUTE = '/.figma/make/kit.html'
  const VIRTUAL_ID = 'virtual:figma-stories'
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  const STORIES_MODULE = `export const stories = import.meta.glob(${JSON.stringify(storiesGlob)})`
  const HTML_BOOTSTRAP = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
<div id="figma-make-kit-root"></div>
<script type="module">
  import { stories } from 'virtual:figma-stories'
  window.__FIGMA__ = Object.assign(window.__FIGMA__ ?? {}, { stories })
  window.dispatchEvent(new CustomEvent('figma.ready'))
</script>
</body>
</html>`

  return {
    name: 'figma-make-kit',
    apply: 'serve',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      return null
    },
    load(id) {
      if (id !== RESOLVED_ID) return null
      return STORIES_MODULE
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (url.split('?')[0] !== ROUTE) return next()

        try {
          res.setHeader('Content-Type', 'text/html')
          res.end(await server.transformIndexHtml(url, HTML_BOOTSTRAP))
        } catch (err) {
          next(err as Error)
        }
      })
    },
  }
}
