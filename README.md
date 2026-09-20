# Craft Pal

**Live:** https://craftpal.help-pal-apps.com

Track materials, recipes, and sales profit for craft sellers (bows, wreaths, and more).

- **Price:** Free with ads (no subscription)
- **Storage:** localStorage on-device (offline-friendly)
- **PWA:** Add to Home Screen via `manifest.webmanifest` + service worker

## Monetization

Free + ads. Stripe checkout is paused; `src/lib/billing.ts` only clears legacy return URLs.

Former Payment Link (deactivate in Stripe if still live):

`https://buy.stripe.com/8x29AMegD0RCd2ZeYd4AU09`

## Gift unlocks


Open with a gift query to unlock full access anytime:

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
