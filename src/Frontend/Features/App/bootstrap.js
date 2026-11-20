/**
 * App bootstrap. Loads the scan from Backend via Frontend/Api, then mounts UI features.
 * Does not judge pages in the browser.
 */

import { getScan } from "@/Frontend/Api/scanApi";
import { renderDashboard, bindDashboard, setScanning } from "@/Frontend/Features/Dashboard/dashboard";
import { mountAlerts, refreshAlerts } from "@/Frontend/Features/Alerts/alerts";
import { mountGenie, refreshGenie } from "@/Frontend/Features/Genie/genie";

export async function startMonitor() {
  const { hub, reports, score } = await getScan();
  const context = { hub, score };

  renderDashboard(reports, context);
  bindDashboard(reports, context, () => runScan(reports, context));
  mountAlerts(reports);
  mountGenie(reports);

  const note = document.getElementById("run-note");
  if (note) {
    note.textContent =
      `${score.passed} of ${score.total} on brand (${score.share}%). ${hub.catalogueCount} products in the Brand Hub stand-in.`;
  }
}

/** Re-fetches the Backend scan, then redraws. */
async function runScan(previousReports, previousContext) {
  setScanning(true);
  try {
    const { hub, reports, score } = await getScan();
    const context = { hub, score };
    renderDashboard(reports, context);
    refreshAlerts(reports);
    refreshGenie(reports);
    const note = document.getElementById("run-note");
    if (note) {
      note.textContent =
        `${score.passed} of ${score.total} on brand (${score.share}%). ${hub.catalogueCount} products in the Brand Hub stand-in.`;
    }
    Object.assign(previousContext, context);
    previousReports.splice(0, previousReports.length, ...reports);
  } catch (error) {
    const caseNode = document.getElementById("case");
    if (caseNode) caseNode.textContent = error.message;
  } finally {
    setScanning(false);
  }
}
