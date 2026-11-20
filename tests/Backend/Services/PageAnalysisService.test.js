import { describe, it, expect } from "vitest";
import { analyzePage } from "@/Backend/Services/PageAnalysisService";

const catalogue = [
  {
    name: "Compabloc",
    words: "compact heat exchanger 60 bar",
    blurb: "Compabloc",
    headline: "Compabloc"
  }
];

describe("PageAnalysisService", () => {
  it("returns on-brand when claims and logo pass for a reseller without Alfa Laval logo", () => {
    const report = analyzePage({
      speaker: "distributor",
      text: "We offer the Compabloc heat exchanger at 60 bar.",
      colors: ["#E87722"],
      logo: { present: false }
    }, catalogue);
    expect(report.verdict).toBe("on-brand");
    expect(report.products[0].name).toBe("Compabloc");
  });

  it("flags language as review (low severity only)", () => {
    const report = analyzePage({
      speaker: "distributor",
      text: "Compabloc is a game-changer at 60 bar.",
      colors: [],
      logo: { present: false }
    }, catalogue);
    expect(report.verdict).toBe("review");
    expect(report.flags.every((f) => f.severity === "low")).toBe(true);
  });

  it("flags Element-style logo ground as mismatch", () => {
    const report = analyzePage({
      speaker: "distributor",
      text: "Compabloc at 60 bar.",
      colors: [],
      logo: {
        present: true,
        stretched: false,
        lockup: "official-wordmark",
        color: "#FFFFFF",
        ground: "#11387F"
      }
    }, catalogue);
    expect(report.verdict).toBe("mismatch");
    expect(report.checks.find((c) => c.id === "logo").flags.length).toBeGreaterThan(0);
  });

  it("does not check reseller site colors", () => {
    const report = analyzePage({
      speaker: "distributor",
      text: "Compabloc at 60 bar.",
      colors: ["#FF00FF"],
      logo: { present: false }
    }, catalogue);
    expect(report.checks.find((c) => c.id === "color").flags).toEqual([]);
  });
});
