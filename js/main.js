/**
 * Main
 * ----
 * Starts the monitor. Wilmer: read this header, then the file it names.
 *
 * Kim Gustafsson (Global Digital Brand Lead), 18 Nov 2026:
 *   - First task is to gather the data. He does not yet know which social
 *     posts may be fetched, because a scrape includes personal data.
 *   - He wants "how on-brand are we in total, per country". That score
 *     needs Alfa Laval's closed systems.
 *   - The Brand Hub holds the guidelines and assets, through an MCP.
 *   - The Brand Agent can create on-brand content, and its judgment can
 *     be reached too. Gautam (AI solutions manager) owns that connection.
 *   - The Digital Design System, also through an MCP, is for the UI.
 *   - Their brand AI can be connected to Databricks.
 *
 * What this repo aims to do with that:
 *   1. Brand Hub is the correct version.          brand-hub.js   NOT CONNECTED
 *   2. Collect pages and tag the source.          collector.js
 *      speaker: alfa-laval, distributor, partner,
 *      website (other sites, such as spare parts),
 *      or social. Social "live" waits for a feed
 *      Kim approves. The two LinkedIn rows are
 *      written samples, origin "seeded".
 *   3. Brand Agent returns On brand, Review, or   brand-agent.js NOT CONNECTED
 *      Mismatch, and names the reason.
 *      A partner is judged the same way. Do not
 *      assume a partner is on brand.
 *   4. Score is the share of pages that passed,   score.js
 *      in total and per country. Review does not
 *      pass. Passed of total is the only score.
 *   5. Draw that, including on brand by source.   dashboard.js
 *      Do not judge here.
 *
 * The design system is the look of this screen only (css/dashboard.css).
 * It is not a check.
 *
 * Nothing from Alfa Laval's hub, agent, design-system MCP, or closed
 * systems is connected. Each stand-in says so on the screen. Replace the
 * stand-in in the file named above and leave the call shape alone.
 */

import { loadBrandHub } from "./brand-hub.js?v=4";
import { collectPages } from "./collector.js?v=4";
import { judgePage } from "./brand-agent.js?v=4";
import { scoreRun } from "./score.js?v=4";
import { renderDashboard, bindDashboard, setScanning } from "./dashboard.js?v=4";

async function start() {
  const hub = await loadBrandHub();
  const pages = await collectPages();
  const reports = pages.map((page) => judgePage(page, hub));
  const score = scoreRun(reports);

  renderDashboard(reports, { hub, score });
  bindDashboard(reports, { hub, score }, () => runScan(reports, { hub, score }));
  document.getElementById("run-note").textContent =
    `${score.passed} of ${score.total} on brand (${score.share}%). ${hub.catalogue.length} products in the Brand Hub stand-in.`;
}

/** Shows the scan state, then draws the same reports again. */
function runScan(reports, context) {
  setScanning(true);
  window.setTimeout(() => {
    renderDashboard(reports, context);
    setScanning(false);
  }, 700);
}

start().catch((error) => {
  document.getElementById("case").textContent = error.message;
});
