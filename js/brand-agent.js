/**
 * Brand Agent
 * -----------
 * NOT CONNECTED. Wilmer: replace the body of judgePage() when Gautam
 * opens the agent. Keep the return shape.
 *
 * Kim said the Brand Agent can create on-brand content, and that its
 * intelligence can be reached too. He has not confirmed the call. Our
 * aim is to hand it one found page and get back:
 *   verdict: "on-brand" | "review" | "mismatch"
 *   reasons: sentences a person can act on
 * A bare yes or no is not enough. Each reason is one flag. The open
 * case numbers them 1, 2, 3 so the count matches the lines. Do not
 * merge two problems into one reason.
 *
 * status "stand-in" means that call does not exist yet. analyzer.js
 * supplies the same answer from the local checks (claims, logo, color,
 * language). High flags are a Mismatch. Language-only flags are a Review.
 * No flags is On brand.
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
