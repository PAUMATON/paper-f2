import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createApp, type AppDeps } from "./app";
import { createClaudeGenerator, type Effort } from "./claude";
import { createGeminiGenerator } from "./gemini";
import type { Generator } from "./generator";

try {
  process.loadEnvFile();
} catch {
  // No .env file: the environment variables may already be set.
}

const env = process.env;
const provider = env.ARREL_PROVIDER === "claude" ? "claude" : "gemini";
const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
const aiConfigured =
  provider === "gemini"
    ? Boolean(geminiKey)
    : Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_PROFILE);

const generator: Generator =
  provider === "gemini"
    ? createGeminiGenerator({ apiKey: geminiKey, model: env.ARREL_MODEL || undefined, configured: aiConfigured })
    : createClaudeGenerator({
        model: env.ARREL_MODEL || undefined,
        effort: (env.ARREL_EFFORT as Effort) || undefined,
        configured: aiConfigured,
      });

const deps: AppDeps = { aiConfigured, generator };

// With Gemini, the key can also be pasted in the app: it is written to .env and used right away.
if (provider === "gemini") {
  deps.saveKey = async (key) => {
    const current = existsSync(".env") ? readFileSync(".env", "utf8") : "";
    const line = `GEMINI_API_KEY=${key}`;
    const next = /^GEMINI_API_KEY=.*$/m.test(current)
      ? current.replace(/^GEMINI_API_KEY=.*$/m, line)
      : `${current}${current && !current.endsWith("\n") ? "\n" : ""}${line}\n`;
    writeFileSync(".env", next);
    process.env.GEMINI_API_KEY = key;
    deps.generator = createGeminiGenerator({ apiKey: key, model: env.ARREL_MODEL || undefined });
    deps.aiConfigured = true;
  };
}

const app = createApp(deps);

// After `npm run build`, the same server also serves the web app.
if (existsSync("dist")) app.use("/*", serveStatic({ root: "./dist" }));

const port = Number(env.PORT) || 8787;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Arrel escoltant a http://localhost:${info.port} (IA: ${provider})`);
  if (!aiConfigured) {
    const key = provider === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY";
    console.warn(`Falta ${key} a l'arxiu .env: només funcionarà l'arbre d'exemple.`);
  }
});
