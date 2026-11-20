import { loadBrandHub } from "@/Backend/Services/BrandHubService";
import { getAllPages } from "@/Backend/Repositories/PageRepository";
import { judgePage } from "@/Backend/Services/BrandAgentService";
import { scoreRun } from "@/Backend/Services/ScoringService";

/**
 * Full pipeline: hub + pages → judge → score.
 * Controllers call this; they do not call Repositories directly.
 */
export async function runScan() {
  const hub = await loadBrandHub();
  const pages = await getAllPages();
  const reports = pages.map((page) => judgePage(page, hub));
  const score = scoreRun(reports);
  return { hub, reports, score };
}
