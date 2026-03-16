import http from "http";
import { execFileSync } from "child_process";
import express from "express";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

const app = express();
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));

function freePort(port: number) {
  try { execFileSync("fuser", ["-k", `${port}/tcp`], { stdio: "ignore" }); } catch {}
}

function listenWithRetry(server: http.Server, port: number, retries = 3): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    const tryBind = () => {
      attempt++;
      server.listen(port, "0.0.0.0");
      server.once("listening", () => resolve());
      server.once("error", (err: NodeJS.ErrnoException) => {
        server.removeAllListeners("error");
        server.removeAllListeners("listening");
        if (err.code === "EADDRINUSE" && attempt < retries) {
          console.warn(`[Auth] Port ${port} busy — freeing and retrying (${attempt}/${retries})…`);
          freePort(port);
          setTimeout(tryBind, 600);
        } else {
          reject(err);
        }
      });
    };
    tryBind();
  });
}

async function start() {
  try {
    await setupAuth(app);
    registerAuthRoutes(app);

    const PORT = parseInt(process.env.AUTH_PORT ?? "5001");
    const server = http.createServer(app);

    await listenWithRetry(server, PORT);
    console.log(`Auth server running on port ${PORT}`);

    server.on("error", (err) => console.error("[Auth] Server error:", err));

    const shutdown = (signal: string) => {
      console.log(`[Auth] ${signal} received — shutting down…`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 5_000);
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));
  } catch (err) {
    console.error("[Auth] Failed to start:", err);
    process.exit(1);
  }
}

process.on("uncaughtException",  (err)    => console.error("[Auth] Uncaught exception:", err));
process.on("unhandledRejection", (reason) => console.error("[Auth] Unhandled rejection:", reason));

start();
