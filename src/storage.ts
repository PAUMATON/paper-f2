import type { Lang, Lesson, Level, Outline } from "../shared/types";

export interface StoredTree {
  id: string;
  topic: string;
  lang: Lang;
  level: Level;
  createdAt: number;
  outline: Outline;
  /** Lessons already written, by node id. */
  lessons: Record<string, Lesson>;
  done: string[];
  selected: string;
  demo?: boolean;
}

const PREFIX = "arrel:v1:";
const INDEX_KEY = PREFIX + "trees";
const LANG_KEY = PREFIX + "lang";
const treeKey = (id: string) => PREFIX + "tree:" + id;

// Storage can be missing or full (private windows, blocked site data): the app
// keeps working in memory and only loses what it couldn't save.
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignored: see above.
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignored: see above.
  }
}

function treeIds(): string[] {
  return read<string[]>(INDEX_KEY) ?? [];
}

export function listTrees(): StoredTree[] {
  return treeIds()
    .map((id) => read<StoredTree>(treeKey(id)))
    .filter((t): t is StoredTree => t !== null);
}

export function loadTree(id: string): StoredTree | null {
  return read<StoredTree>(treeKey(id));
}

export function saveTree(tree: StoredTree): void {
  write(treeKey(tree.id), tree);
  const ids = treeIds();
  if (!ids.includes(tree.id)) write(INDEX_KEY, [tree.id, ...ids]);
}

export function deleteTree(id: string): void {
  remove(treeKey(id));
  write(INDEX_KEY, treeIds().filter((x) => x !== id));
}

export function loadLang(): Lang | null {
  return read<Lang>(LANG_KEY);
}

export function saveLang(lang: Lang): void {
  write(LANG_KEY, lang);
}
