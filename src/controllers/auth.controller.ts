// Controllers translate HTTP <-> service calls. No business logic lives here.

import { Request, Response } from "express";
import { z } from "zod";
import { registerUser, loginUser, AuthError } from "../services/auth.service";

// This describes exactly what a valid register request looks like.
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function register(req: Request, res: Response) {
  const parseResult = registerSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      status: "error",
      message: "Invalid input.",
      details: parseResult.error.flatten().fieldErrors,
    });
  }

  const { email, password } = parseResult.data;

  try {
    const result = await registerUser(email, password);
    return res.status(201).json({ status: "ok", ...result });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(409).json({ status: "error", message: error.message });
    }
    console.error(error);
    return res.status(500).json({ status: "error", message: "Something went wrong." });
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required."),
});

export async function login(req: Request, res: Response) {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      status: "error",
      message: "Invalid input.",
      details: parseResult.error.flatten().fieldErrors,
    });
  }

  const { email, password } = parseResult.data;

  try {
    const result = await loginUser(email, password);
    return res.status(200).json({ status: "ok", ...result });
  } catch (error) {
    if (error instanceof AuthError) {
      // 401 = "not authenticated" — correct status for bad credentials.
      return res.status(401).json({ status: "error", message: error.message });
    }
    console.error(error);
    return res.status(500).json({ status: "error", message: "Something went wrong." });
  }
}

export async function getMe(req: Request, res: Response) {
  // req.user was attached by the requireAuth middleware — we trust it
  // because it came from a verified JWT, not from anything the client typed.
  return res.status(200).json({ status: "ok", user: req.user });
}