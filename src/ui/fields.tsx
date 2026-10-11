import { useId } from "react";

type NumFieldProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Show a range slider under the input. */
  slider?: boolean;
  suffix?: string;
};

export function NumField({ label, value, onChange, step = 1, min = 0, max, slider, suffix = "Kč" }: NumFieldProps) {
  const id = useId();
  const set = (raw: string) => {
    const n = Number(raw.replace(/\s/g, "").replace(",", "."));
    if (Number.isFinite(n)) onChange(n);
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-input">
        <input id={id} type="number" inputMode="numeric" value={value} step={step} min={min} max={max}
          onChange={(e) => set(e.target.value)} />
        <span className="suffix">{suffix}</span>
      </div>
      {slider && max !== undefined && (
        <input type="range" aria-label={label} value={value} step={step} min={min} max={max}
          onChange={(e) => set(e.target.value)} />
      )}
    </div>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
