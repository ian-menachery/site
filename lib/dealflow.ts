// TypeScript port of dealflow's underwriting math (private repo):
// src/dealflow/underwriting/metrics.py, function for function, plus the way
// engine.py:27-58 wires them together. No rounding anywhere, as in the source.
//
// NOI excludes debt service and capex reserve. Cap rate is unlevered and
// capex-free; owner-earnings yield is unlevered but capex-adjusted.

/** Monthly fully-amortizing payment: P·r / (1 − (1 + r)^−n), r monthly, n months. */
export function mortgagePayment(loanAmount: number, annualRate: number, termYears: number): number {
  const n = termYears * 12;
  if (n <= 0) return 0;
  if (annualRate === 0) return loanAmount / n;
  const r = annualRate / 12;
  return (loanAmount * r) / (1 - (1 + r) ** -n);
}

/** NOI = gross annual rent × (1 − vacancy) − operating expenses. */
export function netOperatingIncome(
  grossAnnualRent: number,
  vacancyRate: number,
  operatingExpensesAnnual: number,
): number {
  const effectiveGrossIncome = grossAnnualRent * (1 - vacancyRate);
  return effectiveGrossIncome - operatingExpensesAnnual;
}

/** NOI / price; null if price is non-positive. */
export function capRate(noi: number, purchasePrice: number): number | null {
  if (purchasePrice <= 0) return null;
  return noi / purchasePrice;
}

export function annualCashFlow(noi: number, annualDebtService: number): number {
  return noi - annualDebtService;
}

/** (NOI − debt service − capex) / cash invested; null if no cash is invested. */
export function cashOnCash(
  noi: number,
  annualDebtService: number,
  capexReserveAnnual: number,
  totalCashInvested: number,
): number | null {
  if (totalCashInvested <= 0) return null;
  return (noi - annualDebtService - capexReserveAnnual) / totalCashInvested;
}

/** NOI / debt service; null for zero debt service (all cash): "N/A", never 0. */
export function dscr(noi: number, annualDebtService: number): number | null {
  if (annualDebtService === 0) return null;
  return noi / annualDebtService;
}

export function ownerEarnings(noi: number, capexReserveAnnual: number): number {
  return noi - capexReserveAnnual;
}

/** Owner earnings / (price + closing + rehab); null if the basis is non-positive. */
export function ownerEarningsYield(ownerEarningsValue: number, totalProjectBasis: number): number | null {
  if (totalProjectBasis <= 0) return null;
  return ownerEarningsValue / totalProjectBasis;
}

export type DealInputs = {
  purchase_price: number;
  gross_monthly_rent: number;
  vacancy_rate: number; // fraction
  operating_expenses_annual: number;
  capex_reserve_annual: number;
  closing_costs: number;
  rehab_cost: number;
  down_payment_rate: number; // fraction
  interest_rate: number; // annual, fraction
  loan_term_years: number;
};

export type DealOutputs = {
  gross_annual_rent: number;
  down_payment: number;
  loan_amount: number;
  monthly_payment: number;
  annual_debt_service: number;
  total_cash_invested: number;
  total_project_basis: number;
  noi: number;
  cap_rate: number | null;
  annual_cash_flow: number;
  cash_on_cash: number | null;
  dscr: number | null;
  owner_earnings: number;
  owner_earnings_yield: number | null;
};

/** engine.underwrite's arithmetic, with opex, capex and closing as dollar amounts. */
export function underwrite(i: DealInputs): DealOutputs {
  const gross_annual_rent = i.gross_monthly_rent * 12;
  const down_payment = i.purchase_price * i.down_payment_rate;
  const loan_amount = i.purchase_price - down_payment;
  const monthly_payment = mortgagePayment(loan_amount, i.interest_rate, i.loan_term_years);
  const annual_debt_service = monthly_payment * 12;
  const total_cash_invested = down_payment + i.closing_costs + i.rehab_cost;
  const total_project_basis = i.purchase_price + i.closing_costs + i.rehab_cost;

  const noi = netOperatingIncome(gross_annual_rent, i.vacancy_rate, i.operating_expenses_annual);
  const owner_earnings = ownerEarnings(noi, i.capex_reserve_annual);
  return {
    gross_annual_rent,
    down_payment,
    loan_amount,
    monthly_payment,
    annual_debt_service,
    total_cash_invested,
    total_project_basis,
    noi,
    cap_rate: capRate(noi, i.purchase_price),
    annual_cash_flow: annualCashFlow(noi, annual_debt_service),
    cash_on_cash: cashOnCash(noi, annual_debt_service, i.capex_reserve_annual, total_cash_invested),
    dscr: dscr(noi, annual_debt_service),
    owner_earnings,
    owner_earnings_yield: ownerEarningsYield(owner_earnings, total_project_basis),
  };
}
