import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import organizationsRoutes from "./routes/organizations.routes.js";
import referralsRoutes from "./routes/referrals.routes.js";
import mcpRoutes from "./routes/mcp.routes.js";
import { auth } from "./middleware/auth.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
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
