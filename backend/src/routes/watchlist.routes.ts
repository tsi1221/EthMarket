import { Router } from "express";
import {
  getWatchlist,
  replaceWatchlist,
  toggleWatchlist,
} from "../controllers/watchlist.controller";
import { requireAuth } from "../middleware/auth";
import { requireDatabase } from "../middleware/requireDatabase";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  watchlistReplaceSchema,
  watchlistToggleSchema,
} from "../validators/watchlist.validator";

export const watchlistRouter = Router();

watchlistRouter.use(requireAuth, requireDatabase);

watchlistRouter.get("/", asyncHandler(getWatchlist));
watchlistRouter.put("/", validateBody(watchlistReplaceSchema), asyncHandler(replaceWatchlist));
watchlistRouter.post(
  "/toggle",
  validateBody(watchlistToggleSchema),
  asyncHandler(toggleWatchlist),
);
