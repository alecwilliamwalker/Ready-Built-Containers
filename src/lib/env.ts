import { z } from "zod";

const asOptionalString = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const trimString = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.trim();
};

const optionalNonEmptyString = () =>
  z.preprocess(asOptionalString, z.string().min(1).optional());

const optionalEmailString = () =>
  z.preprocess(asOptionalString, z.string().email().optional());

const optionalUrlOrEmptyString = () =>
  z.preprocess(trimString, z.string().url().optional().or(z.literal("")));

const envSchema = z
  .object({
    DATABASE_URL: z.preprocess(trimString, z.string().min(1, "DATABASE_URL is required")),
    STRIPE_SECRET_KEY: optionalNonEmptyString(),
    STRIPE_PRICE_ID_DEPOSIT: optionalNonEmptyString(),
    STRIPE_WEBHOOK_SECRET: optionalNonEmptyString(),
    EMAIL_API_KEY: optionalNonEmptyString(),
    EMAIL_FROM_ADDRESS: optionalEmailString(),
    EMAIL_FROM_NAME: z.preprocess(trimString, z.string().optional()),
    INTERNAL_NOTIFICATIONS_EMAIL: optionalEmailString(),
    ADMIN_JWT_SECRET: z
      .preprocess(asOptionalString, z.string().min(32, "ADMIN_JWT_SECRET must be at least 32 characters").optional()),
    USER_JWT_SECRET: z
      .preprocess(asOptionalString, z.string().min(32, "USER_JWT_SECRET must be at least 32 characters").optional()),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    NEXT_PUBLIC_CALENDLY_URL: optionalUrlOrEmptyString(),
    NEXT_PUBLIC_SITE_URL: optionalUrlOrEmptyString(),
  })
  .transform((values) => ({
    ...values,
    EMAIL_FROM_NAME: values.EMAIL_FROM_NAME ?? "Ready Built Containers",
  }));

const nodeEnv = process.env.NODE_ENV ?? "development";
const DEV_DEFAULTS = {
  DATABASE_URL: "file:./prisma/dev.db",
  ADMIN_JWT_SECRET: "dev-admin-secret-please-change-me-123456",
  USER_JWT_SECRET: "dev-user-secret-please-change-me-654321",
} as const;

// In development, use defaults if provided values are invalid (e.g., too short)
const getDevValue = (envValue: string | undefined, devDefault: string, minLength?: number) => {
  if (nodeEnv === "production") return envValue;
  if (!envValue) return devDefault;
  if (minLength && envValue.length < minLength) return devDefault;
  return envValue;
};

const rawEnv: Record<string, string | undefined> = {
  ...process.env,
  NODE_ENV: nodeEnv,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    (nodeEnv === "production" ? undefined : DEV_DEFAULTS.DATABASE_URL),
  ADMIN_JWT_SECRET: getDevValue(process.env.ADMIN_JWT_SECRET, DEV_DEFAULTS.ADMIN_JWT_SECRET, 32),
  USER_JWT_SECRET: getDevValue(process.env.USER_JWT_SECRET, DEV_DEFAULTS.USER_JWT_SECRET, 32),
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  console.error("Loaded environment snapshot (sanitized):", {
    NODE_ENV: rawEnv.NODE_ENV,
    DATABASE_URL: rawEnv.DATABASE_URL ? "[set]" : undefined,
    ADMIN_JWT_SECRET: rawEnv.ADMIN_JWT_SECRET ? `[set:${rawEnv.ADMIN_JWT_SECRET.length} chars]` : undefined,
    USER_JWT_SECRET: rawEnv.USER_JWT_SECRET ? `[set:${rawEnv.USER_JWT_SECRET.length} chars]` : undefined,
    STRIPE_SECRET_KEY: rawEnv.STRIPE_SECRET_KEY ? "[set]" : undefined,
    STRIPE_PRICE_ID_DEPOSIT: rawEnv.STRIPE_PRICE_ID_DEPOSIT ? "[set]" : undefined,
    STRIPE_WEBHOOK_SECRET: rawEnv.STRIPE_WEBHOOK_SECRET ? "[set]" : undefined,
    EMAIL_API_KEY: rawEnv.EMAIL_API_KEY ? "[set]" : undefined,
    EMAIL_FROM_ADDRESS: rawEnv.EMAIL_FROM_ADDRESS,
    EMAIL_FROM_NAME: rawEnv.EMAIL_FROM_NAME,
    INTERNAL_NOTIFICATIONS_EMAIL: rawEnv.INTERNAL_NOTIFICATIONS_EMAIL,
    NEXT_PUBLIC_CALENDLY_URL: rawEnv.NEXT_PUBLIC_CALENDLY_URL,
    NEXT_PUBLIC_SITE_URL: rawEnv.NEXT_PUBLIC_SITE_URL,
  });
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

export function requireEnv<K extends keyof typeof env>(key: K) {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${String(key)}`);
  }

  return value;
}

