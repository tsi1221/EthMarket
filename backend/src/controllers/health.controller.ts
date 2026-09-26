import type { Request, Response } from "express";
import mongoose from "mongoose";

export function getHealth(_req: Request, res: Response) {
  res.status(200).json({
    status: "ok",
  });
}

export function getDatabaseHealth(_req: Request, res: Response) {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "error",
    database: connected ? "connected" : "disconnected",
  });
}
