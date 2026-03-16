import express from "express";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));

async function start() {
  try {
    await setupAuth(app);
    registerAuthRoutes(app);

    const PORT = parseInt(process.env.AUTH_PORT || "5001");
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Auth server running on port ${PORT}`);
    });

    const shutdown = () => {
      console.log("[Auth] Graceful shutdown…");
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 5000);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    server.on("error", (err) => {
      console.error("[Auth] Server error:", err);
    });
  } catch (err) {
    console.error("[Auth] Failed to start:", err);
    process.exit(1);
  }
}

process.on("uncaughtException", (err) => {
  console.error("[Auth] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Auth] Unhandled rejection:", reason);
});

start();
