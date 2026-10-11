import { TAX_YEARS } from "./config/taxYears";
import { monthlyNeed } from "./engine/need";
import type { Person } from "./engine/tax";
import { DEFAULTS, parseState, type AppState } from "./state";
import { NumField, Switch } from "./ui/fields";
import { kc } from "./ui/format";
import { HouseholdPanel } from "./ui/HouseholdPanel";
import { ImportExport } from "./ui/ImportExport";
import { HppCard, OsvcCard } from "./ui/ModeCards";
import { Panel } from "./ui/Panel";
import { StatsPanel } from "./ui/StatsPanel";
import { useStoredState } from "./ui/useStoredState";

const childrenLabel = (n: number) => `${n} ${n === 1 ? "dítě" : n >= 2 && n <= 4 ? "děti" : "dětí"}`;

export function App() {
  const [s, setS] = useStoredState<AppState>("income-calc:v1", DEFAULTS, parseState);
  const set = (patch: Partial<AppState>) => setS((prev) => ({ ...prev, ...patch }));
  const setPanel = (key: keyof AppState["openPanels"]) => (open: boolean) =>
    setS((prev) => ({ ...prev, openPanels: { ...prev.openPanels, [key]: open } }));
  const year = TAX_YEARS[s.year] ?? TAX_YEARS[2026];
  const person: Person = {
    children: s.claimChildren ? s.children : 0,
    mortgageInterest: s.mortgageInterest,
    homeBefore2021: s.homeBefore2021,
  };
  const need = monthlyNeed(s.household);
  const osvcOpts = { sickness: s.sickness };

  return (
    <main className="container-xl py-3">
      <header className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0"><i className="bi bi-calculator me-2 text-primary" aria-hidden />Kalkulačka příjmu</h1>
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          <div className="input-group input-group-sm w-auto">
            <label className="input-group-text" htmlFor="tax-year">Daňový rok</label>
            <select id="tax-year" className="form-select" value={year.year} onChange={(e) => set({ year: Number(e.target.value) })}>
              {Object.keys(TAX_YEARS).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <ImportExport state={s} onImport={setS} />
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setS(DEFAULTS)}>
            <i className="bi bi-arrow-counterclockwise me-1" aria-hidden />Obnovit výchozí
          </button>
        </div>
      </header>

      <div className="vstack gap-3">
        <HouseholdPanel household={s.household} onChange={(household) => set({ household })}
          open={s.openPanels.expenses} onToggle={setPanel("expenses")} />

        <Panel title="Daňové slevy a odpočty" icon="bi-percent" open={s.openPanels.tax} onToggle={setPanel("tax")}
          summary={`${childrenLabel(person.children)}, úroky z hypotéky ${kc(s.mortgageInterest)}/rok`}>
          <h3 className="h6 text-uppercase text-body-secondary mb-2"><i className="bi bi-people me-1" aria-hidden />Děti</h3>
          <div className="row g-3 align-items-end">
            <div className="col-sm-6 col-lg-3">
              <NumField label="Počet dětí" value={s.children} suffix="" min={0} max={10}
                onChange={(children) => set({ children: Math.max(0, Math.round(children)) })} />
            </div>
            <div className="col-sm-6 col-lg-4 pb-3">
              <Switch label="Uplatňuji slevu na děti" checked={s.claimChildren} onChange={(claimChildren) => set({ claimChildren })} />
            </div>
          </div>
          <hr className="my-3" />
          <h3 className="h6 text-uppercase text-body-secondary mb-2"><i className="bi bi-bank me-1" aria-hidden />Hypotéka</h3>
          <div className="row g-3 align-items-end">
            <div className="col-sm-6 col-lg-3">
              <NumField label="Úroky z hypotéky za rok" value={s.mortgageInterest} step={1000}
                onChange={(mortgageInterest) => set({ mortgageInterest })} />
            </div>
            <div className="col-sm-6 col-lg-5 pb-3">
              <Switch label="Bydlení pořízeno před 2021 (strop 300 000 Kč)" checked={s.homeBefore2021}
                onChange={(homeBefore2021) => set({ homeBefore2021 })} />
            </div>
          </div>
          <p className="small text-body-secondary mb-0 mt-2">
            Sleva na poplatníka {kc(year.creditTaxpayer)}/rok vždy. Výpočet ročně (roční zúčtování / přiznání).
          </p>
        </Panel>

        <div className="row g-3">
          <div className="col-lg-6">
            <HppCard need={need} year={year} person={person} offer={s.offerHpp} onOffer={(offerHpp) => set({ offerHpp })}
              mdPerYear={s.mdPerYear} osvcOpts={osvcOpts} />
          </div>
          <div className="col-lg-6">
            <OsvcCard need={need} year={year} person={person} offer={s.offerMd} onOffer={(offerMd) => set({ offerMd })}
              mdPerYear={s.mdPerYear} onMdPerYear={(mdPerYear) => set({ mdPerYear: Math.max(1, Math.round(mdPerYear)) })}
              opts={osvcOpts} onOpts={(o) => set({ sickness: o.sickness })} />
          </div>
        </div>

        <StatsPanel worklog={s.worklog} onChange={(worklog) => set({ worklog })} need={need} person={person} osvcOpts={osvcOpts}
          onApply={(mdPerYear, offerMd) => set({ mdPerYear, offerMd })} open={s.openPanels.stats} onToggle={setPanel("stats")} />
      </div>
    </main>
  );
}
