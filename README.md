# Kalkulačka příjmu

Interactive Czech calculator: what pay covers a household's monthly expenses, as an employee (HPP: gross, net, hourly, employer cost) or self-employed (OSVČ with 60 % flat-rate expenses: MD rate, hourly).

- Toggle, edit, add and remove expense items; set groceries, savings and partner's net income.
- Solver shows the minimum HPP gross and OSVČ MD rate that cover the need; dial in an offer to see surplus or deficit.
- HPP vs OSVČ equivalence both ways, surplus charts, 23 % tax band and VAT threshold warnings.
- Child credits and bonus, mortgage interest deduction, tax years 2026 and 2027.
- Inputs stay in the browser (localStorage). Export and import them as JSON; any subset of fields works, the rest falls back to the sample defaults.

## Run

VS Code task `Review: income calculator`, or `npm install` and `npm run dev`. Tests: `npm test`.

## Tax data

Rates live in `src/config/taxYears.ts`, with sources in `docs/research/cz-tax-2026.md`. Not tax advice.

## JSON format

```json
{
  "year": 2026,
  "children": 2,
  "mortgageInterest": 0,
  "mdPerYear": 200,
  "offerMd": 7000,
  "household": {
    "groceries": 15000,
    "savings": 5000,
    "partnerNet": 25000,
    "expenses": [{ "name": "Hypotéka", "amount": 25000, "enabled": true }]
  }
}
```

Other keys: `claimChildren`, `homeBefore2021`, `sickness`, `offerHpp`.
