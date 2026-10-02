import { useEffect, useRef, useState } from 'react'
import { findAllProducts } from '../../api/productSearch'
import { NovaBadge } from '../../components/NovaBadge'
import { ProductImage } from '../../components/ProductImage'
import type { Product, ShoppingItem } from '../../types'
import { chooseProduct } from './listRepository'
import { describeComposition, openFoodFactsUrl } from './productText'

type Props = {
  item: ShoppingItem
  alternatives: Product[]
  approximate: boolean
  onClose: () => void
}

const FIRST_SHOWN = 3
const SHOW_MORE_STEP = 5

/**
 * Panel with the top 3, and "Voir plus" when none of them is on the shelf.
 * Built on the native <dialog> element: showModal() gives the dark backdrop,
 * closing with Escape and keeping the focus inside, for free.
 */
export function ProductPicker({ item, alternatives, approximate, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // Starts with the products saved in the item (up to 10, available offline);
  // beyond that, the full list (~50) is loaded from the search cache.
  const [products, setProducts] = useState(alternatives)
  const [allLoaded, setAllLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  // If a product further down was chosen earlier, show it.
  const selectedIndex = alternatives.findIndex((product) => product.code === item.product?.code)
  const [visibleCount, setVisibleCount] = useState(Math.max(FIRST_SHOWN, selectedIndex + 1))

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const hasMore = visibleCount < products.length || !allLoaded

  // Always 5 more. When the saved products run out, the full list is loaded first.
  async function showMore() {
    const target = Math.min(visibleCount, products.length) + SHOW_MORE_STEP
    if (target > products.length && !allLoaded) {
      setLoading(true)
      setLoadError(false)
      try {
        const all = await findAllProducts(item.label)
        setAllLoaded(true)
        if (all.length > products.length) setProducts(all)
      } catch (error) {
        console.error(error)
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }
    setVisibleCount(target)
  }

  async function choose(product: Product) {
    await chooseProduct(item.id, product)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // A tap on the backdrop lands on the <dialog> itself (the panel content is inside it).
      onClick={(event) => event.target === dialogRef.current && dialogRef.current.close()}
      aria-labelledby="picker-title"
      // Near the top of the screen (just below the notch) rather than stuck to the bottom,
      // where Safari's toolbar hides part of it. Scrolls inside if taller than the screen.
      className="mx-auto mt-[calc(env(safe-area-inset-top)+1rem)] mb-auto max-h-[calc(100dvh-env(safe-area-inset-top)-2rem)] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto overscroll-contain rounded-2xl bg-stone-50 p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="picker-title" className="text-lg font-bold">
              {item.label} : les meilleurs choix
            </h2>
            <p className="text-sm text-stone-500">Du moins au plus industriel</p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fermer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-200 text-lg"
          >
            ✕
          </button>
        </div>

        {approximate && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            « {item.label} » n'est pas dans le dictionnaire : résultats approximatifs, vérifie que ça correspond.
          </p>
        )}

        <ol className="flex flex-col gap-2">
          {products.slice(0, visibleCount).map((product, index) => {
            const selected = product.code === item.product?.code
            return (
              <li key={product.code}>
                <button
                  type="button"
                  onClick={() => choose(product)}
                  aria-pressed={selected}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 bg-white p-3 text-left ${
                    selected ? 'border-green-700' : 'border-transparent'
                  }`}
                >
                  <span className="w-5 shrink-0 text-center font-bold text-stone-400">{index + 1}</span>
                  <ProductImage url={product.imageUrl} alt={product.name} size="lg" />
                  <span className="min-w-0 flex-1">
                    {product.brand && <span className="block text-sm font-semibold">{product.brand}</span>}
                    <span className="block leading-snug">{product.name}</span>
                    {product.packaging && <span className="block text-sm text-stone-500">{product.packaging}</span>}
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <NovaBadge nova={product.nova} />
                      <span className="text-xs text-stone-500">{describeComposition(product)}</span>
                    </span>
                  </span>
                  {selected && (
                    <span className="shrink-0 text-xl text-green-700" aria-label="Choisi">
                      ✓
                    </span>
                  )}
                </button>
                <a
                  href={openFoodFactsUrl(product)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 ml-8 inline-block py-1 text-xs text-stone-500 underline"
                >
                  Fiche Open Food Facts
                </a>
              </li>
            )
          })}
        </ol>

        {hasMore && (
          <button
            type="button"
            onClick={showMore}
            disabled={loading}
            className="mt-3 h-12 w-full rounded-xl border border-stone-300 bg-white font-medium text-stone-800 active:bg-stone-100 disabled:text-stone-400"
          >
            {loading ? 'Chargement…' : 'Voir plus de produits'}
          </button>
        )}
        {loadError && (
          <p className="mt-2 text-sm text-red-700">Impossible de charger plus de produits. Vérifie ta connexion.</p>
        )}
        {!hasMore && products.length > FIRST_SHOWN && (
          <p className="mt-3 text-center text-sm text-stone-500">
            C'est tout ce qu'Open Food Facts connaît pour cet article.
          </p>
        )}

        {alternatives[0]?.nova === 4 && (
          <p className="mt-3 text-sm text-red-700">
            Aucun produit moins transformé trouvé : ce sont les ultra-transformés les moins chargés.
          </p>
        )}
      </div>
    </dialog>
  )
}
