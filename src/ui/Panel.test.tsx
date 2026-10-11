import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Panel } from "./Panel";

describe("Panel", () => {
  it("shows summary only while collapsed", () => {
    const closed = renderToString(<Panel title="T" summary="S1" open={false} onToggle={() => {}}>body</Panel>);
    const open = renderToString(<Panel title="T" summary="S1" open onToggle={() => {}}>body</Panel>);
    expect(closed).toContain("S1");
    expect(open).not.toContain("S1");
    expect(open).toContain("open");
  });
});
