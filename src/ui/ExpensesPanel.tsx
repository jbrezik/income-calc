import type { Expense, Household } from "../engine/need";
import { monthlyNeed } from "../engine/need";
import { NumField } from "./fields";
import { kc } from "./format";
import { Panel } from "./Panel";

type Props = {
  household: Household;
  onChange: (h: Household) => void;
  open: boolean;
  onToggle: (open: boolean) => void;
};

export function ExpensesPanel({ household: h, onChange, open, onToggle }: Props) {
  const setExpense = (id: string, patch: Partial<Expense>) =>
    onChange({ ...h, expenses: h.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  const remove = (id: string) => onChange({ ...h, expenses: h.expenses.filter((e) => e.id !== id) });
  const add = () =>
    onChange({ ...h, expenses: [...h.expenses, { id: `e${Date.now()}`, name: "Nová položka", amount: 0, enabled: true }] });
  const enabledTotal = h.expenses.filter((e) => e.enabled).reduce((s, e) => s + e.amount, 0);

  const need = <>Potřebuji čistého <strong>{kc(monthlyNeed(h))}</strong> měsíčně</>;

  return (
    <Panel title="Výdaje domácnosti" summary={need} open={open} onToggle={onToggle}>
      <table className="expenses">
        <tbody>
          {h.expenses.map((e) => (
            <tr key={e.id} className={e.enabled ? "" : "off"}>
              <td>
                <input type="checkbox" aria-label={`Zahrnout ${e.name}`} checked={e.enabled}
                  onChange={(ev) => setExpense(e.id, { enabled: ev.target.checked })} />
              </td>
              <td>
                <input className="name" aria-label="Název" value={e.name}
                  onChange={(ev) => setExpense(e.id, { name: ev.target.value })} />
              </td>
              <td>
                <input className="amount" type="number" aria-label={`Částka ${e.name}`} value={e.amount} step={100}
                  onChange={(ev) => setExpense(e.id, { amount: Number(ev.target.value) || 0 })} />
              </td>
              <td>
                <button className="ghost" aria-label={`Odebrat ${e.name}`} onClick={() => remove(e.id)}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td><button className="ghost" onClick={add}>+ Přidat položku</button></td>
            <td className="num">{kc(enabledTotal)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
      <div className="grid3">
        <NumField label="Jídlo a domácnost" value={h.groceries} step={1000} onChange={(groceries) => onChange({ ...h, groceries })} />
        <NumField label="Spoření" value={h.savings} step={1000} max={60000} slider onChange={(savings) => onChange({ ...h, savings })} />
        <NumField label="Příjem partnera (čistý)" value={h.partnerNet} step={1000} onChange={(partnerNet) => onChange({ ...h, partnerNet })} />
      </div>
      <p className="need">{need}</p>
    </Panel>
  );
}
