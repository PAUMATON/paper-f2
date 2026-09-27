import type { z } from "zod";
import type { LessonRequest, OutlineRequest } from "../shared/schemas";
import type { Lesson, Outline } from "../shared/types";
import { GenerationError } from "./errors";
import { normalizeLesson, normalizeOutline, RawLessonSchema, RawOutlineSchema } from "./normalize";
import { LESSON_SYSTEM, lessonMessage, OUTLINE_SYSTEM, outlineMessage } from "./prompts";

export interface Generator {
  outline(req: OutlineRequest): Promise<Outline>;
  lesson(req: LessonRequest): Promise<Lesson>;
}

/** One call to a model that must answer with JSON matching `schema`. */
export type GenerateJson = <T>(schema: z.ZodType<T>, system: string, content: string) => Promise<T>;

/** Builds the tree and lesson generator on top of any provider's JSON call. */
export function createGenerator(generate: GenerateJson): Generator {
  return {
    async outline(req) {
      const raw = await generate(RawOutlineSchema, OUTLINE_SYSTEM, outlineMessage(req));
      return normalizeOutline(raw);
    },
    async lesson(req) {
      const node = req.outline.nodes.find((n) => n.id === req.nodeId);
      if (!node) throw new GenerationError("bad_request", "unknown node");
      const raw = await generate(RawLessonSchema, LESSON_SYSTEM, lessonMessage(req));
      return normalizeLesson(raw, node);
    },
  };
}
