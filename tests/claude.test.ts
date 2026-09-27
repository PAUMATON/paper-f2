import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import type { LessonRequest } from "../shared/schemas";
import { GenerationError } from "../server/errors";
import { createClaudeGenerator } from "../server/claude";
import { OUTLINE_SYSTEM } from "../server/prompts";

const rawOutline = {
  title: "SQL",
  summary: "Fer consultes útils.",
  nodes: [
    { id: "n1", title: "Què és una base de dades", goal: "Entendre taules i files.", minutes: 15, deps: [], project: false },
    { id: "n2", title: "SELECT i WHERE", goal: "Filtrar dades.", minutes: 25, deps: ["n1"], project: false },
    { id: "n3", title: "Projecte: informe de vendes", goal: "Fer un informe real.", minutes: 45, deps: ["n2"], project: true },
  ],
};

const rawLesson = {
  explanation: ["Una taula té files i columnes."],
  example: { kind: "code", language: "sql", content: "SELECT * FROM vendes;" },
  practice: "Crea una taula.",
  searchTerms: ["sql select"],
  quiz: [
    { question: "Què és una fila?", options: ["Un registre", "Una columna", "Una taula", "Un índex"], answer: 0, why: "Cada fila és un registre." },
    { question: "Què filtra WHERE?", options: ["Columnes", "Files", "Taules", "Res"], answer: 1, why: "WHERE filtra files." },
    { question: "Què fa SELECT *?", options: ["Esborra", "Crea", "Tria totes les columnes", "Ordena"], answer: 2, why: "* vol dir totes les columnes." },
  ],
  checklist: [],
};

function message(text: string, stop_reason: Anthropic.Beta.BetaMessage["stop_reason"] = "end_turn") {
  return { content: [{ type: "text", text }], stop_reason } as unknown as Anthropic.Beta.BetaMessage;
}

function fakeClient(create: (...args: unknown[]) => unknown) {
  const fn = vi.fn(create);
  return { client: { beta: { messages: { create: fn } } } as unknown as Anthropic, create: fn };
}

const lessonRequest: LessonRequest = {
  topic: "SQL",
  lang: "ca",
  level: "beginner",
  outline: { title: "SQL", nodes: rawOutline.nodes.map(({ minutes: _, ...n }) => n) },
  nodeId: "n2",
};

async function codeOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(GenerationError);
    return (error as GenerationError).code;
  }
  throw new Error("expected a GenerationError");
}

describe("createClaudeGenerator", () => {
  it("asks for structured output with refusal fallbacks and normalizes the outline", async () => {
    const { client, create } = fakeClient(async () => message(JSON.stringify(rawOutline)));
    const outline = await createClaudeGenerator({ client }).outline({ topic: "SQL", lang: "ca", level: "beginner" });

    expect(outline.nodes.map((n) => n.id)).toEqual(["n1", "n2", "n3"]);
    const params = create.mock.calls[0][0] as Record<string, any>;
    expect(params.model).toBe("claude-opus-5");
    expect(params.fallbacks).toBe("default");
    expect(params.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(params.thinking).toEqual({ type: "adaptive" });
    expect(params.output_config.effort).toBe("medium");
    expect(params.output_config.format.type).toBe("json_schema");
    expect(params.system).toBe(OUTLINE_SYSTEM);
    expect(params.messages[0].content).toContain("<topic>SQL</topic>");
    expect(params.messages[0].content).toContain("Catalan");
  });

  it("uses the configured model and effort", async () => {
    const { client, create } = fakeClient(async () => message(JSON.stringify(rawOutline)));
    await createClaudeGenerator({ client, model: "claude-sonnet-5", effort: "high" }).outline({
      topic: "SQL",
      lang: "en",
      level: "advanced",
    });
    const params = create.mock.calls[0][0] as Record<string, any>;
    expect(params.model).toBe("claude-sonnet-5");
    expect(params.output_config.effort).toBe("high");
  });

  it("writes a lesson with the tree as context", async () => {
    const { client, create } = fakeClient(async () => message(JSON.stringify(rawLesson)));
    const lesson = await createClaudeGenerator({ client }).lesson(lessonRequest);

    expect(lesson.quiz).toHaveLength(3);
    const content = (create.mock.calls[0][0] as Record<string, any>).messages[0].content as string;
    expect(content).toContain("n3. Projecte: informe de vendes");
    expect(content).toContain('Write the lesson for n2, "SELECT i WHERE"');
  });

  it("maps refusals, truncation and malformed output", async () => {
    const refused = fakeClient(async () => message("", "refusal")).client;
    const truncated = fakeClient(async () => message('{"title": "SQL"', "max_tokens")).client;
    const malformed = fakeClient(async () => message('{"title": 3}')).client;
    const req = { topic: "SQL", lang: "ca", level: "beginner" } as const;

    expect(await codeOf(createClaudeGenerator({ client: refused }).outline(req))).toBe("refused");
    expect(await codeOf(createClaudeGenerator({ client: truncated }).outline(req))).toBe("bad_generation");
    expect(await codeOf(createClaudeGenerator({ client: malformed }).outline(req))).toBe("bad_generation");
  });

  it("maps API and credential errors", async () => {
    const req = { topic: "SQL", lang: "ca", level: "beginner" } as const;
    const failWith = (error: unknown) =>
      fakeClient(async () => {
        throw error;
      }).client;

    const rateLimited = failWith(Anthropic.APIError.generate(429, undefined, "slow down", new Headers()));
    const badKey = failWith(Anthropic.APIError.generate(401, undefined, "invalid x-api-key", new Headers()));
    const overloaded = failWith(Anthropic.APIError.generate(529, undefined, "overloaded", new Headers()));
    const noCredentials = failWith(new Error("Could not resolve authentication method"));

    expect(await codeOf(createClaudeGenerator({ client: rateLimited }).outline(req))).toBe("rate_limited");
    expect(await codeOf(createClaudeGenerator({ client: badKey }).outline(req))).toBe("ai_not_configured");
    expect(await codeOf(createClaudeGenerator({ client: overloaded }).outline(req))).toBe("ai_error");
    expect(await codeOf(createClaudeGenerator({ client: noCredentials, configured: false }).outline(req))).toBe(
      "ai_not_configured",
    );
  });
});
