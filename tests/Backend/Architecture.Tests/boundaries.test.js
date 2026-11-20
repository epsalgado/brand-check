import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

describe("Architecture.Tests", () => {
  it("enforces Backend and Frontend layer boundaries", () => {
    const root = path.resolve(import.meta.dirname, "../../..");
    const isWin = process.platform === "win32";
    const bin = path.join(
      root,
      "node_modules",
      ".bin",
      isWin ? "depcruise.cmd" : "depcruise"
    );
    let output = "";
    try {
      output = execFileSync(
        bin,
        ["src/Backend", "src/Frontend", "--config", ".dependency-cruiser.cjs", "--output-type", "err"],
        { cwd: root, encoding: "utf8", shell: isWin }
      );
    } catch (error) {
      output = `${error.stdout || ""}${error.stderr || ""}${error.message}`;
      expect.fail(`Architecture boundaries violated:\n${output}`);
    }
    expect(output.length === 0 || /no dependency violations|0 errors/i.test(output)).toBe(true);
  });
});
