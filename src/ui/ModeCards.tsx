import type { TaxYear } from "../config/taxYears";
import { minHppGross, minMdRate } from "../engine/solve";
import { hpp, osvc, type OsvcOptions, type Person } from "../engine/tax";
import { Check, NumField } from "./fields";
import { kc, signedKc } from "./format";
import { SurplusChart } from "./SurplusChart";

type Common = { need: number; year: TaxYear; person: Person };

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`row${strong ? " strong" : ""}`}>
      <span>{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}

function Surplus({ value }: { value: number }) {
  return (
    <div className={`surplus ${value >= 0 ? "good" : "bad"}`}>
      {value >= 0 ? "Pokryje, přebytek" : "Nepokryje, chybí"} <strong>{signedKc(value)}</strong> měsíčně
    </div>
  );
}

/** Tax row: negative annual tax is a child bonus paid out. */
function TaxRow({ annualTax }: { annualTax: number }) {
  return annualTax < 0
    ? <Row label="Daňový bonus" value={`+${kc(-annualTax / 12)}`} />
    : <Row label="Daň po slevách" value={`−${kc(annualTax / 12)}`} />;
}

type HppProps = Common & { offer: number; onOffer: (v: number) => void; mdPerYear: number; osvcOpts: OsvcOptions };

export function HppCard({ need, year, person, offer, onOffer, mdPerYear, osvcOpts }: HppProps) {
  const minGross = minHppGross(need, year, person);
  const min = hpp(minGross, year, person);
  const r = hpp(offer, year, person);
  const thresholdMonthly = year.highRateThreshold / 12;
  const equivMd = minMdRate(r.netMonthly, mdPerYear, year, person, osvcOpts);

  return (
    <section className="card mode">
      <h2>HPP <span className="sub">zaměstnanec</span></h2>
      <div className="minimum">
        <div className="label">Minimum k pokrytí</div>
        <div className="big">{kc(minGross)} <span className="sub">hrubého / měs</span></div>
        <div className="sub">čistá {kc(min.netMonthly)} · {kc(min.hourly)}/h · firmu stojí {kc(min.employerCostMonthly)}</div>
      </div>
      <NumField label="Nabídka (hrubá mzda / měs)" value={offer} step={1000} max={Math.max(250000, offer)} slider onChange={onOffer} />
      <Surplus value={r.netMonthly - need} />
      <div className="breakdown">
        <Row label="Hrubá mzda" value={kc(offer)} />
        <Row label="Sociální (7,1 %)" value={`−${kc(r.annual.social / 12)}`} />
        <Row label="Zdravotní (4,5 %)" value={`−${kc(r.annual.health / 12)}`} />
        <TaxRow annualTax={r.annual.tax} />
        <Row label="Čistá mzda" value={kc(r.netMonthly)} strong />
        <Row label="Hodinová sazba" value={`${kc(r.hourly)}/h`} />
        <Row label="Náklad zaměstnavatele" value={kc(r.employerCostMonthly)} />
      </div>
      <p className={`note${r.aboveHighRate ? " warn" : ""}`}>
        {r.aboveHighRate
          ? `Nad hranicí 23 % daně (${kc(thresholdMonthly)} hrubého / měs).`
          : `Hranice 23 % daně: ${kc(thresholdMonthly)} hrubého / měs.`}
      </p>
      <p className="equiv">Stejná čistá jako OSVČ za <strong>{kc(equivMd)}/MD</strong> ({mdPerYear} MD/rok)</p>
      <SurplusChart surplusAt={(g) => hpp(g, year, person).netMonthly - need}
        from={Math.round(minGross * 0.5)} to={Math.round(Math.max(minGross * 1.6, offer * 1.1))}
        offer={offer} minimum={minGross} xLabel="Hrubá mzda" />
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
    <section className="card mode">
      <h2>OSVČ <span className="sub">IČO, paušál {year.osvc.flatExpenseRate * 100} %</span></h2>
      <div className="minimum">
        <div className="label">Minimum k pokrytí</div>
        <div className="big">{kc(minRate)} <span className="sub">/ MD</span></div>
        <div className="sub">{kc(min.hourly)}/h · čistá {kc(min.netMonthly)} / měs</div>
      </div>
      <NumField label="Nabídka (sazba za MD)" value={offer} step={100} max={Math.max(20000, offer)} slider onChange={onOffer} />
      <div className="grid2">
        <NumField label="Fakturované MD za rok" value={mdPerYear} suffix="MD" min={1} max={260} onChange={onMdPerYear} />
        <Check label="Nemocenské pojištění" checked={opts.sickness} onChange={(sickness) => onOpts({ ...opts, sickness })} />
      </div>
      <Surplus value={r.netMonthly - need} />
      <div className="breakdown">
        <Row label="Fakturace" value={kc(r.annual.revenue / 12)} />
        <Row label="Sociální" value={`−${kc(r.annual.social / 12)}`} />
        <Row label="Zdravotní" value={`−${kc(r.annual.health / 12)}`} />
        {opts.sickness && <Row label="Nemocenské" value={`−${kc(r.annual.sickness / 12)}`} />}
        <TaxRow annualTax={r.annual.tax} />
        <Row label="Čistý příjem" value={kc(r.netMonthly)} strong />
        <Row label="Hodinová sazba" value={`${kc(r.hourly)}/h`} />
        <Row label="Obrat za rok" value={kc(r.annual.revenue)} />
      </div>
      {r.vatWarning && (
        <p className="note warn">
          Obrat nad {kc(year.vatThreshold)} za rok: povinná registrace k DPH od dalšího roku. Sazby počítány bez DPH.
        </p>
      )}
      <p className="note">Pojistné počítáno z ročního zisku (přehled), ne ze záloh.</p>
      <p className="equiv">Stejná čistá jako HPP za <strong>{kc(equivGross)}</strong> hrubého / měs</p>
      <SurplusChart surplusAt={(x) => osvc(x, mdPerYear, year, person, opts).netMonthly - need}
        from={Math.round(minRate * 0.5)} to={Math.round(Math.max(minRate * 1.6, offer * 1.1))}
        offer={offer} minimum={minRate} xLabel="Sazba za MD" />
    </section>
  );
}
