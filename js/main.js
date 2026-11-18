/**
 * Main
 * ----
 * Starts the monitor. The order is the whole product:
 *   1. Open the Brand Hub (stand-in until theirs connects).  brand-hub.js
 *   2. Collect the pages to look at.                         collector.js
 *   3. Ask the Brand Agent to judge each page.              brand-agent.js
 *   4. Draw the score, the countries, and the open case.    dashboard.js
 *
 * The design system is the look of this screen only. It is not a check.
 */

import { loadBrandHub } from "./brand-hub.js";
import { collectPages } from "./collector.js";
import { judgePage } from "./brand-agent.js";
import { scoreRun } from "./score.js";
import { renderDashboard, bindDashboard, setScanning } from "./dashboard.js";

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
