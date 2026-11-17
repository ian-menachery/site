// TypeScript port of cutover (github.com/ian-menachery/cutover). The Python engine
// does this work in DuckDB SQL; this is a second, independent implementation of the
// same rules, held to identical output by cutover.test.ts against
// data/cutover/reference.json. Mirrors: defect composition (synth/scenario.py
// compose), the expected/actual views (migration.py), checks R1-R8 (checks/*.py) and
// the exception register plus readiness (runner.py). Field names stay snake_case so
// results compare one-to-one with the Python output.

export type Row = Record<string, string>;
export type Tables = { source: Record<string, Row[]>; target: Record<string, Row[]> };

export type Transform = {
  type: "text" | "date" | "money" | "map" | "parent";
  format?: string;
  map?: Record<string, string>;
  entity?: string;
};
export type FieldSpec = {
  source: string;
  target: string;
  class: "key" | "money" | "date" | "picklist" | "text";
  required?: boolean;
  transform: Transform;
};
export type EntitySpec = {
  name: string;
  source_key: string;
  target_key: string;
  target_id: string;
  exclude_when?: { field: string; equals?: string; before?: string; format?: string }[];
  fields: FieldSpec[];
  control_totals?: { group_by: string[]; sum: string[] };
};
export type Spec = { name: string; target_date_format?: string; entities: EntitySpec[] };
export type RegisterEntry = { check: string; entity: string; key: string; reason: string; ticket: string };
export type Op = {
  op: "delete" | "set" | "append";
  side: "source" | "target";
  entity: string;
  id?: string;
  field?: string;
  value?: string;
  row?: Row;
};
export type Defect = { id: string; title: string; description: string; ops: Op[] };

export type Finding = {
  check: string;
  severity: "blocker" | "warning";
  entity: string;
  kind: string;
  message: string;
  key: string | null;
  source_row: number | null;
  target_row: number | null;
  field: string | null;
  group: Record<string, string | null> | null;
  source_value: string | null;
  expected: string | null;
  found: string | null;
  waived: boolean;
  ticket: string | null;
};
export type CheckResult = {
  id: string;
  name: string;
  status: "pass" | "fail" | "skip";
  message: string;
  findings: Finding[];
};
export type Summary = {
  check: string;
  name: string;
  entity: string;
  kind: string;
  field: string | null;
  count: number;
};
export type Readiness = {
  status: "READY" | "BLOCKED";
  blockers: Summary[];
  warnings: Summary[];
  known_exceptions: number;
  stale_exceptions: { check: string; entity: string; key: string; ticket: string }[];
  skipped: string[];
};
export type Report = { spec: string; checks: CheckResult[]; readiness: Readiness };

// ---------------------------------------------------------------- composition

/** Apply the enabled defects to a copy of the clean tables: D1..D9 order, ops in order. */
export function compose(spec: Spec, base: Tables, defects: Defect[], enabled: Set<string>): Tables {
  const t: Tables = {
    source: Object.fromEntries(Object.entries(base.source).map(([k, v]) => [k, v.map((r) => ({ ...r }))])),
    target: Object.fromEntries(Object.entries(base.target).map(([k, v]) => [k, v.map((r) => ({ ...r }))])),
  };
  for (const d of defects) {
    if (!enabled.has(d.id)) continue;
    for (const op of d.ops) {
      const e = entity(spec, op.entity);
      const rows = t[op.side][op.entity];
      if (op.op === "append") {
        rows.push({ ...op.row });
        continue;
      }
      const idCol = op.side === "target" ? e.target_id : e.source_key;
      const i = rows.findIndex((r) => r[idCol] === op.id);
      if (i < 0) throw new Error(`${d.id}: no ${op.side} ${op.entity} row ${op.id}`);
      if (op.op === "delete") rows.splice(i, 1);
      else rows[i] = { ...rows[i], [op.field as string]: op.value as string };
    }
  }
  return t;
}

/** Turn column lists plus row arrays (the demo.json layout) into records. */
export function toRows(columns: string[], rows: string[][]): Row[] {
  return rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
}

// ---------------------------------------------------------------- values

type Val = string | number | null; // text and ISO dates as strings, money as integer cents

// DuckDB's TRIM strips Unicode space separators (not tabs or newlines).
const EDGE_SPACE = /^\p{Zs}+|\p{Zs}+$/gu;

export function norm(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const t = v.replace(EDGE_SPACE, "");
  return t === "" ? null : t;
}

/** try_strptime for %Y, %m, %d and literals; 1-4 digit years, 1-2 digit months and days. */
export function parseDate(s: string | null, fmt: string): string | null {
  if (s === null) return null;
  let i = 0;
  let y = -1;
  let m = -1;
  let d = -1;
  const digits = (max: number) => {
    const start = i;
    while (i < s.length && i - start < max && s[i] >= "0" && s[i] <= "9") i++;
    return i > start ? Number(s.slice(start, i)) : -1;
  };
  for (let k = 0; k < fmt.length; k++) {
    if (fmt[k] === "%") {
      const code = fmt[++k];
      if (code === "Y") y = digits(4);
      else if (code === "m") m = digits(2);
      else if (code === "d") d = digits(2);
      else return null;
      if ((code === "Y" && y < 0) || (code === "m" && m < 0) || (code === "d" && d < 0)) return null;
    } else if (s[i++] !== fmt[k]) return null;
  }
  if (i !== s.length || y < 0 || m < 1 || m > 12 || d < 1) return null;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  if (d > days) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * TRY_CAST(REPLACE(s, ',', '') AS DECIMAL(18,2)) as integer cents, rounding half away
 * from zero. Not ported: exponent notation, which DuckDB accepts and this rejects.
 */
export function parseMoney(s: string | null): number | null {
  if (s === null) return null;
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s.replace(/,/g, ""));
  if (!m || (m[2] === "" && (m[3] ?? "") === "")) return null;
  const whole = m[2] || "0";
  if (whole.replace(/^0+/, "").length > 16) return null;
  const frac = (m[3] ?? "").padEnd(3, "0");
  let cents = Number(whole) * 100 + Number(frac.slice(0, 2));
  if (Number(frac[2]) >= 5) cents += 1;
  if (m[1] === "-" && cents !== 0) cents = -cents;
  return cents;
}

export function formatCents(c: number): string {
  const a = Math.abs(c);
  return `${c < 0 ? "-" : ""}${Math.floor(a / 100)}.${String(a % 100).padStart(2, "0")}`;
}

const show = (f: FieldSpec, v: Val): string | null =>
  v === null ? null : f.transform.type === "money" ? formatCents(v as number) : String(v);
const blank = (v: unknown) => (v === null || v === undefined ? "blank" : String(v));
const py = (v: unknown) => (v === null || v === undefined ? "None" : String(v)); // Python str(None)
const has = (o: object | undefined, k: string) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const cmp = (a: string | null, b: string | null) =>
  a === b ? 0 : a === null ? -1 : b === null ? 1 : a < b ? -1 : 1;

function entity(spec: Spec, name: string): EntitySpec {
  const e = spec.entities.find((x) => x.name === name);
  if (!e) throw new Error(`spec has no entity ${name}`);
  return e;
}

// ---------------------------------------------------------------- views

type Exp = {
  row: number;
  key: string | null;
  inScope: boolean;
  deferred: boolean;
  v: Record<string, { value: Val; src: string | null; unmapped: boolean }>;
};
type Act = { row: number; key: string | null; v: Record<string, { value: Val; raw: string | null }> };

function inScope(e: EntitySpec, r: Row): boolean {
  const clauses = e.exclude_when ?? [];
  if (!clauses.length) return true;
  // Excluded only when every clause is known to hold (SQL three-valued AND).
  const holds = clauses.flatMap((c) => {
    const v = norm(r[c.field]);
    const out: (boolean | null)[] = [];
    if (c.equals !== undefined) out.push(v === null ? null : v === c.equals);
    if (c.before !== undefined) {
      const dte = parseDate(v, c.format ?? "%Y-%m-%d");
      out.push(dte === null ? null : dte < c.before);
    }
    return out;
  });
  return !holds.every((h) => h === true);
}

function expRows(spec: Spec, e: EntitySpec, rows: Row[], deferredKeys: Set<string>): Exp[] {
  return rows.map((r, i) => {
    const key = norm(r[e.source_key]);
    const scope = inScope(e, r);
    const v: Exp["v"] = {};
    for (const f of e.fields) {
      const src = norm(r[f.source]);
      const t = f.transform;
      let value: Val = src;
      let unmapped = false;
      if (t.type === "date") value = parseDate(src, t.format ?? "%Y-%m-%d");
      else if (t.type === "money") value = parseMoney(src);
      else if (t.type === "map") {
        value = src !== null && has(t.map, src) ? (t.map as Record<string, string>)[src] : null;
        unmapped = src !== null && !has(t.map, src);
      }
      v[f.target] = { value, src, unmapped };
    }
    return { row: i + 2, key, inScope: scope, deferred: scope && key !== null && deferredKeys.has(key), v };
  });
}

function actRows(spec: Spec, e: EntitySpec, tables: Tables): Act[] {
  const lookups = new Map<string, Map<string, string | null>>();
  for (const f of e.fields) {
    if (f.transform.type !== "parent") continue;
    const p = entity(spec, f.transform.entity as string);
    const counts = new Map<string, { n: number; lk: string | null }>();
    for (const r of tables.target[p.name]) {
      const id = norm(r[p.target_id]);
      if (id === null) continue;
      const c = counts.get(id) ?? { n: 0, lk: norm(r[p.target_key]) };
      c.n += 1;
      counts.set(id, c);
    }
    lookups.set(f.target, new Map([...counts].map(([id, c]) => [id, c.n === 1 ? c.lk : null])));
  }
  const fmt = spec.target_date_format ?? "%Y-%m-%d";
  return tables.target[e.name].map((r, i) => {
    const v: Act["v"] = {};
    for (const f of e.fields) {
      const raw = norm(r[f.target]);
      const t = f.transform.type;
      let value: Val = raw;
      if (t === "date") value = parseDate(raw, fmt);
      else if (t === "money") value = parseMoney(raw);
      else if (t === "parent") value = raw === null ? null : (lookups.get(f.target)?.get(raw) ?? null);
      v[f.target] = { value, raw };
    }
    return { row: i + 2, key: norm(r[e.target_key]), v };
  });
}

type View = { e: EntitySpec; exp: Exp[]; act: Act[] };

function counts(keys: (string | null)[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const k of keys) if (k !== null) out.set(k, (out.get(k) ?? 0) + 1);
  return out;
}

function finding(p: Partial<Finding> & Pick<Finding, "check" | "severity" | "entity" | "kind" | "message">): Finding {
  return {
    key: null,
    source_row: null,
    target_row: null,
    field: null,
    group: null,
    source_value: null,
    expected: null,
    found: null,
    waived: false,
    ticket: null,
    ...p,
  };
}

// ---------------------------------------------------------------- checks

function r1(views: View[], tables: Tables): Finding[] {
  const out: Finding[] = [];
  for (const { e, exp } of views) {
    const expected = exp.filter((x) => x.inScope && !x.deferred).length;
    const deferred = exp.filter((x) => x.deferred).length;
    const found = tables.target[e.name].length;
    if (expected !== found)
      out.push(
        finding({
          check: "R1",
          severity: "blocker",
          entity: e.name,
          kind: "count_mismatch",
          expected: String(expected),
          found: String(found),
          message: `${e.name}: expected ${expected} target rows (in-scope legacy rows less ${deferred} deferred), found ${found}.`,
        }),
      );
  }
  return out;
}

function r2(views: View[]): Finding[] {
  const out: Finding[] = [];
  for (const { e, exp, act } of views) {
    const sides = [
      { side: "source", rows: exp.filter((x) => x.inScope), severity: "warning", column: e.source_key },
      { side: "target", rows: act, severity: "blocker", column: e.target_key },
    ] as const;
    for (const { side, rows, severity, column } of sides) {
      const n = counts(rows.map((x) => x.key));
      for (const x of rows) {
        const ref = side === "source" ? { source_row: x.row } : { target_row: x.row };
        if (x.key === null)
          out.push(finding({ check: "R2", severity, entity: e.name, kind: "blank_key", ...ref,
            message: `${side} ${e.name} row ${x.row}: blank ${column}.` }));
        else if ((n.get(x.key) as number) > 1)
          out.push(finding({ check: "R2", severity, entity: e.name, kind: "duplicate_key", key: x.key, ...ref,
            message: `${side} ${e.name} ${column} ${x.key} appears ${n.get(x.key)} times (row ${x.row}).` }));
      }
    }
  }
  return out;
}

function r3(views: View[]): Finding[] {
  const out: Finding[] = [];
  for (const { e, exp, act } of views) {
    const s = counts(exp.filter((x) => x.inScope).map((x) => x.key));
    const t = new Set(act.map((a) => a.key).filter((k) => k !== null));
    for (const x of exp)
      if (x.inScope && x.key !== null && s.get(x.key) === 1 && !t.has(x.key))
        out.push(finding({ check: "R3", severity: "blocker", entity: e.name, kind: "missing_in_target",
          key: x.key, source_row: x.row,
          message: `${e.name} ${x.key} (legacy row ${x.row}) has no row in the target.` }));
  }
  return out;
}

function r4(views: View[]): Finding[] {
  const out: Finding[] = [];
  for (const { e, exp, act } of views) {
    const t = counts(act.map((a) => a.key));
    const scoped = new Set(exp.filter((x) => x.inScope && x.key !== null).map((x) => x.key));
    const all = new Set(exp.map((x) => x.key).filter((k) => k !== null));
    for (const a of act) {
      if (a.key === null || t.get(a.key) !== 1 || scoped.has(a.key)) continue;
      const known = all.has(a.key);
      const where = `${e.name} ${a.key} (target row ${a.row})`;
      out.push(finding({ check: "R4", severity: "blocker", entity: e.name,
        kind: known ? "out_of_scope" : "not_in_source", key: a.key, target_row: a.row,
        message: known ? `${where} matches a legacy row the scope rule excludes.` : `${where} matches no legacy row.` }));
    }
  }
  return out;
}

function r5(views: View[]): Finding[] {
  const out: Finding[] = [];
  for (const { e, exp, act } of views) {
    const ct = e.control_totals;
    if (!ct || !ct.group_by.length) continue;
    const fieldOf = (g: string) => e.fields.find((f) => f.target === g) as FieldSpec;
    type Agg = { g: (string | null)[]; n: number; s: number[] };
    const add = (m: Map<string, Agg>, g: (string | null)[], sums: Val[]) => {
      const k = JSON.stringify(g);
      const a = m.get(k) ?? { g, n: 0, s: ct.sum.map(() => 0) };
      a.n += 1;
      sums.forEach((v, j) => (a.s[j] += v === null ? 0 : (v as number)));
      m.set(k, a);
    };
    const x = new Map<string, Agg>();
    for (const r of exp) {
      if (!r.inScope || r.deferred) continue;
      const g = ct.group_by.map((name) => {
        const f = fieldOf(name);
        const c = r.v[name];
        if (f.transform.type === "map") return c.value !== null ? String(c.value) : c.unmapped ? `UNMAPPED(${c.src})` : null;
        return show(f, c.value);
      });
      add(x, g, ct.sum.map((s) => r.v[s].value));
    }
    const a = new Map<string, Agg>();
    for (const r of act) add(a, ct.group_by.map((name) => show(fieldOf(name), r.v[name].value)), ct.sum.map((s) => r.v[s].value));

    const keys = [...new Set([...x.keys(), ...a.keys()])].sort((k1, k2) => {
      const g1 = JSON.parse(k1) as (string | null)[];
      const g2 = JSON.parse(k2) as (string | null)[];
      for (let i = 0; i < g1.length; i++) {
        const c = cmp(g1[i], g2[i]);
        if (c) return c;
      }
      return 0;
    });
    for (const k of keys) {
      const ex = x.get(k);
      const ac = a.get(k);
      const g = (ex ?? ac)!.g;
      const group = Object.fromEntries(ct.group_by.map((name, i) => [name, g[i]]));
      const label = ct.group_by.map((name, i) => `${name}=${blank(g[i])}`).join(", ");
      const measures: [string, string, string, string][] = [];
      const xn = ex?.n ?? 0;
      const an = ac?.n ?? 0;
      if (xn !== an) measures.push(["count", String(xn), String(an), String(an - xn)]);
      ct.sum.forEach((s, j) => {
        const xs = ex?.s[j] ?? 0;
        const as = ac?.s[j] ?? 0;
        if (xs !== as) measures.push([s, formatCents(xs), formatCents(as), formatCents(as - xs)]);
      });
      for (const [measure, expected, found, diff] of measures)
        out.push(finding({ check: "R5", severity: "blocker", entity: e.name, kind: "control_total_mismatch",
          field: measure, group, expected, found,
          message: `${e.name} [${label}] ${measure}: expected ${expected}, found ${found} (difference ${diff}).` }));
    }
  }
  return out;
}

function r6Message(entityName: string, f: FieldSpec, key: string, src: string | null, exp: string | null, raw: string | null, act: string | null): string {
  const head = `${entityName} ${key}: ${f.target}`;
  if (exp === null && src !== null) return `${head} legacy value ${src} could not be parsed.`;
  if (f.transform.type === "parent") {
    if (act === null) return `${head} ${blank(raw)} matches no ${f.transform.entity} row; expected legacy ${py(exp)}.`;
    return `${head} ${raw} belongs to legacy ${act}, expected legacy ${py(exp)}.`;
  }
  if (act === null && raw !== null) return `${head} target value ${raw} could not be parsed; expected ${blank(exp)}.`;
  return `${head} expected ${blank(exp)}, found ${blank(raw)}.`;
}

function r6(views: View[]): Finding[] {
  const out: Finding[] = [];
  for (const { e, exp, act } of views) {
    const s = counts(exp.filter((x) => x.inScope).map((x) => x.key));
    const t = counts(act.map((a) => a.key));
    const byKey = new Map(act.filter((a) => a.key !== null).map((a) => [a.key as string, a]));
    for (const x of exp) {
      if (!x.inScope || x.key === null || s.get(x.key) !== 1 || t.get(x.key) !== 1) continue;
      const a = byKey.get(x.key) as Act;
      for (const f of e.fields) {
        const xv = x.v[f.target];
        const av = a.v[f.target];
        if (xv.unmapped) continue;
        const differs =
          xv.value !== av.value || (av.value === null && av.raw !== null) || (xv.value === null && xv.src !== null);
        if (!differs) continue;
        const expShown = show(f, xv.value);
        const actShown = show(f, av.value);
        out.push(finding({ check: "R6", severity: f.class === "text" ? "warning" : "blocker", entity: e.name,
          kind: "field_mismatch", key: x.key, source_row: x.row, target_row: a.row, field: f.target,
          source_value: xv.src, expected: expShown, found: f.transform.type === "parent" ? actShown : av.raw,
          message: r6Message(e.name, f, x.key, xv.src, expShown, av.raw, actShown) }));
      }
    }
  }
  return out;
}

function r7(views: View[]): Finding[] {
  const out: Finding[] = [];
  for (const { e, exp, act } of views) {
    for (const f of e.fields) {
      if (f.transform.type !== "map") continue;
      for (const x of exp)
        if (x.inScope && x.v[f.target].unmapped)
          out.push(finding({ check: "R7", severity: "blocker", entity: e.name, kind: "unmapped_source_value",
            key: x.key, source_row: x.row, field: f.target, source_value: x.v[f.target].src,
            message: `${e.name} ${py(x.key)}: legacy ${f.source} ${x.v[f.target].src} has no mapping to ${f.target}.` }));
      const labels = new Set(Object.values(f.transform.map ?? {}));
      for (const a of act) {
        const v = a.v[f.target].raw;
        if (!((v !== null && !labels.has(v)) || (v === null && f.required))) continue;
        const where = `${e.name} row ${a.row} (${a.key ?? "no key"})`;
        out.push(finding({ check: "R7", severity: "blocker", entity: e.name,
          kind: v === null ? "blank_required_value" : "invalid_target_value", key: a.key, target_row: a.row,
          field: f.target, found: v,
          message: v === null ? `${where}: ${f.target} is blank but required.` : `${where}: ${f.target} ${v} is not an allowed value.` }));
      }
    }
  }
  return out;
}

function r8(spec: Spec, views: View[], tables: Tables): Finding[] {
  const out: Finding[] = [];
  for (const { e, act } of views) {
    for (const f of e.fields) {
      if (f.transform.type !== "parent") continue;
      const p = entity(spec, f.transform.entity as string);
      const ids = new Set(tables.target[p.name].map((r) => norm(r[p.target_id])).filter((v) => v !== null));
      for (const a of act) {
        const v = a.v[f.target].raw;
        if (v !== null && ids.has(v)) continue;
        out.push(finding({ check: "R8", severity: "blocker", entity: e.name, kind: "dangling_parent",
          key: a.key, target_row: a.row, field: f.target, found: v,
          message: `${e.name} row ${a.row} (${a.key ?? "no key"}): ${f.target} ${blank(v)} matches no ${p.name} row.` }));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- runner

export const CHECK_NAMES: Record<string, string> = {
  R1: "record_counts",
  R2: "key_integrity",
  R3: "source_orphans",
  R4: "target_orphans",
  R5: "control_totals",
  R6: "field_diffs",
  R7: "unmapped_values",
  R8: "referential_integrity",
};

function summary(results: CheckResult[], severity: string): Summary[] {
  const groups = new Map<string, Summary>();
  for (const r of results)
    for (const f of r.findings) {
      if (f.waived || f.severity !== severity) continue;
      const k = JSON.stringify([r.id, f.entity, f.kind, f.field]);
      const g = groups.get(k) ?? { check: r.id, name: r.name, entity: f.entity, kind: f.kind, field: f.field, count: 0 };
      g.count += 1;
      groups.set(k, g);
    }
  return [...groups.values()];
}

export function runChecks(spec: Spec, tables: Tables, register: RegisterEntry[]): Report {
  const views: View[] = spec.entities.map((e) => {
    const deferred = new Set(register.filter((r) => r.check === "R3" && r.entity === e.name).map((r) => r.key));
    return { e, exp: expRows(spec, e, tables.source[e.name], deferred), act: actRows(spec, e, tables) };
  });
  const runs: [string, () => Finding[]][] = [
    ["R1", () => r1(views, tables)],
    ["R2", () => r2(views)],
    ["R3", () => r3(views)],
    ["R4", () => r4(views)],
    ["R5", () => r5(views)],
    ["R6", () => r6(views)],
    ["R7", () => r7(views)],
    ["R8", () => r8(spec, views, tables)],
  ];
  const reg = new Map(register.map((r) => [JSON.stringify([r.check, r.entity, r.key]), r]));
  const used = new Set<string>();
  const checks: CheckResult[] = runs.map(([id, run]) => {
    const findings = run();
    for (const f of findings) {
      const k = JSON.stringify([f.check, f.entity, f.key]);
      const entry = f.key ? reg.get(k) : undefined;
      if (entry) {
        f.waived = true;
        f.ticket = entry.ticket;
        used.add(k);
      }
    }
    const open = findings.filter((f) => !f.waived).length;
    const waived = findings.length - open;
    const known = `${waived} known exception(s)`;
    const message = open
      ? `${open} finding(s)${waived ? `, ${known}` : ""}.`
      : waived
        ? `No open findings; ${known}.`
        : "No findings.";
    return { id, name: CHECK_NAMES[id], status: open ? "fail" : "pass", message, findings };
  });
  const blockers = summary(checks, "blocker");
  return {
    spec: spec.name,
    checks,
    readiness: {
      status: blockers.length ? "BLOCKED" : "READY",
      blockers,
      warnings: summary(checks, "warning"),
      known_exceptions: checks.reduce((n, c) => n + c.findings.filter((f) => f.waived).length, 0),
      stale_exceptions: register
        .filter((r) => !used.has(JSON.stringify([r.check, r.entity, r.key])))
        .map((r) => ({ check: r.check, entity: r.entity, key: r.key, ticket: r.ticket })),
      skipped: [],
    },
  };
}
