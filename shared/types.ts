export const LANGS = ["ca", "es", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const MAX_NODES = 15;
export const NODE_ID = /^n\d{1,2}$/;

export interface TreeNode {
  id: string;
  title: string;
  goal: string;
  minutes: number;
  deps: string[];
  project: boolean;
}

export interface Outline {
  title: string;
  summary: string;
  nodes: TreeNode[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Example {
  kind: "code" | "text";
  language: string;
  content: string;
}

export interface Link {
  label: string;
  url: string;
}

export interface Lesson {
  explanation: string[];
  example: Example | null;
  practice: string;
  searchTerms: string[];
  /** Curated links. Only hand-written trees have them: the AI never writes URLs. */
  links: Link[];
  quiz: QuizQuestion[];
  checklist: string[];
}

export type ErrorCode =
  | "bad_request"
  | "ai_not_configured"
  | "refused"
  | "rate_limited"
  | "bad_generation"
  | "ai_error"
  | "server_error";
