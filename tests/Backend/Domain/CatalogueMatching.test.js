import { describe, it, expect } from "vitest";
import { normalize, findMentions } from "@/Backend/Domain/CatalogueMatching";

describe("CatalogueMatching", () => {
  it("normalizes case, spaces, and registered marks", () => {
    expect(normalize("  Alfa®  Laval  ")).toBe("alfa laval");
  });

  it("prefers the longest product name and returns at most six", () => {
    const catalogue = [
      { name: "MaxiLobe", words: "pump" },
      { name: "MaxiLobe UltraPure", words: "hygienic pump" },
      { name: "CB", words: "skipped two letter" }
    ];
    const text = "We sell the Alfa Laval MaxiLobe UltraPure unit.";
    const found = findMentions(text, catalogue);
    expect(found.map((p) => p.name)).toEqual(["MaxiLobe UltraPure"]);
  });

  it("skips generic names unless Alfa Laval is nearby", () => {
    const catalogue = [{ name: "Pumps", words: "fluid" }];
    expect(findMentions("Industrial pumps for sale", catalogue)).toEqual([]);
    expect(findMentions("Alfa Laval pumps for sale", catalogue).map((p) => p.name)).toEqual(["Pumps"]);
  });
});
