import { describe, expect, it } from 'vitest'
import type { ShoppingItem } from '../types'
import { BackupError, backupFileName, buildBackup, parseBackup } from './backup'

const items: ShoppingItem[] = [
  { id: '1', label: 'Courgettes', kind: 'raw', quantity: '3', checked: false, createdAt: 1 },
  {
    id: '2',
    label: 'Yaourt nature',
    kind: 'packaged',
    product: { code: '123', name: 'Yaourt', nova: 1, additives: [], stores: ['carrefour'] },
    checked: true,
    createdAt: 2,
  },
]

const date = new Date('2026-09-26T10:00:00Z')

describe('backup round trip', () => {
  it('parses what it exports', () => {
    const text = JSON.stringify(buildBackup(items, date))
    expect(parseBackup(text).items).toEqual(items)
  })

  it('accepts backups made under the old app name', () => {
    const text = JSON.stringify({ ...buildBackup(items, date), app: 'clean-eating' })
    expect(parseBackup(text).items).toEqual(items)
  })

  it('names the file with the date', () => {
    expect(backupFileName(date)).toBe('whole-cart-2026-09-26.json')
  })
})

describe('parseBackup errors', () => {
  const valid = buildBackup(items, date)

  it.each([
    ['not JSON', 'hello'],
    ['another app', JSON.stringify({ ...valid, app: 'yuka' })],
    ['a newer version', JSON.stringify({ ...valid, version: 99 })],
    ['items not an array', JSON.stringify({ ...valid, items: {} })],
    ['an item without label', JSON.stringify({ ...valid, items: [{ ...items[0], label: '' }] })],
    ['an item with a bad kind', JSON.stringify({ ...valid, items: [{ ...items[0], kind: 'x' }] })],
    ['a broken product', JSON.stringify({ ...valid, items: [{ ...items[1], product: { code: 1 } }] })],
  ])('rejects %s', (_, text) => {
    expect(() => parseBackup(text)).toThrow(BackupError)
  })
})
