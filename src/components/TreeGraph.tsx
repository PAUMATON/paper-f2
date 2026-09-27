import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { levels, nodeStatus } from "../../shared/graph";
import type { TreeNode } from "../../shared/types";
import type { Strings } from "../i18n";

interface Props {
  nodes: TreeNode[];
  done: ReadonlySet<string>;
  selected: string;
  onSelect: (id: string) => void;
  t: Strings;
}

interface Edge {
  key: string;
  d: string;
  on: boolean;
}

export function TreeGraph({ nodes, done, selected, onSelect, t }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [edges, setEdges] = useState<Edge[]>([]);

  const rows = useMemo(() => {
    const depth = levels(nodes);
    const result: TreeNode[][] = [];
    for (const n of nodes) (result[depth.get(n.id) ?? 0] ??= []).push(n);
    return result.filter(Boolean);
  }, [nodes]);
  const number = useMemo(() => new Map(nodes.map((n, i) => [n.id, i + 1])), [nodes]);

  const draw = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const rectOf = (id: string) => el.querySelector(`[data-id="${id}"]`)?.getBoundingClientRect();
    const next: Edge[] = [];
    for (const n of nodes) {
      const b = rectOf(n.id);
      if (!b) continue;
      for (const dep of n.deps) {
        const a = rectOf(dep);
        if (!a) continue;
        const x1 = a.left + a.width / 2 - box.left;
        const y1 = a.bottom - box.top;
        const x2 = b.left + b.width / 2 - box.left;
        const y2 = b.top - box.top;
        const my = (y1 + y2) / 2;
        next.push({ key: `${dep}-${n.id}`, d: `M${x1} ${y1} C${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`, on: done.has(dep) });
      }
    }
    setSize({ w: box.width, h: box.height });
    setEdges(next);
  }, [nodes, done]);

  useLayoutEffect(draw, [draw]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(el);
    document.fonts?.ready.then(() => draw());
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div className="tree" ref={ref}>
      <svg className="edges" width={size.w} height={size.h} aria-hidden="true">
        {edges.map((e) => (
          <path key={e.key} d={e.d} className={e.on ? "on" : ""} />
        ))}
      </svg>
      {rows.map((row, i) => (
        <div className="row" key={i}>
          {row.map((n) => {
            const st = nodeStatus(n, done);
            const badge = st === "done" ? "✓" : st === "locked" ? <LockIcon /> : n.project ? "★" : number.get(n.id);
            return (
              <button
                key={n.id}
                data-id={n.id}
                className={`node ${st}${n.project ? " project" : ""}${selected === n.id ? " selected" : ""}`}
                aria-label={`${n.title}, ${t.status[st]}`}
                aria-pressed={selected === n.id}
                onClick={() => onSelect(n.id)}
              >
                <span className="badge">{badge}</span>
                <span className="t">{n.title}</span>
                <span className="m">
                  {n.project ? `${t.project} · ` : ""}
                  {t.minutes(n.minutes)}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
