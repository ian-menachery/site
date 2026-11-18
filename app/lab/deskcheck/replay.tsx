"use client";

import { useState } from "react";
import { BARS, byRun, summarize, type Row, type Summary } from "@/lib/deskcheck";

type Step = { role: string; name?: string | null; content: unknown; thinking?: string };
type AgentRun = { grade: Row; fail: string[]; status: string; steps: Step[] };
export type Trace = {
  id: string;
  set: "test" | "gate3";
  cat: string;
  why: string;
  requester: string;
  message: string;
  expected: string[];
  agents: Record<string, AgentRun>;
};
export type Results = {
  runs: Record<string, { label: string; set: "test" | "gate3"; model: string | null; reps: number }>;
  rows: Row[];
  spendUsd: number;
};

const SETS = {
  test: { label: "Clean test set (90 cases)", gate: "Gate 2", bars: BARS.map((b) => b.id) },
  gate3: {
    label: "Blind, messier set (60 cases)",
    gate: "Gate 3",
    bars: ["beats_baseline", "wrong_action", "invented_policy", "escalation_recall", "false_escalation"],
  },
} as const;

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const frac = (r: { k: number; n: number }) => `${r.k}/${r.n}`;

function verdict(m: Summary, router: Summary, ids: readonly string[]) {
  const missed = BARS.filter((b) => ids.includes(b.id) && !b.pass(m, router)).map((b) => b.label);
  return missed.length ? `FAIL: ${missed.join("; ")}` : "PASS";
}

function ResultsTable({ results, set }: { results: Results; set: "test" | "gate3" }) {
  const rows = byRun(results.rows);
  const runs = Object.entries(results.runs).filter(([, r]) => r.set === set);
  const routerRun = runs.find(([, r]) => !r.model)?.[0];
  const router = routerRun ? summarize(rows[routerRun]) : null;
  return (
    <table>
      <thead>
        <tr>
          <th>Agent</th>
          <th>Task success</th>
          <th>Wrong actions</th>
          <th>Must-escalate recall</th>
          <th>False escalation</th>
          <th>Invented policy</th>
          <th>p95 latency</th>
          <th>Cost / query</th>
          <th>{SETS[set].gate}</th>
        </tr>
      </thead>
      <tbody>
        {runs.map(([run, meta]) => {
          const m = summarize(rows[run]);
          const v = meta.model && router ? verdict(m, router, SETS[set].bars) : "baseline";
          return (
            <tr key={run}>
              <td>
                {meta.label}
                {meta.reps > 1 ? ` (${meta.reps} reps)` : ""}
              </td>
              <td>
                {frac(m.taskSuccess)} = {pct(m.taskSuccess.rate)}
              </td>
              <td style={m.wrongAction.k ? { background: "var(--fail-bg)" } : undefined}>{m.wrongAction.k}</td>
              <td>{frac(m.escalationRecall)}</td>
              <td>{frac(m.falseEscalation)}</td>
              <td>{m.inventedPolicy.k}</td>
              <td>{m.latencyP95 < 1 ? "<1 s" : `${m.latencyP95.toFixed(1)} s`}</td>
              <td>${m.costMean.toFixed(4)}</td>
              <td style={{ background: v === "PASS" ? "var(--ready-bg)" : v === "baseline" ? undefined : "var(--warn-bg)" }}>
                {v}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function short(step: Step): string {
  const c = step.content as Record<string, unknown>;
  if (step.role === "tool_call") {
    const args = Object.entries(c)
      .filter(([k]) => k !== "justification" && k !== "summary" && k !== "message")
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(", ");
    return `${step.name}(${args})`;
  }
  if (step.role === "tool_result") {
    if (c.ok === false) return `rejected: ${c.error}`;
    if (Array.isArray(c.matches))
      return c.matches.length
        ? (c.matches as { id: string; name: string; title: string; status: string }[])
            .map((m) => `${m.id} ${m.name} (${m.title}, ${m.status})`)
            .join("; ")
        : "no match";
    if (c.title) return `${c.id}: ${c.title}`;
    if (c.sent) return "reply sent";
    return Object.entries(c)
      .filter(([k]) => k !== "ok")
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("; ");
  }
  return String(step.content);
}

function Replay({ trace }: { trace: Trace }) {
  const agents = Object.keys(trace.agents);
  const [agent, setAgent] = useState(agents[agents.length - 1]);
  const [shown, setShown] = useState(1);
  const run = trace.agents[agent];
  const steps = run.steps.filter((s) => !(s.role === "tool_result" && s.name === "reply"));
  const reply = run.steps.find((s) => s.role === "tool_call" && s.name === "reply")?.content as
    | { kind: string; message: string; cited_policy_ids: string[] }
    | undefined;
  const done = shown >= steps.length;

  function pick(a: string) {
    setAgent(a);
    setShown(1);
  }

  return (
    <>
      <p>
        {agents.map((a) => (
          <button key={a} type="button" aria-pressed={a === agent} onClick={() => pick(a)}>
            {a} {trace.agents[a].grade.ok ? "✓" : "✗"}
          </button>
        ))}
      </p>
      <ol>
        {steps.slice(0, shown).map((s, i) => {
          if (s.role === "tool_call" && s.name === "reply") return null;
          const rejected = s.role === "tool_result" && (s.content as { ok?: boolean }).ok === false;
          return (
            <li key={i} style={rejected ? { background: "var(--fail-bg)" } : undefined}>
              {s.thinking && <p><em>Thinking: {s.thinking}</em></p>}
              <code>{s.role === "tool_result" ? `→ ${short(s)}` : s.role === "assistant" ? String(s.content) : short(s)}</code>
            </li>
          );
        })}
      </ol>
      {done && reply ? (
        <>
          <p>
            <strong>Reply ({reply.kind})</strong>
            {reply.cited_policy_ids.length ? `, citing ${reply.cited_policy_ids.join(", ")}` : ""}:
          </p>
          <blockquote style={{ whiteSpace: "pre-wrap" }}>{reply.message}</blockquote>
        </>
      ) : done && run.status !== "ok" ? (
        <p>
          <strong>No reply.</strong> The run ended with status <code>{run.status}</code>
          {run.status === "refusal" ? " (the API's safety layer declined the request)" : ""}.
        </p>
      ) : (
        <p>
          <button type="button" onClick={() => setShown((n) => n + 1)}>
            Next step
          </button>{" "}
          <button type="button" onClick={() => setShown(steps.length)}>
            Show all
          </button>
        </p>
      )}
      {done && (
        <p style={{ background: run.grade.ok ? "var(--ready-bg)" : "var(--fail-bg)" }}>
          {run.grade.ok ? "Scored correct." : `Scored wrong: ${run.fail.join("; ")}.`}
          {run.grade.blocked ? ` Code blocked ${run.grade.blocked} attempted write(s).` : ""}
        </p>
      )}
    </>
  );
}

export default function DeskcheckDemo({ results, traces }: { results: Results; traces: Trace[] }) {
  const [set, setSet] = useState<"test" | "gate3">("gate3");
  const [id, setId] = useState(traces[0].id);
  const trace = traces.find((t) => t.id === id) ?? traces[0];
  return (
    <>
      <h2>Results</h2>
      <p>
        {(Object.keys(SETS) as ("test" | "gate3")[]).map((s) => (
          <button key={s} type="button" aria-pressed={s === set} onClick={() => setSet(s)}>
            {SETS[s].label}
          </button>
        ))}
      </p>
      <ResultsTable results={results} set={set} />
      <p>
        Recomputed in your browser from {results.rows.length} graded runs. Total API spend for the
        whole project: ${results.spendUsd.toFixed(2)}.
      </p>

      <h2>Replay a case</h2>
      <p>
        <label>
          Case:{" "}
          <select value={trace.id} onChange={(e) => setId(e.target.value)}>
            {traces.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} ({t.cat.replace("_", " ")}, {t.set === "gate3" ? "blind set" : "test set"})
              </option>
            ))}
          </select>
        </label>
      </p>
      <p>{trace.why}</p>
      <p>
        <strong>{trace.requester}</strong> writes:
      </p>
      <blockquote style={{ whiteSpace: "pre-wrap" }}>{trace.message}</blockquote>
      <p>Counts as correct: {trace.expected.join(" OR ")}.</p>
      <Replay key={trace.id} trace={trace} />
    </>
  );
}
