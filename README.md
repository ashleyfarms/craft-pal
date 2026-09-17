# Craft Pal

**Live:** https://craftpal.help-pal-apps.com

Track materials, recipes, and sales profit for craft sellers (bows, wreaths, and more).

- **Price:** $4.99/mo after a 14-day free trial (Stripe Payment Link + soft local trial)
- **Storage:** localStorage on-device (offline-friendly)
- **PWA:** Add to Home Screen via `manifest.webmanifest` + service worker

## Stripe checkout

Subscribe opens the Stripe Payment Link:

- **Payment Link:** `https://buy.stripe.com/8x29AMegD0RCd2ZeYd4AU09`
- **Success redirect:** `https://craftpal.help-pal-apps.com/?checkout=success` (also in `public/stripe-success-url.txt`)

Override the link at build time with `VITE_STRIPE_PAYMENT_LINK` (Netlify env). No Stripe secret keys in the frontend — client only needs the Payment Link URL.

On return (`?checkout=success`, `?plus=1`, or a session id), Craft Pal unlocks Plus on this device.

## Gift unlocks

Open with a gift query to unlock full access without the paywall:

- `?gift=albert`
- `?gift=david`
- `?gift=ashley`

## Develop

```bash
npm install
npm run dev
npm run build
```

## Deploy

Static site via Netlify (`netlify.toml`). Custom domain: `craftpal.help-pal-apps.com` (Netlify site: `craft-pal-app`).
