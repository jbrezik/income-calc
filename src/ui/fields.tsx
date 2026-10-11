import { useId } from "react";

const parse = (raw: string) => Number(raw.replace(/\s/g, "").replace(",", "."));

type NumFieldProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
};

/** Plain number input with a unit suffix. */
export function NumField({ label, value, onChange, step = 1, min = 0, max, suffix = "Kč" }: NumFieldProps) {
  const id = useId();
  return (
    <div className="mb-2">
      <label htmlFor={id} className="form-label small text-body-secondary mb-1">{label}</label>
      <div className="input-group">
        <input id={id} className="form-control text-end num-input" type="number" inputMode="numeric"
          value={value} step={step} min={min} max={max}
          onChange={(e) => { const n = parse(e.target.value); if (Number.isFinite(n)) onChange(n); }} />
        {suffix && <span className="input-group-text">{suffix}</span>}
      </div>
    </div>
  );
}

type StepperProps = NumFieldProps & {
  /** Fixed amounts for the minus/plus buttons, smallest first. */
  steps: [number, number];
  /** Show a range slider under the input. */
  slider?: boolean;
};

const fmtStep = (n: number) => (n >= 1000 ? `${n / 1000}k` : String(n));

/** Centered <-big><-small>[value]<+small><+big> that never wraps, with optional slider. */
export function Stepper({ label, value, onChange, steps, min = 0, max, slider, suffix = "Kč" }: StepperProps) {
  const id = useId();
  const clamp = (n: number) => Math.max(min, max !== undefined && !slider ? Math.min(max, n) : n);
  const btn = (delta: number) => (
    <button type="button" className={`btn stepper-btn ${delta > 0 ? "btn-outline-success" : "btn-outline-danger"}`}
      onClick={() => onChange(clamp(value + delta))} aria-label={`${delta > 0 ? "Přidat" : "Ubrat"} ${Math.abs(delta)} ${suffix}`}>
      {delta > 0 ? "+" : "−"}{fmtStep(Math.abs(delta))}
    </button>
  );
  const [small, big] = steps;
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label small text-body-secondary mb-1 d-block text-center">{label}</label>
      <div className="input-group flex-nowrap stepper">
        {btn(-big)}
        {btn(-small)}
        <input id={id} className="form-control text-center num-input" type="number" inputMode="numeric"
          value={value} min={min} step={small}
          onChange={(e) => { const n = parse(e.target.value); if (Number.isFinite(n)) onChange(clamp(n)); }} />
        <span className="input-group-text">{suffix}</span>
        {btn(small)}
        {btn(big)}
      </div>
      {slider && max !== undefined && (
        <input type="range" className="form-range mt-2" aria-label={label} value={value} step={small} min={min} max={max}
          onChange={(e) => onChange(parse(e.target.value))} />
      )}
    </div>
  );
}

type SwitchProps = { label: string; checked: boolean; onChange: (v: boolean) => void; hideLabel?: boolean; className?: string };

export function Switch({ label, checked, onChange, hideLabel, className = "" }: SwitchProps) {
  const id = useId();
  return (
    <div className={`form-check form-switch mb-0 ${className}`}>
      <input id={id} className="form-check-input" type="checkbox" role="switch" checked={checked}
        onChange={(e) => onChange(e.target.checked)} aria-label={hideLabel ? label : undefined} />
      {!hideLabel && <label htmlFor={id} className="form-check-label">{label}</label>}
    </div>
  );
}
