import { useMemo, useState, type FormEvent } from 'react'
import type { Material, Recipe, RecipeLine } from '../lib/types'
import {
  money,
  pct,
  recipeMarginPct,
  recipeProfit,
  recipeUnitCost,
} from '../lib/calc'
import { uid } from '../lib/storage'

type Props = {
  materials: Material[]
  recipes: Recipe[]
  onChange: (next: Recipe[]) => void
}

type DraftLine = { materialId: string; qty: string }

export function Recipes({ materials, recipes, onChange }: Props) {
  const [name, setName] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([
    { materialId: '', qty: '1' },
  ])
  const [editing, setEditing] = useState<string | null>(null)

  const draftAsRecipe: Recipe = useMemo(
    () => ({
      id: 'draft',
      name: name || 'Draft',
      lines: lines
        .filter((l) => l.materialId && Number(l.qty) > 0)
        .map((l) => ({ materialId: l.materialId, qty: Number(l.qty) })),
      sellPrice: sellPrice === '' ? undefined : Number(sellPrice),
      createdAt: '',
    }),
    [name, lines, sellPrice],
  )

  const cost = recipeUnitCost(draftAsRecipe, materials)
  const profit = recipeProfit(draftAsRecipe, materials)
  const margin = recipeMarginPct(draftAsRecipe, materials)

  function reset() {
    setName('')
    setSellPrice('')
    setLines([{ materialId: '', qty: '1' }])
    setEditing(null)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const cleanLines: RecipeLine[] = lines
      .filter((l) => l.materialId && Number(l.qty) > 0)
      .map((l) => ({ materialId: l.materialId, qty: Number(l.qty) }))
    if (!n || cleanLines.length === 0) return
    const price =
      sellPrice === '' || Number.isNaN(Number(sellPrice))
        ? undefined
        : Number(sellPrice)

    if (editing) {
      onChange(
        recipes.map((r) =>
          r.id === editing
            ? { ...r, name: n, lines: cleanLines, sellPrice: price }
            : r,
        ),
      )
    } else {
      onChange([
        {
          id: uid('rec'),
          name: n,
          lines: cleanLines,
          sellPrice: price,
          createdAt: new Date().toISOString(),
        },
        ...recipes,
      ])
    }
    reset()
  }

  function startEdit(r: Recipe) {
    setEditing(r.id)
    setName(r.name)
    setSellPrice(r.sellPrice != null ? String(r.sellPrice) : '')
    setLines(
      r.lines.length
        ? r.lines.map((l) => ({
            materialId: l.materialId,
            qty: String(l.qty),
          }))
        : [{ materialId: '', qty: '1' }],
    )
  }

  function remove(id: string) {
    if (!confirm('Remove this recipe?')) return
    onChange(recipes.filter((r) => r.id !== id))
    if (editing === id) reset()
  }

  return (
    <section className="screen">
      <header className="screen-head">
        <h1>Recipes</h1>
        <p className="muted">What goes into each finished piece</p>
      </header>

      {materials.length === 0 ? (
        <p className="hint-box">Add materials first, then build recipes here.</p>
      ) : (
        <form className="card form" onSubmit={onSubmit}>
          <label>
            Recipe name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Autumn wreath, hair bow…"
              required
            />
          </label>

          <div className="lines">
            <div className="lines-label">Materials used</div>
            {lines.map((line, i) => (
              <div key={i} className="line-row">
                <select
                  value={line.materialId}
                  onChange={(e) => {
                    const next = [...lines]
                    next[i] = { ...next[i], materialId: e.target.value }
                    setLines(next)
                  }}
                  required
                >
                  <option value="">Pick material…</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={line.qty}
                  onChange={(e) => {
                    const next = [...lines]
                    next[i] = { ...next[i], qty: e.target.value }
                    setLines(next)
                  }}
                  placeholder="Qty"
                  required
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    className="linkish danger"
                    onClick={() => setLines(lines.filter((_, j) => j !== i))}
                    aria-label="Remove line"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => setLines([...lines, { materialId: '', qty: '1' }])}
            >
              + Add material
            </button>
          </div>

          <label>
            Sell price (optional)
            <input
              type="number"
              min="0"
              step="0.01"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="28.00"
            />
          </label>

          <div className="cost-box">
            <div>
              Unit cost <strong>{money(cost)}</strong>
            </div>
            {profit != null && (
              <div>
                Profit <strong>{money(profit)}</strong>
                {margin != null && (
                  <span className="muted"> · {pct(margin)} margin</span>
                )}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary">
              {editing ? 'Save recipe' : 'Save recipe'}
            </button>
            {editing && (
              <button type="button" className="btn ghost" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <ul className="list">
        {recipes.length === 0 && materials.length > 0 && (
          <li className="empty">No recipes yet.</li>
        )}
        {recipes.map((r) => {
          const c = recipeUnitCost(r, materials)
          const p = recipeProfit(r, materials)
          const m = recipeMarginPct(r, materials)
          return (
            <li key={r.id} className="list-item">
              <div>
                <strong>{r.name}</strong>
                <div className="muted sm">
                  Cost {money(c)}
                  {r.sellPrice != null && (
                    <>
                      {' '}
                      · Sell {money(r.sellPrice)}
                      {p != null && (
                        <>
                          {' '}
                          · Profit{' '}
                          <span className="highlight">{money(p)}</span>
                          {m != null && ` (${pct(m)})`}
                        </>
                      )}
                    </>
                  )}
                </div>
                <div className="muted xs">
                  {r.lines.length} material
                  {r.lines.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="item-actions">
                <button type="button" className="linkish" onClick={() => startEdit(r)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="linkish danger"
                  onClick={() => remove(r.id)}
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
