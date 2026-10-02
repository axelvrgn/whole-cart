import Dexie, { type EntityTable } from 'dexie'
import type { Product, ShoppingItem } from '../types'

/** Raw search results kept locally, so the same search isn't repeated for a week. */
export type SearchCacheEntry = {
  key: string // e.g. "category:en:plain-yogurts" or "text:kombucha"
  savedAt: number
  products: Product[]
}

/**
 * Local database, stored in the browser's IndexedDB (works offline, survives reloads).
 * Dexie is a thin, typed wrapper around the raw IndexedDB API, which is very verbose.
 */
export const db = new Dexie('whole-cart') as Dexie & {
  items: EntityTable<ShoppingItem, 'id'>
  searchCache: EntityTable<SearchCacheEntry, 'key'>
}

// The schema lists only the primary key and the indexed fields (used for sorting/filtering),
// not every property. Booleans can't be indexed in IndexedDB, so `checked` isn't listed.
// Never edit an existing version: add a new one, Dexie upgrades existing databases.
db.version(1).stores({
  items: 'id, createdAt',
})
db.version(2).stores({
  searchCache: 'key',
})
