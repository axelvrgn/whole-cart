import type { ProductSearchResult } from '../../api/productSearch'
import type { ShoppingItem } from '../../types'
import { searchTargetFor } from '../../utils/foodMatcher'

type NewItem = {
  label: string
  quantity?: string
}

/**
 * Builds a new item, or returns null if the label is empty.
 * Fresh, loose products (courgettes…) are "raw": nothing to search.
 * Everything else starts with a pending Open Food Facts search.
 */
export function createItem(input: NewItem, now = Date.now(), id: string = crypto.randomUUID()): ShoppingItem | null {
  const label = input.label.trim().replace(/\s+/g, ' ')
  if (!label) return null

  const quantity = input.quantity?.trim()
  const isRaw = searchTargetFor(label)?.kind === 'none'
  return {
    id,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    kind: isRaw ? 'raw' : 'packaged',
    ...(!isRaw && { search: { status: 'pending' } }),
    ...(quantity && { quantity }),
    checked: false,
    createdAt: now,
  }
}

/** The changes to save on an item once its search has finished. */
export function applySearchResult(result: ProductSearchResult): Partial<ShoppingItem> {
  if (result.status === 'no-search') return { kind: 'raw', search: undefined, product: undefined }
  if (result.status === 'not-found') {
    return { search: { status: 'not-found', approximate: result.approximate }, product: undefined }
  }
  return {
    search: { status: 'found', alternatives: result.products, approximate: result.approximate },
    product: result.products[0],
  }
}

/** Items still to buy first (in the order they were added), then checked items. */
export function sortItems(items: readonly ShoppingItem[]): ShoppingItem[] {
  return [...items].sort((a, b) => Number(a.checked) - Number(b.checked) || a.createdAt - b.createdAt)
}

export function countRemaining(items: readonly ShoppingItem[]): number {
  return items.filter((item) => !item.checked).length
}
