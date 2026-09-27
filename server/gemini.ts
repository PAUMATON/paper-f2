import { ApiError, FinishReason, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { GenerationError } from "./errors";
import { createGenerator, type Generator } from "./generator";

export interface GeminiOptions {
  client?: GoogleGenAI;
  apiKey?: string;
  model?: string;
  /** Whether a key was found in the environment; only used to explain failures. */
  configured?: boolean;
}

const BLOCKED = new Set<FinishReason | undefined>([
  FinishReason.SAFETY,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.BLOCKLIST,
  FinishReason.SPII,
  FinishReason.RECITATION,
]);

/** JSON schema in the shape Gemini's structured output accepts: inlined, without `$schema`. */
function toGeminiSchema(schema: z.ZodType): unknown {
  const { $schema: _, ...json } = z.toJSONSchema(schema, { reused: "inline" }) as Record<string, unknown>;
  return json;
}

export function createGeminiGenerator(options: GeminiOptions = {}): Generator {
  const model = options.model ?? "gemini-flash-latest";
  const configured = options.configured ?? true;
  let client = options.client;

  async function generate<T>(schema: z.ZodType<T>, system: string, content: string): Promise<T> {
    let response;
    try {
      client ??= new GoogleGenAI({ apiKey: options.apiKey });
      response = await client.models.generateContent({
        model,
        contents: content,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema: toGeminiSchema(schema),
        },
      });
    } catch (error) {
      throw toGenerationError(error, configured);
    }

    const finish = response.candidates?.[0]?.finishReason;
    if (response.promptFeedback?.blockReason || BLOCKED.has(finish)) throw new GenerationError("refused");
    if (finish === FinishReason.MAX_TOKENS) throw new GenerationError("bad_generation", "output truncated");

    let data: unknown;
    try {
      data = JSON.parse(response.text ?? "");
    } catch {
      throw new GenerationError("bad_generation", "output was not JSON");
    }
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new GenerationError("bad_generation", "output did not match the schema");
    return parsed.data;
  }

  return createGenerator(generate);
}

function toGenerationError(error: unknown, configured: boolean): GenerationError {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return new GenerationError("ai_not_configured", error.message);
    if (error.status === 429) return new GenerationError("rate_limited");
    return new GenerationError("ai_error", error.message);
  }
  // Without a key the SDK fails before sending anything.
  if (!configured) return new GenerationError("ai_not_configured");
  return new GenerationError("ai_error", error instanceof Error ? error.message : String(error));
}
