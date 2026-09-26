import type { ShoppingItem } from '../../types'

type NewItem = {
  label: string
  quantity?: string
  kind?: ShoppingItem['kind']
  product?: ShoppingItem['product']
}

/** Builds a new item, or returns null if the label is empty. */
export function createItem(input: NewItem, now = Date.now(), id: string = crypto.randomUUID()):ShoppingItem | null {
  const label = input.label.trim().replace(/\s+/g, ' ')
  if (!label) return null

  const quantity = input.quantity?.trim()
  return {
    id,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    kind: input.kind ?? 'raw',
    ...(input.product && { product: input.product }),
    ...(quantity && { quantity }),
    checked: false,
    createdAt: now,
  }
}

/** Items still to buy first (in the order they were added), then checked items. */
export function sortItems(items: readonly ShoppingItem[]): ShoppingItem[] {
  return [...items].sort((a, b) => Number(a.checked) - Number(b.checked) || a.createdAt - b.createdAt)
}

export function countRemaining(items: readonly ShoppingItem[]): number {
  return items.filter((item) => !item.checked).length
}
