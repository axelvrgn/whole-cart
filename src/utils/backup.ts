import type { Product, ShoppingItem } from '../types'

const APP_ID = 'whole-cart'
// Backups made before the app was renamed are still accepted.
const LEGACY_APP_IDS: readonly unknown[] = ['clean-eating']
const BACKUP_VERSION = 1

export type Backup = {
  app: typeof APP_ID
  version: number
  exportedAt: string
  items: ShoppingItem[]
}

export function buildBackup(items: ShoppingItem[], now = new Date()): Backup {
  return { app: APP_ID, version: BACKUP_VERSION, exportedAt: now.toISOString(), items }
}

export function backupFileName(now = new Date()): string {
  return `whole-cart-${now.toISOString().slice(0, 10)}.json`
}

export class BackupError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.name === 'string'
  )
}

function isShoppingItem(value: unknown): value is ShoppingItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    value.label.trim() !== '' &&
    (value.kind === 'raw' || value.kind === 'packaged') &&
    typeof value.checked === 'boolean' &&
    typeof value.createdAt === 'number' &&
    isOptionalString(value.quantity) &&
    (value.product === undefined || isProduct(value.product))
  )
}

/**
 * Validates the content of an imported file. The file comes from outside the app,
 * so nothing is trusted: throws a BackupError with a user-facing French message.
 */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError("Ce fichier n'est pas un fichier JSON valide.")
  }

  if (!isRecord(data) || (data.app !== APP_ID && !LEGACY_APP_IDS.includes(data.app))) {
    throw new BackupError("Ce fichier n'est pas une sauvegarde Whole Cart.")
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    throw new BackupError('Cette sauvegarde vient d’une version plus récente de l’app.')
  }
  if (!Array.isArray(data.items) || !data.items.every(isShoppingItem)) {
    throw new BackupError('La liste contenue dans ce fichier est invalide ou abîmée.')
  }

  return {
    app: APP_ID,
    version: data.version,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    items: data.items,
  }
}
