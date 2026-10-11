import { useRef, useState } from "react";
import { parseState, serializeState, type AppState } from "../state";

type Props = { state: AppState; onImport: (s: AppState) => void };

/** Export inputs to a JSON file and load them back. */
export function ImportExport({ state, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([serializeState(state)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "income-calc.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      onImport({ ...parseState(JSON.parse(await file.text())), openPanels: state.openPanels });
      setError(null);
    } catch (e) {
      setError(e instanceof SyntaxError ? "Soubor není platný JSON." : (e as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <button className="ghost" onClick={exportJson}>Export JSON</button>
      <button className="ghost" onClick={() => fileRef.current?.click()}>Import JSON</button>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importJson(e.target.files?.[0])} />
      {error && <p className="note warn import-error" role="alert">{error}</p>}
    </>
  );
}
