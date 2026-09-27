import { useEffect, useMemo, useRef, useState } from "react";
import { availableNodes, nodeStatus } from "../../shared/graph";
import type { TreeNode } from "../../shared/types";
import { ApiError, createLesson } from "../api";
import type { Strings, UiError } from "../i18n";
import { loadTree, saveTree, type StoredTree } from "../storage";
import { NodeDetail } from "./NodeDetail";
import { TreeGraph } from "./TreeGraph";

interface Props {
  treeId: string;
  t: Strings;
  onBack: () => void;
  onFocus: (title: string) => void;
}

export function TreeView({ treeId, t, onBack, onFocus }: Props) {
  const [initial] = useState(() => loadTree(treeId));
  if (!initial) {
    return (
      <main className="empty">
        <button className="linkish" onClick={onBack}>
          ← {t.back}
        </button>
      </main>
    );
  }
  return <TreeScreen initial={initial} t={t} onBack={onBack} onFocus={onFocus} />;
}

function TreeScreen({ initial, t, onBack, onFocus }: Omit<Props, "treeId"> & { initial: StoredTree }) {
  const [tree, setTree] = useState(initial);
  const [lessonErrors, setLessonErrors] = useState<Record<string, UiError>>({});
  const inFlight = useRef(new Set<string>());

  const nodes = tree.outline.nodes;
  const done = useMemo(() => new Set(tree.done), [tree.done]);
  const selected = nodes.find((n) => n.id === tree.selected) ?? nodes[0];
  const status = nodeStatus(selected, done);

  useEffect(() => saveTree(tree), [tree]);

  async function fetchLesson(nodeId: string) {
    if (inFlight.current.has(nodeId)) return;
    inFlight.current.add(nodeId);
    setLessonErrors(({ [nodeId]: _, ...rest }) => rest);
    try {
      const lesson = await createLesson({
        topic: tree.topic,
        lang: tree.lang,
        level: tree.level,
        outline: {
          title: tree.outline.title,
          nodes: nodes.map(({ id, title, goal, deps, project }) => ({ id, title, goal, deps, project })),
        },
        nodeId,
      });
      // Also written straight to storage, so a lesson isn't lost (and paid for again)
      // if the learner leaves the tree while it is being written.
      const stored = loadTree(tree.id);
      if (stored) saveTree({ ...stored, lessons: { ...stored.lessons, [nodeId]: lesson } });
      setTree((prev) => ({ ...prev, lessons: { ...prev.lessons, [nodeId]: lesson } }));
    } catch (err) {
      setLessonErrors((prev) => ({ ...prev, [nodeId]: err instanceof ApiError ? err.code : "server_error" }));
    } finally {
      inFlight.current.delete(nodeId);
    }
  }

  // Lessons are written the first time an unlocked node is opened.
  const needsLesson = status !== "locked" && !tree.lessons[selected.id] && !lessonErrors[selected.id];
  useEffect(() => {
    if (needsLesson) fetchLesson(selected.id);
  }, [needsLesson, selected.id]);

  function select(id: string) {
    setTree((prev) => ({ ...prev, selected: id }));
    if (window.matchMedia("(max-width: 860px)").matches) {
      document.querySelector(".detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function pass(nodeId: string): TreeNode[] {
    if (done.has(nodeId)) return [];
    const before = new Set(availableNodes(nodes, done).map((n) => n.id));
    const after = new Set(done).add(nodeId);
    setTree((prev) => ({ ...prev, done: [...prev.done, nodeId] }));
    return availableNodes(nodes, after).filter((n) => !before.has(n.id));
  }

  const next = availableNodes(nodes, done)[0];
  const pct = Math.round((done.size / nodes.length) * 100);
  const number = nodes.indexOf(selected) + 1;

  return (
    <main className="tree-screen">
      <div className="crumbs">
        <button className="linkish" onClick={onBack}>
          ← {t.back}
        </button>
      </div>

      <section className="today" aria-live="polite">
        {next ? (
          <>
            <div>
              <p className="eyebrow">
                {tree.outline.title} · {t.todayEyebrow}
              </p>
              <h2>{next.title}</h2>
              <p className="meta">
                {t.minutes(next.minutes)} · {next.goal}
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => select(next.id)}>
              {selected.id === next.id ? t.youAreHere : t.start}
            </button>
          </>
        ) : (
          <div>
            <p className="eyebrow">{t.treeDoneEyebrow}</p>
            <h2>{t.treeDoneTitle}</h2>
            <p className="meta">{t.treeDoneMeta}</p>
          </div>
        )}
        <div className="progress">
          <div className="bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <span>{t.progress(done.size, nodes.length, pct)}</span>
        </div>
      </section>

      <div className="layout">
        <section className="tree-wrap" aria-label={tree.outline.title}>
          <TreeGraph nodes={nodes} done={done} selected={selected.id} onSelect={select} t={t} />
          <div className="legend">
            <span>
              <i style={{ background: "var(--ok)" }} />
              {t.status.done}
            </span>
            <span>
              <i style={{ background: "var(--hl)" }} />
              {t.status.available}
            </span>
            <span>
              <i style={{ background: "var(--line)" }} />
              {t.status.locked}
            </span>
          </div>
        </section>
        <NodeDetail
          node={selected}
          number={number}
          status={status}
          lesson={tree.lessons[selected.id]}
          lessonError={lessonErrors[selected.id]}
          missing={nodes.filter((n) => selected.deps.includes(n.id) && !done.has(n.id))}
          t={t}
          onRetry={() => fetchLesson(selected.id)}
          onSelect={select}
          onPass={() => pass(selected.id)}
          onFocus={() => onFocus(selected.title)}
        />
      </div>
      <p className="note">{t.savedLocally}</p>
    </main>
  );
}
