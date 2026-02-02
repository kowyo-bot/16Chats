import { betterAuth } from "better-auth";
import { Pool } from "pg";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database:
    process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.startsWith("postgres://") ||
      process.env.DATABASE_URL.startsWith("postgresql://"))
      ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false,
          },
        })
      : new Database("./sqlite.db"),
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});

export type Session = typeof auth.$Infer.Session;
