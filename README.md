# MarketPlace

Discover. Compare. Invest.

Beginner-friendly crypto marketplace. The mobile app talks to this API, which loads public asset data from True Markets. Quotes and orders are sent to True Markets only when server trading credentials are configured, and only after the user confirms an order.

## Apps

- `mobile/` — Expo + React Native + TypeScript
- `backend/` — Express + TypeScript + MongoDB

## Run the API

```powershell
cd backend
npm install
copy .env.example .env
npm run dev
```

Health check: `GET http://localhost:5000/api/health`

Put secrets only in `backend/.env`. Do not commit that file. True Markets private keys stay on the server (`TRUE_MARKETS_KEY_FILE` or `TRUE_MARKETS_KEY_ID` + `TRUE_MARKETS_PRIVATE_KEY`).

`PORTFOLIO_SOURCE=demo` stores a labeled practice portfolio. It is not a live brokerage balance.

## Run the app

```powershell
cd mobile
npm install
npx expo start
```

The app uses `http://localhost:5000` on web, `http://10.0.2.2:5000` on the Android emulator, and this computer's LAN address on a physical phone. Override with `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env`.

## Useful routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `GET /api/markets`
- `GET /api/markets/:symbol`
- `GET /api/watchlist`
- `POST /api/watchlist/toggle`
- `GET /api/trading/capabilities`
- `POST /api/trading/quote`
- `POST /api/trading/orders`

`GET /api/trading/capabilities` reports whether quotes and orders are actually configured. The app does not invent a successful trade when they are not.
