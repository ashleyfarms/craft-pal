import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { AppData, Sale } from '../lib/types'
import { LINE_SUGGESTIONS, WHERE_SUGGESTIONS } from '../lib/types'
import { money, recipeUnitCost, saleProfit, saleUnitCost, salesToCsv } from '../lib/calc'
import { todayISO, uid } from '../lib/storage'

type Props = {
  data: AppData
  onChange: (sales: Sale[]) => void
  focusLog?: boolean
}

/** Most-used values first, then suggestions, de-duplicated (case-insensitive). */
function quickPicks(used: string[], suggestions: string[], max = 6): string[] {
  const counts = new Map<string, { label: string; n: number }>()
  for (const u of used) {
    const k = u.trim().toLowerCase()
    if (!k) continue
    const c = counts.get(k) || { label: u.trim(), n: 0 }
    c.n += 1
    counts.set(k, c)
  }
  const out = [...counts.values()].sort((a, b) => b.n - a.n).map((c) => c.label)
  for (const s of suggestions) if (!counts.has(s.toLowerCase())) out.push(s)
  return out.slice(0, max)
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

export function Sales({ data, onChange, focusLog }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [product, setProduct] = useState('')
  const [line, setLine] = useState('')
  const [where, setWhere] = useState('')
  const [qty, setQty] = useState('1')
  const [sellPrice, setSellPrice] = useState('')
  const [recipeId, setRecipeId] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [date, setDate] = useState(todayISO())
  const [msg, setMsg] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const productRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusLog) productRef.current?.focus()
  }, [focusLog])

  const products = useMemo(() => {
    const names = [...data.recipes.map((r) => r.name), ...data.sales.map((s) => s.product)]
    return [...new Map(names.filter(Boolean).map((n) => [n.toLowerCase(), n])).values()]
  }, [data.recipes, data.sales])
  const linePicks = quickPicks(data.sales.map((s) => s.line).filter((l) => l !== 'Other'), LINE_SUGGESTIONS)
  const wherePicks = quickPicks(data.sales.map((s) => s.where).filter((w) => w !== 'Other'), WHERE_SUGGESTIONS)
  const recipe = data.recipes.find((r) => r.id === recipeId)

  /** Picking a known product fills in what we already know about it. */
  function chooseProduct(name: string) {
    setProduct(name)
    if (editing) return
    const last = data.sales.find((s) => same(s.product, name))
    const r = data.recipes.find((x) => same(x.name, name))
    if (last) {
      setLine((v) => v || last.line)
      setSellPrice((v) => v || String(last.sellPrice))
      if (last.unitCost != null) setUnitCost((v) => v || String(last.unitCost))
    }
    if (r) {
      setRecipeId(r.id)
      if (r.sellPrice != null) setSellPrice((v) => v || String(r.sellPrice))
    } else if (last?.recipeId) setRecipeId(last.recipeId)
  }

  function reset() {
    setEditing(null)
    setProduct('')
    setLine('')
    setQty('1')
    setSellPrice('')
    setRecipeId('')
    setUnitCost('')
    setDate(todayISO())
    // keep "where" — sellers usually log several sales from the same place
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = Number(qty)
    const price = Number(sellPrice)
    const name = product.trim()
    if (!name) return setMsg('Add a product name.')
    if (!(q > 0)) return setMsg('Quantity must be at least 1.')
    if (sellPrice === '' || !(price >= 0)) return setMsg('Add the sale price.')
    const cost = unitCost.trim() === '' ? undefined : Math.max(0, Number(unitCost) || 0)
    const base = editing ? data.sales.find((s) => s.id === editing) : undefined
    const sale: Sale = {
      id: base?.id || uid('sale'),
      product: name,
      line: line.trim() || 'Other',
      where: where.trim() || 'Other',
      qty: q,
      sellPrice: price,
      recipeId: recipe ? recipe.id : undefined,
      unitCost: recipe ? undefined : cost,
      date: date || todayISO(),
      createdAt: base?.createdAt || new Date().toISOString(),
    }
    onChange(base ? data.sales.map((s) => (s.id === base.id ? sale : s)) : [sale, ...data.sales])
    setMsg(base ? 'Sale updated.' : `Logged ${q} × ${name}.`)
    window.setTimeout(() => setMsg(''), 2500)
    reset()
  }

  function edit(s: Sale) {
    setEditing(s.id)
    setProduct(s.product)
    setLine(s.line === 'Other' ? '' : s.line)
    setWhere(s.where === 'Other' ? '' : s.where)
    setQty(String(s.qty))
    setSellPrice(String(s.sellPrice))
    setRecipeId(s.recipeId || '')
    setUnitCost(s.unitCost != null ? String(s.unitCost) : '')
    setDate(s.date)
    setMsg('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function remove(id: string) {
    if (!confirm('Delete this sale?')) return
    onChange(data.sales.filter((s) => s.id !== id))
    if (editing === id) reset()
  }

  function exportCsv() {
    const csv = salesToCsv(data.sales, data.recipes, data.materials)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `craft-pal-sales-${todayISO()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const sorted = [...data.sales].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt),
  )

  return (
    <section className="screen">
      <header className="screen-head">
        <h1>Sales</h1>
        <p className="muted">Log what sold, and where</p>
      </header>

      <form ref={formRef} className={`card form ${focusLog ? 'pulse' : ''}`} onSubmit={onSubmit}>
        <label>
          Product
          <input
            ref={productRef}
            list="cp-products"
            value={product}
            onChange={(e) => chooseProduct(e.target.value)}
            placeholder="e.g. Christmas bow"
            autoComplete="off"
            enterKeyHint="next"
          />
          <datalist id="cp-products">
            {products.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>

        <div className="pick-field">
          <span className="pick-label">Product line</span>
          <div className="chips" role="group" aria-label="Product line">
            {linePicks.map((l) => (
              <button key={l} type="button" className={`chip ${same(l, line) ? 'on' : ''}`} onClick={() => setLine(same(l, line) ? '' : l)}>
                {l}
              </button>
            ))}
          </div>
          <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="or type a new line" aria-label="Product line" />
        </div>

        <div className="pick-field">
          <span className="pick-label">Where sold</span>
          <div className="chips" role="group" aria-label="Where sold">
            {wherePicks.map((w) => (
              <button key={w} type="button" className={`chip ${same(w, where) ? 'on' : ''}`} onClick={() => setWhere(same(w, where) ? '' : w)}>
                {w}
              </button>
            ))}
          </div>
          <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="or type a place (e.g. Maple St fair)" aria-label="Where sold" />
        </div>

        <div className="row-3">
          <label>
            Qty
            <input type="number" inputMode="numeric" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <label>
            Price each $
            <input type="number" inputMode="decimal" min="0" step="0.01" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="0.00" />
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        <div className="row-2">
          {data.recipes.length > 0 && (
            <label>
              Cost from recipe
              <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
                <option value="">None</option>
                {data.recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {recipe ? (
            <p className="cost-box sm">
              Cost each <strong>{money(recipeUnitCost(recipe, data.materials))}</strong>
              <br />
              <span className="muted xs">from materials</span>
            </p>
          ) : (
            <label>
              Cost each $ <span className="muted xs">(optional)</span>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0.00" />
            </label>
          )}
        </div>

        {msg && (
          <p className="form-msg" role="status">
            {msg}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" className="btn primary">
            {editing ? 'Save changes' : 'Log sale'}
          </button>
          {editing && (
            <button type="button" className="btn ghost" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-head">
        <h2>Sales log</h2>
        {data.sales.length > 0 && (
          <button type="button" className="btn ghost sm" onClick={exportCsv}>
            Export CSV
          </button>
        )}
      </div>

      <ul className="list">
        {sorted.length === 0 && <li className="empty">No sales logged yet.</li>}
        {sorted.map((s) => {
          const profit = saleProfit(s, data.recipes, data.materials)
          const cost = saleUnitCost(s, data.recipes, data.materials)
          return (
            <li key={s.id} className={`list-item ${editing === s.id ? 'editing' : ''}`}>
              <div>
                <strong>
                  {s.product} × {s.qty}
                </strong>
                <div className="muted sm">
                  {s.line} · {s.where} · {s.date}
                </div>
                <div className="muted sm">
                  {money(s.sellPrice)} each{cost > 0 ? ` · cost ${money(cost)}` : ''} · profit{' '}
                  <span className={profit < 0 ? 'neg' : 'highlight'}>{money(profit)}</span>
                </div>
              </div>
              <div className="item-actions">
                <button type="button" className="linkish" onClick={() => edit(s)}>
                  Edit
                </button>
                <button type="button" className="linkish danger" onClick={() => remove(s.id)}>
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
