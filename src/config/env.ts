const configuredJwtSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production" && !configuredJwtSecret) {
  throw new Error("JWT_SECRET must be configured in production.");
}

export const JWT_SECRET = configuredJwtSecret || "dev-secret-change-me";
