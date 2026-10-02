export type NovaGroup = 1 | 2 | 3 | 4

export type NutriScore = 'a' | 'b' | 'c' | 'd' | 'e'

/** A packaged product from Open Food Facts. Community data: anything optional may be missing. */
export type Product = {
  code: string // barcode
  name: string
  brand?: string
  nova?: NovaGroup
  nutriscore?: NutriScore
  additivesCount?: number
  ingredientsCount?: number
  popularity?: number // number of scans on Open Food Facts
  packaging?: string // e.g. "4 x 125 g"
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
