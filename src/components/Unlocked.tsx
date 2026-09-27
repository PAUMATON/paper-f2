import type { TreeNode } from "../../shared/types";
import type { Strings } from "../i18n";

export function Unlocked({ nodes, t, onSelect }: { nodes: TreeNode[]; t: Strings; onSelect: (id: string) => void }) {
  if (!nodes.length) return null;
  return (
    <p>
      {t.unlocked}{" "}
      {nodes.map((n, i) => (
        <span key={n.id}>
          {i > 0 && ", "}
          <button className="linkish" onClick={() => onSelect(n.id)}>
            {n.title}
          </button>
        </span>
      ))}
    </p>
  );
}
