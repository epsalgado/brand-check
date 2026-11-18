/**
 * Catalogue
 * ---------
 * Alfa Laval's own product pages, saved in data/products.json.
 * Each record has the name, the family, the official link, and the words
 * Alfa Laval wrote. The analyzer uses those words as the authentic version.
 *
 * findMentions() answers one question: which catalogue names appear in a
 * piece of outside text? Longer names win when they cover the same words,
 * so "MaxiLobe UltraPure" is not also reported as "MaxiLobe". The list is
 * then ordered as the names appear on the page. The first one is the
 * product the dashboard compares against. Two-letter codes (CB, GL, MR)
 * are skipped because they collide with ordinary words.
 */

/** Names that are real catalogue entries and also ordinary words. */
const GENERIC_NAMES = new Set([
  "multi", "pumps", "valves", "cooker", "modules", "sani", "systems",
  "models", "overview", "tubes", "filters", "heaters", "boilers"
]);

/**
 * Three- and four-letter model codes that are safe to match as whole words.
 * Two-letter codes (CB, GL, MR) are left out. They collide with ordinary text.
 */
const SHORT_CODES = new Set(["lkh", "glx", "axp", "cpm", "smp", "pche"]);

export async function loadCatalogue() {
  const response = await fetch("data/products.json");
  if (!response.ok) {
    throw new Error("Could not load data/products.json");
  }
  const data = await response.json();
  return data.products;
}

/** Lower case, one space, no registered-mark sign. */
export function normalize(value) {
  return (value || "")
    .toLowerCase()
    .replace(/®/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} text  The found page.
 * @param {Array} catalogue  Records from loadCatalogue().
 * @returns {Array} Matching product records, longest name first, at most six.
 */
export function findMentions(text, catalogue) {
  const haystack = normalize(text);
  const found = [];
  const byLength = [...catalogue].sort(
    (a, b) => normalize(b.name).length - normalize(a.name).length
  );

  for (const product of byLength) {
    const name = normalize(product.name);
    if (name.length < 3) continue;
    if (name.length < 4 && !SHORT_CODES.has(name)) continue;

    const match = haystack.match(boundaryPattern(name));
    if (!match) continue;

    const start = match.index + match[0].length - name.length;
    const end = start + name.length;
    const brandIsNearby = haystack.slice(Math.max(0, start - 80), start).includes("alfa laval");
    if (GENERIC_NAMES.has(name) && !brandIsNearby) continue;
    if (found.some((item) => start >= item.start && end <= item.end)) continue;

    found.push({ product, start, end });
  }

  return found
    .sort((a, b) => a.start - b.start)
    .slice(0, 6)
    .map((item) => item.product);
}

/** A name matches as a whole word, not as part of a longer word. */
function boundaryPattern(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i");
}
