/**
 * Brand book / Brand Hub stand-in rules.
 * NOT CONNECTED to the Brand Hub. Replace these lists when the hub MCP
 * returns real guidelines, or stop reading this file from PageAnalysisService.
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

/** The logo ink is navy on a light ground, or white on a dark ground. */
export const LOGO_COLORS = ["#0B1128", "#FFFFFF"];

/**
 * Words the Brand Hub does not use. Each hit is its own low-severity flag.
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
 */
export const CLAIM_PHRASES = [
  "food-grade",
  "food grade",
  "fda approved",
  "certified organic",
  "guaranteed miracle"
];

/** How Alfa Laval introduces itself. */
export const COMPANY_VOICE =
  "Alfa Laval is a leading global provider of first-rate products in the areas of heat transfer, separation and fluid handling. They write in a concrete way about efficiency, reliability, uptime, hygiene, energy, and yield.";
