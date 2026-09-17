/** Soft 14-day local trial + Stripe Payment Link checkout for Craft Pal Plus ($4.99/mo). */

export const STRIPE_PAYMENT_LINK =
  import.meta.env.VITE_STRIPE_PAYMENT_LINK ||
  'https://buy.stripe.com/8x29AMegD0RCd2ZeYd4AU09'

export const TRIAL_KEY = 'craft-pal-trial-v1'
export const PLUS_KEY = 'craft-pal-plus-v1'
export const PENDING_KEY = 'craft-pal-checkout-pending-v1'
export const TRIAL_DAYS = 14
export const PRICE_LABEL = '$4.99/mo'

const IDB_NAME = 'craft-pal-kv'

export type TrialState = {
  startedAt: string
  endsAt: string
}

export type PlusState = {
  unlocked: true
  status: 'trialing' | 'active'
  trialStarted: string
  trialEnds: string
  checkoutCompletedAt: string
  source: 'stripe-return' | 'manual'
  sessionId?: string
}

function idbOpen(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

function idbSet(key: string, value: string) {
  void idbOpen().then((db) => {
    if (!db) return
    try {
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').put(value, key)
    } catch {
      /* ignore */
    }
  })
}

function idbGet(key: string): Promise<string | null> {
  return idbOpen().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) return resolve(null)
        try {
          const tx = db.transaction('kv', 'readonly')
          const req = tx.objectStore('kv').get(key)
          req.onsuccess = () =>
            resolve(typeof req.result === 'string' ? req.result : null)
          req.onerror = () => resolve(null)
        } catch {
          resolve(null)
        }
      }),
  )
}

function parseTrial(raw: string | null): TrialState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<TrialState>
    if (!parsed?.startedAt) return null
    const endsAt =
      parsed.endsAt ||
      new Date(
        new Date(parsed.startedAt).getTime() + TRIAL_DAYS * 86400000,
      ).toISOString()
    return { startedAt: String(parsed.startedAt), endsAt: String(endsAt) }
  } catch {
    return null
  }
}

export function readTrial(): TrialState | null {
  if (typeof window === 'undefined') return null
  try {
    return parseTrial(window.localStorage.getItem(TRIAL_KEY))
  } catch {
    return null
  }
}

/** Start soft local trial on first open if missing. */
export function ensureTrial(): TrialState {
  const existing = readTrial()
  if (existing) return existing
  const started = new Date()
  const ends = new Date(started.getTime() + TRIAL_DAYS * 86400000)
  const next: TrialState = {
    startedAt: started.toISOString(),
    endsAt: ends.toISOString(),
  }
  try {
    window.localStorage.setItem(TRIAL_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

export function trialDaysLeft(trial: TrialState | null = readTrial()): number {
  if (!trial) return TRIAL_DAYS
  const ms = new Date(trial.endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
}

export function isTrialActive(trial: TrialState | null = readTrial()): boolean {
  if (!trial) return true
  return new Date(trial.endsAt).getTime() > Date.now()
}

function parsePlus(raw: string | null): PlusState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<PlusState> & {
      at?: string
      status?: string
      source?: string
    }
    if (!parsed || parsed.unlocked !== true) return null
    // Migrate older placeholder unlocks (status/at/source shape).
    const started =
      parsed.trialStarted ||
      parsed.checkoutCompletedAt ||
      parsed.at ||
      new Date().toISOString()
    const ends =
      parsed.trialEnds ||
      new Date(new Date(started).getTime() + TRIAL_DAYS * 86400000).toISOString()
    const status: PlusState['status'] =
      parsed.status === 'active' || parsed.status === 'trialing'
        ? parsed.status
        : 'trialing'
    const source: PlusState['source'] =
      parsed.source === 'manual' ? 'manual' : 'stripe-return'
    return {
      unlocked: true,
      status,
      trialStarted: String(started),
      trialEnds: String(ends),
      checkoutCompletedAt: String(parsed.checkoutCompletedAt || started),
      source,
      sessionId: parsed.sessionId ? String(parsed.sessionId) : undefined,
    }
  } catch {
    return null
  }
}

export function isStripeLinkReady(): boolean {
  return /^https?:\/\//i.test(String(STRIPE_PAYMENT_LINK || ''))
}

/** Payment Link URL; attaches client_reference_id from gift nickname when present. */
export function checkoutUrl(opts: { nickname?: string; email?: string } = {}): string {
  const link = String(STRIPE_PAYMENT_LINK || '')
  if (!isStripeLinkReady()) return link
  const url = new URL(link)
  const nick = String(opts.nickname || '').trim()
  if (nick) url.searchParams.set('client_reference_id', nick.slice(0, 80))
  if (opts.email) url.searchParams.set('prefilled_email', opts.email)
  return url.toString()
}

export function readPlus(): PlusState | null {
  if (typeof window === 'undefined') return null
  try {
    return parsePlus(window.localStorage.getItem(PLUS_KEY))
  } catch {
    return null
  }
}

export function isPlusUnlocked(state: PlusState | null = readPlus()): boolean {
  return Boolean(state?.unlocked)
}

/** Display label — trial end date while in Stripe trial window; then simple Plus. */
export function plusBannerText(state: PlusState | null = readPlus()): string {
  if (!state?.unlocked) return ''
  const endMs = state.trialEnds ? new Date(state.trialEnds).getTime() : NaN
  if (Number.isFinite(endMs) && endMs > Date.now()) {
    return `Plus trial active until ${new Date(endMs).toLocaleDateString()}`
  }
  return 'Craft Pal Plus · unlocked on this device'
}

export function unlockPlus(opts?: {
  sessionId?: string
  source?: PlusState['source']
}): PlusState {
  const existing = readPlus()
  const started = new Date()
  const ends = new Date(started.getTime() + TRIAL_DAYS * 86400000)
  const next: PlusState = {
    unlocked: true,
    status: existing?.status === 'active' ? 'active' : 'trialing',
    trialStarted: existing?.trialStarted || started.toISOString(),
    trialEnds: existing?.trialEnds || ends.toISOString(),
    checkoutCompletedAt: started.toISOString(),
    source: opts?.source || 'stripe-return',
    sessionId: opts?.sessionId || existing?.sessionId,
  }
  if (new Date(next.trialEnds).getTime() <= Date.now()) {
    next.status = 'active'
  }
  const raw = JSON.stringify(next)
  try {
    window.localStorage.setItem(PLUS_KEY, raw)
  } catch {
    /* IndexedDB backup still helps on flaky storage */
  }
  idbSet(PLUS_KEY, raw)
  clearCheckoutPending()
  return next
}

export async function hydratePlusFromIdb(): Promise<PlusState | null> {
  if (typeof window === 'undefined') return null
  try {
    const fromLs = readPlus()
    if (fromLs) return fromLs
    const raw = await idbGet(PLUS_KEY)
    const parsed = parsePlus(raw)
    if (!parsed) return null
    try {
      window.localStorage.setItem(PLUS_KEY, JSON.stringify(parsed))
    } catch {
      /* ignore */
    }
    return parsed
  } catch {
    return null
  }
}

export function markCheckoutPending() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify({ at: Date.now() }))
  } catch {
    /* ignore */
  }
}

export function checkoutWasPending(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as { at?: number }
    const at = Number(parsed.at)
    return Number.isFinite(at) && Date.now() - at < 2 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function clearCheckoutPending() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
}

/** True when return URL hints checkout completed — any of these is enough. */
export function checkoutReturnParams() {
  const q = new URLSearchParams(window.location.search)
  const sessionId = q.get('session_id') || q.get('checkout_session_id') || null
  const success =
    q.get('checkout') === 'success' ||
    q.get('plus') === '1' ||
    Boolean(sessionId)
  return {
    success,
    sessionId,
  }
}

export function clearCheckoutQuery() {
  const url = new URL(window.location.href)
  ;['checkout', 'plus', 'session_id', 'checkout_session_id'].forEach((k) =>
    url.searchParams.delete(k),
  )
  window.history.replaceState({}, '', url.pathname + url.search + url.hash)
}

export function hasFullAccess(opts: {
  gift: boolean
  plus: boolean
  trial: TrialState | null
}): boolean {
  if (opts.gift || opts.plus) return true
  return isTrialActive(opts.trial)
}

export const PRICE_USD = 4.99
export const APP_SLUG = 'craft-pal'
export const APP_ITEM_NAME = 'Craft Pal subscription'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/** Fire GA4 purchase + subscribe once per successful checkout (deduped in localStorage). */
export function trackSubscriptionPurchase(opts: { transactionId?: string; value?: number } = {}) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  const value = opts.value != null ? Number(opts.value) : PRICE_USD
  const tid = String(opts.transactionId || '').trim() || `local-${APP_SLUG}-${Date.now()}`
  const key = `ga-sub-${APP_SLUG}-${tid}`
  try {
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, '1')
  } catch {
    /* still fire once this page load */
  }
  window.gtag('event', 'purchase', {
    transaction_id: tid,
    value,
    currency: 'USD',
    items: [{
      item_name: APP_ITEM_NAME,
      item_category: 'subscription',
      price: value,
    }],
  })
  window.gtag('event', 'subscribe', {
    app: APP_SLUG,
    value,
    currency: 'USD',
  })
}
