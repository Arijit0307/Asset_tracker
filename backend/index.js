import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { pool } from "./config/db.js";
import assetRoutes from "./routes/assetRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW() AS server_time");

    res.status(200).json({
      success: true,
      message: "Backend and PostgreSQL connected successfully",
      serverTime: result.rows[0].server_time,
    });
  } catch (error) {
    next(error);
  }
});

// Asset routes
app.use("/api/assets", assetRoutes);

// Unknown route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler
app.use((error, req, res, next) => {
  console.error("Backend Error:", error.message);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development"
      ? {
          error: error.message,
          code: error.code,
        }
      : {}),
  });
});

const PORT = Number(process.env.PORT || 5000);

const server = app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

// Graceful shutdown
async function shutdown() {
  console.log("Closing server and database connections...");

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);