/**
 * Main
 * ----
 * Starts the monitor. The order is the whole product:
 *   1. Load Alfa Laval's own catalogue.     catalogue.js
 *   2. Collect the pages to look at.        collector.js
 *   3. Compare each page with the brand.    analyzer.js
 *   4. Draw the one dashboard.              dashboard.js
 *
 * Rules live in brand-book.js. Change a color or a banned phrase there.
 */

import { loadCatalogue } from "./catalogue.js";
import { collectPages } from "./collector.js";
import { analyzePage } from "./analyzer.js";
import { renderDashboard, bindDashboard, setScanning } from "./dashboard.js";

async function start() {
  const catalogue = await loadCatalogue();
  const pages = await collectPages();
  const reports = pages.map((page) => analyzePage(page, catalogue));

  renderDashboard(reports);
  bindDashboard(reports, () => runScan(reports));
  document.getElementById("run-note").textContent =
    `${pages.length} pages in this run. ${catalogue.length} Alfa Laval products in the catalogue.`;
}

/** Shows the scan state, then draws the same reports again. */
function runScan(reports) {
  setScanning(true);
  window.setTimeout(() => {
    renderDashboard(reports);
    setScanning(false);
  }, 700);
}

start().catch((error) => {
  document.getElementById("case").textContent = error.message;
});
