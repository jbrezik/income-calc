import { TAX_YEARS } from "./config/taxYears";
import { monthlyNeed } from "./engine/need";
import type { Person } from "./engine/tax";
import { DEFAULTS, type AppState } from "./state";
import { ExpensesPanel } from "./ui/ExpensesPanel";
import { Check, NumField } from "./ui/fields";
import { kc } from "./ui/format";
import { ImportExport } from "./ui/ImportExport";
import { HppCard, OsvcCard } from "./ui/ModeCards";
import { Panel } from "./ui/Panel";
import { useStoredState } from "./ui/useStoredState";

const childrenLabel = (n: number) => `${n} ${n === 1 ? "dítě" : n >= 2 && n <= 4 ? "děti" : "dětí"}`;

export function App() {
  const [s, setS] = useStoredState<AppState>("income-calc:v1", DEFAULTS);
  const set = (patch: Partial<AppState>) => setS((prev) => ({ ...prev, ...patch }));
  const year = TAX_YEARS[s.year] ?? TAX_YEARS[2026];
  const person: Person = {
    children: s.claimChildren ? s.children : 0,
    mortgageInterest: s.mortgageInterest,
    homeBefore2021: s.homeBefore2021,
  };
  const need = monthlyNeed(s.household);
  const osvcOpts = { sickness: s.sickness };

  return (
    <main>
      <header>
        <h1>Kalkulačka příjmu</h1>
        <div className="header-actions">
          <label>
            Daňový rok{" "}
            <select value={year.year} onChange={(e) => set({ year: Number(e.target.value) })}>
              {Object.keys(TAX_YEARS).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <ImportExport state={s} onImport={setS} />
          <button className="ghost" onClick={() => setS(DEFAULTS)}>Obnovit výchozí</button>
        </div>
      </header>

      <div className="top">
        <ExpensesPanel household={s.household} onChange={(household) => set({ household })}
          open={s.openPanels.expenses} onToggle={(expenses) => set({ openPanels: { ...s.openPanels, expenses } })} />
        <Panel title="Daňové slevy a odpočty" open={s.openPanels.tax}
          onToggle={(tax) => set({ openPanels: { ...s.openPanels, tax } })}
          summary={`${childrenLabel(person.children)}, úroky z hypotéky ${kc(s.mortgageInterest)}/rok`}>
          <Check label="Uplatňuji slevu na děti" checked={s.claimChildren} onChange={(claimChildren) => set({ claimChildren })} />
          <NumField label="Počet dětí" value={s.children} suffix="" min={0} max={10} onChange={(children) => set({ children: Math.max(0, Math.round(children)) })} />
          <NumField label="Úroky z hypotéky za rok" value={s.mortgageInterest} step={1000} onChange={(mortgageInterest) => set({ mortgageInterest })} />
          <Check label="Bydlení pořízeno před 2021 (strop 300 000 Kč)" checked={s.homeBefore2021} onChange={(homeBefore2021) => set({ homeBefore2021 })} />
          <p className="note">Sleva na poplatníka {year.creditTaxpayer.toLocaleString("cs-CZ")} Kč/rok vždy. Výpočet ročně (roční zúčtování / přiznání).</p>
        </Panel>
      </div>

      <div className="modes">
        <HppCard need={need} year={year} person={person} offer={s.offerHpp} onOffer={(offerHpp) => set({ offerHpp })}
          mdPerYear={s.mdPerYear} osvcOpts={osvcOpts} />
        <OsvcCard need={need} year={year} person={person} offer={s.offerMd} onOffer={(offerMd) => set({ offerMd })}
          mdPerYear={s.mdPerYear} onMdPerYear={(mdPerYear) => set({ mdPerYear: Math.max(1, Math.round(mdPerYear)) })}
          opts={osvcOpts} onOpts={(o) => set({ sickness: o.sickness })} />
      </div>
    </main>
  );
}
