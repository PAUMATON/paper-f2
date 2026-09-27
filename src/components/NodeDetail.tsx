import type { NodeStatus } from "../../shared/graph";
import type { Lesson, TreeNode } from "../../shared/types";
import type { Strings, UiError } from "../i18n";
import { ProjectChecklist } from "./ProjectChecklist";
import { Quiz } from "./Quiz";

interface Props {
  node: TreeNode;
  number: number;
  status: NodeStatus;
  lesson: Lesson | undefined;
  /** Undefined while there is nothing to report. */
  lessonError: UiError | undefined;
  missing: TreeNode[];
  t: Strings;
  onRetry: () => void;
  onSelect: (id: string) => void;
  onPass: () => TreeNode[];
  onFocus: () => void;
}

const searchUrl = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

export function NodeDetail(props: Props) {
  const { node, number, status, t } = props;
  return (
    <aside className="detail" aria-live="polite">
      <div>
        <div className="head-meta">
          <span>
            {t.node} {number}
            {node.project ? ` · ${t.project.toLowerCase()}` : ""}
          </span>
          <span>·</span>
          <span>{t.minutes(node.minutes)}</span>
          <span className={`chip ${status}`}>{t.status[status]}</span>
        </div>
        <h2>{node.title}</h2>
      </div>
      <section>
        <h3>{t.goal}</h3>
        <p>{node.goal}</p>
      </section>
      <DetailBody {...props} />
    </aside>
  );
}

function DetailBody({ node, status, lesson, lessonError, missing, t, onRetry, onSelect, onPass, onFocus }: Props) {
  if (status === "locked") {
    return (
      <div className="lockbox">
        <p>
          <b>{t.lockedTitle}</b> {t.lockedBody}
        </p>
        <div className="actions">
          {missing.map((m) => (
            <button key={m.id} className="btn btn-ghost btn-small" onClick={() => onSelect(m.id)}>
              {m.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!lesson) {
    if (lessonError) {
      return (
        <div className="result bad" role="alert">
          <p>{t.errors[lessonError]}</p>
          <div className="actions">
            <button className="btn btn-ghost btn-small" onClick={onRetry}>
              {t.retry}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="writing" role="status">
        <span className="spinner" aria-hidden="true" />
        {t.writingLesson}
      </div>
    );
  }

  const hasLinks = lesson.links.length > 0 || lesson.searchTerms.length > 0;
  return (
    <>
      <section>
        <h3>{t.explanation}</h3>
        {lesson.explanation.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>
      {lesson.example && (
        <section>
          <h3>{t.example}</h3>
          {lesson.example.kind === "code" ? (
            <pre>
              <code>{lesson.example.content}</code>
            </pre>
          ) : (
            <p className="worked">{lesson.example.content}</p>
          )}
        </section>
      )}
      {hasLinks && (
        <section>
          <h3>{t.learnMore}</h3>
          <ul className="resources">
            {lesson.links.map((l) => (
              <li key={l.url + l.label}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
            {lesson.searchTerms.map((q) => (
              <li key={q}>
                <a href={searchUrl(q)} target="_blank" rel="noopener noreferrer">
                  🔎 {q}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {lesson.practice && (
        <section>
          <h3>{t.practice}</h3>
          <p className="practice">{lesson.practice}</p>
        </section>
      )}
      <div className="actions">
        <button className="btn btn-ghost" onClick={onFocus}>
          {t.focusStart}
        </button>
      </div>
      {node.project ? (
        <ProjectChecklist
          key={node.id}
          items={lesson.checklist}
          alreadyDone={status === "done"}
          t={t}
          onPass={onPass}
          onSelect={onSelect}
        />
      ) : (
        <Quiz
          key={node.id}
          nodeId={node.id}
          questions={lesson.quiz}
          alreadyDone={status === "done"}
          t={t}
          onPass={onPass}
          onSelect={onSelect}
        />
      )}
    </>
  );
}
