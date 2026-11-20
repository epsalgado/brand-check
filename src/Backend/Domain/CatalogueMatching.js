/**
 * Pure catalogue name-matching. Longer names win when they cover the same
 * words. Two-letter codes are skipped because they collide with ordinary words.
 */

/** Names that are real catalogue entries and also ordinary words. */
const GENERIC_NAMES = new Set([
  "multi", "pumps", "valves", "cooker", "modules", "sani", "systems",
  "models", "overview", "tubes", "filters", "heaters", "boilers"
]);

/**
 * Three- and four-letter model codes that are safe to match as whole words.
 */
const SHORT_CODES = new Set(["lkh", "glx", "axp", "cpm", "smp", "pche"]);

/** Lower case, one space, no registered-mark sign. */
export function normalize(value) {
  return (value || "")
    .toLowerCase()
    .replace(/®/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} text
 * @param {Array} catalogue
 * @returns {Array} Matching product records, at most six.
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

function boundaryPattern(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i");
}
