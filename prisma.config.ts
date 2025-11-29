import { defineConfig } from "@prisma/config";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), ".env") });

export default defineConfig({
  schema: "./prisma/schema.prisma",
});
