export type NovaGroup = 1 | 2 | 3 | 4

export type NutriScore = 'a' | 'b' | 'c' | 'd' | 'e'

export type Product = {
  code: string
  name: string
  brand?: string
  nova?: NovaGroup
  nutriscore?: NutriScore
  additives: string[]
  stores: string[]
  imageUrl?: string
}

export type ShoppingItem = {
  id: string
  label: string // "Yaourt nature", "Courgettes"
  kind: 'raw' | 'packaged'
  product?: Product // packaged products only
  quantity?: string
  checked: boolean
  createdAt: number
}

export type Settings = {
  store: string // Open Food Facts store tag, e.g. "carrefour"
  maxNova: 1 | 2 | 3
}
