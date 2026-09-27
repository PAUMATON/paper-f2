import { useEffect, useState, type FormEvent } from "react";
import { LEVELS, type Lang, type Level } from "../../shared/types";
import { ApiError, createOutline, getHealth } from "../api";
import { createDemoTree, DEMO_ID } from "../demo/pythonCa";
import type { Strings, UiError } from "../i18n";
import { deleteTree, listTrees, loadTree, saveTree, type StoredTree } from "../storage";

interface Props {
  t: Strings;
  lang: Lang;
  onOpen: (id: string) => void;
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function Home({ t, lang, onOpen }: Props) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<UiError | null>(null);
  const [ai, setAi] = useState<boolean | null>(null);
  const [trees, setTrees] = useState(listTrees);

  useEffect(() => {
    getHealth().then(
      (h) => setAi(h.ai),
      () => setAi(null),
    );
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    const clean = topic.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError(null);
    try {
      const outline = await createOutline({ topic: clean, lang, level });
      const tree: StoredTree = {
        id: newId(),
        topic: clean,
        lang,
        level,
        createdAt: Date.now(),
        outline,
        lessons: {},
        done: [],
        selected: outline.nodes[0].id,
      };
      saveTree(tree);
      onOpen(tree.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "server_error");
      setBusy(false);
    }
  }

  function openDemo() {
    if (!loadTree(DEMO_ID)) saveTree(createDemoTree());
    onOpen(DEMO_ID);
  }

  function remove(id: string) {
    deleteTree(id);
    setTrees(listTrees());
  }

  const hasDemo = trees.some((tree) => tree.id === DEMO_ID);

  return (
    <main className="home">
      <section className="hero">
        {busy ? (
          <Growing t={t} topic={topic.trim()} />
        ) : (
          <form onSubmit={create} className="hero-form">
            <label htmlFor="topic" className="hero-title">
              {t.heroTitle}
            </label>
            <div className="hero-row">
              <input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t.heroPlaceholder}
                maxLength={200}
                autoComplete="off"
                autoFocus
              />
              <button className="btn btn-primary btn-big" type="submit" disabled={!topic.trim()}>
                {t.create}
              </button>
            </div>
            <fieldset className="levels">
              <legend>{t.levelLabel}</legend>
              {LEVELS.map((l) => (
                <label key={l} className={level === l ? "on" : ""}>
                  <input type="radio" name="level" value={l} checked={level === l} onChange={() => setLevel(l)} />
                  {t.levels[l]}
                </label>
              ))}
            </fieldset>
            {error && (
              <p className="alert bad" role="alert">
                {t.errors[error]}
              </p>
            )}
            {ai === false && !error && <p className="alert">{t.aiOff}</p>}
          </form>
        )}
      </section>

      <section className="library">
        <h2>{t.myTrees}</h2>
        {trees.length === 0 && <p className="note">{t.noTrees}</p>}
        <div className="cards">
          {trees.map((tree) => (
            <TreeCard key={tree.id} tree={tree} t={t} onOpen={() => onOpen(tree.id)} onDelete={() => remove(tree.id)} />
          ))}
          {!hasDemo && (
            <button className="card card-demo" onClick={openDemo}>
              <span className="card-title">{t.demoTitle}</span>
              <span className="card-meta">{t.demoMeta}</span>
              <span className="card-cta">{t.openDemo} →</span>
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function TreeCard({ tree, t, onOpen, onDelete }: { tree: StoredTree; t: Strings; onOpen: () => void; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const total = tree.outline.nodes.length;
  const pct = Math.round((tree.done.length / total) * 100);
  return (
    <div className="card">
      <button className="card-main" onClick={onOpen}>
        <span className="card-title">{tree.outline.title}</span>
        <span className="card-meta">{t.progress(tree.done.length, total, pct)}</span>
        <span className="bar">
          <span style={{ width: `${pct}%` }} />
        </span>
      </button>
      <div className="card-actions">
        {confirming ? (
          <>
            <span>{t.confirmDelete}</span>
            <button className="btn btn-ghost btn-small" onClick={onDelete}>
              {t.yesDelete}
            </button>
            <button className="btn btn-ghost btn-small" onClick={() => setConfirming(false)}>
              {t.cancel}
            </button>
          </>
        ) : (
          <button className="linkish" onClick={() => setConfirming(true)}>
            {t.delete}
          </button>
        )}
      </div>
    </div>
  );
}

function Growing({ t, topic }: { t: Strings; topic: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, t.growing.length - 1)), 4000);
    return () => clearInterval(timer);
  }, [t]);
  return (
    <div className="growing" role="status" aria-live="polite">
      <svg viewBox="0 0 120 120" aria-hidden="true" className="sprout">
        <path className="stem" d="M60 110 V52" />
        <path className="branch b1" d="M60 80 C48 74 40 66 34 56" />
        <path className="branch b2" d="M60 68 C72 62 80 54 86 44" />
        <path className="branch b3" d="M60 56 C54 48 52 40 52 30" />
        <circle className="leaf l1" cx="34" cy="56" r="6" />
        <circle className="leaf l2" cx="86" cy="44" r="6" />
        <circle className="leaf l3" cx="52" cy="30" r="6" />
        <circle className="leaf l4" cx="60" cy="50" r="7" />
      </svg>
      <p className="eyebrow">{topic}</p>
      <p className="growing-msg">{t.growing[step]}</p>
    </div>
  );
}
