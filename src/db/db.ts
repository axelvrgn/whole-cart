import Dexie, { type EntityTable } from 'dexie'
import type { ShoppingItem } from '../types'

/**
 * Local database, stored in the browser's IndexedDB (works offline, survives reloads).
 * Dexie is a thin, typed wrapper around the raw IndexedDB API, which is very verbose.
 */
export const db = new Dexie('whole-cart') as Dexie & {
  items: EntityTable<ShoppingItem, 'id'>
}

// The schema lists only the primary key and the indexed fields (used for sorting/filtering),
// not every property. Booleans can't be indexed in IndexedDB, so `checked` isn't listed.
// To change the schema later, add a db.version(2) instead of editing this one.
db.version(1).stores({
  items: 'id, createdAt',
})
