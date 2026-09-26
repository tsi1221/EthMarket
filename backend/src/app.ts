import cors from "cors";
import express from "express";
import { env, resolveCorsOrigins } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { apiRateLimit } from "./middleware/rateLimit";
import { securityHeaders } from "./middleware/securityHeaders";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();
  const allowedOrigins = resolveCorsOrigins();

  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser clients (mobile apps, curl, server-to-server) send no Origin.
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json({ limit: "32kb" }));

  app.get("/", (_req, res) => {
    res.json({
      product: "EthMarket",
      tagline: "Discover. Compare. Invest.",
      health: "/api/health",
      environment: env.NODE_ENV,
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
      },
      markets: {
        list: "GET /api/markets",
        detail: "GET /api/markets/:symbol",
      },
      portfolio: {
        summary: "GET /api/portfolio",
        balance: "GET /api/portfolio/balance",
      },
      trading: {
        capabilities: "GET /api/trading/capabilities",
        quote: "POST /api/trading/quote",
        orders: "POST /api/trading/orders",
        listOrders: "GET /api/trading/orders",
        orderStatus: "GET /api/trading/orders/:id/status",
      },
      watchlist: {
        list: "GET /api/watchlist",
        replace: "PUT /api/watchlist",
        toggle: "POST /api/watchlist/toggle",
      },
      profile: {
        update: "PATCH /api/auth/me",
      },
    });
  });

  app.use("/api", apiRateLimit, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
