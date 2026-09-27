import { z } from "zod";
import { LANGS, LEVELS, MAX_NODES, NODE_ID } from "./types";

// Request bodies the API accepts. Kept apart from types.ts so the web app
// doesn't bundle zod just for the types.

const text = (max: number) => z.string().trim().min(1).max(max);

export const OutlineRequestSchema = z.object({
  topic: text(200),
  lang: z.enum(LANGS),
  level: z.enum(LEVELS),
});
export type OutlineRequest = z.infer<typeof OutlineRequestSchema>;

export const LessonRequestSchema = z.object({
  topic: text(200),
  lang: z.enum(LANGS),
  level: z.enum(LEVELS),
  outline: z.object({
    title: text(200),
    nodes: z
      .array(
        z.object({
          id: z.string().regex(NODE_ID),
          title: text(200),
          goal: text(400),
          deps: z.array(z.string().regex(NODE_ID)).max(MAX_NODES),
          project: z.boolean(),
        }),
      )
      .min(1)
      .max(MAX_NODES),
  }),
  nodeId: z.string().regex(NODE_ID),
});
export type LessonRequest = z.infer<typeof LessonRequestSchema>;
