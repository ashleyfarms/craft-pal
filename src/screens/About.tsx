import type { FormEvent } from 'react'
import { HelpPalLink } from '../components/HelpPalLink'
import { AdSlot } from '../components/AdSlot'

type Props = {
  giftOn: boolean
  giftFor?: string
  plusOn: boolean
  giftCode: string
  setGiftCode: (v: string) => void
  onRedeemGift: (e: FormEvent) => void
  giftMsg: string
}

export function About({
  giftOn,
  giftFor,
  giftCode,
  setGiftCode,
  onRedeemGift,
  giftMsg,
}: Props) {
  return (
    <section className="screen">
      <header className="screen-head">
        <h1>About</h1>
        <p className="muted">Craft Pal is free with ads</p>
      </header>

      <AdSlot slot="header" />

      <article className="card price-card">
        <div className="price-tag">Free · with ads</div>
        <p>
          Track materials, recipes, and sales on this device. Free with ads —
          no paid plans.
        </p>
        <p className="muted">
          We don&apos;t sell your personal info. Google Analytics (G-E7PX36SGJE)
          and ads help keep Craft Pal free. Your numbers stay in this browser.
        </p>
        {giftOn ? (
          <p className="gift-banner" role="status">
            Gift pass unlocked{giftFor ? ` for ${giftFor}` : ''}. Full access.
          </p>
        ) : (
          <p className="gift-banner plus-banner" role="status">
            Free · supported by sponsors
          </p>
        )}
      </article>

      <HelpPalLink />

      {!giftOn && (
        <form className="card form" onSubmit={onRedeemGift}>
          <div className="gift-label">Have a gift link or code?</div>
          <div className="gift-row">
            <input
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value)}
              placeholder="albert, david, or ashley"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button type="submit" className="btn primary">
              Unlock
            </button>
          </div>
          {giftMsg && (
            <p className="gift-error" role="alert">
              {giftMsg}
            </p>
          )}
        </form>
      )}
    </section>
  )
}
