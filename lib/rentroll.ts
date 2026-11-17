// TypeScript port of rentroll (private repo): the tabular adapter's parsing and
// stated-total detection (src/rentroll/adapters/tabular.py), the five checks
// (src/rentroll/checks/*.py), the runner (checks/__init__.py) and the default
// tolerances (tolerances.py). Field names stay snake_case so results compare
// one-to-one with the Python output in data/rentroll/reference_results.json.

export type Status = "pass" | "fail" | "skip";
export type Occupancy = "occupied" | "vacant" | "unknown";
export type Category = "revenue" | "expense" | "unknown";
/** A CSV read as header-keyed strings, like csv.DictReader. */
export type Table = Record<string, string | null | undefined>[];

export type RentRollRow = {
  unit_id: string;
  unit_type: string | null;
  square_feet: number | null;
  occupancy_status: Occupancy | null;
  in_place_rent: number | null;
  market_rent: number | null;
  lease_start: string | null;
  lease_end: string | null;
  concession_amount: number | null;
};

export type T12LineItem = {
  label: string;
  category: Category | null;
  monthly_values: (number | null)[];
  stated_annual_total: number | null;
};

export const STATED_FIELDS = [
  "total_units",
  "gross_potential_rent",
  "gross_rental_income",
  "vacancy_loss",
  "concessions",
  "total_operating_revenue",
  "total_operating_expenses",
  "net_operating_income",
] as const;
export type StatedField = (typeof STATED_FIELDS)[number];
export type StatedTotals = Partial<Record<StatedField, number | null>>;

export type StatedSource = {
  field: StatedField;
  value: number | null;
  method: "detected" | "override" | "absent";
  source: string | null;
  reason: string | null;
};

export type DealDocs = {
  rent_roll: RentRollRow[];
  t12: T12LineItem[];
  stated: StatedTotals;
  stated_sources: StatedSource[];
};

export type CheckResult = {
  id: string;
  name: string;
  status: Status;
  expected: number | null;
  found: number | null;
  variance: number | null;
  variance_pct: number | null;
  tolerance: string | null;
  refs: string[];
  message: string;
};

export type Report = {
  checks: CheckResult[];
  stated_sources: StatedSource[];
  warnings: string[];
};

// ---- Python-compatible number handling ------------------------------------

const PY_FLOAT =
  /^[+-]?(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?$/;
const PY_SPECIAL = /^([+-]?)(inf|infinity|nan)$/i;

/** Python float(str), or null where it would raise ValueError. */
function pyFloat(text: string): number | null {
  const t = text.trim();
  const special = PY_SPECIAL.exec(t);
  if (special) {
    if (special[2].toLowerCase() === "nan") return NaN;
    return special[1] === "-" ? -Infinity : Infinity;
  }
  return PY_FLOAT.test(t) ? Number(t.replace(/_/g, "")) : null;
}

/** Python 3.12 sum() over floats (Neumaier compensated summation). */
function pySum(values: number[]): number {
  let total = 0;
  let c = 0;
  for (const x of values) {
    const t = total + x;
    c += Math.abs(total) >= Math.abs(x) ? total - t + x : x - t + total;
    total = t;
  }
  return c !== 0 && Number.isFinite(c) ? total + c : total;
}

/** statistics.median */
function median(values: number[]): number {
  const data = [...values].sort((a, b) => a - b);
  const n = data.length;
  return n % 2 === 1 ? data[(n - 1) / 2] : (data[n / 2 - 1] + data[n / 2]) / 2;
}

/** Python format(x, ".2f"), ",.2f" or "+,.2f": half-even on exact ties. */
function fixed2(x: number, commas = true, plus = false): string {
  const neg = x < 0 || Object.is(x, -0);
  const sign = neg ? "-" : plus ? "+" : "";
  if (Number.isNaN(x)) return (plus ? "+" : "") + "nan";
  const a = Math.abs(x);
  if (a === Infinity) return sign + "inf";
  let s = a.toFixed(2);
  // toFixed rounds an exact tie up; Python rounds it to even. Ties are only
  // possible when a is a multiple of 1/8.
  if (Number.isInteger(a * 8) && !Number.isInteger(a * 100)) {
    const n = Math.floor(a * 100);
    s = ((n % 2 === 0 ? n : n + 1) / 100).toFixed(2);
  }
  if (commas) {
    const [whole, frac] = s.split(".");
    s = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + frac;
  }
  return sign + s;
}

/** Python str(float) for the small round numbers the tolerances use. */
function pyRepr(x: number): string {
  return Number.isInteger(x) ? x.toFixed(1) : String(x);
}

// ---- Tolerances (tolerances.py) ------------------------------------------

export type Tolerances = {
  gpr_sum_pct: number;
  t12_column_sum_abs: number;
  noi_recompute_abs: number;
};

export const DEFAULT_TOLERANCES: Tolerances = {
  gpr_sum_pct: 0.5,
  t12_column_sum_abs: 1.0,
  noi_recompute_abs: 1.0,
};

const EXACT = "exact";
const EXACT_ANY_ROW = "exact, any row fails the check";
const gprSumLabel = (t: Tolerances) => `${pyRepr(t.gpr_sum_pct)}% of stated GPR`;
const t12ColumnSumLabel = (t: Tolerances) => `$${fixed2(t.t12_column_sum_abs, false)} absolute`;
const noiRecomputeLabel = (t: Tolerances) => `$${fixed2(t.noi_recompute_abs, false)} absolute`;

// ---- Tabular adapter (adapters/tabular.py) --------------------------------

const MONTHS_IN_YEAR = 12;
export const MONTH_COLUMNS = Array.from(
  { length: MONTHS_IN_YEAR },
  (_, i) => `month_${String(i + 1).padStart(2, "0")}`,
);

export const RENT_ROLL_COLUMNS = [
  "unit_id",
  "unit_type",
  "square_feet",
  "occupancy_status",
  "in_place_rent",
  "market_rent",
  "lease_start",
  "lease_end",
  "concession_amount",
] as const;
const NUMERIC_RENT_ROLL_COLUMNS = new Set([
  "square_feet",
  "in_place_rent",
  "market_rent",
  "concession_amount",
]);

const TOTALS_ROW = /^\s*(total|totals|grand total)\s*:?\s*$/i;

const T12_CAPTIONS: Record<Exclude<StatedField, "total_units">, string[]> = {
  gross_potential_rent: ["gross potential rent", "gross scheduled rent", "gpr"],
  gross_rental_income: ["gross rental income", "gross rent income"],
  vacancy_loss: ["vacancy loss", "vacancy"],
  concessions: ["concessions", "concession"],
  total_operating_revenue: ["total operating revenue", "effective gross income", "total revenue"],
  total_operating_expenses: ["total operating expenses", "total expenses"],
  net_operating_income: ["net operating income", "noi"],
};

const RENT_ROLL_TOTAL_FIELDS: [string, StatedField][] = [
  ["in_place_rent", "gross_potential_rent"],
  ["market_rent", "gross_potential_rent"],
];

/** An empty cell means absent. It must never become a zero. */
function text(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const stripped = value.trim();
  return stripped || null;
}

export function parseNumber(value: string | null | undefined): number | null {
  const raw = text(value);
  if (raw === null) return null;
  let cleaned = raw.replaceAll(",", "").replaceAll("$", "").trim();
  const negative = cleaned.startsWith("(") && cleaned.endsWith(")");
  if (negative) cleaned = cleaned.slice(1, -1).trim();
  const number = pyFloat(cleaned);
  if (number === null) return null;
  return negative ? -number : number;
}

function enumValue<T extends string>(value: string | null, allowed: readonly T[], where: string) {
  if (value !== null && !allowed.includes(value as T)) {
    throw new Error(`${where}: expected one of ${allowed.join(", ")}, got "${value}"`);
  }
  return value as T | null;
}

export function isTotalsRow(row: Table[number]): boolean {
  const unitId = text(row.unit_id);
  return unitId === null || TOTALS_ROW.test(unitId);
}

/** Unit rows only, with totals rows excluded and empty cells left absent. */
export function rentRollRows(table: Table): RentRollRow[] {
  return table
    .filter((row) => !isTotalsRow(row))
    .map((row, i) => {
      const out: Record<string, unknown> = {};
      for (const column of RENT_ROLL_COLUMNS) {
        out[column] = NUMERIC_RENT_ROLL_COLUMNS.has(column)
          ? parseNumber(row[column])
          : text(row[column]);
      }
      enumValue(
        out.occupancy_status as string | null,
        ["occupied", "vacant", "unknown"],
        `rent_roll.${i}.occupancy_status`,
      );
      return out as RentRollRow;
    });
}

/** T12 line items, one per row, with twelve monthly values each. */
export function t12LineItems(table: Table): T12LineItem[] {
  const items: T12LineItem[] = [];
  for (const row of table) {
    const label = text(row.label);
    if (label === null) continue;
    items.push({
      label,
      category: enumValue(
        text(row.category),
        ["revenue", "expense", "unknown"],
        `t12.${items.length}.category`,
      ),
      monthly_values: MONTH_COLUMNS.map((column) => parseNumber(row[column])),
      stated_annual_total: parseNumber(row.stated_annual_total),
    });
  }
  return items;
}

function candidates(rentRoll: Table, t12: Table): Map<StatedField, [number, string][]> {
  const found = new Map<StatedField, [number, string][]>();
  const add = (field: StatedField, entry: [number, string]) =>
    found.set(field, [...(found.get(field) ?? []), entry]);

  rentRoll.forEach((row, i) => {
    if (!isTotalsRow(row)) return;
    for (const [column, field] of RENT_ROLL_TOTAL_FIELDS) {
      const value = parseNumber(row[column]);
      if (value !== null) add(field, [value, `rent_roll!row_${i + 2}`]);
    }
  });

  for (const row of t12) {
    const label = text(row.label);
    if (label === null) continue;
    const normalized = label.trim().toLowerCase().replace(/:+$/, "");
    for (const [field, captions] of Object.entries(T12_CAPTIONS)) {
      if (!captions.includes(normalized)) continue;
      const value = parseNumber(row.stated_annual_total);
      if (value !== null) add(field as StatedField, [value, `t12!"${label}"`]);
    }
  }
  return found;
}

/**
 * Resolve stated totals with provenance. An override wins per field; two
 * sources disagreeing about a field populate nothing (ABSENT), never a guess.
 */
export function statedWithProvenance(
  rentRoll: Table,
  t12: Table,
  override?: StatedTotals | null,
): { stated: StatedTotals; sources: StatedSource[] } {
  const found = candidates(rentRoll, t12);
  const stated: StatedTotals = {};
  const sources: StatedSource[] = [];

  for (const field of STATED_FIELDS) {
    if (override && field in override) {
      const value = override[field] ?? null;
      stated[field] = value;
      sources.push({ field, value, method: "override", source: "--stated", reason: null });
      continue;
    }
    const matches = found.get(field) ?? [];
    const distinct = new Set(matches.map(([value]) => value));
    if (distinct.size === 1) {
      const [value, where] = matches[0];
      stated[field] = value;
      sources.push({ field, value, method: "detected", source: where, reason: null });
    } else if (distinct.size > 1) {
      const listed = matches.map(([value, where]) => `${fixed2(value)} from ${where}`).join(", ");
      sources.push({
        field,
        value: null,
        method: "absent",
        source: null,
        reason: `conflicting candidates (${listed}); refusing to pick`,
      });
    } else {
      sources.push({
        field,
        value: null,
        method: "absent",
        source: null,
        reason: "no totals row or recognised caption found",
      });
    }
  }
  return { stated, sources };
}

/** CSV tables (plus an optional --stated override) to DealDocs. */
export function buildDeal(rentRoll: Table, t12: Table, override?: StatedTotals | null): DealDocs {
  const { stated, sources } = statedWithProvenance(rentRoll, t12, override);
  return {
    rent_roll: rentRollRows(rentRoll),
    t12: t12LineItems(t12),
    stated,
    stated_sources: sources,
  };
}

// ---- Checks ---------------------------------------------------------------

type Input = "rent_roll" | "t12";

function result(partial: Partial<CheckResult> & Pick<CheckResult, "id" | "name" | "status" | "message">): CheckResult {
  return {
    expected: null,
    found: null,
    variance: null,
    variance_pct: null,
    tolerance: null,
    refs: [],
    ...partial,
  };
}

const stat = (deal: DealDocs, field: StatedField) => deal.stated[field] ?? null;

/** Sum of a line item's twelve monthly values, or null if incomplete. */
function completeMonthlySum(item: T12LineItem): number | null {
  const values = item.monthly_values;
  if (values.length !== MONTHS_IN_YEAR || values.some((v) => v === null)) return null;
  return pySum(values as number[]);
}

function named(labels: string[], max: number): string {
  const shown = labels.slice(0, max).join(", ");
  return labels.length <= max ? shown : `${shown}, and ${labels.length - max} more`;
}

// C1 unit_count
function checkUnitCount(deal: DealDocs): CheckResult {
  const base = { id: "C1", name: "unit_count", tolerance: EXACT };
  const MAX_REFS = 10;
  const found = deal.rent_roll.length;
  const stated = stat(deal, "total_units");

  if (stated === null) {
    return result({
      ...base,
      status: "skip",
      message: `No stated total unit count found, so the ${found} rent roll rows were not verified against anything.`,
    });
  }

  const variance = found - stated;
  const variance_pct = stated ? (variance / stated) * 100 : null;
  if (variance === 0) {
    return result({
      ...base,
      status: "pass",
      expected: stated,
      found,
      variance: 0,
      variance_pct: 0,
      message: `Rent roll has ${found} rows, matching the stated unit count.`,
    });
  }

  const refs = ["stated!total_units"];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  deal.rent_roll.forEach((row, i) => {
    if (seen.has(row.unit_id)) duplicates.push(`rent_roll!row_${i + 1}`);
    seen.add(row.unit_id);
  });
  let detail = "";
  if (duplicates.length) {
    refs.push(...duplicates.slice(0, MAX_REFS));
    detail = ` ${duplicates.length} row(s) repeat a unit_id seen earlier, which is the most likely cause.`;
  } else if (variance > 0) {
    // Name the rows past the stated count; they are the surplus.
    const surplus = Array.from({ length: variance }, (_, i) => `rent_roll!row_${stated + 1 + i}`);
    refs.push(...surplus.slice(0, MAX_REFS));
  } else {
    refs.push("rent_roll");
    detail = " The missing rows are not present to cite.";
  }

  const direction = variance > 0 ? "more" : "fewer";
  return result({
    ...base,
    status: "fail",
    expected: stated,
    found,
    variance,
    variance_pct,
    refs,
    message: `Rent roll has ${found} rows, ${Math.abs(variance)} ${direction} than the stated unit count of ${stated}.${detail}`,
  });
}

/** What a row contributes to rent at full occupancy (C2). */
export function scheduledRent(row: RentRollRow): number | null {
  if (row.occupancy_status === "occupied") return row.in_place_rent;
  if (row.occupancy_status === "vacant") return row.market_rent;
  return row.in_place_rent !== null ? row.in_place_rent : row.market_rent;
}

function deviationRefs(deal: DealDocs, max: number): string[] {
  const contributions = deal.rent_roll.map((row) => [row, scheduledRent(row)] as const);
  const known = contributions.flatMap(([, v]) => (v === null ? [] : [v]));
  if (!known.length) return [];
  const overall = median(known);
  const byType = new Map<string, number[]>();
  for (const [row, value] of contributions) {
    if (row.unit_type !== null && value !== null) {
      byType.set(row.unit_type, [...(byType.get(row.unit_type) ?? []), value]);
    }
  }
  const medians = new Map([...byType].map(([type, values]) => [type, median(values)]));

  const deviations: [number, string][] = [];
  for (const [row, value] of contributions) {
    if (value === null) continue;
    const peer = row.unit_type !== null ? (medians.get(row.unit_type) ?? overall) : overall;
    const deviation = Math.abs(value - peer);
    if (deviation > 0) deviations.push([deviation, row.unit_id]);
  }
  deviations.sort((a, b) => b[0] - a[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  return deviations.slice(0, max).map(([, id]) => id);
}

// C2 gpr_sum
function checkGprSum(deal: DealDocs, tol: Tolerances): CheckResult {
  const base = { id: "C2", name: "gpr_sum", tolerance: gprSumLabel(tol) };
  const MAX_REFS = 5;
  const MAX_SKIP_IDS = 5;
  const expected = stat(deal, "gross_potential_rent");

  if (expected === null) {
    return result({
      ...base,
      status: "skip",
      message:
        "No stated gross potential rent found, so the rent roll's scheduled rent was not verified against anything.",
    });
  }

  const contributions = deal.rent_roll.map((row) => [row, scheduledRent(row)] as const);
  const missing = contributions.filter(([, v]) => v === null).map(([row]) => row.unit_id);
  if (missing.length) {
    return result({
      ...base,
      status: "skip",
      refs: missing.slice(0, MAX_SKIP_IDS),
      message:
        `${missing.length} of ${deal.rent_roll.length} rows have no scheduled rent to contribute ` +
        `(occupied with no in-place rent, or vacant with no market rent): ${named(missing, MAX_SKIP_IDS)}. ` +
        "Comparing a partial sum against a stated total would be a false failure.",
    });
  }

  const found = pySum(contributions.map(([, v]) => v as number));
  const variance = found - expected;
  const variance_pct = expected ? (variance / expected) * 100 : null;
  const allowed = (Math.abs(expected) * tol.gpr_sum_pct) / 100;
  const numbers = { expected, found, variance, variance_pct };

  if (Math.abs(variance) <= allowed) {
    return result({
      ...base,
      ...numbers,
      status: "pass",
      message: `Scheduled rent of ${fixed2(found)} is within tolerance of the stated gross potential rent of ${fixed2(expected)}.`,
    });
  }

  let refs = deviationRefs(deal, MAX_REFS);
  let detail: string;
  if (refs.length) {
    detail = " Furthest from their unit_type median: " + refs.join(", ") + ".";
  } else {
    refs = ["stated!gross_potential_rent"];
    detail =
      " No single row deviates from its unit_type median, so the variance is spread evenly or the stated figure itself is wrong.";
  }
  const direction = variance > 0 ? "above" : "below";
  const magnitude = variance_pct !== null ? `${fixed2(Math.abs(variance_pct), false)}% ` : "";
  return result({
    ...base,
    ...numbers,
    status: "fail",
    refs,
    message: `Scheduled rent of ${fixed2(found)} is ${magnitude}${direction} the stated gross potential rent of ${fixed2(expected)}.${detail}`,
  });
}

/** Occupied at zero rent, or vacant carrying rent (C4). */
function isInconsistent(row: RentRollRow): boolean {
  if (row.in_place_rent === null) return false;
  if (row.occupancy_status === "occupied") return row.in_place_rent === 0;
  if (row.occupancy_status === "vacant") return row.in_place_rent > 0;
  return false;
}

// C4 occupancy_consistency
function checkOccupancy(deal: DealDocs): CheckResult {
  const base = { id: "C4", name: "occupancy_consistency", tolerance: EXACT_ANY_ROW };
  const MAX_REFS = 10;
  const usable = deal.rent_roll.filter(
    (row) => row.occupancy_status === "occupied" || row.occupancy_status === "vacant",
  );
  const unusable = deal.rent_roll.length - usable.length;

  if (!usable.length) {
    return result({
      ...base,
      status: "skip",
      message: `All ${deal.rent_roll.length} rows have an unknown or missing occupancy status, so no row could be checked for consistency.`,
    });
  }

  const unknownNote = unusable
    ? ` ${unusable} row(s) have an unknown or missing occupancy status and were not evaluated.`
    : "";
  const offenders = deal.rent_roll.filter(isInconsistent).map((row) => row.unit_id);

  if (!offenders.length) {
    return result({
      ...base,
      status: "pass",
      expected: 0,
      found: 0,
      variance: 0,
      variance_pct: 0,
      message: `All ${usable.length} rows with a known occupancy status agree with their rent.${unknownNote}`,
    });
  }

  return result({
    ...base,
    status: "fail",
    expected: 0,
    found: offenders.length,
    variance: offenders.length,
    refs: offenders.slice(0, MAX_REFS),
    message:
      `${offenders.length} of ${usable.length} rows contradict themselves: occupied at zero rent, ` +
      `or vacant carrying rent. ${named(offenders, MAX_REFS)}.${unknownNote}`,
  });
}

// C5 t12_column_sums
function checkT12Columns(deal: DealDocs, tol: Tolerances): CheckResult {
  const base = { id: "C5", name: "t12_column_sums", tolerance: t12ColumnSumLabel(tol) };
  const MAX_REFS = 10;
  const MAX_NAMED = 5;
  const noTotal: string[] = [];
  const incomplete: string[] = [];
  const breaches: [number, string, number][] = [];

  for (const item of deal.t12) {
    if (item.stated_annual_total === null) {
      noTotal.push(item.label);
      continue;
    }
    const monthly = completeMonthlySum(item);
    if (monthly === null) {
      incomplete.push(item.label);
      continue;
    }
    const variance = monthly - item.stated_annual_total;
    if (Math.abs(variance) > tol.t12_column_sum_abs) {
      breaches.push([Math.abs(variance), item.label, variance]);
    }
  }

  const checked = deal.t12.length - noTotal.length - incomplete.length;
  if (!checked) {
    return result({
      ...base,
      status: "skip",
      refs: [...noTotal.slice(0, MAX_NAMED), ...incomplete.slice(0, MAX_NAMED)],
      message:
        `None of the ${deal.t12.length} T12 line items could be checked: ` +
        `${noTotal.length} have no stated annual total and ${incomplete.length} have an incomplete monthly series.`,
    });
  }

  let unchecked = "";
  if (noTotal.length) {
    unchecked += ` ${noTotal.length} line item(s) have no stated annual total and were not checked: ${named(noTotal, MAX_NAMED)}.`;
  }
  if (incomplete.length) {
    unchecked += ` ${incomplete.length} line item(s) have an incomplete monthly series and were not checked: ${named(incomplete, MAX_NAMED)}.`;
  }

  if (!breaches.length) {
    return result({
      ...base,
      status: "pass",
      expected: 0,
      found: 0,
      variance: 0,
      variance_pct: 0,
      message: `All ${checked} checkable line item(s) sum to their stated annual totals.${unchecked}`,
    });
  }

  breaches.sort((a, b) => b[0] - a[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  const shown = breaches.slice(0, MAX_REFS);
  const detail = shown.map(([, label, v]) => `${label} (${fixed2(v, true, true)})`).join(", ");
  const suffix = breaches.length <= MAX_REFS ? "" : `, and ${breaches.length - MAX_REFS} more`;
  return result({
    ...base,
    status: "fail",
    expected: 0,
    found: breaches.length,
    variance: breaches.length,
    refs: shown.map(([, label]) => label),
    message: `${breaches.length} of ${checked} checkable line item(s) do not sum to their stated annual total: ${detail}${suffix}.${unchecked}`,
  });
}

// C6 noi_recompute
function checkNoi(deal: DealDocs, tol: Tolerances): CheckResult {
  const base = { id: "C6", name: "noi_recompute", tolerance: noiRecomputeLabel(tol) };
  const MAX_NAMED = 5;
  const skip = (message: string, refs: string[] = []) =>
    result({ ...base, status: "skip", refs, message });
  const resolved = (item: T12LineItem) =>
    item.stated_annual_total !== null ? item.stated_annual_total : completeMonthlySum(item);

  const stated = stat(deal, "net_operating_income");
  if (stated === null) {
    return skip(
      "No stated net operating income found, so a recomputed NOI was not verified against anything.",
    );
  }

  const revenueItems = deal.t12.filter((item) => item.category === "revenue");
  const expenseItems = deal.t12.filter((item) => item.category === "expense");
  const absent = (
    [
      ["REVENUE", revenueItems],
      ["EXPENSE", expenseItems],
    ] as const
  )
    .filter(([, items]) => !items.length)
    .map(([name]) => name);
  if (absent.length) {
    return skip(
      `No ${absent.join(" or ")}-category line items present; cannot recompute NOI from ${deal.t12.length} line item(s).`,
    );
  }

  const unclassified = deal.t12
    .filter((item) => item.category !== "revenue" && item.category !== "expense")
    .map((item) => item.label);
  if (unclassified.length) {
    return skip(
      `${unclassified.length} line item(s) have an unknown or missing category: ${named(unclassified, MAX_NAMED)}. ` +
        "An unclassified line could sit on either side of the equation, so NOI was not recomputed.",
      unclassified.slice(0, MAX_NAMED),
    );
  }

  const unresolved = deal.t12.filter((item) => resolved(item) === null).map((item) => item.label);
  if (unresolved.length) {
    return skip(
      `${unresolved.length} line item(s) have neither a stated annual total nor a complete monthly series: ` +
        `${named(unresolved, MAX_NAMED)}. An understated expense total inflates NOI, so a partial list is never summed.`,
      unresolved.slice(0, MAX_NAMED),
    );
  }

  const revenue = pySum(revenueItems.map((item) => resolved(item) as number));
  const expenses = pySum(expenseItems.map((item) => resolved(item) as number));
  const recomputed = revenue - expenses;
  const variance = recomputed - stated;
  const variance_pct = stated ? (variance / stated) * 100 : null;
  const basis =
    `Revenue ${fixed2(revenue)} from ${revenueItems.length} line item(s) less ` +
    `expenses ${fixed2(expenses)} from ${expenseItems.length} line item(s).`;
  const numbers = { expected: stated, found: recomputed, variance, variance_pct };

  if (Math.abs(variance) <= tol.noi_recompute_abs) {
    return result({
      ...base,
      ...numbers,
      status: "pass",
      message: `Recomputed NOI of ${fixed2(recomputed)} is within tolerance of the stated ${fixed2(stated)}. ${basis}`,
    });
  }
  const direction = variance > 0 ? "above" : "below";
  return result({
    ...base,
    ...numbers,
    status: "fail",
    refs: ["stated!net_operating_income"],
    message: `Recomputed NOI of ${fixed2(recomputed)} is ${fixed2(Math.abs(variance))} ${direction} the stated ${fixed2(stated)}. ${basis}`,
  });
}

// ---- Runner (checks/__init__.py) ------------------------------------------

type Check = {
  id: string;
  name: string;
  requires: Input[];
  run: (deal: DealDocs, tol: Tolerances) => CheckResult;
};

export const CHECKS: Check[] = [
  { id: "C1", name: "unit_count", requires: ["rent_roll"], run: checkUnitCount },
  { id: "C2", name: "gpr_sum", requires: ["rent_roll"], run: checkGprSum },
  { id: "C4", name: "occupancy_consistency", requires: ["rent_roll"], run: checkOccupancy },
  { id: "C5", name: "t12_column_sums", requires: ["t12"], run: checkT12Columns },
  { id: "C6", name: "noi_recompute", requires: ["t12"], run: checkNoi },
];

const INPUT_LABELS: Record<Input, string> = { rent_roll: "rent roll", t12: "T12" };

/** Run every check, skipping any whose required input is empty. */
export function runChecks(deal: DealDocs, tol: Tolerances = DEFAULT_TOLERANCES): Report {
  const empty = (["rent_roll", "t12"] as const).filter((name) => !deal[name].length);
  const skippedFor = new Map<Input, number>();
  const checks = CHECKS.map((check) => {
    const blocked = check.requires.filter((name) => empty.includes(name));
    if (!blocked.length) return check.run(deal, tol);
    for (const name of blocked) skippedFor.set(name, (skippedFor.get(name) ?? 0) + 1);
    return result({
      id: check.id,
      name: check.name,
      status: "skip",
      message: `${blocked.map((name) => INPUT_LABELS[name]).join(" and ")} is empty; no rows to evaluate.`,
    });
  });
  const warnings = [...skippedFor].map(
    ([name, count]) => `${INPUT_LABELS[name]} is empty; ${count} check(s) that read it were skipped.`,
  );
  return { checks, stated_sources: deal.stated_sources, warnings };
}
