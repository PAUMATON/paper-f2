import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { GenerationError } from "./errors";
import { createGenerator, type Generator } from "./generator";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface ClaudeOptions {
  client?: Anthropic;
  model?: string;
  effort?: Effort;
  /** Whether credentials were found in the environment; only used to explain failures. */
  configured?: boolean;
}

export function createClaudeGenerator(options: ClaudeOptions = {}): Generator {
  const client = options.client ?? new Anthropic();
  const model = options.model ?? "claude-opus-5";
  const effort = options.effort ?? "medium";
  const configured = options.configured ?? true;

  async function generate<T>(schema: z.ZodType<T>, system: string, content: string): Promise<T> {
    const format = betaZodOutputFormat(schema);
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await client.beta.messages.create({
        model,
        max_tokens: 16000,
        // If a safety classifier declines, the API retries on a suitable model instead of refusing.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort, format },
        system,
        messages: [{ role: "user", content }],
      });
    } catch (error) {
      throw toGenerationError(error, configured);
    }

    if (response.stop_reason === "refusal") throw new GenerationError("refused");
    if (response.stop_reason === "max_tokens") throw new GenerationError("bad_generation", "output truncated");
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    try {
      return format.parse(text);
    } catch {
      throw new GenerationError("bad_generation", "output did not match the schema");
    }
  }

  return createGenerator(generate);
}

function toGenerationError(error: unknown, configured: boolean): GenerationError {
  if (error instanceof Anthropic.AuthenticationError) return new GenerationError("ai_not_configured", "invalid API key");
  if (error instanceof Anthropic.RateLimitError) return new GenerationError("rate_limited");
  if (error instanceof Anthropic.APIError) return new GenerationError("ai_error", error.message);
  // Without credentials the SDK fails before sending anything.
  if (!configured) return new GenerationError("ai_not_configured");
  return new GenerationError("ai_error", error instanceof Error ? error.message : String(error));
}
