import { useState, type DragEvent } from "react";
import type { Category, Household, Item } from "../engine/need";
import { categoryTotal, expensesTotal, incomesTotal, monthlyNeed, moveItem } from "../engine/need";
import { Stepper, Switch } from "./fields";
import { kc } from "./format";
import { Panel } from "./Panel";

const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Drop position: before item `before` in category `cat`; null = end of the category. */
type DropTarget = { cat: string; before: string | null };

/** Drag-and-drop wiring shared by all category lists. Rows drag only from their grip handle. */
type Dnd = {
  categoryId: string;
  armed: string | null;
  dragging: string | null;
  over: DropTarget | null;
  arm: (id: string | null) => void;
  start: (id: string) => void;
  hover: (t: DropTarget) => void;
  drop: (t: DropTarget) => void;
  end: () => void;
};

/** Handlers that make an element a drop target. Stops propagation so the card-level target doesn't override rows. */
function dropZone(dnd: Dnd | undefined, before: string | null) {
  if (!dnd) return {};
  const target = { cat: dnd.categoryId, before };
  return {
    onDragOver: (e: DragEvent) => {
      if (!dnd.dragging) return;
      e.preventDefault();
      e.stopPropagation();
      if (dnd.over?.cat !== target.cat || dnd.over.before !== before) dnd.hover(target);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dnd.drop(target);
    },
  };
}

type ItemListProps = {
  items: Item[];
  onChange: (items: Item[]) => void;
  addLabel: string;
  /** Category is switched off: render items dimmed. */
  muted?: boolean;
  dnd?: Dnd;
};

/** Rows of name + amount with per-row switch and remove, plus an add link. */
function ItemList({ items, onChange, addLabel, muted, dnd }: ItemListProps) {
  const set = (id: string, patch: Partial<Item>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const isOver = (before: string | null) => dnd?.over?.cat === dnd?.categoryId && dnd?.over?.before === before;
  return (
    <ul className={`list-group list-group-flush list-group-dashed${muted ? " opacity-50" : ""}`}>
      {items.map((i) => (
        <li key={i.id} {...dropZone(dnd, i.id)}
          draggable={dnd?.armed === i.id}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", i.id);
            dnd?.start(i.id);
          }}
          onDragEnd={() => dnd?.end()}
          className={`list-group-item d-flex align-items-center gap-2 item-row${i.enabled ? "" : " item-off"}${
            isOver(i.id) ? " drop-before" : ""}${dnd?.dragging === i.id ? " dragging" : ""}`}>
          {dnd && (
            <span className="drag-handle" title="Přetáhnout do jiné kategorie" aria-hidden
              onPointerDown={() => dnd.arm(i.id)} onPointerUp={() => dnd.arm(null)}>
              <i className="bi bi-grip-vertical" />
            </span>
          )}
          <Switch label={`Zahrnout ${i.name}`} hideLabel checked={i.enabled} onChange={(enabled) => set(i.id, { enabled })} />
          <input className="form-control form-control-sm border-0 bg-transparent px-1 item-name" aria-label="Název"
            value={i.name} onChange={(e) => set(i.id, { name: e.target.value })} />
          <div className="input-group input-group-sm item-amount">
            <input className="form-control text-end num-input" type="number" step={100} min={0} aria-label={`Částka ${i.name}`}
              value={i.amount} onChange={(e) => set(i.id, { amount: Math.max(0, Number(e.target.value) || 0) })} />
            <span className="input-group-text">Kč</span>
          </div>
          <button type="button" className="btn btn-link btn-sm text-body-secondary p-0 icon-btn" aria-label={`Odebrat ${i.name}`}
            onClick={() => onChange(items.filter((x) => x.id !== i.id))}>
            <i className="bi bi-dash-circle" aria-hidden />
          </button>
        </li>
      ))}
      <li className={`list-group-item${isOver(null) ? " drop-before" : ""}`} {...dropZone(dnd, null)}>
        <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none"
          onClick={() => onChange([...items, { id: newId("i"), name: "", amount: 0, enabled: true }])}>
          <i className="bi bi-plus-lg me-1" aria-hidden />{addLabel}
        </button>
      </li>
    </ul>
  );
}

type CategoryCardProps = { category: Category; onChange: (c: Category) => void; onRemove: () => void; dnd: Dnd };

function CategoryCard({ category: c, onChange, onRemove, dnd }: CategoryCardProps) {
  const over = dnd.dragging && dnd.over?.cat === c.id;
  return (
    <div className={`card h-100 category-card${over ? " drop-into" : ""}`} {...dropZone(dnd, null)}>
      <div className="card-header d-flex align-items-center gap-2 bg-body-tertiary">
        <Switch label={`Kategorie ${c.name}`} hideLabel checked={c.enabled} onChange={(enabled) => onChange({ ...c, enabled })} />
        <input className="form-control border-0 bg-transparent fw-semibold px-1 category-name" aria-label="Název kategorie"
          value={c.name} onChange={(e) => onChange({ ...c, name: e.target.value })} />
        <span className={`text-nowrap fw-semibold ${c.enabled ? "" : "text-body-secondary text-decoration-line-through"}`}>
          {kc(categoryTotal(c))}
        </span>
        <button type="button" className="btn btn-link btn-sm text-body-secondary p-0 icon-btn" aria-label={`Odebrat kategorii ${c.name}`}
          onClick={onRemove}>
          <i className="bi bi-x-lg" aria-hidden />
        </button>
      </div>
      <ItemList items={c.items} onChange={(items) => onChange({ ...c, items })} addLabel="Přidat položku" muted={!c.enabled} dnd={dnd} />
    </div>
  );
}

type Props = {
  household: Household;
  onChange: (h: Household) => void;
  open: boolean;
  onToggle: (open: boolean) => void;
};

export function HouseholdPanel({ household: h, onChange, open, onToggle }: Props) {
  const setCategory = (c: Category) => onChange({ ...h, categories: h.categories.map((x) => (x.id === c.id ? c : x)) });
  const removeCategory = (id: string) => onChange({ ...h, categories: h.categories.filter((x) => x.id !== id) });
  const addCategory = () =>
    onChange({ ...h, categories: [...h.categories, { id: newId("c"), name: "Nová kategorie", enabled: true, items: [] }] });
  const need = monthlyNeed(h);
  const summary = <>Potřebuji čistého <strong>{kc(need)}</strong> měsíčně</>;

  const [armed, setArmed] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<DropTarget | null>(null);
  const endDrag = () => {
    setArmed(null);
    setDragging(null);
    setOver(null);
  };
  const dndFor = (categoryId: string): Dnd => ({
    categoryId, armed, dragging, over,
    arm: setArmed,
    start: setDragging,
    hover: setOver,
    drop: (t) => {
      if (dragging) onChange({ ...h, categories: moveItem(h.categories, dragging, t.cat, t.before) });
      endDrag();
    },
    end: endDrag,
  });

  return (
    <Panel title="Rozpočet domácnosti" icon="bi-house" summary={summary} open={open} onToggle={onToggle}>
      <div className="d-flex align-items-baseline justify-content-between mb-2">
        <h3 className="h6 text-uppercase text-body-secondary mb-0">Výdaje</h3>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={addCategory}>
          <i className="bi bi-folder-plus me-1" aria-hidden />Přidat kategorii
        </button>
      </div>
      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
        {h.categories.map((c) => (
          <div className="col" key={c.id}>
            <CategoryCard category={c} onChange={setCategory} onRemove={() => removeCategory(c.id)} dnd={dndFor(c.id)} />
          </div>
        ))}
      </div>

      <hr className="my-4" />

      <div className="row g-3">
        <div className="col-md-6 col-xl-4">
          <h3 className="h6 text-uppercase text-body-secondary mb-2">Další příjmy domácnosti</h3>
          <div className="card">
            <ItemList items={h.incomes} onChange={(incomes) => onChange({ ...h, incomes })} addLabel="Přidat příjem" />
          </div>
        </div>
        <div className="col-md-6 col-xl-4">
          <h3 className="h6 text-uppercase text-body-secondary mb-2">Spoření</h3>
          <Stepper label="Měsíčně odložit" value={h.savings} steps={[500, 1000]} max={60000} slider
            onChange={(savings) => onChange({ ...h, savings })} />
        </div>
        <div className="col-xl-4">
          <h3 className="h6 text-uppercase text-body-secondary mb-2">Bilance</h3>
          <table className="table table-sm mb-0 balance">
            <tbody>
              <tr><td>Výdaje</td><td className="text-end">{kc(expensesTotal(h))}</td></tr>
              <tr><td>Spoření</td><td className="text-end">+{kc(h.savings)}</td></tr>
              <tr><td>Další příjmy</td><td className="text-end">−{kc(incomesTotal(h))}</td></tr>
              <tr className="fw-bold"><td>Potřebuji čistého</td><td className="text-end">{kc(need)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}
