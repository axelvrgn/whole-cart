import { db } from '../../db/db'
import type { ShoppingItem } from '../../types'

// All reads and writes of the shopping list go through here, so screens never touch Dexie directly.

export function getAllItems(): Promise<ShoppingItem[]> {
  return db.items.orderBy('createdAt').toArray()
}

export async function addItem(item: ShoppingItem): Promise<void> {
  await db.items.add(item)
}

export async function setChecked(id: string, checked: boolean): Promise<void> {
  await db.items.update(id, { checked })
}

export async function deleteItem(id: string): Promise<void> {
  await db.items.delete(id)
}

export async function deleteCheckedItems(): Promise<void> {
  await db.items.filter((item) => item.checked).delete()
}

/** Replaces the whole list in one transaction: if anything fails, nothing is changed. */
export async function replaceAllItems(items: ShoppingItem[]): Promise<void> {
  await db.transaction('rw', db.items, async () => {
    await db.items.clear()
    await db.items.bulkAdd(items)
  })
}
