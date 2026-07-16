import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv[2] || "development";
const envFile = mode === "example" ? ".env.example" : `.env.${mode}`;
const requiredPublicKeys = [
  "VITE_APP_ENV",
  "VITE_APP_NAME",
  "VITE_SITE_URL",
  "VITE_API_BASE_URL",
  "VITE_CMS_URL",
  "VITE_DEFAULT_MARKET",
  "VITE_PAYMENT_MODE",
  "VITE_ENABLE_LIVE_PAYMENTS",
  "VITE_ENABLE_MESSAGING_AUTOMATION",
  "VITE_ENABLE_ANALYTICS",
];

function parseEnv(file) {
  const body = readFileSync(resolve(file), "utf8");
  const values = new Map();

  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^"|"$/g, "");
    values.set(key, value);
  }

  return values;
}

const values = parseEnv(envFile);
const missing = requiredPublicKeys.filter((key) => !values.has(key));
const empty = requiredPublicKeys.filter((key) => values.has(key) && values.get(key) === "");

if (missing.length || empty.length) {
  if (missing.length) console.error(`Missing keys in ${envFile}: ${missing.join(", ")}`);
  if (empty.length) console.error(`Empty keys in ${envFile}: ${empty.join(", ")}`);
  process.exit(1);
}

console.log(`${envFile} has all required public environment keys.`);
