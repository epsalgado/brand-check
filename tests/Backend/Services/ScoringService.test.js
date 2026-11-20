import { describe, it, expect } from "vitest";
import { scoreRun } from "@/Backend/Services/ScoringService";

describe("ScoringService", () => {
  it("counts only on-brand as passed", () => {
    const reports = [
      { verdict: "on-brand", page: { country: "Sweden" } },
      { verdict: "review", page: { country: "Sweden" } },
      { verdict: "mismatch", page: { country: "United States" } }
    ];
    const score = scoreRun(reports);
    expect(score.passed).toBe(1);
    expect(score.total).toBe(3);
    expect(score.share).toBe(33);
    expect(score.byCountry).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ country: "Sweden", passed: 1, total: 2 }),
        expect.objectContaining({ country: "United States", passed: 0, total: 1 })
      ])
    );
  });
});
