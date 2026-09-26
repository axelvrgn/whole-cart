import { Page } from '../../components/Page'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { AddItemForm } from './AddItemForm'
import { countRemaining, sortItems } from './listLogic'
import { deleteCheckedItems, getAllItems } from './listRepository'
import { ShoppingItemRow } from './ShoppingItemRow'

export function ListPage() {
  const items = useLiveQuery(getAllItems)

  const remaining = items ? countRemaining(items) : 0
  const checkedCount = items ? items.length - remaining : 0

  function handleClearChecked() {
    const plural = checkedCount > 1 ? 's' : ''
    if (window.confirm(`Retirer ${checkedCount} article${plural} coché${plural} de la liste ?`)) {
      void deleteCheckedItems()
    }
  }

  return (
    <Page title="Ma liste">
      <AddItemForm />

      {/* undefined = still loading from the database: render nothing rather than a flash of "empty". */}
      {items && items.length === 0 && (
        <p className="mt-10 text-center text-stone-500">
          Ta liste est vide.
          <br />
          Ajoute ton premier article ci-dessus.
        </p>
      )}

      {items && items.length > 0 && (
        <>
          <p className="mt-5 mb-2 text-sm text-stone-500">
            {remaining === 0 ? 'Tout est dans le panier 🎉' : `${remaining} à acheter`}
          </p>
          <ul className="flex flex-col gap-2">
            {sortItems(items).map((item) => (
              <ShoppingItemRow key={item.id} item={item} />
            ))}
          </ul>
          {checkedCount > 0 && (
            <button
              type="button"
              onClick={handleClearChecked}
              className="mt-6 h-12 w-full rounded-xl border border-stone-300 text-stone-700 active:bg-stone-100"
            >
              Retirer les articles cochés ({checkedCount})
            </button>
          )}
        </>
      )}
    </Page>
  )
}
