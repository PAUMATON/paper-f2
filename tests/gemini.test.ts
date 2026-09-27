import { ApiError, FinishReason, type GenerateContentResponse, type GoogleGenAI } from "@google/genai";
import { describe, expect, it, vi } from "vitest";
import { GenerationError } from "../server/errors";
import { createGeminiGenerator } from "../server/gemini";
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

const req = { topic: "SQL", lang: "ca", level: "beginner" } as const;

function response(text: string | undefined, extra: Record<string, unknown> = {}) {
  return { text, candidates: [{ finishReason: FinishReason.STOP }], ...extra } as unknown as GenerateContentResponse;
}

function fakeClient(generateContent: (...args: unknown[]) => unknown) {
  const fn = vi.fn(generateContent);
  return { client: { models: { generateContent: fn } } as unknown as GoogleGenAI, generateContent: fn };
}

async function codeOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(GenerationError);
    return (error as GenerationError).code;
  }
  throw new Error("expected a GenerationError");
}

describe("createGeminiGenerator", () => {
  it("asks for JSON matching the schema and normalizes the outline", async () => {
    const { client, generateContent } = fakeClient(async () => response(JSON.stringify(rawOutline)));
    const outline = await createGeminiGenerator({ client }).outline(req);

    expect(outline.nodes.map((n) => n.id)).toEqual(["n1", "n2", "n3"]);
    const params = generateContent.mock.calls[0][0] as Record<string, any>;
    expect(params.model).toBe("gemini-flash-latest");
    expect(params.contents).toContain("<topic>SQL</topic>");
    expect(params.config.systemInstruction).toBe(OUTLINE_SYSTEM);
    expect(params.config.responseMimeType).toBe("application/json");
    expect(params.config.responseJsonSchema.$schema).toBeUndefined();
    expect(params.config.responseJsonSchema.required).toEqual(["title", "summary", "nodes"]);
  });

  it("uses the configured model", async () => {
    const { client, generateContent } = fakeClient(async () => response(JSON.stringify(rawOutline)));
    await createGeminiGenerator({ client, model: "gemini-pro-latest" }).outline(req);
    expect((generateContent.mock.calls[0][0] as Record<string, any>).model).toBe("gemini-pro-latest");
  });

  it("maps blocked, truncated and malformed answers", async () => {
    const blockedPrompt = fakeClient(async () => response(undefined, { promptFeedback: { blockReason: "SAFETY" } })).client;
    const blockedAnswer = fakeClient(async () =>
      response("", { candidates: [{ finishReason: FinishReason.PROHIBITED_CONTENT }] }),
    ).client;
    const truncated = fakeClient(async () => response('{"title": "SQL"', { candidates: [{ finishReason: FinishReason.MAX_TOKENS }] })).client;
    const notJson = fakeClient(async () => response("hola!")).client;
    const wrongShape = fakeClient(async () => response('{"title": 3}')).client;

    expect(await codeOf(createGeminiGenerator({ client: blockedPrompt }).outline(req))).toBe("refused");
    expect(await codeOf(createGeminiGenerator({ client: blockedAnswer }).outline(req))).toBe("refused");
    expect(await codeOf(createGeminiGenerator({ client: truncated }).outline(req))).toBe("bad_generation");
    expect(await codeOf(createGeminiGenerator({ client: notJson }).outline(req))).toBe("bad_generation");
    expect(await codeOf(createGeminiGenerator({ client: wrongShape }).outline(req))).toBe("bad_generation");
  });

  it("maps API and credential errors", async () => {
    const failWith = (error: unknown) =>
      fakeClient(async () => {
        throw error;
      }).client;

    const cases = [
      [new ApiError({ message: "quota", status: 429 }), "rate_limited"],
      [new ApiError({ message: "denied", status: 403 }), "ai_not_configured"],
      [new ApiError({ message: "unavailable", status: 503 }), "ai_error"],
    ] as const;
    for (const [error, code] of cases) {
      expect(await codeOf(createGeminiGenerator({ client: failWith(error) }).outline(req))).toBe(code);
    }
    expect(await codeOf(createGeminiGenerator({ client: failWith(new Error("no key")), configured: false }).outline(req))).toBe(
      "ai_not_configured",
    );
  });
});
