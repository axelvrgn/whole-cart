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

/** Where the Open Food Facts search for a list item stands. */
export type ItemSearch =
  | { status: 'pending' }
  | { status: 'found'; alternatives: Product[]; approximate: boolean } // best first, up to 3
  | { status: 'not-found'; approximate: boolean }
  | { status: 'error'; reason: 'offline' | 'unavailable' }

export type ShoppingItem = {
  id: string
  label: string // "Yaourt nature", "Courgettes"
  kind: 'raw' | 'packaged' // raw = fresh, loose product: nothing to search
  product?: Product // the chosen product (the n°1 by default)
  search?: ItemSearch // packaged items only
  quantity?: string
  checked: boolean
  createdAt: number
}
