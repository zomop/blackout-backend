// This is the entry point of our backend.
// Today it does two things only:
//   1. Starts a web server.
//   2. Exposes a "/health" route that also checks the database connection.
// No auth, no game logic yet — that comes in later steps.

import express = require("express");
import cors = require("cors");
import dotenv from "dotenv";
import { prisma } from "./prisma/client";
import authRoutes from "./routes/auth.routes";
import dungeonRoutes from "./routes/dungeon.routes";


dotenv.config();

const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));
app.use(express.json({ limit: "32kb" }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dungeon", dungeonRoutes);

// Basic route so we know the server itself is alive.
app.get("/", (_req, res) => {
  res.json({ message: "BLACKOUT backend is running." });
});

// Lightweight liveness probe for load balancers and container orchestrators.
// Keep this independent from the database so it can distinguish process health
// from dependency health.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// This route proves the SERVER can talk to the DATABASE.
// It counts how many users exist (0 is a perfectly fine answer right now).
app.get("/health/db", async (_req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ status: "ok", userCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Database not reachable." });
  }
});

app.use((_req, res) => {
  res.status(404).json({ status: "error", message: "Route not found." });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof SyntaxError) {
    return res.status(400).json({ status: "error", message: "Malformed JSON request." });
  }
  console.error(error);
  return res.status(500).json({ status: "error", message: "Internal server error." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`BLACKOUT backend listening on http://localhost:${PORT}`);
});
