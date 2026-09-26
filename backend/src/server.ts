import type { Server } from "node:http";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";
import { createApp } from "./app";
import { logError } from "./utils/logger";

let server: Server | null = null;
let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`[server] Received ${signal}. Shutting down…`);

  const forceTimer = setTimeout(() => {
    console.error("[server] Forced exit after shutdown timeout");
    process.exit(1);
  }, 10_000);
  forceTimer.unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await disconnectDatabase();
    console.log("[server] Shutdown complete");
    process.exit(0);
  } catch (error) {
    logError("shutdown", error);
    process.exit(1);
  }
}

async function bootstrap() {
  const app = createApp();

  await connectDatabase();

  server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`[server] EthMarket API listening on port ${env.PORT}`);
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

bootstrap().catch((error) => {
  logError("server", error);
  process.exit(1);
});
