import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!process.env.API_TOKEN || token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
