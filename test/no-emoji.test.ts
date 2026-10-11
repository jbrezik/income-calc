import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Emoji and emoji-rendering symbols are banned in tracked files (see CLAUDE.md).
// CLAUDE.md is exempt: it names the banned symbols. Arrows (U+2190-21FF) and stars (U+2605, U+2606) are allowed typography.
const BANNED = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2604}\u{2607}-\u{27BF}\u{2B00}-\u{2BFF}\u{25B6}\u{25C0}\u{FE0F}]/u;

describe("no emoji", () => {
  const files = execSync("git ls-files --cached --others --exclude-standard", { encoding: "utf8" })
    .split("\n")
    .filter((f) => f && !f.endsWith("package-lock.json") && f !== "CLAUDE.md");

  it.each(files)("%s", (file) => {
    const lines = readFileSync(file, "utf8").split("\n");
    const hits = lines.map((l, i) => (BANNED.test(l) ? `${i + 1}: ${l.trim()}` : null)).filter(Boolean);
    expect(hits).toEqual([]);
  });
});
