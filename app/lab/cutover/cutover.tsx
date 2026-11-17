"use client";

import { useMemo, useState } from "react";
import {
  compose,
  runChecks,
  toRows,
  type Defect,
  type Finding,
  type RegisterEntry,
  type Spec,
  type Summary,
  type Tables,
} from "@/lib/cutover";

export type Demo = {
  spec: Spec;
  register: RegisterEntry[];
  columns: Record<"source" | "target", Record<string, string[]>>;
  base: Record<"source" | "target", Record<string, string[][]>>;
  defects: Defect[];
};

const BLOCKED_BG = "rgba(220, 38, 38, 0.22)";
const READY_BG = "rgba(22, 163, 74, 0.22)";
const WARN_BG = "rgba(234, 179, 8, 0.25)";
const SHOWN = 50; // findings listed per check; the rest are counted

function ref(f: Finding) {
  const parts = [];
  if (f.source_row !== null) parts.push(`legacy row ${f.source_row}`);
  if (f.target_row !== null) parts.push(`target row ${f.target_row}`);
  return parts.join(", ") || "totals";
}

function line(s: Summary) {
  const what =
    s.kind === "control_total_mismatch"
      ? `${s.count} ${s.entity} group(s)`
      : s.kind === "count_mismatch"
        ? `${s.entity} row count`
        : `${s.count} ${s.entity}`;
  return `${s.check} ${s.name}: ${what}${s.field ? ` · ${s.field}` : ""} (${s.kind.replaceAll("_", " ")})`;
}

export default function Cutover({ demo }: { demo: Demo }) {
  const [on, setOn] = useState<Set<string>>(() => new Set(demo.defects.map((d) => d.id)));

  const base: Tables = useMemo(() => {
    const side = (s: "source" | "target") =>
      Object.fromEntries(Object.entries(demo.base[s]).map(([e, rows]) => [e, toRows(demo.columns[s][e], rows)]));
    return { source: side("source"), target: side("target") };
  }, [demo]);

  const report = useMemo(
    () => runChecks(demo.spec, compose(demo.spec, base, demo.defects, on), demo.register),
    [demo, base, on],
  );
  const r = report.readiness;

  function toggle(id: string) {
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <h2>Injected defects</h2>
      <p>
        <button type="button" onClick={() => setOn(new Set(demo.defects.map((d) => d.id)))}>
          All nine on
        </button>{" "}
        <button type="button" onClick={() => setOn(new Set())}>
          Clean migration
        </button>
      </p>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {demo.defects.map((d) => (
          <li key={d.id}>
            <label>
              <input type="checkbox" checked={on.has(d.id)} onChange={() => toggle(d.id)} />{" "}
              <strong>
                {d.id} {d.title}.
              </strong>{" "}
              {d.description}
            </label>
          </li>
        ))}
      </ul>

      <h2>Go-live readiness</h2>
      <p
        style={{
          background: r.status === "READY" ? READY_BG : BLOCKED_BG,
          padding: "0.5em 0.75em",
          fontWeight: 600,
        }}
      >
        {r.status === "READY" ? "READY to sign off" : "BLOCKED: do not sign off"}
      </p>
      {r.blockers.length > 0 && (
        <>
          <p>Blocks sign-off:</p>
          <ul>
            {r.blockers.map((b) => (
              <li key={line(b)}>{line(b)}</li>
            ))}
          </ul>
        </>
      )}
      {r.warnings.length > 0 && (
        <>
          <p>Warnings to acknowledge (they do not block on their own):</p>
          <ul>
            {r.warnings.map((w) => (
              <li key={line(w)}>{line(w)}</li>
            ))}
          </ul>
        </>
      )}
      <p>
        Known exceptions: {r.known_exceptions} (pending policies deferred under ticket MIG-142).
        {r.stale_exceptions.length > 0 && ` Stale register entries: ${r.stale_exceptions.length}.`}
      </p>

      <h2>Checks</h2>
      <table>
        <thead>
          <tr>
            <th>check</th>
            <th>status</th>
            <th>result</th>
          </tr>
        </thead>
        <tbody>
          {report.checks.map((c) => (
            <tr key={c.id} style={c.status === "fail" ? { background: BLOCKED_BG } : undefined}>
              <td>
                {c.id} {c.name}
              </td>
              <td>{c.status.toUpperCase()}</td>
              <td>{c.message}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Exception report</h2>
      <p>One section per check. Each finding cites the CSV line in the legacy or target export (the header is line 1).</p>
      {report.checks
        .filter((c) => c.findings.length > 0)
        .map((c) => (
          <details key={c.id}>
            <summary>
              {c.id} {c.name}: {c.message}
            </summary>
            <table>
              <thead>
                <tr>
                  <th>severity</th>
                  <th>ref</th>
                  <th>finding</th>
                </tr>
              </thead>
              <tbody>
                {c.findings.slice(0, SHOWN).map((f, i) => (
                  <tr
                    key={i}
                    style={{ background: f.waived ? undefined : f.severity === "blocker" ? BLOCKED_BG : WARN_BG }}
                  >
                    <td>{f.waived ? "known exception" : f.severity}</td>
                    <td>{ref(f)}</td>
                    <td style={{ overflowWrap: "anywhere" }}>
                      {f.message}
                      {f.ticket && ` (${f.ticket})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {c.findings.length > SHOWN && <p>…and {c.findings.length - SHOWN} more of the same check.</p>}
          </details>
        ))}
    </>
  );
}
