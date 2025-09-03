"use client";

import { useState } from "react";
import type { Quiz } from "@/types/quiz";

export default function Home() {
  const [topic, setTopic] = useState("System Design");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateQuiz() {
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    setError(null);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate quiz");
      setQuiz(data);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qIdx: number, optIdx: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  }

  function submit() {
    if (!quiz) return;
    setSubmitted(true);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  const score = (() => {
    if (!quiz || !submitted) return 0;
    return quiz.questions.reduce((acc, q, i) => {
      const picked = answers[i];
      return acc + (picked === q.answerIndex ? 1 : 0);
    }, 0);
  })();

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">AI Quiz MVP</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Enter a topic (e.g., Photosynthesis)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={generateQuiz}
          disabled={loading || !topic.trim()}
          className="border rounded px-4 py-2"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 border rounded text-red-700">
          Error: {error}
        </div>
      )}

      {!quiz && !loading && <p>Enter a topic and click Generate.</p>}

      {quiz && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            Topic: <span className="font-normal">{quiz.topic}</span>
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="space-y-6"
          >
            {quiz.questions.map((q, i) => (
              <fieldset key={i} className="border rounded p-4">
                <legend className="font-medium">{i + 1}. {q.question}</legend>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, j) => (
                    <label key={j} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={answers[i] === j}
                        onChange={() => selectAnswer(i, j)}
                        disabled={submitted}
                      />
                      <span>
                        {String.fromCharCode(65 + j)}. {opt}
                      </span>
                    </label>
                  ))}
                </div>

                {submitted && (
                  <div className="mt-3">
                    <div>
                      Correct answer: <b>{String.fromCharCode(65 + q.answerIndex)}</b>
                    </div>
                    {answers[i] !== undefined && (
                      <div>
                        Your answer:{" "}
                        <b>{String.fromCharCode(65 + answers[i])}</b>{" "}
                        {answers[i] === q.answerIndex ? "✅" : "❌"}
                      </div>
                    )}
                  </div>
                )}
              </fieldset>
            ))}

            {!submitted ? (
              <button
                type="submit"
                className="border rounded px-4 py-2"
                disabled={Object.keys(answers).length < quiz.questions.length}
              >
                Submit
              </button>
            ) : (
              <div className="space-y-3">
                <div className="text-lg">
                  Score: <b>{score}</b> / {quiz.questions.length}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="border rounded px-4 py-2" onClick={reset}>
                    Try Again
                  </button>
                  <button type="button" className="border rounded px-4 py-2" onClick={generateQuiz}>
                    New Quiz
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
