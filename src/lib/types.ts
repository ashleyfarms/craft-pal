export type Material = {
  id: string
  name: string
  packCost: number
  unitsPerPack: number
  createdAt: string
}

export type RecipeLine = {
  materialId: string
  qty: number
}

export type Recipe = {
  id: string
  name: string
  lines: RecipeLine[]
  sellPrice?: number
  createdAt: string
}

/** Suggested "where sold" places shown before the seller has any of their own. */
export const WHERE_SUGGESTIONS = ['Etsy', 'Facebook Marketplace', 'Craft fair', 'In person']

/** Suggested product lines shown before the seller has any of their own. */
export const LINE_SUGGESTIONS = ['Bows', 'Wreaths', 'Stuffies']

export type Sale = {
  id: string
  /** Product name as the seller calls it (e.g. "Christmas bow"). */
  product: string
  /** Product line / category (e.g. "Bows"). */
  line: string
  /** Where it sold: venue or channel (e.g. "Etsy", "Maple St craft fair"). */
  where: string
  qty: number
  /** Sale price per item. */
  sellPrice: number
  /** Linked recipe; cost per item comes from its materials when set. */
  recipeId?: string
  /** Manual cost per item, used when no recipe is linked. */
  unitCost?: number
  date: string
  createdAt: string
}

export type AppData = {
  materials: Material[]
  recipes: Recipe[]
  sales: Sale[]
}

export type TabId = 'home' | 'materials' | 'recipes' | 'sales' | 'sells' | 'about'
