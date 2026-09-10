import type { AppData } from './types'

export const DATA_KEY = 'craft-pal-data-v1'

const empty: AppData = { materials: [], recipes: [], sales: [] }

export function readData(): AppData {
  if (typeof window === 'undefined') return { ...empty }
  try {
    const raw = window.localStorage.getItem(DATA_KEY)
    if (!raw) return { materials: [], recipes: [], sales: [] }
    const parsed = JSON.parse(raw) as Partial<AppData>
    return {
      materials: Array.isArray(parsed.materials) ? parsed.materials : [],
      recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
    }
  } catch {
    return { materials: [], recipes: [], sales: [] }
  }
}

export function writeData(data: AppData) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data))
  } catch {
    /* quota / private mode */
  }
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
