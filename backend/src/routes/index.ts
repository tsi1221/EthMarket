import { Router } from "express";
import { authRouter } from "./auth.routes";
import { healthRouter } from "./health.routes";
import { marketRouter } from "./market.routes";
import { portfolioRouter } from "./portfolio.routes";
import { tradingRouter } from "./trading.routes";
import { watchlistRouter } from "./watchlist.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/markets", marketRouter);
apiRouter.use("/portfolio", portfolioRouter);
apiRouter.use("/trading", tradingRouter);
apiRouter.use("/watchlist", watchlistRouter);
