import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { AppData, TabId } from './lib/types'
import { readData, writeData } from './lib/storage'
import {
  clearGiftQuery,
  isGiftUnlocked,
  readGift,
  readNickname,
  resolveGiftCode,
  unlockGift,
  type GiftState,
} from './lib/gift'
import {
  ensureTrial,
  hasFullAccess,
  isPlusUnlocked,
  readPlus,
  unlockPlusPlaceholder,
  type PlusState,
  type TrialState,
} from './lib/billing'
import { Home } from './screens/Home'
import { Materials } from './screens/Materials'
import { Recipes } from './screens/Recipes'
import { Sales } from './screens/Sales'
import { Subscribe } from './screens/Subscribe'
import './App.css'

const TABS: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'materials', label: 'Materials' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'sales', label: 'Sales' },
  { id: 'subscribe', label: 'Plan' },
]

export default function App() {
  const [data, setData] = useState<AppData>(() => readData())
  const [tab, setTab] = useState<TabId>('home')
  const [focusLog, setFocusLog] = useState(false)
  const [gift, setGift] = useState<GiftState | null>(() => readGift())
  const [plus, setPlus] = useState<PlusState | null>(() => readPlus())
  const [trial, setTrial] = useState<TrialState | null>(null)
  const [nickname, setNickname] = useState(() => readNickname())
  const [toast, setToast] = useState('')
  const [giftCode, setGiftCode] = useState('')
  const [giftMsg, setGiftMsg] = useState('')
  const [ready, setReady] = useState(false)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 3200)
  }

  const persist = useCallback((next: AppData) => {
    setData(next)
    writeData(next)
  }, [])

  const applyGift = useCallback((who: string, announce: boolean) => {
    const next = unlockGift(who)
    setGift(next)
    setNickname(next.nickname)
    if (announce) flash(`Gift pass unlocked for ${who}.`)
    return next
  }, [])

  useEffect(() => {
    const t = ensureTrial()
    setTrial(t)

    const fromUrl = resolveGiftCode(
      new URLSearchParams(window.location.search).get('gift'),
    )
    if (fromUrl) {
      applyGift(fromUrl, true)
      clearGiftQuery()
    }
    setReady(true)
  }, [applyGift])

  function redeemGiftCode(raw: string): boolean {
    const who = resolveGiftCode(raw)
    if (!who) {
      setGiftMsg('Try albert, david, or ashley.')
      return false
    }
    applyGift(who, true)
    setGiftMsg('')
    setGiftCode('')
    return true
  }

  function onGiftSubmit(e: FormEvent) {
    e.preventDefault()
    redeemGiftCode(giftCode)
  }

  const giftOn = isGiftUnlocked(gift)
  const plusOn = isPlusUnlocked(plus)
  const fullAccess = hasFullAccess({ gift: giftOn, plus: plusOn, trial })

  function goLogSale() {
    if (!fullAccess) {
      setTab('subscribe')
      flash('Trial ended — subscribe or use a gift code to keep logging.')
      return
    }
    setFocusLog(true)
    setTab('sales')
    window.setTimeout(() => setFocusLog(false), 1200)
  }

  function guardWrite(fn: () => void) {
    if (!fullAccess) {
      setTab('subscribe')
      flash('Trial ended — unlock to edit.')
      return
    }
    fn()
  }

  if (!ready) {
    return (
      <div className="app-shell loading">
        <p>Loading Craft Pal…</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            ✿
          </span>
          <div>
            <div className="brand-name">Craft Pal</div>
            <div className="brand-tag">Cost · recipes · sales</div>
          </div>
        </div>
        {giftOn && (
          <p className="gift-chip" role="status">
            Gift · {gift?.giftFor || nickname}
          </p>
        )}
        {!giftOn && plusOn && (
          <p className="gift-chip plus" role="status">
            Subscribed
          </p>
        )}
      </header>

      {!fullAccess && (
        <div className="soft-paywall" role="status">
          <p>
            Your 14-day trial has ended. Subscribe ($4.99/mo) or redeem a gift
            code to keep tracking.
          </p>
          <button
            type="button"
            className="btn primary sm"
            onClick={() => setTab('subscribe')}
          >
            See plan
          </button>
        </div>
      )}

      <main className="main">
        {tab === 'home' && (
          <Home
            data={data}
            onLogSale={goLogSale}
            onGoMaterials={() => setTab('materials')}
            onGoRecipes={() => setTab('recipes')}
          />
        )}
        {tab === 'materials' && (
          <Materials
            materials={data.materials}
            onChange={(materials) =>
              guardWrite(() => persist({ ...data, materials }))
            }
          />
        )}
        {tab === 'recipes' && (
          <Recipes
            materials={data.materials}
            recipes={data.recipes}
            onChange={(recipes) =>
              guardWrite(() => persist({ ...data, recipes }))
            }
          />
        )}
        {tab === 'sales' && (
          <Sales
            data={data}
            focusLog={focusLog}
            onChange={(sales) => guardWrite(() => persist({ ...data, sales }))}
          />
        )}
        {tab === 'subscribe' && (
          <Subscribe
            giftOn={giftOn}
            giftFor={gift?.giftFor}
            plusOn={plusOn}
            trial={trial}
            onSubscribePlaceholder={() => {
              const next = unlockPlusPlaceholder()
              setPlus(next)
              flash('Subscribed on this device (Stripe coming soon).')
            }}
            giftCode={giftCode}
            setGiftCode={setGiftCode}
            onRedeemGift={onGiftSubmit}
            giftMsg={giftMsg}
          />
        )}
      </main>

      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
