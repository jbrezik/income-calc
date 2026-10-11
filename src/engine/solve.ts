import type { TaxYear } from "../config/taxYears";
import { hpp, osvc, type OsvcOptions, type Person } from "./tax";

const MAX = 10_000_000;

/** Smallest whole-CZK x in [0, MAX] with net(x) >= need. Net must be non-decreasing in x;
 * the 100 CZK tax-base rounding adds wobbles of a few CZK, which only shift the answer by that much. */
function minCovering(net: (x: number) => number, need: number): number {
  let lo = 0;
  let hi = MAX;
  if (net(lo) >= need) return lo;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (net(mid) >= need) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** Minimum monthly HPP gross whose net covers `needMonthly`. */
export const minHppGross = (needMonthly: number, year: TaxYear, p: Person) =>
  minCovering((g) => hpp(g, year, p).netMonthly, needMonthly);

/** Minimum OSVČ MD rate whose net covers `needMonthly`. */
export const minMdRate = (needMonthly: number, mdPerYear: number, year: TaxYear, p: Person, opts: OsvcOptions) =>
  minCovering((r) => osvc(r, mdPerYear, year, p, opts).netMonthly, needMonthly);
