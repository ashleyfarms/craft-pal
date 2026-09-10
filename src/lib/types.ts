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

export type SaleChannel =
  | 'Etsy'
  | 'Facebook'
  | 'Craft fair'
  | 'Consignment'
  | 'Other'

export const SALE_CHANNELS: SaleChannel[] = [
  'Etsy',
  'Facebook',
  'Craft fair',
  'Consignment',
  'Other',
]

export type Sale = {
  id: string
  recipeId: string
  qty: number
  sellPrice: number
  channel: SaleChannel
  date: string
  createdAt: string
}

export type AppData = {
  materials: Material[]
  recipes: Recipe[]
  sales: Sale[]
}

export type TabId = 'home' | 'materials' | 'recipes' | 'sales' | 'subscribe'
