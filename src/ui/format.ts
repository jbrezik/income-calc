const czk = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

export const kc = (n: number) => `${czk.format(Math.round(n))} Kč`;
export const signedKc = (n: number) => `${n >= 0 ? "+" : "−"}${kc(Math.abs(n))}`;
