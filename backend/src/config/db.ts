import mongoose from "mongoose";
import { env } from "./env";

export function describeDatabaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const lower = message.toLowerCase();
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (lower.includes("bad auth") || lower.includes("authentication failed") || code === "18") {
    return "authentication failed. The database username or password was rejected. Percent-encode reserved characters in the password (@ : / ? # [ ] and spaces) and keep the username unchanged.";
  }

  if (lower.includes("not authorized") || lower.includes("unauthorized")) {
    return "database user permission problem. The user reached Atlas but cannot access this database.";
  }

  if (
    lower.includes("enotfound") ||
    lower.includes("querysrv") ||
    lower.includes("eai_again") ||
    lower.includes("dns")
  ) {
    return "DNS/hostname problem. The Atlas hostname could not be resolved.";
  }

  if (
    lower.includes("invalid scheme") ||
    lower.includes("invalid connection string") ||
    lower.includes("mongodburl") ||
    (lower.includes("uri") && lower.includes("invalid"))
  ) {
    return "malformed connection string.";
  }

  if (
    lower.includes("timed out") ||
    lower.includes("timeout") ||
    lower.includes("etimedout") ||
    lower.includes("replicasetnoprimary") ||
    lower.includes("whitelisted")
  ) {
    return "timeout. Atlas hostnames resolved, but no database connection completed. The driver mentions IP access for every selection failure; that text is not proof of an IP block. Confirm the cluster is resumed and that outbound TCP port 27017 can reach Atlas.";
  }

  return "database unavailable.";
}

function redactedDriverMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown database error";
  return message
    .replace(/mongodb(\+srv)?:\/\/[^@\s/]+@/gi, "mongodb://[redacted]@")
    .replace(/[A-Za-z0-9._%+-]+:[^@\s/]+@/g, "[redacted]@")
    .slice(0, 400);
}

export async function connectDatabase(): Promise<void> {
  if (!env.MONGODB_URI) {
    console.error("[db] MONGODB_URI is not configured");
    return;
  }

  mongoose.set("strictQuery", true);

  console.log("[db] Connecting to MongoDB Atlas...");

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15_000,
    });
  } catch (error) {
    console.error(`[db] MongoDB connection failed: ${describeDatabaseError(error)}`);
    console.error(`[db] Redacted driver message: ${redactedDriverMessage(error)}`);

    if (env.NODE_ENV === "production") {
      throw error;
    }

    console.warn("[db] Continuing without MongoDB. Auth routes will fail until Atlas is reachable.");
    return;
  }

  console.log("[db] Connected to MongoDB Atlas");
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}
