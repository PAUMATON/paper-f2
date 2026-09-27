import { useMemo, useState, type FormEvent } from "react";
import type { QuizQuestion, TreeNode } from "../../shared/types";
import type { Strings } from "../i18n";
import { shuffledOrder } from "../lib/shuffle";
import { Unlocked } from "./Unlocked";

interface Props {
  nodeId: string;
  questions: QuizQuestion[];
  alreadyDone: boolean;
  t: Strings;
  /** Marks the node as passed and returns the nodes it unlocked. */
  onPass: () => TreeNode[];
  onSelect: (id: string) => void;
}

type Result =
  | { kind: "incomplete" }
  | { kind: "failed"; correct: number; need: number }
  | { kind: "review"; correct: number }
  | { kind: "passed"; correct: number; unlocked: TreeNode[] };

export function Quiz({ nodeId, questions, alreadyDone, t, onPass, onSelect }: Props) {
  // Options are shown in a stable shuffled order, so the right answer's position gives nothing away.
  const orders = useMemo(
    () => questions.map((q, i) => shuffledOrder(`${nodeId}:${i}:${q.question}`, q.options.length)),
    [nodeId, questions],
  );
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const need = Math.ceil((questions.length * 2) / 3);

  function check(e: FormEvent) {
    e.preventDefault();
    if (answers.includes(null)) {
      setResult({ kind: "incomplete" });
      return;
    }
    setChecked(true);
    const correct = questions.filter((q, i) => answers[i] === q.answer).length;
    if (correct < need) setResult({ kind: "failed", correct, need });
    else if (alreadyDone) setResult({ kind: "review", correct });
    else setResult({ kind: "passed", correct, unlocked: onPass() });
  }

  return (
    <section>
      <h3>{t.quizTitle(need, questions.length)}</h3>
      <form className="quiz" onSubmit={check}>
        {questions.map((q, i) => {
          const ok = answers[i] === q.answer;
          return (
            <fieldset key={i}>
              <legend>
                {i + 1}. {q.question}
              </legend>
              {orders[i].map((optionIndex) => (
                <label className="opt" key={optionIndex}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === optionIndex}
                    onChange={() => {
                      setAnswers((prev) => prev.map((a, j) => (j === i ? optionIndex : a)));
                      setChecked(false);
                    }}
                  />
                  <span>{q.options[optionIndex]}</span>
                </label>
              ))}
              {checked && (
                <div className={`fb ${ok ? "ok" : "bad"}`}>
                  <b>{ok ? t.correct : t.incorrect}</b>{" "}
                  {!ok && `${t.theAnswerIs} ${q.options[q.answer]}. `}
                  {q.why}
                </div>
              )}
            </fieldset>
          );
        })}
        <div className="actions">
          <button className="btn btn-primary" type="submit">
            {t.check}
          </button>
        </div>
      </form>
      {result && <QuizResult result={result} total={questions.length} t={t} onSelect={onSelect} />}
    </section>
  );
}

function QuizResult({ result, total, t, onSelect }: { result: Result; total: number; t: Strings; onSelect: (id: string) => void }) {
  switch (result.kind) {
    case "incomplete":
      return <div className="result bad">{t.answerAll(total)}</div>;
    case "failed":
      return <div className="result bad">{t.failed(result.correct, total, result.need)}</div>;
    case "review":
      return <div className="result ok">{t.alreadyPassed(result.correct, total)}</div>;
    case "passed":
      return (
        <div className="result ok" role="status">
          <p>
            <b>{t.passed}</b> {t.score(result.correct, total)}
          </p>
          <Unlocked nodes={result.unlocked} t={t} onSelect={onSelect} />
        </div>
      );
  }
}
