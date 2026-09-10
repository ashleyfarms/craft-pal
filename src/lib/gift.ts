/** Gift / tester unlock for Albert, Ashley & David (same pattern as other ashleyfarms apps). */

export const GIFT_KEY = 'craft-pal-gift-v1'
export const NICKNAME_KEY = 'craft-pal-nickname-v1'

const GIFT_CODES: Record<string, string> = {
  albert: 'Albert',
  ashley: 'Ashley',
  david: 'David',
}

export type GiftState = {
  unlocked: true
  gift: true
  giftFor: string
  nickname: string
  at: number
  source: 'gift'
}

export function resolveGiftCode(raw: string | null | undefined): string | null {
  const code = String(raw || '')
    .trim()
    .toLowerCase()
  return GIFT_CODES[code] || null
}

function parseGift(raw: string | null): GiftState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<GiftState>
    if (!parsed || parsed.unlocked !== true || parsed.gift !== true) return null
    const who = String(parsed.giftFor || parsed.nickname || '').trim()
    if (!who) return null
    return {
      unlocked: true,
      gift: true,
      giftFor: who,
      nickname: String(parsed.nickname || who).trim() || who,
      at: typeof parsed.at === 'number' ? parsed.at : Date.now(),
      source: 'gift',
    }
  } catch {
    return null
  }
}

export function readGift(): GiftState | null {
  if (typeof window === 'undefined') return null
  try {
    return parseGift(window.localStorage.getItem(GIFT_KEY))
  } catch {
    return null
  }
}

export function readNickname(): string {
  if (typeof window === 'undefined') return ''
  try {
    const fromNick = window.localStorage.getItem(NICKNAME_KEY)
    if (fromNick && fromNick.trim()) return fromNick.trim()
  } catch {
    /* ignore */
  }
  return readGift()?.nickname || ''
}

export function unlockGift(who: string): GiftState {
  const existing = readGift()
  const currentNick = readNickname()
  const nickname = currentNick || who
  const next: GiftState = {
    unlocked: true,
    gift: true,
    giftFor: who,
    nickname,
    at: existing?.at || Date.now(),
    source: 'gift',
  }
  try {
    window.localStorage.setItem(GIFT_KEY, JSON.stringify(next))
    if (!currentNick) window.localStorage.setItem(NICKNAME_KEY, nickname)
  } catch {
    /* ignore */
  }
  return next
}

export function isGiftUnlocked(state: GiftState | null = readGift()): boolean {
  return Boolean(state?.unlocked && state?.gift)
}

export function clearGiftQuery() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('gift')) return
  url.searchParams.delete('gift')
  window.history.replaceState({}, '', url.pathname + url.search + url.hash)
}
