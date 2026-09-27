/* Craft Pal service worker — v2 (self-healing).
 * - Takes over immediately (skipWaiting + clients.claim) and deletes every older cache.
 * - Navigations are network-first, so a new deploy is picked up on the next open;
 *   the cached copy is only used when offline.
 * - Hashed /assets/* are cache-first, but an HTML response is never cached or served
 *   as a script (that was the blank-white-screen trap in v1).
 * - On the legacy craft-pal-app.netlify.app origin it clears itself out and sends the
 *   window to the real domain, so old home-screen installs recover.
 */
const VERSION = '2026-09-27-2'
const CACHE = 'craft-pal-' + VERSION
const CANONICAL = 'https://craftpal.help-pal-apps.com'
const LEGACY_HOSTS = ['craft-pal-app.netlify.app']
const isLegacy = LEGACY_HOSTS.includes(self.location.hostname)

self.addEventListener('install', (event) => {
  self.skipWaiting()
  if (isLegacy) return
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add(new Request('/', { cache: 'reload' })))
      .catch(() => {}),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      const stale = keys.filter((k) => k !== CACHE || isLegacy)
      await Promise.all(stale.map((k) => caches.delete(k)))
      await self.clients.claim()
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (isLegacy) {
        await self.registration.unregister()
        for (const w of wins) {
          const u = new URL(w.url)
          w.navigate(CANONICAL + u.pathname + u.search + u.hash).catch(() => {})
        }
        return
      }
      // Upgrading from an older SW: reload open windows once so a blank page recovers.
      if (stale.length) for (const w of wins) w.navigate(w.url).catch(() => {})
    })(),
  )
})

function isHtml(res) {
  return (res.headers.get('content-type') || '').includes('text/html')
}

async function networkFirstNavigation(req) {
  try {
    const res = await fetch(req)
    if (res.ok && res.type === 'basic' && !res.redirected && isHtml(res)) {
      const copy = res.clone()
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
    }
    return res
  } catch {
    const cached = (await caches.match(req)) || (await caches.match('/'))
    return cached || Response.error()
  }
}

async function cacheFirstAsset(req) {
  const cached = await caches.match(req)
  if (cached && !isHtml(cached)) return cached
  const res = await fetch(req)
  if (res.ok && res.type === 'basic' && !isHtml(res)) {
    const copy = res.clone()
    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
  }
  return res
}

async function networkWithCacheFallback(req) {
  try {
    const res = await fetch(req)
    if (res.ok && res.type === 'basic' && !res.redirected) {
      const copy = res.clone()
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
    }
    return res
  } catch {
    return (await caches.match(req)) || Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (isLegacy || req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // ads, analytics, fonts: browser handles
  if (url.pathname === '/sw.js') return
  if (req.mode === 'navigate') return event.respondWith(networkFirstNavigation(req))
  if (url.pathname.startsWith('/assets/')) return event.respondWith(cacheFirstAsset(req))
  event.respondWith(networkWithCacheFallback(req))
})
