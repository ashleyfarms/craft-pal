# Craft Pal

Track materials, recipes, and sales profit for craft sellers (bows, wreaths, and more).

- **Price (UI):** $4.99/mo after a 14-day free trial (Stripe wiring later)
- **Storage:** localStorage on-device (offline-friendly)
- **PWA:** Add to Home Screen via `manifest.webmanifest` + service worker

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

Static site via Netlify (`netlify.toml`). Site name: `craft-pal-app`.
