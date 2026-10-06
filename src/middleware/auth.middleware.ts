// This middleware protects routes. Put it in front of any route that
// should only be accessible to logged-in users.
//
// How it works: the client must send "Authorization: Bearer <token>".
// We verify that token. If valid, we attach the decoded user info to
// req.user and call next() to let the request continue.
// If invalid or missing, we reject with 401 immediately — the
// controller behind it never even runs.

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

export interface AuthPayload {
  userId: string;
  role: "PLAYER" | "ADMIN";
}

function isAuthPayload(value: string | jwt.JwtPayload): value is AuthPayload {
  return typeof value !== "string" && typeof value.userId === "string"
    && (value.role === "PLAYER" || value.role === "ADMIN");
}

// This tells TypeScript that req.user might exist and what shape it has.
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "error", message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isAuthPayload(decoded)) {
      return res.status(401).json({ status: "error", message: "Invalid or expired token." });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Invalid or expired token." });
  }
}

// Use this AFTER requireAuth on routes that should be admin-only.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ status: "error", message: "Admin access required." });
  }
  next();
}
