# BLACKOUT Backend

Express + Prisma backend for the BLACKOUT authentication and dungeon API.

## Development

```bash
npm ci
npx prisma generate
npm run build
npm run dev
```

The default development server listens on `http://localhost:4000`.

## Environment

- `DATABASE_URL`: Prisma database connection string.
- `JWT_SECRET`: signing key for authentication tokens. This is required when `NODE_ENV=production`.
- `CORS_ORIGIN`: allowed browser origin. When omitted, the development fallback leaves CORS open for local frontend work; set this explicitly in deployed environments.
- `PORT`: HTTP port, default `4000`.

Never commit `.env` files or production credentials.

## Health endpoints

- `GET /health` checks process liveness without requiring the database.
- `GET /health/db` verifies Prisma can reach the database and reports the user count.
