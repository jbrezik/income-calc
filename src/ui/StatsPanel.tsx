import { taxYearFor } from "../config/taxYears";
import { HOURS_PER_DAY } from "../engine/calendar";
import { osvcFromRevenue, type OsvcOptions, type Person } from "../engine/tax";
import { emptyWorkYear, yearStats, type WorkYear, type YearStats } from "../engine/worklog";
import { kc, signedKc } from "./format";
import { Panel } from "./Panel";

const MONTHS = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"];
const pct = (x: number) => `${Math.round(x * 100)} %`;
const num = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

type Props = {
  worklog: WorkYear[];
  onChange: (w: WorkYear[]) => void;
  need: number;
  person: Person;
  osvcOpts: OsvcOptions;
  /** Use a year's projected MD count and last rate in the OSVČ card. */
  onApply: (mdPerYear: number, mdRate: number) => void;
  open: boolean;
  onToggle: (open: boolean) => void;
};

/** Stats per year; each year falls back to the previous year's utilization and rate for projection. */
function allStats(worklog: WorkYear[]): Map<number, YearStats> {
  const out = new Map<number, YearStats>();
  let prev: YearStats | undefined;
  for (const w of [...worklog].sort((a, b) => a.year - b.year)) {
    prev = yearStats(w, prev && { utilization: prev.utilization, rate: prev.lastRate });
    out.set(w.year, prev);
  }
  return out;
}

type MonthInputProps = { value: number | null; placeholder: number; label: string; onChange: (v: number | null) => void };

function MonthInput({ value, placeholder, label, onChange }: MonthInputProps) {
  return (
    <input className="form-control form-control-sm text-end cell-input" type="number" min={0} aria-label={label}
      value={value ?? ""} placeholder={String(placeholder)}
      onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))} />
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="col">
      <div className="border rounded-3 p-2 h-100">
        <div className="small text-body-secondary">{label}</div>
        <div className="fw-bold">{value}</div>
        {sub && <div className="small text-body-secondary">{sub}</div>}
      </div>
    </div>
  );
}

type YearCardProps = {
  w: WorkYear;
  s: YearStats;
  need: number;
  person: Person;
  osvcOpts: OsvcOptions;
  onChange: (w: WorkYear) => void;
  onRemove: () => void;
  onApply: Props["onApply"];
};

function YearCard({ w, s, need, person, osvcOpts, onChange, onRemove, onApply }: YearCardProps) {
  const tax = taxYearFor(w.year);
  const net = osvcFromRevenue(s.total.revenue, tax, person, osvcOpts).netMonthly;
  const surplus = net - need;
  const md = Math.round(s.total.hours / HOURS_PER_DAY);
  const setMonth = (key: "hours" | "rates", i: number, v: number | null) =>
    onChange({ ...w, [key]: w[key].map((x, j) => (j === i ? v : x)) });
  const hasProjection = s.months.some((m) => m.projected);

  return (
    <div className="card mb-3">
      <div className="card-header d-flex flex-wrap align-items-center gap-2 bg-body-tertiary">
        <h3 className="h6 mb-0 me-auto"><i className="bi bi-calendar3 me-2" aria-hidden />{w.year}</h3>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => onApply(md, Math.round(s.lastRate * HOURS_PER_DAY))}>
          <i className="bi bi-box-arrow-in-down-right me-1" aria-hidden />Převzít do OSVČ ({md} MD, {kc(s.lastRate * HOURS_PER_DAY)}/MD)
        </button>
        <button type="button" className="btn btn-link btn-sm text-body-secondary p-0 icon-btn" aria-label={`Odebrat rok ${w.year}`}
          onClick={() => { if (confirm(`Odebrat rok ${w.year}?`)) onRemove(); }}>
          <i className="bi bi-x-lg" aria-hidden />
        </button>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-sm align-middle stats-table mb-2">
            <thead>
              <tr>
                <th scope="col" />
                {MONTHS.map((m) => <th scope="col" key={m} className="text-end">{m}</th>)}
                <th scope="col" className="text-end">Rok</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-body-secondary small">
                <th scope="row" className="fw-normal">Fond hodin</th>
                {s.months.map((m) => <td key={m.month} className="text-end">{m.available}</td>)}
                <td className="text-end">{s.total.available}</td>
              </tr>
              <tr>
                <th scope="row">Hodiny</th>
                {s.months.map((m, i) => (
                  <td key={m.month}>
                    <MonthInput value={w.hours[i]} placeholder={m.hours} label={`Hodiny ${MONTHS[i]} ${w.year}`}
                      onChange={(v) => setMonth("hours", i, v)} />
                  </td>
                ))}
                <td className="text-end fw-semibold">{num.format(s.total.hours)}</td>
              </tr>
              <tr>
                <th scope="row">Sazba Kč/h</th>
                {s.months.map((m, i) => (
                  <td key={m.month}>
                    <MonthInput value={w.rates[i]} placeholder={m.rate} label={`Sazba ${MONTHS[i]} ${w.year}`}
                      onChange={(v) => setMonth("rates", i, v)} />
                  </td>
                ))}
                <td className="text-end fw-semibold">{num.format(s.avgRate)}</td>
              </tr>
              <tr>
                <th scope="row">Fakturace</th>
                {s.months.map((m) => (
                  <td key={m.month} className={`text-end small ${m.projected ? "fst-italic text-body-secondary" : ""}`}>
                    {num.format(m.revenue / 1000)}k
                  </td>
                ))}
                <td className="text-end fw-semibold">{num.format(s.total.revenue / 1000)}k</td>
              </tr>
            </tbody>
          </table>
        </div>
        {hasProjection && (
          <p className="small text-body-secondary">
            <i className="bi bi-graph-up-arrow me-1" aria-hidden />
            Kurzívou projekce: fond hodin × využití {pct(s.utilization)} × poslední sazba. Prázdná pole doplňte skutečností.
          </p>
        )}
        <div className="row row-cols-2 row-cols-md-3 row-cols-xl-6 g-2">
          <Tile label="Odpracováno" value={`${num.format(s.actual.hours)} h`} sub={`z ${num.format(s.actual.available)} h fondu`} />
          <Tile label="Využití" value={pct(s.utilization)} sub="hodin z fondu" />
          <Tile label="Průměrná sazba" value={`${kc(s.avgRate)}/h`} sub={`${kc(s.avgRate * HOURS_PER_DAY)}/MD`} />
          <Tile label="Fakturace skutečná" value={kc(s.actual.revenue)} />
          <Tile label={hasProjection ? "Projekce roku" : "Fakturace rok"} value={kc(s.total.revenue)} sub={`${md} MD`} />
          <Tile label="Čistá měs. průměr" value={kc(net)} sub={`${signedKc(surplus)} vs potřeba`} />
        </div>
        {tax.year !== w.year && (
          <p className="small text-body-secondary mt-2 mb-0">Daň a pojistné podle pravidel {tax.year}.</p>
        )}
      </div>
    </div>
  );
}

export function StatsPanel({ worklog, onChange, need, person, osvcOpts, onApply, open, onToggle }: Props) {
  const stats = allStats(worklog);
  const years = [...worklog].sort((a, b) => b.year - a.year);
  const addYear = () => {
    const next = worklog.length ? Math.max(...worklog.map((w) => w.year)) + 1 : new Date().getFullYear();
    onChange([...worklog, emptyWorkYear(next)]);
  };
  const addPrevYear = () => {
    const prev = worklog.length ? Math.min(...worklog.map((w) => w.year)) - 1 : new Date().getFullYear() - 1;
    onChange([...worklog, emptyWorkYear(prev)]);
  };
  const latest = years[0] && stats.get(years[0].year);

  return (
    <Panel title="Statistiky: odpracované hodiny a sazby" icon="bi-bar-chart-line" open={open} onToggle={onToggle}
      summary={latest && `${years[0].year}: projekce ${kc(latest.total.revenue)}, využití ${pct(latest.utilization)}`}>
      {years.map((w) => (
        <YearCard key={w.year} w={w} s={stats.get(w.year)!} need={need} person={person} osvcOpts={osvcOpts} onApply={onApply}
          onChange={(nw) => onChange(worklog.map((x) => (x.year === w.year ? nw : x)))}
          onRemove={() => onChange(worklog.filter((x) => x.year !== w.year))} />
      ))}
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={addYear}>
          <i className="bi bi-plus-lg me-1" aria-hidden />Přidat další rok
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addPrevYear}>
          <i className="bi bi-plus-lg me-1" aria-hidden />Přidat předchozí rok
        </button>
      </div>
    </Panel>
  );
}
