import express from "express";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

const app = express();
app.use(express.json());

(async () => {
  await setupAuth(app);
  registerAuthRoutes(app);

  const PORT = parseInt(process.env.AUTH_PORT || "5001");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Auth server running on port ${PORT}`);
  });
})();
