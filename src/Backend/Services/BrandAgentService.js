/**
 * Brand Agent facade. Replace the body of judgePage() when the real agent
 * connects. Keep the return shape.
 */

import { analyzePage } from "@/Backend/Services/PageAnalysisService";

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
