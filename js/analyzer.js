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
 *   2. Logo     — the Alfa Laval wordmark, only when this page shows it
 *   3. Color    — fills on Alfa Laval's own site, not a reseller's buttons
 *   4. Language — hype that Alfa Laval's own pages do not use
 *
 * Kim's question is: does this company sell an Alfa Laval product, and
 * where it shows Alfa Laval's logo, is that logo the real one?
 * A distributor or reseller is its own company. Their own logo on their
 * own page is not a miss. A missing Alfa Laval wordmark is a miss only
 * on Alfa Laval's own site (speaker "alfa-laval").
 * If the page does show the Alfa Laval wordmark, stretched, old, or
 * recolored is a mismatch. That is the check. Do not flag a site only
 * because the header is the reseller's own mark.
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
} from "./brand-book.js";
import { findMentions, normalize } from "./catalogue.js";

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
 * A claim is fine when the same words are already on Alfa Laval's page.
 */
function checkClaims(page, products, authentic) {
  const flags = [];
  if (!products.length) {
    flags.push({
      severity: "high",
      detail: "The page does not name a product from Alfa Laval’s catalogue."
    });
  }

  for (const claim of claimsIn(page.text)) {
    if (!authentic.includes(normalize(claim))) {
      const name = products[0] ? products[0].name : "the catalogue";
      flags.push({
        severity: "high",
        detail: `“${claim}” is not on Alfa Laval’s page for ${name}.`
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
 * Wilmer: logo.present false means we did not see the Alfa Laval wordmark.
 * That is a miss only when speaker is "alfa-laval". On a distributor,
 * partner, spare-parts site, or social post, their own logo is expected.
 * When the Alfa Laval wordmark is present, judge that mark: proportions,
 * current lockup, navy or white. A wrong mark is a mismatch no matter
 * who the speaker is.
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
        detail: "The Alfa Laval wordmark is missing from Alfa Laval’s own page."
      });
    } else {
      pass = "No Alfa Laval wordmark on this page. Their own logo is fine. The wordmark is checked only when the page shows it on an Alfa Laval product.";
    }
  } else {
    if (logo.stretched) {
      flags.push({ severity: "high", detail: "The Alfa Laval wordmark is stretched. Alfa Laval uses it at its real proportions." });
    }
    if (logo.lockup === "old-wordmark") {
      flags.push({ severity: "high", detail: "This is an old Alfa Laval wordmark, not the current mark." });
    }
    if (logo.lockup === "recolored") {
      flags.push({ severity: "high", detail: "The Alfa Laval wordmark has been recolored. It is navy #0B1128, or white on a dark ground." });
    } else if (logo.color && !nearPalette(logo.color, LOGO_COLORS, COLOR_TOLERANCE)) {
      flags.push({ severity: "high", detail: `The Alfa Laval wordmark color ${logo.color} is not navy or white.` });
    }
  }

  return { id: "logo", label: "Logo", flags, pass };
}

/**
 * Page colors are judged on Alfa Laval's own site. A reseller's orange
 * button is their brand, not a miss. Wilmer: do not record a whole
 * stylesheet. Record a color here only when it is Alfa Laval's own page,
 * or when it is the color of an Alfa Laval wordmark (that case is the
 * logo check).
 */
function checkColors(page) {
  const flags = [];
  let pass = "Matches";
  if (!isAlfaLaval(page)) {
    pass = "Their own site colors are not checked. Color is checked on Alfa Laval’s own site, and on the Alfa Laval wordmark when a page shows it.";
    return { id: "color", label: "Color", flags, pass };
  }
  for (const hex of page.colors || []) {
    if (!nearPalette(hex, PALETTE.map((swatch) => swatch.hex), COLOR_TOLERANCE)) {
      flags.push({
        severity: "high",
        detail: `${hex.toUpperCase()} is not an Alfa Laval color. The brand blue is #0068FF and the navy is #0B1128.`
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
        detail: `“${word}” is not how Alfa Laval writes about its products.`
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
