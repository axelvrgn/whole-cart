import { describe, expect, it } from 'vitest'
import type { Product, ShoppingItem } from '../../types'
import { applySearchResult, countRemaining, createItem, sortItems } from './listLogic'

function item(id: string, createdAt: number, checked = false): ShoppingItem {
  return { id, label: id, kind: 'raw', checked, createdAt }
}

describe('createItem', () => {
  it('builds a raw item, without search, for a fresh product', () => {
    expect(createItem({ label: 'courgettes', quantity: '3' }, 1000, 'abc')).toEqual({
      id: 'abc',
      label: 'Courgettes',
      kind: 'raw',
      quantity: '3',
      checked: false,
      createdAt: 1000,
    })
  })

  it('builds a packaged item with a pending search for anything else', () => {
    expect(createItem({ label: 'yaourt' })).toMatchObject({ kind: 'packaged', search: { status: 'pending' } })
    expect(createItem({ label: 'kombucha' })).toMatchObject({ kind: 'packaged', search: { status: 'pending' } })
  })

  it('trims the label and collapses spaces', () => {
    expect(createItem({ label: '  yaourt   nature ' })?.label).toBe('Yaourt nature')
  })

  it('returns null for an empty label', () => {
    expect(createItem({ label: '   ' })).toBeNull()
  })

  it('omits an empty quantity', () => {
    expect(createItem({ label: 'Oeufs', quantity: '  ' })).not.toHaveProperty('quantity')
  })

  it('generates a different id each time', () => {
    expect(createItem({ label: 'a' })?.id).not.toBe(createItem({ label: 'a' })?.id)
  })
})

describe('applySearchResult', () => {
  const yaourt: Product = { code: '1', name: 'Yaourt nature', nova: 1 }
  const skyr: Product = { code: '2', name: 'Skyr', nova: 1 }

  it('selects the n°1 and keeps the alternatives', () => {
    expect(applySearchResult({ status: 'found', products: [yaourt, skyr], approximate: false })).toEqual({
      search: { status: 'found', alternatives: [yaourt, skyr], approximate: false },
      product: yaourt,
    })
  })

  it('clears the product when nothing was found', () => {
    expect(applySearchResult({ status: 'not-found', products: [], approximate: true })).toEqual({
      search: { status: 'not-found', approximate: true },
      product: undefined,
    })
  })

  it('turns the item into a raw one when there is nothing to search', () => {
    expect(applySearchResult({ status: 'no-search' })).toEqual({ kind: 'raw', search: undefined, product: undefined })
  })
})

describe('sortItems', () => {
  it('puts unchecked items first, each group in insertion order', () => {
    const items = [item('c', 3, true), item('b', 2), item('a', 1, true), item('d', 4)]
    expect(sortItems(items).map((i) => i.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('does not mutate the input', () => {
    const items = [item('b', 2), item('a', 1)]
    sortItems(items)
    expect(items.map((i) => i.id)).toEqual(['b', 'a'])
  })
})

describe('countRemaining', () => {
  it('counts unchecked items', () => {
    expect(countRemaining([item('a', 1), item('b', 2, true), item('c', 3)])).toBe(2)
  })
})
