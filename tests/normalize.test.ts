import { describe, expect, it } from "vitest";
import { GenerationError } from "../server/errors";
import { normalizeLesson, normalizeOutline, type RawLesson, type RawOutline } from "../server/normalize";

function rawOutline(nodes: RawOutline["nodes"]): RawOutline {
  return { title: "  Excel  ", summary: "Fer fulls de càlcul útils.", nodes };
}

const node = (id: string, deps: string[] = [], extra: Partial<RawOutline["nodes"][number]> = {}) => ({
  id,
  title: `Títol ${id}`,
  goal: `Aprendre ${id}.`,
  minutes: 20,
  deps,
  project: false,
  ...extra,
});

function expectBadGeneration(fn: () => unknown) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(GenerationError);
    expect((error as GenerationError).code).toBe("bad_generation");
    return;
  }
  throw new Error("expected a GenerationError");
}

describe("normalizeOutline", () => {
  it("renumbers ids in study order and remaps the dependencies", () => {
    const outline = normalizeOutline(
      rawOutline([node("fitxers", ["basics"]), node("basics"), node("final", ["fitxers", "basics"], { project: true })]),
    );
    expect(outline.title).toBe("Excel");
    expect(outline.nodes.map((n) => [n.id, n.title, n.deps])).toEqual([
      ["n1", "Títol basics", []],
      ["n2", "Títol fitxers", ["n1"]],
      ["n3", "Títol final", ["n2", "n1"]],
    ]);
    expect(outline.nodes[2].project).toBe(true);
  });

  it("drops unknown, duplicated and self dependencies, and clamps minutes", () => {
    const outline = normalizeOutline(
      rawOutline([node("n1", [], { minutes: 500 }), node("n2", ["n1", "n1", "n9", "n2"], { minutes: 0.4 }), node("n3", ["n2"])]),
    );
    expect(outline.nodes[1].deps).toEqual(["n1"]);
    expect(outline.nodes[0].minutes).toBe(90);
    expect(outline.nodes[1].minutes).toBe(20);
  });

  it("rejects cycles, duplicated ids and trees that are too small", () => {
    expectBadGeneration(() => normalizeOutline(rawOutline([node("n1", ["n3"]), node("n2", ["n1"]), node("n3", ["n2"])])));
    expectBadGeneration(() => normalizeOutline(rawOutline([node("n1"), node("n1"), node("n2")])));
    expectBadGeneration(() => normalizeOutline(rawOutline([node("n1"), node("n2", ["n1"])])));
  });

  it("keeps at most 15 nodes", () => {
    const many = Array.from({ length: 20 }, (_, i) => node(`n${i + 1}`, i ? [`n${i}`] : []));
    expect(normalizeOutline(rawOutline(many)).nodes).toHaveLength(15);
  });
});

const question = (answer: number, options = ["A", "B", "C", "D"]) => ({
  question: "Quina és la correcta?",
  options,
  answer,
  why: "Perquè sí.",
});

function rawLesson(extra: Partial<RawLesson> = {}): RawLesson {
  return {
    explanation: ["Primer paràgraf.", "  ", "Segon paràgraf."],
    example: { kind: "Code", language: "Python", content: "\nprint('hola')\n\n" },
    practice: "Fes-ho tu.",
    searchTerms: ["python print", ""],
    quiz: [question(1), question(3), question(0)],
    checklist: ["no hauria de sortir"],
    ...extra,
  };
}

describe("normalizeLesson", () => {
  it("cleans the lesson of a normal node", () => {
    const lesson = normalizeLesson(rawLesson(), { project: false });
    expect(lesson.explanation).toEqual(["Primer paràgraf.", "Segon paràgraf."]);
    expect(lesson.example).toEqual({ kind: "code", language: "python", content: "print('hola')" });
    expect(lesson.searchTerms).toEqual(["python print"]);
    expect(lesson.links).toEqual([]);
    expect(lesson.quiz).toHaveLength(3);
    expect(lesson.checklist).toEqual([]);
  });

  it("drops invalid questions and fails when fewer than two remain", () => {
    const lesson = normalizeLesson(rawLesson({ quiz: [question(1), question(7), question(2), question(0, ["A", "A"])] }), {
      project: false,
    });
    expect(lesson.quiz.map((q) => q.answer)).toEqual([1, 2]);
    expectBadGeneration(() => normalizeLesson(rawLesson({ quiz: [question(1), question(-1)] }), { project: false }));
  });

  it("uses the checklist instead of the quiz for a project", () => {
    const lesson = normalizeLesson(rawLesson({ checklist: ["Funciona", "Té una funció", " "] }), { project: true });
    expect(lesson.quiz).toEqual([]);
    expect(lesson.checklist).toEqual(["Funciona", "Té una funció"]);
    expectBadGeneration(() => normalizeLesson(rawLesson({ checklist: ["Només un"] }), { project: true }));
  });

  it("treats anything but code as a text example and drops empty ones", () => {
    const text = normalizeLesson(rawLesson({ example: { kind: "prose", language: "x", content: "Un cas." } }), { project: false });
    expect(text.example).toEqual({ kind: "text", language: "", content: "Un cas." });
    const empty = normalizeLesson(rawLesson({ example: { kind: "code", language: "sql", content: "  " } }), { project: false });
    expect(empty.example).toBeNull();
  });
});
