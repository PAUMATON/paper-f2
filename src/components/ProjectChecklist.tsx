import { useState } from "react";
import type { TreeNode } from "../../shared/types";
import type { Strings } from "../i18n";
import { Unlocked } from "./Unlocked";

interface Props {
  items: string[];
  alreadyDone: boolean;
  t: Strings;
  onPass: () => TreeNode[];
  onSelect: (id: string) => void;
}

export function ProjectChecklist({ items, alreadyDone, t, onPass, onSelect }: Props) {
  const [ticked, setTicked] = useState<boolean[]>(() => items.map(() => alreadyDone));
  const [unlocked, setUnlocked] = useState<TreeNode[] | null>(null);
  const allTicked = ticked.every(Boolean);

  return (
    <section>
      <h3>{t.projectReqs}</h3>
      {items.map((item, i) => (
        <label className="check" key={i}>
          <input
            type="checkbox"
            checked={ticked[i]}
            disabled={alreadyDone}
            onChange={() => setTicked((prev) => prev.map((v, j) => (j === i ? !v : v)))}
          />
          <span>{item}</span>
        </label>
      ))}
      <div className="actions">
        <button className="btn btn-primary" disabled={alreadyDone || !allTicked} onClick={() => setUnlocked(onPass())}>
          {alreadyDone ? t.projectDone : t.markProject}
        </button>
      </div>
      {unlocked && (
        <div className="result ok" role="status">
          <p>
            <b>{t.passed}</b> {t.projectDelivered}
          </p>
          <Unlocked nodes={unlocked} t={t} onSelect={onSelect} />
        </div>
      )}
    </section>
  );
}
