import { existsSync } from "node:fs";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createApp } from "./app";
import { createClaudeGenerator, type Effort } from "./generator";

try {
  process.loadEnvFile();
} catch {
  // No .env file: the environment variables may already be set.
}

const env = process.env;
const aiConfigured = Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_PROFILE);

const app = createApp({
  aiConfigured,
  generator: createClaudeGenerator({
    model: env.ARREL_MODEL || undefined,
    effort: (env.ARREL_EFFORT as Effort) || undefined,
    configured: aiConfigured,
  }),
});

// After `npm run build`, the same server also serves the web app.
if (existsSync("dist")) app.use("/*", serveStatic({ root: "./dist" }));

const port = Number(env.PORT) || 8787;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Arrel escoltant a http://localhost:${info.port}`);
  if (!aiConfigured) console.warn("Falta ANTHROPIC_API_KEY a l'arxiu .env: només funcionarà l'arbre d'exemple.");
});
