/**
 * Brand Agent
 * -----------
 * Judges one found page and returns On brand, Review, or Mismatch,
 * plus the exact reason for anything that failed.
 *
 * status "stand-in" means Alfa Laval's agent is not connected yet.
 * The local check fills the same answer shape. When their agent is
 * connected, replace the body of judgePage() and keep this shape:
 *   verdict: "on-brand" | "review" | "mismatch"
 *   reasons: sentences a person can act on
 */

import { analyzePage } from "./analyzer.js";

export function judgePage(page, hub) {
  const report = analyzePage(page, hub.catalogue);
  return {
    ...report,
    judgment: {
      status: "stand-in",
      label: "Brand Agent",
      note: "Stand-in until Alfa Laval connects the Brand Agent.",
      verdict: report.verdict,
      reasons: report.flags.map((flag) => flag.detail)
    }
  };
}
