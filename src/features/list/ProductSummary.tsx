import { NovaBadge } from '../../components/NovaBadge'
import { ProductImage } from '../../components/ProductImage'
import type { ShoppingItem } from '../../types'
import { retrySearch } from './listRepository'

type Props = {
  item: ShoppingItem
  onOpenPicker: () => void
}

/** The line under a packaged item: search progress, the chosen product, or what went wrong. */
export function ProductSummary({ item, onOpenPicker }: Props) {
  const search = item.search
  if (!search) return null

  switch (search.status) {
    case 'pending':
      return (
        <p className="flex items-center gap-2 px-4 pb-3 text-sm text-stone-500" role="status">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-green-700" />
          Recherche du meilleur produit…
        </p>
      )

    case 'not-found':
      return (
        <p className="px-4 pb-3 text-sm text-stone-500">
          Aucun produit trouvé sur Open Food Facts{search.approximate && ' (mot inconnu du dictionnaire)'}.
        </p>
      )

    case 'error':
      return (
        <div className="flex items-center justify-between gap-2 px-4 pb-3">
          <p className="text-sm text-red-700">
            {search.reason === 'offline' ? 'Pas de connexion.' : 'Open Food Facts ne répond pas.'}
          </p>
          <button
            type="button"
            onClick={() => retrySearch(item.id)}
            className="h-11 shrink-0 rounded-lg border border-stone-300 px-3 text-sm font-medium active:bg-stone-100"
          >
            Réessayer
          </button>
        </div>
      )

    case 'found': {
      const product = item.product ?? search.alternatives[0]
      if (!product) return null
      const rank = search.alternatives.findIndex((p) => p.code === product.code) + 1
      return (
        <button
          type="button"
          onClick={onOpenPicker}
          className="flex w-full items-center gap-3 border-t border-stone-100 px-4 py-2 text-left active:bg-stone-50"
        >
          <ProductImage url={product.imageUrl} alt={product.name} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">
              {product.brand && <span className="font-semibold">{product.brand} · </span>}
              {product.name}
            </span>
            <span className="mt-0.5 flex items-center gap-2">
              <NovaBadge nova={product.nova} />
              {product.packaging && <span className="truncate text-xs text-stone-500">{product.packaging}</span>}
              {search.approximate && <span className="text-xs text-amber-700">approximatif</span>}
            </span>
          </span>
          <span className="shrink-0 text-xs font-medium text-green-700">
            {rank > 0 ? `n°${rank}` : ''} · top {search.alternatives.length} ›
          </span>
        </button>
      )
    }
  }
}
