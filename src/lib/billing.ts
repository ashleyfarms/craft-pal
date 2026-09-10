/** Soft trial + Subscribe placeholder. Stripe wire comes later. */

export const TRIAL_KEY = 'craft-pal-trial-v1'
export const PLUS_KEY = 'craft-pal-plus-v1'
export const TRIAL_DAYS = 14
export const PRICE_LABEL = '$4.99/mo'

export type TrialState = {
  startedAt: string
  endsAt: string
}

export type PlusState = {
  unlocked: true
  status: 'active' | 'placeholder'
  at: string
  source: 'subscribe-placeholder' | 'manual'
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

/** Start trial on first open if missing. */
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

export function readPlus(): PlusState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PLUS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PlusState>
    if (parsed?.unlocked !== true) return null
    return {
      unlocked: true,
      status: parsed.status === 'active' ? 'active' : 'placeholder',
      at: String(parsed.at || new Date().toISOString()),
      source:
        parsed.source === 'manual' ? 'manual' : 'subscribe-placeholder',
    }
  } catch {
    return null
  }
}

export function isPlusUnlocked(state: PlusState | null = readPlus()): boolean {
  return Boolean(state?.unlocked)
}

/** Placeholder subscribe — marks local unlock until Stripe is wired. */
export function unlockPlusPlaceholder(): PlusState {
  const next: PlusState = {
    unlocked: true,
    status: 'placeholder',
    at: new Date().toISOString(),
    source: 'subscribe-placeholder',
  }
  try {
    window.localStorage.setItem(PLUS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

export function hasFullAccess(opts: {
  gift: boolean
  plus: boolean
  trial: TrialState | null
}): boolean {
  if (opts.gift || opts.plus) return true
  return isTrialActive(opts.trial)
}
