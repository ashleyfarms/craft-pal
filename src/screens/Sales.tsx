import { useEffect, useState, type FormEvent } from 'react'
import type { AppData, Sale, SaleChannel } from '../lib/types'
import { SALE_CHANNELS } from '../lib/types'
import { money, saleProfit } from '../lib/calc'
import { todayISO, uid } from '../lib/storage'

type Props = {
  data: AppData
  onChange: (sales: Sale[]) => void
  focusLog?: boolean
}

export function Sales({ data, onChange, focusLog }: Props) {
  const [recipeId, setRecipeId] = useState('')
  const [qty, setQty] = useState('1')
  const [sellPrice, setSellPrice] = useState('')
  const [channel, setChannel] = useState<SaleChannel>('Craft fair')
  const [date, setDate] = useState(todayISO())

  useEffect(() => {
    if (!recipeId && data.recipes[0]) setRecipeId(data.recipes[0].id)
  }, [data.recipes, recipeId])

  useEffect(() => {
    const r = data.recipes.find((x) => x.id === recipeId)
    if (r?.sellPrice != null) setSellPrice(String(r.sellPrice))
  }, [recipeId, data.recipes])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = Number(qty)
    const price = Number(sellPrice)
    if (!recipeId || !(q > 0) || !(price >= 0)) return
    const sale: Sale = {
      id: uid('sale'),
      recipeId,
      qty: q,
      sellPrice: price,
      channel,
      date: date || todayISO(),
      createdAt: new Date().toISOString(),
    }
    onChange([sale, ...data.sales])
    setQty('1')
    setDate(todayISO())
  }

  function remove(id: string) {
    if (!confirm('Delete this sale?')) return
    onChange(data.sales.filter((s) => s.id !== id))
  }

  const sorted = [...data.sales].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  )

  return (
    <section className="screen">
      <header className="screen-head">
        <h1>Sales</h1>
        <p className="muted">Log what sold and where</p>
      </header>

      {data.recipes.length === 0 ? (
        <p className="hint-box">Build a recipe first, then log sales here.</p>
      ) : (
        <form
          className={`card form ${focusLog ? 'pulse' : ''}`}
          onSubmit={onSubmit}
        >
          <label>
            Recipe
            <select
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
              required
            >
              {data.recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <div className="row-2">
            <label>
              Qty sold
              <input
                type="number"
                min="1"
                step="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </label>
            <label>
              Sell price each ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="row-2">
            <label>
              Channel
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as SaleChannel)}
              >
                {SALE_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
          </div>
          <button type="submit" className="btn primary">
            Log sale
          </button>
        </form>
      )}

      <ul className="list">
        {sorted.length === 0 && data.recipes.length > 0 && (
          <li className="empty">No sales logged yet.</li>
        )}
        {sorted.map((s) => {
          const recipe = data.recipes.find((r) => r.id === s.recipeId)
          const profit = saleProfit(s, data.recipes, data.materials)
          return (
            <li key={s.id} className="list-item">
              <div>
                <strong>
                  {recipe?.name || 'Recipe'} × {s.qty}
                </strong>
                <div className="muted sm">
                  {s.date} · {s.channel} · {money(s.sellPrice)} each
                </div>
                <div className="muted sm">
                  Profit{' '}
                  <span className="highlight">{money(profit)}</span>
                </div>
              </div>
              <div className="item-actions">
                <button
                  type="button"
                  className="linkish danger"
                  onClick={() => remove(s.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
