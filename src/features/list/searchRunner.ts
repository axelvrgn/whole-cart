import { findProducts, ProductSearchError } from '../../api/productSearch'
import type { ShoppingItem } from '../../types'
import { applySearchResult } from './listLogic'
import { updateItem } from './listRepository'

// Items whose search is currently running, so a re-render doesn't start it twice.
const running = new Set<string>()

/**
 * Starts the Open Food Facts search of every item still marked "pending".
 * Called whenever the list changes: new items, "Réessayer", and items left pending
 * when the app was closed mid-search all go through here.
 */
export function runPendingSearches(items: readonly ShoppingItem[]): void {
  for (const item of items) {
    if (item.search?.status === 'pending' && !running.has(item.id)) {
      running.add(item.id)
      void searchItem(item).finally(() => running.delete(item.id))
    }
  }
}

async function searchItem(item: ShoppingItem): Promise<void> {
  try {
    const result = await findProducts(item.label)
    await updateItem(item.id, applySearchResult(result))
  } catch (error) {
    console.error(`Search failed for "${item.label}"`, error)
    const reason = error instanceof ProductSearchError ? error.reason : 'unavailable'
    await updateItem(item.id, { search: { status: 'error', reason } })
  }
}
