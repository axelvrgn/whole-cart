import { describe, expect, it } from 'vitest'
import type { ShoppingItem } from '../../types'
import { countRemaining, createItem, sortItems } from './listLogic'

function item(id: string, createdAt: number, checked = false): ShoppingItem {
  return { id, label: id, kind: 'raw', checked, createdAt }
}

describe('createItem', () => {
  it('builds an unchecked raw item', () => {
    expect(createItem({ label: 'courgettes', quantity: '3' }, 1000, 'abc')).toEqual({
      id: 'abc',
      label: 'Courgettes',
      kind: 'raw',
      quantity: '3',
      checked: false,
      createdAt: 1000,
    })
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
