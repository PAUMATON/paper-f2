import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { LessonRequestSchema, OutlineRequestSchema } from "../shared/schemas";
import { GenerationError, STATUS_BY_CODE } from "./errors";
import type { Generator } from "./generator";

export interface AppDeps {
  generator: Generator;
  aiConfigured: boolean;
  /** Saves a new API key and switches to it. Only offered when the app runs locally. */
  saveKey?: (key: string) => Promise<void>;
}

const KEY = /^[\w-]{10,200}$/;

/** Only a browser on the same computer may change the key. */
function isLocal(host: string | undefined): boolean {
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host ?? "");
}

/** Retries once when the model's answer was unusable; other failures would only repeat. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof GenerationError && error.code === "bad_generation") return fn();
    throw error;
  }
}

function fail(c: Context, error: unknown) {
  if (error instanceof GenerationError) {
    if (error.code !== "refused") console.error(`[arrel] ${error.code}: ${error.message}`);
    return c.json({ error: error.code }, STATUS_BY_CODE[error.code] as ContentfulStatusCode);
  }
  console.error("[arrel]", error);
  return c.json({ error: "server_error" }, 500);
}

export function createApp(deps: AppDeps) {
  const app = new Hono();

  app.get("/api/health", (c) =>
    c.json({ ok: true, ai: deps.aiConfigured, canSetKey: Boolean(deps.saveKey) && isLocal(c.req.header("host")) }),
  );

  app.post("/api/key", async (c) => {
    if (!deps.saveKey || !isLocal(c.req.header("host"))) return c.json({ error: "bad_request" }, 403);
    const body = await c.req.json().catch(() => null);
    const key = typeof body?.key === "string" ? body.key.trim() : "";
    if (!KEY.test(key)) return c.json({ error: "bad_request" }, 400);
    try {
      await deps.saveKey(key);
      return c.json({ ok: true });
    } catch (error) {
      return fail(c, error);
    }
  });

  app.post("/api/outline", async (c) => {
    const parsed = OutlineRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "bad_request" }, 400);
    try {
      const outline = await withRetry(() => deps.generator.outline(parsed.data));
      return c.json({ outline });
    } catch (error) {
      return fail(c, error);
    }
  });

  app.post("/api/lesson", async (c) => {
    const parsed = LessonRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success || !parsed.data.outline.nodes.some((n) => n.id === parsed.data.nodeId)) {
      return c.json({ error: "bad_request" }, 400);
    }
    try {
      const lesson = await withRetry(() => deps.generator.lesson(parsed.data));
      return c.json({ lesson });
    } catch (error) {
      return fail(c, error);
    }
  });

  return app;
}
