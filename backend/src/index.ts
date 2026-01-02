import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import organizationsRoutes from "./routes/organizations.routes.js";
import referralsRoutes from "./routes/referrals.routes.js";
import mcpRoutes from "./routes/mcp.routes.js";
import { auth } from "./middleware/auth.js";

dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL, // From environment variable
  "https://healthcare-refferal-management.vercel.app", // Production Vercel
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000", // Local frontend
].filter(Boolean) as string[]; // Remove undefined values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (
        // Allow Vercel preview deployments (e.g., healthcare-refferal-management-*.vercel.app)
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        // In development, allow all origins
        if (process.env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello Shoaib");
});

app.use("/api/", auth);
app.use("/api/organizations", organizationsRoutes);
app.use("/api/referrals", referralsRoutes);
app.use("/api/mcp", mcpRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Error:", err);
  res.status(err?.status || 500).json({
    error: err?.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
