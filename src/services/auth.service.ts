// This file contains the ACTUAL LOGIC for authentication.
// Routes and controllers just call these functions — they never contain logic themselves.

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client";
import { JWT_SECRET } from "../config/env";
const SALT_ROUNDS = 12;

export class AuthError extends Error {}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(email: string, password: string) {
  email = normalizeEmail(email);
  // 1. Check if this email is already used.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError("Email is already registered.");
  }

  // 2. Hash the password — we NEVER store the real password.
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Save the new user to the database.
  const user = await prisma.user.create({
    data: { email, password_hash },
  });

  // 4. Create a JWT token so the user is immediately "logged in" after registering.
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "15m",
  });

  // 5. Return only safe fields — never return password_hash to the client.
  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

export async function loginUser(email: string, password: string) {
  email = normalizeEmail(email);
  // 1. Find the user by email.
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // We say "invalid credentials" instead of "user not found" —
    // this avoids telling attackers which emails are registered.
    throw new AuthError("Invalid email or password.");
  }

  // 2. Compare the given password against the stored hash.
  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new AuthError("Invalid email or password.");
  }

  // 3. Password is correct — issue a fresh JWT token.
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "15m",
  });

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
  };
}
