import type { AppData, Material, Recipe, Sale } from './types'

export const DATA_KEY = 'craft-pal-data-v1'
/** One-time safety copy of the raw data taken before the sales-model migration. */
export const BACKUP_KEY = 'craft-pal-data-backup-pre-v2'

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim()
}

/**
 * Normalize any stored sale (old v1 shape: recipeId + channel, or the new shape)
 * into the current Sale type. Returns null only for unusable junk.
 */
export function migrateSale(raw: unknown, recipes: Recipe[]): Sale | null {
  try {
    if (!raw || typeof raw !== 'object') return null
    const s = raw as Record<string, unknown>
    const recipeId = str(s.recipeId) || undefined
    const recipe = recipeId ? recipes.find((r) => r.id === recipeId) : undefined
    const qty = num(s.qty, 1)
    const date = /^\d{4}-\d{2}-\d{2}/.test(str(s.date)) ? str(s.date).slice(0, 10) : todayISO()
    const unitCost = s.unitCost == null || s.unitCost === '' ? undefined : num(s.unitCost)
    return {
      id: str(s.id) || uid('sale'),
      product: str(s.product) || recipe?.name || 'Product',
      line: str(s.line) || 'Other',
      where: str(s.where) || str(s.channel) || 'Other',
      qty: qty > 0 ? qty : 1,
      sellPrice: Math.max(0, num(s.sellPrice)),
      recipeId: recipe ? recipe.id : undefined,
      unitCost,
      date,
      createdAt: str(s.createdAt) || new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function readData(): AppData {
  if (typeof window === 'undefined') return { materials: [], recipes: [], sales: [] }
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(DATA_KEY)
    if (!raw) return { materials: [], recipes: [], sales: [] }
    const parsed = JSON.parse(raw) as Partial<AppData> | null
    const materials: Material[] = Array.isArray(parsed?.materials) ? parsed!.materials : []
    const recipes: Recipe[] = Array.isArray(parsed?.recipes) ? parsed!.recipes : []
    const rawSales: unknown[] = Array.isArray(parsed?.sales) ? parsed!.sales : []
    const needsMigration = rawSales.some(
      (s) => !s || typeof s !== 'object' || !('product' in s) || !('where' in s),
    )
    if (needsMigration) {
      try {
        if (!window.localStorage.getItem(BACKUP_KEY)) window.localStorage.setItem(BACKUP_KEY, raw)
      } catch {
        /* quota: migration still happens in memory, original stays until next save */
      }
    }
    const sales = rawSales
      .map((s) => migrateSale(s, recipes))
      .filter((s): s is Sale => s !== null)
    return { materials, recipes, sales }
  } catch {
    // Corrupt JSON: keep a copy so nothing is silently lost, then start clean.
    try {
      if (raw && !window.localStorage.getItem(BACKUP_KEY)) window.localStorage.setItem(BACKUP_KEY, raw)
    } catch {
      /* ignore */
    }
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
