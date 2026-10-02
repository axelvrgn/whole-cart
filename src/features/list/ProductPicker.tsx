import { useEffect, useRef } from 'react'
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

/**
 * Bottom sheet with the top 3. Built on the native <dialog> element: showModal() gives
 * the dark backdrop, closing with Escape and keeping the focus inside, for free.
 */
export function ProductPicker({ item, alternatives, approximate, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

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
      className="mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-lg rounded-t-2xl bg-stone-50 p-0 backdrop:bg-black/40"
    >
      <div className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="picker-title" className="text-lg font-bold">
              {item.label} : le top {alternatives.length}
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
          {alternatives.map((product, index) => {
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

        {alternatives[0]?.nova === 4 && (
          <p className="mt-3 text-sm text-red-700">
            Aucun produit moins transformé trouvé : ce sont les ultra-transformés les moins chargés.
          </p>
        )}
      </div>
    </dialog>
  )
}
