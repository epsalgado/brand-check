/**
 * Analyzer
 * --------
 * Stand-in for the Brand Agent. Wilmer: brand-agent.js calls this.
 * When the real agent returns a verdict and reasons, stop calling this
 * from judgePage(). Leave the file until that answer matches these checks.
 *
 * Takes one collected page plus the product catalogue, and returns a report.
 * The report is what the dashboard draws. Nothing in here touches the page.
 *
 * Four checks, in the order a brand lead cares about them:
 *   1. Claims   — numbers and certificates the found page asserts
 *   2. Logo     — the Alfa Laval logo, only when this page shows it
 *   3. Color    — fills checked against the Brand Hub, not a reseller's buttons
 *   4. Language — hype the Brand Hub does not use
 *
 * Kim's question is: does this company sell an Alfa Laval product, and
 * where it shows Alfa Laval's logo, is that logo the real one?
 * A distributor or reseller is its own company. Their own logo on their
 * own page is not a miss. A missing Alfa Laval logo is a miss only
 * on Alfa Laval's own site (speaker "alfa-laval").
 * If the page does show the Alfa Laval logo, stretched, old, recolored,
 * or a ground color that is not the Brand Hub navy is a mismatch.
 * logo.ground holds that blue, as on Element (#11387F).
 * Reason text names the Brand Agent and the Brand Hub. Do not write
 * that the check compared Alfa Laval's public website.
 * Do not flag a site only because the header is the reseller's own mark.
 *
 * A high-severity flag makes the page a mismatch. Only low flags mean
 * "review". No flags means "on brand".
 */

import {
  PALETTE,
  COLOR_TOLERANCE,
  LOGO_COLORS,
  HYPE_WORDS,
  CLAIM_PHRASES
} from "./brand-book.js?v=4";
import { findMentions, normalize } from "./catalogue.js?v=4";

/**
 * @param {object} page  One snapshot from the collector.
 * @param {Array} catalogue  Product records.
 * @returns {object} report  { page, products, checks, flags, verdict }
 */
export function analyzePage(page, catalogue) {
  const products = findMentions(page.text, catalogue);
  const authentic = products.map((product) => normalize(
    `${product.words || ""} ${product.blurb || ""} ${product.headline || ""}`
  )).join(" \n ");

  const checks = [
    checkClaims(page, products, authentic),
    checkLogo(page),
    checkColors(page),
    checkLanguage(page, authentic)
  ];

  const flags = checks.flatMap((check) => check.flags);
  return {
    page,
    products,
    checks,
    flags,
    verdict: verdictFor(flags)
  };
}

function verdictFor(flags) {
  if (flags.some((flag) => flag.severity === "high")) return "mismatch";
  if (flags.length) return "review";
  return "on-brand";
}

/**
 * Pulls "10 times", "90%", "60 bar", and the phrases in the brand book.
 * A claim is fine when the Brand Hub already says the same words.
 * Reasons name the Brand Agent and the Brand Hub. Do not write that the
 * check was a comparison with Alfa Laval's public website.
 */
function checkClaims(page, products, authentic) {
  const flags = [];
  if (!products.length) {
    flags.push({
      severity: "high",
      detail: "Brand Agent: this page does not name a product the Brand Hub holds."
    });
  }

  for (const claim of claimsIn(page.text)) {
    if (!authentic.includes(normalize(claim))) {
      const name = products[0] ? products[0].name : "the catalogue";
      flags.push({
        severity: "high",
        detail: `Brand Agent: “${claim}” is not in the Brand Hub entry for ${name}.`
      });
    }
  }

  return { id: "claims", label: "Claims", flags };
}

function claimsIn(text) {
  const found = [];
  const numbers = text.matchAll(/\b\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*(?:%|percent|times|bar)\b/gi);
  for (const match of numbers) found.push(match[0].replace(/\s+/g, " ").trim());

  const lower = text.toLowerCase();
  for (const phrase of CLAIM_PHRASES) {
    if (lower.includes(phrase)) found.push(phrase);
  }
  return [...new Set(found)];
}

/**
 * Logo facts were recorded when the page was collected.
 * Wilmer: logo.present false means we did not see the Alfa Laval logo.
 * That is a miss only when speaker is "alfa-laval". On a distributor,
 * partner, spare-parts site, or social post, their own logo is expected.
 * When the Alfa Laval logo is present, judge that mark against the Brand
 * Hub: proportions, lockup, navy or white, and logo.ground when the field
 * behind the letters is recorded. A wrong mark is a mismatch no matter
 * who the source is. The sentence on screen is the Brand Agent's reason.
 */
function checkLogo(page) {
  const logo = page.logo || {};
  const flags = [];
  const wordmarkShown = Boolean(logo.present) && logo.lockup !== "missing";
  let pass = "Matches";

  if (!wordmarkShown) {
    if (isAlfaLaval(page)) {
      flags.push({
        severity: "high",
        detail: "Brand Agent: the Brand Hub logo is missing from this Alfa Laval page."
      });
    } else {
      pass = "Brand Agent: no Alfa Laval logo on this page. Their own logo is fine. The logo is checked only when the page shows it.";
    }
  } else {
    if (logo.stretched) {
      flags.push({ severity: "high", detail: "Brand Agent: this logo is stretched. The Brand Hub logo keeps its real proportions." });
    }
    if (logo.lockup === "old-wordmark") {
      flags.push({
        severity: "high",
        detail: "Brand Agent: this is an old Alfa Laval logo. The Brand Hub logo is the ALFA LAVAL mark in navy, or in white on a dark ground."
      });
    }
    if (logo.lockup === "recolored") {
      flags.push({ severity: "high", detail: "Brand Agent: this logo has been recolored. The Brand Hub logo is navy #0B1128, or white on a dark ground." });
    } else if (logo.color && !nearPalette(logo.color, LOGO_COLORS, COLOR_TOLERANCE)) {
      flags.push({ severity: "high", detail: `Brand Agent: this logo color ${logo.color} is not the Brand Hub navy or white.` });
    }
    if (logo.ground && !nearPalette(logo.ground, ["#0B1128"], COLOR_TOLERANCE)) {
      const ground = String(logo.ground).toUpperCase();
      const away = Math.round(distance(hexToRgb(ground), hexToRgb("#0B1128")));
      flags.push({
        severity: "high",
        detail: `Brand Agent: the letters match the logo in the Brand Hub, and the letters are white. The blue behind them is ${ground}. The Brand Hub logo is navy #0B1128. Two blues count as the same within a distance of ${COLOR_TOLERANCE}. This blue is ${away} away from navy, and it is not the brand blue #0068FF.`
      });
    }
  }

  return { id: "logo", label: "Logo", flags, pass };
}

/**
 * Colors on a reseller's page are not checked. Their buttons are their
 * brand. On an Alfa Laval page, each color outside the Brand Hub palette
 * is its own flag. The color of an Alfa Laval logo, including logo.ground,
 * is the logo check. Wilmer: do not record a whole stylesheet.
 */
function checkColors(page) {
  const flags = [];
  let pass = "Matches";
  if (!isAlfaLaval(page)) {
    pass = "Brand Agent: their own site colors are not checked. Color is checked against the Brand Hub, and on the Alfa Laval logo when a page shows it.";
    return { id: "color", label: "Color", flags, pass };
  }
  for (const hex of page.colors || []) {
    if (!nearPalette(hex, PALETTE.map((swatch) => swatch.hex), COLOR_TOLERANCE)) {
      flags.push({
        severity: "high",
        detail: `Brand Agent: ${hex.toUpperCase()} is not a color in the Brand Hub. The brand blue is #0068FF and the navy is #0B1128.`
      });
    }
  }
  return { id: "color", label: "Color", flags, pass };
}

function isAlfaLaval(page) {
  return page.speaker === "alfa-laval";
}

/** Hype is a review item. The product can still be the right product. */
function checkLanguage(page, authentic) {
  const flags = [];
  const lower = normalize(page.text);
  for (const word of HYPE_WORDS) {
    if (lower.includes(word) && !authentic.includes(word)) {
      flags.push({
        severity: "low",
        detail: `Brand Agent: “${word}” is not how the Brand Hub writes about this product.`
      });
    }
  }
  return { id: "language", label: "Language", flags };
}

function nearPalette(hex, allowed, tolerance) {
  const found = hexToRgb(hex);
  if (!found) return false;
  return allowed.some((swatch) => distance(found, hexToRgb(swatch)) <= tolerance);
}

function hexToRgb(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!match) return null;
  const value = match[1];
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ];
}

function distance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
