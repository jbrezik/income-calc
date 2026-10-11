import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders both modes with defaults", () => {
    const html = renderToString(<App />);
    expect(html).toContain("Kalkulačka příjmu");
    expect(html).toContain("Minimum k pokrytí");
    expect(html).toMatch(/Potřebuji čistého <strong>[0-9]/);
    expect(html).toContain("OSVČ");
  });
});
