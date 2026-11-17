"use client";

import { useState } from "react";
import { underwrite, type DealInputs } from "@/lib/dealflow";

type Field = { key: keyof DealInputs; label: string; percent?: boolean };

const FIELDS: Field[] = [
  { key: "purchase_price", label: "Purchase price ($)" },
  { key: "gross_monthly_rent", label: "Gross rent ($ per month)" },
  { key: "vacancy_rate", label: "Vacancy (%)", percent: true },
  { key: "operating_expenses_annual", label: "Operating expenses ($ per year)" },
  { key: "capex_reserve_annual", label: "Capex reserve ($ per year)" },
  { key: "closing_costs", label: "Closing costs ($)" },
  { key: "rehab_cost", label: "Rehab ($)" },
  { key: "down_payment_rate", label: "Down payment (%)", percent: true },
  { key: "interest_rate", label: "Interest rate (% per year)", percent: true },
  { key: "loan_term_years", label: "Loan term (years)" },
];

const usd = (x: number) =>
  x.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (x: number | null, na: string) => (x === null ? `N/A (${na})` : `${(x * 100).toFixed(2)}%`);

export default function Calculator({ defaults }: { defaults: DealInputs }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      FIELDS.map((f) => [f.key, String(f.percent ? +(defaults[f.key] * 100).toFixed(6) : defaults[f.key])]),
    ),
  );

  const parsed = FIELDS.map((f) => {
    const text = values[f.key].trim();
    const n = text === "" ? NaN : Number(text);
    return [f.key, f.percent ? n / 100 : n] as const;
  });
  const valid = parsed.every(([, n]) => Number.isFinite(n));
  const out = valid ? underwrite(Object.fromEntries(parsed) as DealInputs) : null;

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()}>
        {FIELDS.map((f) => (
          <p key={f.key}>
            <label>
              {f.label}
              <br />
              <input
                value={values[f.key]}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                inputMode="decimal"
                style={{ width: "100%", maxWidth: "14em" }}
              />
            </label>
          </p>
        ))}
      </form>

      <h2>Results</h2>
      {out === null ? (
        <p>Enter a number in every field.</p>
      ) : (
        <table>
          <tbody>
            <tr>
              <th>NOI</th>
              <td>{usd(out.noi)} per year</td>
            </tr>
            <tr>
              <th>Cap rate</th>
              <td>{pct(out.cap_rate, "price must be above zero")}</td>
            </tr>
            <tr>
              <th>Cash-on-cash</th>
              <td>{pct(out.cash_on_cash, "no cash invested")}</td>
            </tr>
            <tr>
              <th>DSCR</th>
              <td>{out.dscr === null ? "N/A (no debt service: all cash)" : `${out.dscr.toFixed(2)}x`}</td>
            </tr>
            <tr>
              <th>Owner-earnings yield</th>
              <td>{pct(out.owner_earnings_yield, "project basis must be above zero")}</td>
            </tr>
            <tr>
              <th>Loan</th>
              <td>
                {usd(out.loan_amount)}, {usd(out.monthly_payment)} per month,{" "}
                {usd(out.annual_debt_service)} debt service per year
              </td>
            </tr>
            <tr>
              <th>Cash flow</th>
              <td>{usd(out.annual_cash_flow)} per year after debt service</td>
            </tr>
            <tr>
              <th>Owner earnings</th>
              <td>{usd(out.owner_earnings)} per year (NOI less capex reserve)</td>
            </tr>
            <tr>
              <th>Cash invested</th>
              <td>{usd(out.total_cash_invested)} (down payment, closing, rehab)</td>
            </tr>
            <tr>
              <th>Project basis</th>
              <td>{usd(out.total_project_basis)} (price, closing, rehab)</td>
            </tr>
          </tbody>
        </table>
      )}
    </>
  );
}
