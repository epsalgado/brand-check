/**
 * Dashboard
 * ---------
 * Draws one screen: the counts, the queue of collected pages, and the open
 * case. It does not decide what is on brand. That decision is already on
 * the report from analyzer.js. This file only presents it.
 *
 * renderDashboard() paints the current reports.
 * bindDashboard() connects the Scan button and the queue.
 */

const VERDICT_LABEL = {
  "on-brand": "On brand",
  "review": "Review",
  "mismatch": "Mismatch"
};

let selectedId = "";

export function renderDashboard(reports) {
  if (!selectedId || !reports.some((report) => report.page.id === selectedId)) {
    const firstProblem = reports.find((report) => report.verdict !== "on-brand");
    selectedId = (firstProblem || reports[0]).page.id;
  }
  renderCounts(reports);
  renderQueue(reports);
  renderCase(reports.find((report) => report.page.id === selectedId));
}

/**
 * Scan is a replay of the analysis so the room can see the engine run.
 * The pages are already collected. The button re-reads them and redraws.
 */
export function bindDashboard(reports, onScan) {
  document.getElementById("scan").addEventListener("click", () => onScan());
  document.getElementById("queue").addEventListener("click", (event) => {
    const row = event.target.closest("[data-id]");
    if (!row) return;
    selectedId = row.dataset.id;
    renderDashboard(reports);
  });
}

export function setScanning(isScanning) {
  const button = document.getElementById("scan");
  button.disabled = isScanning;
  button.textContent = isScanning ? "Scanning…" : "Scan collected pages";
  document.body.classList.toggle("is-scanning", isScanning);
}

function renderCounts(reports) {
  const counts = {
    collected: reports.length,
    onBrand: reports.filter((report) => report.verdict === "on-brand").length,
    review: reports.filter((report) => report.verdict === "review").length,
    mismatch: reports.filter((report) => report.verdict === "mismatch").length
  };
  document.getElementById("kpis").innerHTML = `
    ${kpi("Collected", counts.collected, "Pages in this run")}
    ${kpi("On brand", counts.onBrand, "Matches Alfa Laval")}
    ${kpi("Review", counts.review, "Language only")}
    ${kpi("Mismatches", counts.mismatch, "Open alerts")}`;
}

function kpi(label, value, note) {
  return `<article class="kpi"><p>${escapeHtml(label)}</p><strong>${value}</strong><span>${escapeHtml(note)}</span></article>`;
}

function renderQueue(reports) {
  const rows = reports.map((report) => {
    const selected = report.page.id === selectedId ? " is-selected" : "";
    const origin = report.page.origin === "live" ? "Their site" : "Sample";
    return `
      <button type="button" class="queue-row${selected}" data-id="${escapeHtml(report.page.id)}">
        <span class="queue-title">${escapeHtml(report.page.title)}</span>
        <span class="queue-type">${escapeHtml(report.page.sourceType)} · ${origin}</span>
        <span class="pill pill-${report.verdict}">${VERDICT_LABEL[report.verdict]}</span>
        <span class="queue-count">${report.flags.length}</span>
      </button>`;
  }).join("");
  document.getElementById("queue").innerHTML = rows;
}

function renderCase(report) {
  const page = report.page;
  const product = report.products[0];
  const theirWords = product
    ? excerpt(product.words || product.blurb, 520)
    : "No catalogue product was named, so there is no Alfa Laval page to put beside this.";
  const productLine = report.products.length
    ? report.products.map((item) => item.name).join(", ")
    : "None named";

  document.getElementById("case").innerHTML = `
    <header class="case-head">
      <div>
        <p class="eyebrow">${escapeHtml(page.sourceType)}</p>
        <h2>${escapeHtml(page.title)}</h2>
        <p class="case-meta">Product match: ${escapeHtml(productLine)}</p>
      </div>
      <span class="pill pill-${report.verdict}">${VERDICT_LABEL[report.verdict]}</span>
    </header>
    <ul class="checks">
      ${report.checks.map(renderCheck).join("")}
    </ul>
    <div class="compare">
      <section>
        <h3>What we found</h3>
        <p>${escapeHtml(page.text)}</p>
        ${page.url.startsWith("http") && page.origin === "live" ? `<a href="${escapeHtml(page.url)}" target="_blank" rel="noreferrer">Open their page</a>` : ""}
      </section>
      <section>
        <h3>What Alfa Laval says</h3>
        <p>${escapeHtml(theirWords)}</p>
        ${product ? `<a href="${escapeHtml(product.url)}" target="_blank" rel="noreferrer">Catalogue page for ${escapeHtml(product.name)}</a>` : ""}
      </section>
    </div>`;
}

function renderCheck(check) {
  if (!check.flags.length) {
    return `<li class="check check-pass"><strong>${escapeHtml(check.label)}</strong><span>Matches</span></li>`;
  }
  const details = check.flags.map((flag) => `<span>${escapeHtml(flag.detail)}</span>`).join("");
  return `<li class="check check-flag"><strong>${escapeHtml(check.label)}</strong>${details}</li>`;
}

function excerpt(text, max) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
