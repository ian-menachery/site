"use client";

import { useState } from "react";
import {
  buildDeal,
  CHECKS,
  isTotalsRow,
  runChecks,
  type CheckResult,
  type StatedTotals,
  type Table,
} from "@/lib/rentroll";

export type Fixture = {
  description: string;
  rent_roll: Table;
  t12: Table;
  stated: StatedTotals;
  expected: Record<string, string>;
};

const EDITABLE = new Set(["in_place_rent", "market_rent"]);
const FAIL_BG = "rgba(220, 38, 38, 0.22)";
const SKIP_BG = "rgba(234, 179, 8, 0.25)";
const READS_RENT_ROLL = new Set(CHECKS.filter((c) => c.requires.includes("rent_roll")).map((c) => c.id));

type Flag = { id: string; status: CheckResult["status"] };

function rowStyle(flags: Flag[] | undefined) {
  if (!flags?.length) return undefined;
  return { background: flags.some((f) => f.status === "fail") ? FAIL_BG : SKIP_BG };
}

function flagText(flags: Flag[] | undefined) {
  return flags?.map((f) => `${f.id} ${f.status}`).join(", ") ?? "";
}

function pushFlag(map: Map<number, Flag[]>, index: number, flag: Flag) {
  map.set(index, [...(map.get(index) ?? []), flag]);
}

export default function TieOut({ fixtures }: { fixtures: Record<string, Fixture> }) {
  const names = Object.keys(fixtures);
  const [name, setName] = useState(names[0]);
  const [rentRoll, setRentRoll] = useState<Table>(fixtures[names[0]].rent_roll);
  const [useStated, setUseStated] = useState(true);

  const fixture = fixtures[name];
  const deal = buildDeal(rentRoll, fixture.t12, useStated ? fixture.stated : null);
  const report = runChecks(deal);

  // Map each check's refs back to table rows (raw index), for highlighting.
  const unitRaw: number[] = []; // parsed rent roll index -> raw row index
  rentRoll.forEach((row, i) => {
    if (!isTotalsRow(row)) unitRaw.push(i);
  });
  const rentFlags = new Map<number, Flag[]>();
  const t12Flags = new Map<number, Flag[]>();
  for (const check of report.checks) {
    if (check.status === "pass") continue;
    const flag = { id: check.id, status: check.status };
    for (const ref of check.refs) {
      if (READS_RENT_ROLL.has(check.id)) {
        const row = /^rent_roll!row_(\d+)$/.exec(ref);
        if (row) {
          const raw = unitRaw[Number(row[1]) - 1];
          if (raw !== undefined) pushFlag(rentFlags, raw, flag);
        } else {
          deal.rent_roll.forEach((r, i) => {
            if (r.unit_id === ref) pushFlag(rentFlags, unitRaw[i], flag);
          });
        }
      } else {
        fixture.t12.forEach((r, i) => {
          if (r.label?.trim() === ref) pushFlag(t12Flags, i, flag);
        });
      }
    }
  }

  const rentColumns = Object.keys(fixture.rent_roll[0] ?? {});
  const t12Columns = Object.keys(fixture.t12[0] ?? {});

  function pick(next: string) {
    setName(next);
    setRentRoll(fixtures[next].rent_roll);
  }

  function edit(index: number, column: string, value: string) {
    setRentRoll((rows) => rows.map((row, i) => (i === index ? { ...row, [column]: value } : row)));
  }

  return (
    <>
      <p>
        <label>
          Package:{" "}
          <select value={name} onChange={(e) => pick(e.target.value)}>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>{" "}
        <button type="button" onClick={() => setRentRoll(fixture.rent_roll)}>
          Reset edits
        </button>
      </p>
      <p>{fixture.description}</p>
      <p>
        <label>
          <input type="checkbox" checked={useStated} onChange={(e) => setUseStated(e.target.checked)} />{" "}
          Use the package&apos;s stated totals (untick to see what detection alone finds)
        </label>
      </p>

      <h2>Results</h2>
      {report.warnings.length > 0 && (
        <ul>
          {report.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      <ul style={{ overflowWrap: "anywhere" }}>
        {report.checks.map((c) => (
          <li key={c.id}>
            <strong>
              {c.id} {c.name}: {c.status.toUpperCase()}
            </strong>
            {fixture.expected[c.id] && ` (fixture expects ${fixture.expected[c.id]})`}. {c.message}
            {c.tolerance && ` Tolerance: ${c.tolerance}.`}
            {c.refs.length > 0 && ` Refs: ${c.refs.join(", ")}.`}
          </li>
        ))}
      </ul>

      <h2>Rent roll</h2>
      <p>Rent cells are editable; the checks re-run as you type. Highlighted rows are cited by a failing (red) or skipped (amber) check.</p>
      <table>
        <thead>
          <tr>
            {rentColumns.map((c) => (
              <th key={c}>{c}</th>
            ))}
            <th>checks</th>
          </tr>
        </thead>
        <tbody>
          {rentRoll.map((row, i) => (
            <tr key={i} style={rowStyle(rentFlags.get(i))}>
              {rentColumns.map((c) => (
                <td key={c}>
                  {EDITABLE.has(c) ? (
                    <input
                      value={row[c] ?? ""}
                      onChange={(e) => edit(i, c, e.target.value)}
                      inputMode="decimal"
                      aria-label={`${row.unit_id} ${c}`}
                      style={{ width: "6.5em" }}
                    />
                  ) : (
                    row[c]
                  )}
                </td>
              ))}
              <td>{flagText(rentFlags.get(i))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>T12</h2>
      <table>
        <thead>
          <tr>
            {t12Columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
            <th>checks</th>
          </tr>
        </thead>
        <tbody>
          {fixture.t12.map((row, i) => (
            <tr key={i} style={rowStyle(t12Flags.get(i))}>
              {t12Columns.map((c) => (
                <td key={c}>{row[c]}</td>
              ))}
              <td>{flagText(t12Flags.get(i))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Stated totals</h2>
      <table>
        <thead>
          <tr>
            <th>field</th>
            <th>value</th>
            <th>provenance</th>
          </tr>
        </thead>
        <tbody>
          {report.stated_sources.map((s) => (
            <tr key={s.field}>
              <td>{s.field}</td>
              <td>{s.value === null ? "" : s.value.toLocaleString("en-US")}</td>
              <td>
                {s.method}
                {s.source && ` (${s.source})`}
                {s.reason && `: ${s.reason}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
