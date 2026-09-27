import { useEffect, useState } from "react";
import { LANGS, type Lang } from "../../shared/types";
import type { Strings } from "../i18n";

export interface Focus {
  end: number;
  title: string;
}

interface Props {
  t: Strings;
  lang: Lang;
  onLang: (lang: Lang) => void;
  focus: Focus | null;
  onStopFocus: () => void;
}

export function Header({ t, lang, onLang, focus, onStopFocus }: Props) {
  return (
    <header className="top">
      <a className="brand" href="#/">
        <Logo />
        <div>
          <h1>Arrel</h1>
          <p>{t.tagline}</p>
        </div>
      </a>
      <div className="top-right">
        {focus && <FocusChip t={t} focus={focus} onStop={onStopFocus} />}
        <div className="lang-switch" role="group" aria-label="Language">
          {LANGS.map((code) => (
            <button key={code} type="button" aria-pressed={lang === code} onClick={() => onLang(code)}>
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function FocusChip({ t, focus, onStop }: { t: Strings; focus: Focus; onStop: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const left = Math.max(0, focus.end - now);

  useEffect(() => {
    if (left === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [left === 0]);

  if (left === 0) {
    return (
      <div className="focus-chip" role="status">
        <span>{t.focusDone}</span>
        <button className="btn btn-ghost btn-small" onClick={onStop}>
          {t.close}
        </button>
      </div>
    );
  }
  const m = String(Math.floor(left / 60000)).padStart(2, "0");
  const s = String(Math.floor(left / 1000) % 60).padStart(2, "0");
  return (
    <div className="focus-chip" role="timer">
      <span>
        {t.focus} <strong>{m}:{s}</strong> · {focus.title}
      </span>
      <button className="btn btn-ghost btn-small" onClick={onStop}>
        {t.stop}
      </button>
    </div>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--accent)" />
      <path
        d="M20 8v10M20 18l-7 7M20 18l7 7M13 25v5M27 25l-3 5M27 25l3 5"
        stroke="var(--accent-ink)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="20" cy="8" r="2.6" fill="var(--hl)" />
    </svg>
  );
}
