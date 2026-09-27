import type { ErrorCode } from "../shared/types";

export class GenerationError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

export const STATUS_BY_CODE: Record<ErrorCode, number> = {
  bad_request: 400,
  refused: 422,
  rate_limited: 429,
  server_error: 500,
  bad_generation: 502,
  ai_error: 502,
  ai_not_configured: 503,
};
