import type { FormEvent } from 'react'
import { HelpPalLink } from '../components/HelpPalLink'
import { AdSlot } from '../components/AdSlot'
import {
  PRICE_LABEL,
  plusBannerText,
  type PlusState,
  type TrialState,
} from '../lib/billing'

type Props = {
  giftOn: boolean
  giftFor?: string
  plusOn: boolean
  plus: PlusState | null
  trial: TrialState | null
  onSubscribe: () => void
  giftCode: string
  setGiftCode: (v: string) => void
  onRedeemGift: (e: FormEvent) => void
  giftMsg: string
}

export function Subscribe({
  giftOn,
  giftFor,
  plus,
  giftCode,
  setGiftCode,
  onRedeemGift,
  giftMsg,
}: Props) {
  const plusLabel = plusBannerText(plus)

  return (
    <section className="screen">
      <header className="screen-head">
        <h1>Plan</h1>
        <p className="muted">Craft Pal is free with ads</p>
      </header>

      <AdSlot slot="header" />

      <article className="card price-card">
        <div className="price-tag">{PRICE_LABEL}</div>
        <p>
          Track materials, recipes, and sales offline on this device. Quiet
          sponsor spots keep the lights on — no subscription.
        </p>
        {giftOn ? (
          <p className="gift-banner" role="status">
            Gift pass unlocked{giftFor ? ` for ${giftFor}` : ''}. Full access.
          </p>
        ) : (
          <p className="gift-banner plus-banner" role="status">
            {plusLabel || 'Free · supported by sponsors'}
          </p>
        )}
        <p className="fineprint">
          Stripe checkout is paused. Legacy return URLs are cleaned up automatically.
        </p>
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
