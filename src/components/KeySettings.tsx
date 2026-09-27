import { useState, type FormEvent } from "react";
import { ApiError, saveKey } from "../api";
import type { Strings } from "../i18n";

interface Props {
  t: Strings;
  connected: boolean;
  onSaved: () => void;
}

export function KeySettings({ t, connected, onSaved }: Props) {
  const [open, setOpen] = useState(!connected);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await saveKey(key.trim());
      setKey("");
      setOpen(false);
      setMessage({ ok: true, text: t.keySaved });
      onSaved();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "server_error";
      setMessage({ ok: false, text: code === "bad_request" ? t.keyInvalid : t.errors[code] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="keybox">
      <div className="keybox-head">
        <h2>{t.keyTitle}</h2>
        {connected && !open && (
          <span>
            {t.keyConnected}{" "}
            <button className="linkish" onClick={() => setOpen(true)}>
              {t.keyChange}
            </button>
          </span>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="keybox-form">
          {!connected && <p>{t.keyMissing}</p>}
          <div className="hero-row">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t.keyPlaceholder}
              autoComplete="off"
              spellCheck={false}
              aria-label={t.keyTitle}
            />
            <button className="btn btn-primary" type="submit" disabled={!key.trim() || busy}>
              {t.keySave}
            </button>
          </div>
          <p className="note">
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              {t.keyGet}
            </a>{" "}
            · {t.keyNote}
          </p>
        </form>
      )}
      {message && <p className={`alert${message.ok ? "" : " bad"}`}>{message.text}</p>}
    </section>
  );
}
