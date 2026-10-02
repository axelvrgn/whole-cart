import type { ShoppingItem } from '../../types'
import { deleteItem, setChecked } from './listRepository'
import { ProductSummary } from './ProductSummary'

type Props = {
  item: ShoppingItem
  onOpenPicker: () => void
}

export function ShoppingItemRow({ item, onOpenPicker }: Props) {
  return (
    <li className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="flex items-center">
        {/* The whole row is the tap target for checking: easy with one hand in the shop. */}
        <button
          type="button"
          role="checkbox"
          aria-checked={item.checked}
          onClick={() => setChecked(item.id, !item.checked)}
          className="flex min-h-14 flex-1 items-center gap-3 px-4 py-2 text-left"
        >
          <span
            aria-hidden="true"
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-sm text-white ${
              item.checked ? 'border-green-700 bg-green-700' : 'border-stone-300'
            }`}
          >
            {item.checked && '✓'}
          </span>
          <span className={`flex-1 ${item.checked ? 'text-stone-400 line-through' : ''}`}>{item.label}</span>
          {item.quantity && (
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-sm text-stone-600">{item.quantity}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => deleteItem(item.id)}
          aria-label={`Supprimer ${item.label}`}
          className="flex h-14 w-12 shrink-0 items-center justify-center text-lg text-stone-400 active:text-red-600"
        >
          ✕
        </button>
      </div>
      {/* Once in the basket, the product details are just noise. */}
      {!item.checked && <ProductSummary item={item} onOpenPicker={onOpenPicker} />}
    </li>
  )
}
