import { defineConfig } from "@prisma/config";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// Load .env file for local development (Vercel injects env vars directly)
loadEnv({ path: resolve(process.cwd(), ".env") });

export default defineConfig({
  schema: "./prisma/schema.prisma",
});
