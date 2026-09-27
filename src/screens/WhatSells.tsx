import { useMemo, useState } from 'react'
import type { AppData } from '../lib/types'
import { PERIODS, filterByPeriod, groupSales, money, type Group, type Period } from '../lib/calc'

type Props = {
  data: AppData
  onLogSale: () => void
}

function Bars({ rows, metric, note, max = 6 }: { rows: Group[]; metric: 'profit' | 'revenue'; note: (g: Group) => string; max?: number }) {
  const shown = rows.slice(0, max)
  const top = Math.max(...shown.map((g) => Math.abs(g[metric])), 0.01)
  if (!shown.length) return <p className="muted sm">No sales in this period.</p>
  return (
    <ul className="bars">
      {shown.map((g) => {
        const v = g[metric]
        return (
          <li key={g.key} className="bar-row">
            <div className="bar-top">
              <span className="bar-name">{g.key}</span>
              <span className={`bar-val ${v < 0 ? 'neg' : ''}`}>{money(v)}</span>
            </div>
            <div className="bar-track" aria-hidden>
              <div className={`bar-fill ${v < 0 ? 'neg' : ''}`} style={{ width: `${Math.max(3, (Math.abs(v) / top) * 100)}%` }} />
            </div>
            <div className="bar-note">{note(g)}</div>
          </li>
        )
      })}
      {rows.length > max && <li className="muted xs">+ {rows.length - max} more</li>}
    </ul>
  )
}

const units = (n: number) => `${n} sold`

export function WhatSells({ data, onLogSale }: Props) {
  const [period, setPeriod] = useState<Period>('30d')
  const [place, setPlace] = useState('')
  const { recipes, materials } = data

  const sales = useMemo(() => filterByPeriod(data.sales, period), [data.sales, period])
  const byProduct = useMemo(() => groupSales(sales, (s) => s.product, recipes, materials), [sales, recipes, materials])
  const byLine = useMemo(() => groupSales(sales, (s) => s.line, recipes, materials), [sales, recipes, materials])
  const byWhere = useMemo(() => groupSales(sales, (s) => s.where, recipes, materials, 'revenue'), [sales, recipes, materials])
  const activePlace = byWhere.some((g) => g.key === place) ? place : byWhere[0]?.key || ''
  const atPlace = useMemo(
    () => groupSales(sales.filter((s) => (s.where || 'Other') === activePlace), (s) => s.product, recipes, materials),
    [sales, activePlace, recipes, materials],
  )

  const phrase = PERIODS.find((p) => p.id === period)!.phrase
  const totals = byProduct.reduce((t, g) => ({ units: t.units + g.units, revenue: t.revenue + g.revenue, profit: t.profit + g.profit }), { units: 0, revenue: 0, profit: 0 })
  // Headline names the best real product line; falls back to the top product if lines aren't set yet.
  const bestLine = byLine.find((g) => g.key !== 'Other') || byProduct[0]
  const bestSpot = [...byWhere].sort((a, b) => b.profit - a.profit)[0]

  return (
    <section className="screen">
      <header className="screen-head">
        <h1>What sells</h1>
        <p className="muted">Your best products, lines, and places</p>
      </header>

      <div className="chips period" role="group" aria-label="Time period">
        {PERIODS.map((p) => (
          <button key={p.id} type="button" className={`chip ${period === p.id ? 'on' : ''}`} onClick={() => setPeriod(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {data.sales.length === 0 ? (
        <div className="hint-box">
          <p>Log a few sales and this page shows which products, product lines, and places make you the most money.</p>
          <button type="button" className="btn primary" onClick={onLogSale}>
            Log a sale
          </button>
        </div>
      ) : (
        <>
          <p className="headline" role="status">
            {sales.length === 0 ? (
              <>No sales {phrase}. Try a longer time range.</>
            ) : (
              <>
                <strong>{bestLine.key}</strong> made you <strong>{money(bestLine.profit)}</strong> profit {phrase}
                {bestSpot ? (
                  <>
                    ; best spot: <strong>{bestSpot.key}</strong>.
                  </>
                ) : (
                  '.'
                )}
              </>
            )}
          </p>

          {sales.length > 0 && (
            <div className="stat-grid three">
              <article className="stat-card accent">
                <div className="stat-label">Profit</div>
                <div className="stat-value sm">{money(totals.profit)}</div>
              </article>
              <article className="stat-card">
                <div className="stat-label">Sales</div>
                <div className="stat-value sm">{money(totals.revenue)}</div>
              </article>
              <article className="stat-card">
                <div className="stat-label">Items</div>
                <div className="stat-value sm">{totals.units}</div>
              </article>
            </div>
          )}

          <article className="card chart-card">
            <h2>Top products</h2>
            <p className="muted xs">by profit</p>
            <Bars rows={byProduct} metric="profit" note={(g) => `${units(g.units)} · ${money(g.revenue)} sales`} />
          </article>

          <article className="card chart-card">
            <h2>Product lines</h2>
            <p className="muted xs">by profit</p>
            <Bars rows={byLine} metric="profit" note={(g) => `${units(g.units)} · ${money(g.revenue)} sales`} />
          </article>

          <article className="card chart-card">
            <h2>Where you sell</h2>
            <p className="muted xs">by sales · profit shown underneath</p>
            <Bars rows={byWhere} metric="revenue" note={(g) => `${money(g.profit)} profit · ${units(g.units)}`} />
          </article>

          {byWhere.length > 0 && (
            <article className="card chart-card">
              <h2>What sells where</h2>
              <p className="muted xs">tap a place</p>
              <div className="chips" role="group" aria-label="Place">
                {byWhere.map((g) => (
                  <button key={g.key} type="button" className={`chip ${activePlace === g.key ? 'on' : ''}`} onClick={() => setPlace(g.key)}>
                    {g.key}
                  </button>
                ))}
              </div>
              <Bars rows={atPlace} metric="profit" note={(g) => `${units(g.units)} · ${money(g.revenue)} sales`} max={8} />
            </article>
          )}
        </>
      )}
    </section>
  )
}
