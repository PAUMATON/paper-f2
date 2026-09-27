import { useEffect, useState } from "react";
import type { Lang } from "../shared/types";
import { Header, type Focus } from "./components/Header";
import { Home } from "./components/Home";
import { TreeView } from "./components/TreeView";
import { detectLang, STRINGS } from "./i18n";
import { loadLang, saveLang } from "./storage";

function treeIdFromHash(): string | null {
  const match = location.hash.match(/^#\/tree\/([\w-]+)$/);
  return match ? match[1] : null;
}

export function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang() ?? detectLang());
  const [treeId, setTreeId] = useState(treeIdFromHash);
  const [focus, setFocus] = useState<Focus | null>(null);
  const t = STRINGS[lang];

  useEffect(() => {
    const onHash = () => {
      setTreeId(treeIdFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    saveLang(lang);
  }, [lang]);

  const open = (id: string) => {
    location.hash = `/tree/${id}`;
  };

  return (
    <div className="app">
      <Header t={t} lang={lang} onLang={setLang} focus={focus} onStopFocus={() => setFocus(null)} />
      {treeId ? (
        <TreeView
          key={treeId}
          treeId={treeId}
          t={t}
          onBack={() => (location.hash = "/")}
          onFocus={(title) => setFocus({ end: Date.now() + 25 * 60 * 1000, title })}
        />
      ) : (
        <Home t={t} lang={lang} onOpen={open} />
      )}
    </div>
  );
}
