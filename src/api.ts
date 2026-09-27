import type { LessonRequest, OutlineRequest } from "../shared/schemas";
import type { Lesson, Outline } from "../shared/types";
import type { UiError } from "./i18n";

const BASE = import.meta.env.VITE_API_BASE ?? "";

export class ApiError extends Error {
  constructor(readonly code: UiError) {
    super(code);
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("network");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? "server_error");
  return data as T;
}

export async function getHealth(): Promise<{ ai: boolean; canSetKey: boolean }> {
  return request("/api/health");
}

export async function saveKey(key: string): Promise<void> {
  await request("/api/key", { key });
}

export async function createOutline(req: OutlineRequest): Promise<Outline> {
  return (await request<{ outline: Outline }>("/api/outline", req)).outline;
}

export async function createLesson(req: LessonRequest): Promise<Lesson> {
  return (await request<{ lesson: Lesson }>("/api/lesson", req)).lesson;
}
