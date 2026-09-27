import { z } from "zod";
import { topologicalOrder } from "../shared/graph";
import { MAX_NODES, type Example, type Lesson, type Outline, type QuizQuestion, type TreeNode } from "../shared/types";
import { GenerationError } from "./errors";

// What the model is asked to return. Kept free of constraints the API cannot
// enforce (enums, integer ranges, item counts): those are checked below instead,
// so a near miss gets repaired rather than failing the whole request.

export const RawOutlineSchema = z.object({
  title: z.string().describe("The topic, named the way the learner would say it"),
  summary: z.string().describe("One sentence: what the learner can do after finishing the tree"),
  nodes: z.array(
    z.object({
      id: z.string().describe("n1, n2, n3… in study order"),
      title: z.string(),
      goal: z.string(),
      minutes: z.number(),
      deps: z.array(z.string()).describe("Ids of the earlier nodes this one builds on"),
      project: z.boolean(),
    }),
  ),
});
export type RawOutline = z.infer<typeof RawOutlineSchema>;

export const RawLessonSchema = z.object({
  explanation: z.array(z.string()).describe("Two to four short paragraphs"),
  example: z
    .object({
      kind: z.string().describe('"code" or "text"'),
      language: z.string().describe('Notation of a code example, such as "python" or "sql"; empty for text'),
      content: z.string(),
    })
    .nullable(),
  practice: z.string(),
  searchTerms: z.array(z.string()),
  quiz: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      answer: z.number().describe("0-based index of the correct option"),
      why: z.string(),
    }),
  ),
  checklist: z.array(z.string()),
});
export type RawLesson = z.infer<typeof RawLessonSchema>;

/** Trims, collapses whitespace and cuts overly long single-line text. */
function line(value: string, max: number): string {
  const s = value.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function lines(values: string[], max: number, limit: number): string[] {
  return values.map((v) => line(v, max)).filter(Boolean).slice(0, limit);
}

export function normalizeOutline(raw: RawOutline): Outline {
  const nodes = raw.nodes.slice(0, MAX_NODES);
  if (nodes.length < 3) throw new GenerationError("bad_generation", "too few nodes");

  const rawIds = nodes.map((n) => n.id.trim());
  if (new Set(rawIds).size !== rawIds.length) throw new GenerationError("bad_generation", "duplicate node ids");
  const known = new Set(rawIds);

  const cleaned = nodes.map((n, i) => ({
    id: rawIds[i],
    title: line(n.title, 120),
    goal: line(n.goal, 300),
    minutes: Math.min(90, Math.max(5, Math.round(n.minutes) || 20)),
    deps: [...new Set(n.deps.map((d) => d.trim()))].filter((d) => d !== rawIds[i] && known.has(d)),
    project: n.project,
  }));
  if (cleaned.some((n) => !n.title || !n.goal)) throw new GenerationError("bad_generation", "empty node text");

  const ordered = topologicalOrder(cleaned);
  if (!ordered) throw new GenerationError("bad_generation", "dependency cycle");

  // Renumber n1…nK in study order so ids always match the pattern the API accepts.
  const newId = new Map(ordered.map((n, i) => [n.id, `n${i + 1}`]));
  const result: TreeNode[] = ordered.map((n) => ({
    ...n,
    id: newId.get(n.id)!,
    deps: n.deps.map((d) => newId.get(d)!),
  }));

  return {
    title: line(raw.title, 120) || result[0].title,
    summary: line(raw.summary, 300),
    nodes: result,
  };
}

function normalizeQuestion(q: RawLesson["quiz"][number]): QuizQuestion | null {
  const options = q.options.map((o) => line(o, 200));
  const answer = Math.round(q.answer);
  const question = line(q.question, 400);
  const why = line(q.why, 400);
  const valid =
    question &&
    options.length >= 2 &&
    options.length <= 6 &&
    options.every(Boolean) &&
    new Set(options).size === options.length &&
    answer >= 0 &&
    answer < options.length;
  return valid ? { question, options, answer, why } : null;
}

export function normalizeLesson(raw: RawLesson, node: Pick<TreeNode, "project">): Lesson {
  const explanation = raw.explanation.map((p) => p.trim()).filter(Boolean).slice(0, 6).map((p) => p.slice(0, 2000));
  if (!explanation.length) throw new GenerationError("bad_generation", "empty explanation");

  let example: Example | null = null;
  if (raw.example && raw.example.content.trim()) {
    const kind = raw.example.kind.trim().toLowerCase() === "code" ? "code" : "text";
    example = {
      kind,
      language: kind === "code" ? line(raw.example.language, 30).toLowerCase() : "",
      content: raw.example.content.replace(/^\n+|\s+$/g, "").slice(0, 4000),
    };
  }

  const quiz = node.project ? [] : raw.quiz.map(normalizeQuestion).filter((q) => q !== null).slice(0, 5);
  const checklist = node.project ? lines(raw.checklist, 300, 6) : [];
  if (!node.project && quiz.length < 2) throw new GenerationError("bad_generation", "not enough valid quiz questions");
  if (node.project && checklist.length < 2) throw new GenerationError("bad_generation", "project without checklist");

  return {
    explanation,
    example,
    practice: line(raw.practice, 600),
    searchTerms: lines(raw.searchTerms, 100, 4),
    links: [],
    quiz,
    checklist,
  };
}
