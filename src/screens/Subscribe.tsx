import type { FormEvent } from 'react'
import { HelpPalLink } from '../components/HelpPalLink'
import { PRICE_LABEL, TRIAL_DAYS, trialDaysLeft, type TrialState } from '../lib/billing'

type Props = {
  giftOn: boolean
  giftFor?: string
  plusOn: boolean
  trial: TrialState | null
  onSubscribePlaceholder: () => void
  giftCode: string
  setGiftCode: (v: string) => void
  onRedeemGift: (e: FormEvent) => void
  giftMsg: string
}

export function Subscribe({
  giftOn,
  giftFor,
  plusOn,
  trial,
  onSubscribePlaceholder,
  giftCode,
  setGiftCode,
  onRedeemGift,
  giftMsg,
}: Props) {
  const days = trialDaysLeft(trial)

  return (
    <section className="screen">
      <header className="screen-head">
        <h1>Subscribe</h1>
        <p className="muted">Keep Craft Pal running on your stall tablet</p>
      </header>

      <article className="card price-card">
        <div className="price-tag">{PRICE_LABEL}</div>
        <p>
          After a {TRIAL_DAYS}-day free trial. Track materials, recipes, and
          sales offline on this device.
        </p>
        {giftOn ? (
          <p className="gift-banner" role="status">
            Gift pass unlocked{giftFor ? ` for ${giftFor}` : ''}. Full access —
            no payment needed.
          </p>
        ) : plusOn ? (
          <p className="gift-banner plus-banner" role="status">
            Subscribed on this device (placeholder until Stripe is connected).
          </p>
        ) : (
          <p className="muted">
            {days > 0
              ? `${days} day${days === 1 ? '' : 's'} left in your free trial.`
              : 'Your free trial has ended. Subscribe to keep logging.'}
          </p>
        )}

        {!giftOn && !plusOn && (
          <button
            type="button"
            className="btn primary big"
            onClick={onSubscribePlaceholder}
          >
            Subscribe — {PRICE_LABEL}
          </button>
        )}
        <p className="fineprint">
          Stripe checkout will plug in here. For now this button unlocks the
          app locally so you can keep testing.
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
