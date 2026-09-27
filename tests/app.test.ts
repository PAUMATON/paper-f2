import { describe, expect, it, vi } from "vitest";
import type { Lesson, Outline } from "../shared/types";
import { createApp } from "../server/app";
import { GenerationError } from "../server/errors";
import type { Generator } from "../server/generator";

const outline: Outline = {
  title: "Guitarra",
  summary: "Tocar cançons senzilles.",
  nodes: [
    { id: "n1", title: "Afinar", goal: "Afinar la guitarra.", minutes: 15, deps: [], project: false },
    { id: "n2", title: "Primers acords", goal: "Tocar La, Re i Mi.", minutes: 25, deps: ["n1"], project: false },
    { id: "n3", title: "Projecte: una cançó", goal: "Tocar una cançó sencera.", minutes: 45, deps: ["n2"], project: true },
  ],
};

const lesson: Lesson = {
  explanation: ["Fes servir un afinador."],
  example: null,
  practice: "Afina les sis cordes.",
  searchTerms: [],
  links: [],
  quiz: [],
  checklist: [],
};

function setup(generator: Partial<Generator> = {}, aiConfigured = true) {
  const full: Generator = {
    outline: vi.fn(async () => outline),
    lesson: vi.fn(async () => lesson),
    ...generator,
  };
  return { app: createApp({ generator: full, aiConfigured }), generator: full };
}

const post = (app: ReturnType<typeof setup>["app"], path: string, body: unknown) =>
  app.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const lessonBody = {
  topic: "Guitarra",
  lang: "ca",
  level: "beginner",
  outline: { title: outline.title, nodes: outline.nodes.map(({ minutes: _, ...n }) => n) },
  nodeId: "n2",
};

describe("API", () => {
  it("reports whether the AI is configured", async () => {
    const res = await setup({}, false).app.request("/api/health");
    expect(await res.json()).toEqual({ ok: true, ai: false, canSetKey: false });
  });

  it("creates an outline", async () => {
    const { app, generator } = setup();
    const res = await post(app, "/api/outline", { topic: "  Guitarra ", lang: "ca", level: "beginner" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ outline });
    expect(generator.outline).toHaveBeenCalledWith({ topic: "Guitarra", lang: "ca", level: "beginner" });
  });

  it("rejects invalid requests without calling the AI", async () => {
    const { app, generator } = setup();
    for (const body of ["not json", { topic: "", lang: "ca", level: "beginner" }, { topic: "x", lang: "fr", level: "beginner" }]) {
      const res = await post(app, "/api/outline", body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "bad_request" });
    }
    expect((await post(app, "/api/outline", { topic: "x".repeat(201), lang: "ca", level: "beginner" })).status).toBe(400);
    expect((await post(app, "/api/lesson", { ...lessonBody, nodeId: "n9" })).status).toBe(400);
    expect(generator.outline).not.toHaveBeenCalled();
    expect(generator.lesson).not.toHaveBeenCalled();
  });

  it("writes a lesson for a node of the tree", async () => {
    const { app, generator } = setup();
    const res = await post(app, "/api/lesson", lessonBody);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ lesson });
    expect(generator.lesson).toHaveBeenCalledWith(lessonBody);
  });

  it("retries once when the AI's answer was unusable", async () => {
    const outlineFn = vi
      .fn<Generator["outline"]>()
      .mockRejectedValueOnce(new GenerationError("bad_generation"))
      .mockResolvedValueOnce(outline);
    const { app } = setup({ outline: outlineFn });
    const res = await post(app, "/api/outline", { topic: "Guitarra", lang: "ca", level: "beginner" });
    expect(res.status).toBe(200);
    expect(outlineFn).toHaveBeenCalledTimes(2);
  });

  it("turns generation errors into status codes", async () => {
    const cases = [
      ["refused", 422],
      ["rate_limited", 429],
      ["ai_not_configured", 503],
      ["ai_error", 502],
    ] as const;
    for (const [code, status] of cases) {
      const outlineFn = vi.fn<Generator["outline"]>().mockRejectedValue(new GenerationError(code));
      const { app } = setup({ outline: outlineFn });
      const res = await post(app, "/api/outline", { topic: "Guitarra", lang: "ca", level: "beginner" });
      expect(res.status).toBe(status);
      expect(await res.json()).toEqual({ error: code });
      expect(outlineFn).toHaveBeenCalledTimes(1);
    }
  });

  it("saves a key only from the same computer", async () => {
    const saveKey = vi.fn(async () => {});
    const app = createApp({ generator: setup().generator, aiConfigured: false, saveKey });
    const send = (host: string, key: unknown) =>
      app.request("/api/key", {
        method: "POST",
        headers: { "content-type": "application/json", host },
        body: JSON.stringify({ key }),
      });

    expect(await (await app.request("/api/health", { headers: { host: "localhost:5173" } })).json()).toEqual({
      ok: true,
      ai: false,
      canSetKey: true,
    });
    expect((await send("localhost:5173", "AIzaSyTest_key-123")).status).toBe(200);
    expect(saveKey).toHaveBeenCalledWith("AIzaSyTest_key-123");
    expect((await send("localhost:5173", "short")).status).toBe(400);
    expect((await send("localhost:5173", "AIza key\nINJECTED=1")).status).toBe(400);
    expect((await send("arrel.example.com", "AIzaSyTest_key-123")).status).toBe(403);
    expect(saveKey).toHaveBeenCalledTimes(1);
  });
});
