import type { Material, Recipe, Sale } from './types'

export function unitCost(m: Material): number {
  if (!m.unitsPerPack || m.unitsPerPack <= 0) return 0
  return m.packCost / m.unitsPerPack
}

export function recipeUnitCost(
  recipe: Recipe,
  materials: Material[],
): number {
  const byId = new Map(materials.map((m) => [m.id, m]))
  return recipe.lines.reduce((sum, line) => {
    const mat = byId.get(line.materialId)
    if (!mat) return sum
    return sum + unitCost(mat) * (Number(line.qty) || 0)
  }, 0)
}

export function recipeProfit(recipe: Recipe, materials: Material[]): number | null {
  if (recipe.sellPrice == null || Number.isNaN(Number(recipe.sellPrice))) return null
  return Number(recipe.sellPrice) - recipeUnitCost(recipe, materials)
}

export function recipeMarginPct(
  recipe: Recipe,
  materials: Material[],
): number | null {
  if (recipe.sellPrice == null || recipe.sellPrice <= 0) return null
  const profit = recipeProfit(recipe, materials)
  if (profit == null) return null
  return (profit / recipe.sellPrice) * 100
}

export function money(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return v.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function pct(n: number): string {
  return `${n.toFixed(0)}%`
}

/** Cost per item: from the linked recipe's materials, else the manual cost, else 0. */
export function saleUnitCost(sale: Sale, recipes: Recipe[], materials: Material[]): number {
  const recipe = sale.recipeId ? recipes.find((r) => r.id === sale.recipeId) : undefined
  if (recipe) return recipeUnitCost(recipe, materials)
  return Number.isFinite(sale.unitCost) ? Number(sale.unitCost) : 0
}

export function saleRevenue(sale: Sale): number {
  return sale.sellPrice * sale.qty
}

export function saleProfit(sale: Sale, recipes: Recipe[], materials: Material[]): number {
  return saleRevenue(sale) - saleUnitCost(sale, recipes, materials) * sale.qty
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

function localISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function currentMonthKey(): string {
  return monthKey(localISO(new Date()))
}

export function thisMonthProfit(sales: Sale[], recipes: Recipe[], materials: Material[]): number {
  const mk = currentMonthKey()
  return sales
    .filter((s) => monthKey(s.date) === mk)
    .reduce((sum, s) => sum + saleProfit(s, recipes, materials), 0)
}

export type Period = '30d' | '90d' | 'year' | 'all'

export const PERIODS: { id: Period; label: string; phrase: string }[] = [
  { id: '30d', label: '30 days', phrase: 'in the last 30 days' },
  { id: '90d', label: '90 days', phrase: 'in the last 90 days' },
  { id: 'year', label: 'Year', phrase: 'in the last year' },
  { id: 'all', label: 'All', phrase: 'overall' },
]

export function filterByPeriod(sales: Sale[], period: Period): Sale[] {
  if (period === 'all') return sales
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 365
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  const cutoff = localISO(from)
  return sales.filter((s) => s.date >= cutoff)
}

export type Group = { key: string; units: number; revenue: number; profit: number }

/** Totals grouped by product / line / where, sorted by profit (or revenue). */
export function groupSales(
  sales: Sale[],
  by: (s: Sale) => string,
  recipes: Recipe[],
  materials: Material[],
  sortBy: 'profit' | 'revenue' = 'profit',
): Group[] {
  const map = new Map<string, Group>()
  for (const s of sales) {
    const key = by(s) || 'Other'
    const g = map.get(key) || { key, units: 0, revenue: 0, profit: 0 }
    g.units += s.qty
    g.revenue += saleRevenue(s)
    g.profit += saleProfit(s, recipes, materials)
    map.set(key, g)
  }
  return [...map.values()].sort((a, b) => b[sortBy] - a[sortBy] || b.units - a.units)
}

export function topProductByProfit(
  sales: Sale[],
  recipes: Recipe[],
  materials: Material[],
): Group | null {
  const mk = currentMonthKey()
  const month = sales.filter((s) => monthKey(s.date) === mk)
  return groupSales(month, (s) => s.product, recipes, materials)[0] || null
}

function csvCell(v: string | number): string {
  let t = String(v)
  // Neutralize spreadsheet formulas in free-text fields.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(t) && Number.isNaN(Number(t))) t = `'${t}`
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

export function salesToCsv(sales: Sale[], recipes: Recipe[], materials: Material[]): string {
  const head = ['Date', 'Product', 'Product line', 'Where sold', 'Qty', 'Price each', 'Revenue', 'Cost each', 'Total cost', 'Profit']
  const rows = [...sales]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map((s) => {
      const c = saleUnitCost(s, recipes, materials)
      return [s.date, s.product, s.line, s.where, s.qty, s.sellPrice.toFixed(2), saleRevenue(s).toFixed(2), c.toFixed(2), (c * s.qty).toFixed(2), saleProfit(s, recipes, materials).toFixed(2)]
    })
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
