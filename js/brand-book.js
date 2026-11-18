/**
 * Brand book
 * ----------
 * NOT CONNECTED to the Brand Hub. Wilmer: these lists are the rules the
 * stand-in check uses. When the hub MCP returns the real guidelines,
 * replace the lists here, or stop reading this file from the analyzer.
 *
 * These lists stand in for the Brand Hub. They were read from alfalaval.com
 * on 18 Nov 2026. Their own typeface is "Alfa Laval"; the site falls
 * back to Roboto, and so does this dashboard.
 * Reasons on screen name the Brand Agent and the Brand Hub. Do not write
 * that the check compared the public website.
 *
 * The analyzer only reads these lists. It does not invent rules.
 */

/** Brand Hub stand-in colors. A found color may sit near one of these. */
export const PALETTE = [
  { name: "Navy", hex: "#0B1128" },
  { name: "Blue", hex: "#0068FF" },
  { name: "Blue pressed", hex: "#004AB5" },
  { name: "Blue link", hex: "#005FE8" },
  { name: "Ink", hex: "#3C3C3C" },
  { name: "Body gray", hex: "#545869" },
  { name: "Warm white", hex: "#F5F3F2" },
  { name: "Page gray", hex: "#EEEEEC" },
  { name: "White", hex: "#FFFFFF" }
];

/**
 * How far a found color may sit from the nearest palette color, in plain RGB
 * distance (0 is identical, 441 is black against white). 80 keeps their own
 * blue variants, and rejects orange, purple, and other off-brand fills.
 */
export const COLOR_TOLERANCE = 80;

/** The logo ink is navy on a light ground, or white on a dark ground. logo.ground is checked against navy. */
export const LOGO_COLORS = ["#0B1128", "#FFFFFF"];

/**
 * Words the Brand Hub does not use. Each hit is its own low-severity flag.
 * The case numbers it with the other flags. It is a review, not a broken fact.
 */
export const HYPE_WORDS = [
  "amazing",
  "game-changer",
  "cheapest",
  "unbelievable",
  "best ever",
  "guaranteed miracle"
];

/**
 * Phrases that must already appear on the matching product page.
 * "Without chemicals" is allowed for PureBallast because Alfa Laval says it.
 * "Food-grade" is not a phrase they use on the pages in this catalogue.
 */
export const CLAIM_PHRASES = [
  "food-grade",
  "food grade",
  "fda approved",
  "certified organic",
  "guaranteed miracle"
];

/** How Alfa Laval introduces itself. Used when a page names the company and no product. */
export const COMPANY_VOICE =
  "Alfa Laval is a leading global provider of first-rate products in the areas of heat transfer, separation and fluid handling. They write in a concrete way about efficiency, reliability, uptime, hygiene, energy, and yield.";
