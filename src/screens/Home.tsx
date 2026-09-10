import type { AppData } from '../lib/types'
import {
  money,
  thisMonthProfit,
  topRecipeByProfit,
} from '../lib/calc'

type Props = {
  data: AppData
  onLogSale: () => void
  onGoMaterials: () => void
  onGoRecipes: () => void
}

export function Home({ data, onLogSale, onGoMaterials, onGoRecipes }: Props) {
  const profit = thisMonthProfit(data.sales, data.recipes, data.materials)
  const top = topRecipeByProfit(data.sales, data.recipes, data.materials)
  const monthLabel = new Date().toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <section className="screen">
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
          <div className="stat-label">Top recipe</div>
          <div className="stat-value sm">
            {top ? top.recipe.name : '—'}
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
          Tip: add materials → build a recipe with costs → log sales to see
          profit. Everything stays on this device.
        </p>
      )}
    </section>
  )
}
