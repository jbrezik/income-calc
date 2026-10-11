import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { kc, signedKc } from "./format";

type Props = {
  /** Pay value -> monthly surplus. */
  surplusAt: (x: number) => number;
  from: number;
  to: number;
  offer: number;
  minimum: number;
  xLabel: string;
};

const thousands = (n: number) => `${Math.round(n / 1000)}k`;

export function SurplusChart({ surplusAt, from, to, offer, minimum, xLabel }: Props) {
  const steps = 60;
  const data = Array.from({ length: steps + 1 }, (_, i) => {
    const x = Math.round(from + ((to - from) * i) / steps);
    return { x, surplus: Math.round(surplusAt(x)) };
  });
  const offerSurplus = surplusAt(offer);
  return (
    <div className="chart" role="img" aria-label={`Přebytek podle: ${xLabel}`}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" />
          <XAxis dataKey="x" type="number" domain={[from, to]} tickFormatter={thousands} stroke="var(--muted)" fontSize={12} />
          <YAxis tickFormatter={thousands} stroke="var(--muted)" fontSize={12} width={44} />
          <Tooltip
            formatter={(v) => [signedKc(Number(v)), "Přebytek / měs"]}
            labelFormatter={(x) => `${xLabel}: ${kc(Number(x))}`}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          <ReferenceLine y={0} stroke="var(--muted)" />
          <ReferenceLine x={minimum} stroke="var(--accent)" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="surplus" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
          {offer >= from && offer <= to && (
            <ReferenceDot x={offer} y={Math.round(offerSurplus)} r={5}
              fill={offerSurplus >= 0 ? "var(--good)" : "var(--bad)"} stroke="none" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
