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

export function saleProfit(
  sale: Sale,
  recipes: Recipe[],
  materials: Material[],
): number {
  const recipe = recipes.find((r) => r.id === sale.recipeId)
  if (!recipe) return sale.sellPrice * sale.qty
  const cost = recipeUnitCost(recipe, materials) * sale.qty
  return sale.sellPrice * sale.qty - cost
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export function currentMonthKey(): string {
  return monthKey(new Date().toISOString().slice(0, 10))
}

export function thisMonthProfit(
  sales: Sale[],
  recipes: Recipe[],
  materials: Material[],
): number {
  const mk = currentMonthKey()
  return sales
    .filter((s) => monthKey(s.date) === mk)
    .reduce((sum, s) => sum + saleProfit(s, recipes, materials), 0)
}

export function topRecipeByProfit(
  sales: Sale[],
  recipes: Recipe[],
  materials: Material[],
): { recipe: Recipe; profit: number } | null {
  const mk = currentMonthKey()
  const totals = new Map<string, number>()
  for (const s of sales) {
    if (monthKey(s.date) !== mk) continue
    const p = saleProfit(s, recipes, materials)
    totals.set(s.recipeId, (totals.get(s.recipeId) || 0) + p)
  }
  let best: { recipe: Recipe; profit: number } | null = null
  for (const [id, profit] of totals) {
    const recipe = recipes.find((r) => r.id === id)
    if (!recipe) continue
    if (!best || profit > best.profit) best = { recipe, profit }
  }
  return best
}
