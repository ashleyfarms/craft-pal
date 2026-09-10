import { useState, type FormEvent } from 'react'
import type { Material } from '../lib/types'
import { money, unitCost } from '../lib/calc'
import { uid } from '../lib/storage'

type Props = {
  materials: Material[]
  onChange: (next: Material[]) => void
}

export function Materials({ materials, onChange }: Props) {
  const [name, setName] = useState('')
  const [packCost, setPackCost] = useState('')
  const [units, setUnits] = useState('')
  const [editing, setEditing] = useState<string | null>(null)

  function reset() {
    setName('')
    setPackCost('')
    setUnits('')
    setEditing(null)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const cost = Number(packCost)
    const u = Number(units)
    if (!n || !(cost >= 0) || !(u > 0)) return

    if (editing) {
      onChange(
        materials.map((m) =>
          m.id === editing
            ? { ...m, name: n, packCost: cost, unitsPerPack: u }
            : m,
        ),
      )
    } else {
      onChange([
        {
          id: uid('mat'),
          name: n,
          packCost: cost,
          unitsPerPack: u,
          createdAt: new Date().toISOString(),
        },
        ...materials,
      ])
    }
    reset()
  }

  function startEdit(m: Material) {
    setEditing(m.id)
    setName(m.name)
    setPackCost(String(m.packCost))
    setUnits(String(m.unitsPerPack))
  }

  function remove(id: string) {
    if (!confirm('Remove this material?')) return
    onChange(materials.filter((m) => m.id !== id))
    if (editing === id) reset()
  }

  return (
    <section className="screen">
      <header className="screen-head">
        <h1>Materials</h1>
        <p className="muted">Pack cost ÷ units = cost per piece</p>
      </header>

      <form className="card form" onSubmit={onSubmit}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ribbon, wire, foam base…"
            required
          />
        </label>
        <div className="row-2">
          <label>
            Pack cost ($)
            <input
              type="number"
              min="0"
              step="0.01"
              value={packCost}
              onChange={(e) => setPackCost(e.target.value)}
              placeholder="12.99"
              required
            />
          </label>
          <label>
            Units in pack
            <input
              type="number"
              min="0.01"
              step="any"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="10"
              required
            />
          </label>
        </div>
        {packCost !== '' && units !== '' && Number(units) > 0 && (
          <p className="preview">
            ≈ {money(Number(packCost) / Number(units))} each
          </p>
        )}
        <div className="form-actions">
          <button type="submit" className="btn primary">
            {editing ? 'Save material' : 'Add material'}
          </button>
          {editing && (
            <button type="button" className="btn ghost" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="list">
        {materials.length === 0 && (
          <li className="empty">No materials yet — add your first pack above.</li>
        )}
        {materials.map((m) => (
          <li key={m.id} className="list-item">
            <div>
              <strong>{m.name}</strong>
              <div className="muted sm">
                {money(m.packCost)} / {m.unitsPerPack} →{' '}
                <span className="highlight">{money(unitCost(m))} each</span>
              </div>
            </div>
            <div className="item-actions">
              <button type="button" className="linkish" onClick={() => startEdit(m)}>
                Edit
              </button>
              <button type="button" className="linkish danger" onClick={() => remove(m.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
