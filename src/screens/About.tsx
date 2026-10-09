import type { FormEvent } from 'react'

type Props = {
  giftOn: boolean
  giftFor?: string
  plusOn: boolean
  giftCode: string
  setGiftCode: (v: string) => void
  onRedeemGift: (e: FormEvent) => void
  giftMsg: string
}

export function About({ giftOn, giftFor }: Props) {
  return (
    <section className="screen">
      <header className="screen-head">
        <h1>About</h1>
        <p className="muted">Craft Pal is free with ads</p>
      </header>

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
        {giftOn && (
          <p className="gift-banner" role="status">
            Gift pass unlocked{giftFor ? ` for ${giftFor}` : ''}. Full access.
          </p>
        )}
      </article>
    </section>
  )
}
