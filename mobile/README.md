# EthMarket

Discover. Compare. Invest.

EthMarket is a React Native (Expo) app for discovering digital assets, comparing markets, and requesting live True Markets quotes through a secure Node/Express backend.

## Apps

- `mobile/` — Expo app (Android, iOS, web)
- `backend/` — API (Android package `com.marketplace.app` / EAS slug unchanged)

## Brand

- Product name: **EthMarket**
- Primary green: `#16A34A`
- Tagline: Discover. Compare. Invest.

## Safety

True Markets API keys, private keys, and trading JWTs stay on the backend only.
The Buy screen requests quotes through `POST /api/trading/quote`.
Order execution is intentionally not enabled in this milestone.

## Production API URL

Release builds must set a public HTTPS origin:

```bash
EXPO_PUBLIC_API_BASE_URL=https://YOUR-BACKEND-DOMAIN
```

Do not put MongoDB, JWT, or True Markets secrets in Expo public env vars.
Production also requires backend `CORS_ORIGINS` for any EthMarket web origin.
