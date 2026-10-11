import type { TaxYear } from "../config/taxYears";
import { minHppGross, minMdRate } from "../engine/solve";
import { hpp, osvc, type OsvcOptions, type Person } from "../engine/tax";
import { NumField, Stepper, Switch } from "./fields";
import { kc, signedKc } from "./format";
import { SurplusChart } from "./SurplusChart";

type Common = { need: number; year: TaxYear; person: Person };

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr className={strong ? "fw-bold" : ""}>
      <td>{label}</td>
      <td className="text-end text-nowrap">{value}</td>
    </tr>
  );
}

/** Tax row: negative annual tax is a child bonus paid out. */
function TaxRow({ annualTax }: { annualTax: number }) {
  return annualTax < 0
    ? <Row label="Daňový bonus" value={`+${kc(-annualTax / 12)}`} />
    : <Row label="Daň po slevách" value={`−${kc(annualTax / 12)}`} />;
}

function Surplus({ value }: { value: number }) {
  const ok = value >= 0;
  return (
    <div className={`alert ${ok ? "alert-success" : "alert-danger"} py-2 d-flex align-items-center gap-2`}>
      <i className={`bi ${ok ? "bi-check-circle" : "bi-exclamation-circle"}`} aria-hidden />
      <span>{ok ? "Pokryje, přebytek" : "Nepokryje, chybí"} <strong>{signedKc(value)}</strong> měsíčně</span>
    </div>
  );
}

function Minimum({ value, unit, detail }: { value: string; unit: string; detail: string }) {
  return (
    <div className="border-start border-4 border-primary ps-3 mb-3">
      <div className="small text-body-secondary">Minimum k pokrytí</div>
      <div className="fs-3 fw-bold font-monospace-num">{value} <span className="fs-6 fw-normal text-body-secondary">{unit}</span></div>
      <div className="small text-body-secondary">{detail}</div>
    </div>
  );
}

type HppProps = Common & { offer: number; onOffer: (v: number) => void; mdPerYear: number; osvcOpts: OsvcOptions };

export function HppCard({ need, year, person, offer, onOffer, mdPerYear, osvcOpts }: HppProps) {
  const minGross = minHppGross(need, year, person);
  const min = hpp(minGross, year, person);
  const r = hpp(offer, year, person);
  const thresholdMonthly = year.highRateThreshold / 12;
  const equivMd = minMdRate(r.netMonthly, mdPerYear, year, person, osvcOpts);

  return (
    <section className="card shadow-sm h-100">
      <div className="card-header bg-transparent d-flex align-items-center gap-2">
        <i className="bi bi-briefcase text-primary" aria-hidden />
        <h2 className="h5 mb-0">HPP</h2>
        <span className="text-body-secondary">zaměstnanec</span>
      </div>
      <div className="card-body">
        <Minimum value={kc(minGross)} unit="hrubého / měs"
          detail={`čistá ${kc(min.netMonthly)} · ${kc(min.hourly)}/h · firmu stojí ${kc(min.employerCostMonthly)}`} />
        <Stepper label="Nabídka (hrubá mzda / měs)" value={offer} steps={[500, 1000]} max={Math.max(250000, offer)} slider large
          onChange={onOffer} />
        <Surplus value={r.netMonthly - need} />
        <table className="table table-sm">
          <tbody>
            <Row label="Hrubá mzda" value={kc(offer)} />
            <Row label="Sociální (7,1 %)" value={`−${kc(r.annual.social / 12)}`} />
            <Row label="Zdravotní (4,5 %)" value={`−${kc(r.annual.health / 12)}`} />
            <TaxRow annualTax={r.annual.tax} />
            <Row label="Čistá mzda" value={kc(r.netMonthly)} strong />
            <Row label="Hodinová sazba" value={`${kc(r.hourly)}/h`} />
            <Row label="Náklad zaměstnavatele" value={kc(r.employerCostMonthly)} />
          </tbody>
        </table>
        <p className={`small mb-2 ${r.aboveHighRate ? "text-warning-emphasis" : "text-body-secondary"}`}>
          <i className="bi bi-info-circle me-1" aria-hidden />
          {r.aboveHighRate
            ? `Nad hranicí 23 % daně (${kc(thresholdMonthly)} hrubého / měs).`
            : `Hranice 23 % daně: ${kc(thresholdMonthly)} hrubého / měs.`}
        </p>
        <p className="mb-2"><i className="bi bi-arrow-left-right me-1 text-primary" aria-hidden />
          Stejná čistá jako OSVČ za <strong>{kc(equivMd)}/MD</strong> ({mdPerYear} MD/rok)</p>
        <SurplusChart surplusAt={(g) => hpp(g, year, person).netMonthly - need}
          from={Math.round(minGross * 0.5)} to={Math.round(Math.max(minGross * 1.6, offer * 1.1))}
          offer={offer} minimum={minGross} xLabel="Hrubá mzda" onPick={onOffer} snap={500} />
      </div>
    </section>
  );
}

type OsvcProps = Common & {
  offer: number;
  onOffer: (v: number) => void;
  mdPerYear: number;
  onMdPerYear: (v: number) => void;
  opts: OsvcOptions;
  onOpts: (o: OsvcOptions) => void;
};

export function OsvcCard({ need, year, person, offer, onOffer, mdPerYear, onMdPerYear, opts, onOpts }: OsvcProps) {
  const minRate = minMdRate(need, mdPerYear, year, person, opts);
  const min = osvc(minRate, mdPerYear, year, person, opts);
  const r = osvc(offer, mdPerYear, year, person, opts);
  const equivGross = minHppGross(r.netMonthly, year, person);

  return (
    <section className="card shadow-sm h-100">
      <div className="card-header bg-transparent d-flex align-items-center gap-2">
        <i className="bi bi-person-workspace text-primary" aria-hidden />
        <h2 className="h5 mb-0">OSVČ</h2>
        <span className="text-body-secondary">IČO, paušál {year.osvc.flatExpenseRate * 100} %</span>
      </div>
      <div className="card-body">
        <Minimum value={kc(minRate)} unit="/ MD" detail={`${kc(min.hourly)}/h · čistá ${kc(min.netMonthly)} / měs`} />
        <Stepper label="Nabídka (sazba za MD)" value={offer} steps={[100, 500]} max={Math.max(20000, offer)} slider large
          onChange={onOffer} />
        <div className="row g-2 align-items-end mb-2">
          <div className="col-sm-6">
            <NumField label="Fakturované MD za rok" value={mdPerYear} suffix="MD" min={1} max={260} onChange={onMdPerYear} />
          </div>
          <div className="col-sm-6 pb-3">
            <Switch label="Nemocenské pojištění" checked={opts.sickness} onChange={(sickness) => onOpts({ ...opts, sickness })} />
          </div>
        </div>
        <Surplus value={r.netMonthly - need} />
        <table className="table table-sm">
          <tbody>
            <Row label="Fakturace" value={kc(r.annual.revenue / 12)} />
            <Row label="Sociální" value={`−${kc(r.annual.social / 12)}`} />
            <Row label="Zdravotní" value={`−${kc(r.annual.health / 12)}`} />
            {opts.sickness && <Row label="Nemocenské" value={`−${kc(r.annual.sickness / 12)}`} />}
            <TaxRow annualTax={r.annual.tax} />
            <Row label="Čistý příjem" value={kc(r.netMonthly)} strong />
            <Row label="Hodinová sazba" value={`${kc(r.hourly)}/h`} />
            <Row label="Obrat za rok" value={kc(r.annual.revenue)} />
          </tbody>
        </table>
        {r.vatWarning && (
          <p className="small text-warning-emphasis mb-2">
            <i className="bi bi-exclamation-triangle me-1" aria-hidden />
            Obrat nad {kc(year.vatThreshold)} za rok: povinná registrace k DPH od dalšího roku. Sazby počítány bez DPH.
          </p>
        )}
        <p className="small text-body-secondary mb-2">
          <i className="bi bi-info-circle me-1" aria-hidden />Pojistné počítáno z ročního zisku (přehled), ne ze záloh.
        </p>
        <p className="mb-2"><i className="bi bi-arrow-left-right me-1 text-primary" aria-hidden />
          Stejná čistá jako HPP za <strong>{kc(equivGross)}</strong> hrubého / měs</p>
        <SurplusChart surplusAt={(x) => osvc(x, mdPerYear, year, person, opts).netMonthly - need}
          from={Math.round(minRate * 0.5)} to={Math.round(Math.max(minRate * 1.6, offer * 1.1))}
          offer={offer} minimum={minRate} xLabel="Sazba za MD" onPick={onOffer} snap={100} />
      </div>
    </section>
  );
}
