import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

for (const envPath of [".env.local", "../../.env.local", ".env", "../../.env"]) {
  loadEnv({ path: resolve(process.cwd(), envPath), override: false });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});
