import { AdSlot } from '../components/AdSlot'
import type { AppData } from '../lib/types'
import {
  money,
  thisMonthProfit,
  topProductByProfit,
} from '../lib/calc'

type Props = {
  data: AppData
  onLogSale: () => void
  onGoMaterials: () => void
  onGoRecipes: () => void
  onGoSells: () => void
}

export function Home({ data, onLogSale, onGoMaterials, onGoRecipes, onGoSells }: Props) {
  const profit = thisMonthProfit(data.sales, data.recipes, data.materials)
  const top = topProductByProfit(data.sales, data.recipes, data.materials)
  const monthLabel = new Date().toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <section className="screen">
      <AdSlot slot="in-feed" />
      <header className="screen-head">
        <h1>Home</h1>
        <p className="muted">Your craft stall at a glance</p>
      </header>

      <div className="stat-grid">
        <article className="stat-card accent">
          <div className="stat-label">{monthLabel} profit</div>
          <div className="stat-value">{money(profit)}</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Top product</div>
          <div className="stat-value sm">
            {top ? top.key : '—'}
          </div>
          {top && (
            <div className="stat-sub">{money(top.profit)} this month</div>
          )}
        </article>
        <article className="stat-card">
          <div className="stat-label">Materials</div>
          <div className="stat-value">{data.materials.length}</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Recipes</div>
          <div className="stat-value">{data.recipes.length}</div>
        </article>
      </div>

      <button type="button" className="btn primary big" onClick={onLogSale}>
        Log a sale
      </button>

      {data.sales.length > 0 && (
        <button type="button" className="btn ghost big" onClick={onGoSells}>
          See what sells →
        </button>
      )}

      <div className="quick-row">
        <button type="button" className="btn ghost" onClick={onGoMaterials}>
          Add material
        </button>
        <button type="button" className="btn ghost" onClick={onGoRecipes}>
          Build recipe
        </button>
      </div>

      {data.sales.length === 0 && (
        <p className="hint-box">
          Tip: log each sale with its product line and where you sold it, then
          check What sells to see your best products and places. Everything stays on this device.
        </p>
      )}
    </section>
  )
}
