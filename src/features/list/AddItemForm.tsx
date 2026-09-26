import { useRef, useState, type FormEvent } from 'react'
import { createItem } from './listLogic'
import { addItem } from './listRepository'

// Inputs use text-base (16px): below that, Safari iOS zooms in when the field gets focus.
const inputClass =
  'h-12 min-w-0 rounded-xl border border-stone-300 bg-white px-3 text-base placeholder:text-stone-400 focus:border-green-600 focus:outline-none'

export function AddItemForm() {
  const [label, setLabel] = useState('')
  const [quantity, setQuantity] = useState('')
  const labelRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const item = createItem({ label, quantity })
    if (!item) return
    // Clear the fields right away, before the (async) save: otherwise text typed
    // while saving would be appended to the previous item.
    setLabel('')
    setQuantity('')
    // Keep the keyboard open to add the next item quickly.
    labelRef.current?.focus()
    try {
      await addItem(item)
    } catch (error) {
      console.error(error)
      setLabel(label)
      setQuantity(quantity)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={labelRef}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Ajouter un article…"
        aria-label="Article"
        autoCapitalize="sentences"
        enterKeyHint="done"
        className={`${inputClass} flex-1`}
      />
      <input
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Qté"
        aria-label="Quantité"
        enterKeyHint="done"
        className={`${inputClass} w-20`}
      />
      <button
        type="submit"
        disabled={!label.trim()}
        aria-label="Ajouter"
        className="h-12 w-12 shrink-0 rounded-xl bg-green-700 text-2xl text-white disabled:bg-stone-300"
      >
        +
      </button>
    </form>
  )
}
