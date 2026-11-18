/**
 * Dashboard
 * ---------
 * Draws one screen: the score, the connection cards, the queue, and the
 * open case. Wilmer: do not put a new brand rule in this file. The Brand
 * Agent already decided. This file only presents verdict, reasons, and the
 * pass share from score.js.
 *
 * The cards say Stand-in or Waiting on purpose. Brand Hub, Brand Agent,
 * and the social feed are not connected. The websites card counts pages
 * whose channel is not "social".
 *
 * renderDashboard(reports, context) paints the current reports.
 * context.hub is the Brand Hub. context.score is the pass share.
 * bindDashboard() connects the Scan button and the queue.
 */

const VERDICT_LABEL = {
  "on-brand": "On brand",
  "review": "Review",
  "mismatch": "Mismatch"
};

const CHANNEL_LABEL = {
  website: "Website",
  social: "Social",
  other: "Other"
};

let selectedId = "";

export function renderDashboard(reports, context) {
  if (!selectedId || !reports.some((report) => report.page.id === selectedId)) {
    const firstProblem = reports.find((report) => report.verdict !== "on-brand");
    selectedId = (firstProblem || reports[0]).page.id;
  }
  renderCounts(reports, context.score);
  renderLinks(reports, context.hub);
  renderCoverage(context.score);
  renderQueue(reports);
  renderCase(reports.find((report) => report.page.id === selectedId), context.hub);
}

/**
 * Scan is a replay of the analysis so the room can see the engine run.
 * The pages are already collected. The button re-reads them and redraws.
 */
export function bindDashboard(reports, context, onScan) {
  document.getElementById("scan").addEventListener("click", () => onScan());
  document.getElementById("queue").addEventListener("click", (event) => {
    const row = event.target.closest("[data-id]");
    if (!row) return;
    selectedId = row.dataset.id;
    renderDashboard(reports, context);
  });
}

export function setScanning(isScanning) {
  const button = document.getElementById("scan");
  button.disabled = isScanning;
  button.textContent = isScanning ? "Scanning…" : "Scan collected pages";
  document.body.classList.toggle("is-scanning", isScanning);
}

function renderCounts(reports, score) {
  const review = reports.filter((report) => report.verdict === "review").length;
  const mismatch = reports.filter((report) => report.verdict === "mismatch").length;
  document.getElementById("kpis").innerHTML = `
    ${kpi("Collected", score.total, "Pages in this run", "navy")}
    ${kpi("On brand", `${score.share}%`, `${score.passed} of ${score.total} passed`, "blue")}
    ${kpi("Review", review, "Language only", "deep")}
    ${kpi("Mismatches", mismatch, "Open alerts", "bright")}`;
}

function renderLinks(reports, hub) {
  const social = reports.filter((report) => report.page.channel === "social").length;
  const websites = reports.filter((report) => report.page.channel !== "social").length;
  document.getElementById("links").innerHTML = `
    ${linkCard("Brand Hub", "Stand-in", hub.note)}
    ${linkCard("Brand Agent", "Stand-in", "Returns On brand, Review, or Mismatch, with the reason.")}
    ${linkCard("Social feed", social ? `${social} posts` : "Waiting", social ? "From the approved feed." : "Websites are in this run. Social waits for an approved feed.")}
    ${linkCard("Websites", String(websites), "Distributor pages, shops, news, and Alfa Laval’s own site.")}`;
}

function linkCard(title, state, note) {
  return `<article><p>${escapeHtml(title)}</p><strong>${escapeHtml(state)}</strong><span>${escapeHtml(note)}</span></article>`;
}

function kpi(label, value, note, tone) {
  return `<article class="kpi kpi-${tone}"><p>${escapeHtml(label)}</p><strong>${value}</strong><span>${escapeHtml(note)}</span></article>`;
}

function renderCoverage(score) {
  const chips = score.byCountry.map((group) => {
    const name = group.country === "Worldwide" ? "Worldwide site" : group.country;
    return `<li><span>${escapeHtml(name)}</span> ${group.passed} of ${group.total}</li>`;
  }).join("");
  document.getElementById("coverage").innerHTML = `
    <p>On brand by country</p>
    <ul>${chips}</ul>`;
}

function renderQueue(reports) {
  const rows = reports.map((report) => {
    const selected = report.page.id === selectedId ? " is-selected" : "";
    const channel = CHANNEL_LABEL[report.page.channel] || "Website";
    return `
      <button type="button" class="queue-row${selected}" data-id="${escapeHtml(report.page.id)}">
        <span class="queue-title">${escapeHtml(report.page.title)}<span class="queue-where">${escapeHtml(whereLine(report.page))}</span></span>
        <span class="queue-type">${escapeHtml(channel)} · ${escapeHtml(report.page.sourceType)}</span>
        <span class="pill pill-${report.verdict}">${VERDICT_LABEL[report.verdict]}</span>
        <span class="queue-count">${report.flags.length}</span>
      </button>`;
  }).join("");
  document.getElementById("queue").innerHTML = rows;
}

function renderCase(report, hub) {
  const page = report.page;
  const product = report.products[0];
  const theirWords = product
    ? excerpt(product.words || product.blurb, 520)
    : "No catalogue product was named, so there is no Alfa Laval page to put beside this.";
  const productLine = report.products.length
    ? report.products.map((item) => item.name).join(", ")
    : "None named";
  const agent = report.judgment;

  document.getElementById("case").innerHTML = `
    <header class="case-head">
      <div>
        <p class="eyebrow">${escapeHtml(agent.label)} · ${escapeHtml(page.sourceType)}</p>
        <h2>${escapeHtml(page.title)}</h2>
        <p class="case-meta">${escapeHtml(whereLine(page))}</p>
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
        <h3>What the Brand Hub holds</h3>
        <p class="hub-note">${escapeHtml(hub.note)}</p>
        <p>${escapeHtml(theirWords)}</p>
        ${product ? `<a href="${escapeHtml(product.url)}" target="_blank" rel="noreferrer">Catalogue page for ${escapeHtml(product.name)}</a>` : ""}
      </section>
    </div>`;
}

function whereLine(page) {
  const country = page.country || "Country not recorded";
  const site = page.site || "Site not recorded";
  return `${country} · ${site}`;
}

function renderCheck(check) {
  if (!check.flags.length) {
    return `<li class="check check-pass"><strong>${escapeHtml(check.label)}</strong><span>Matches</span></li>`;
  }
  const details = check.flags.map((flag) => `<span>${escapeHtml(flag.detail)}</span>`).join("");
  return `<li class="check check-flag"><strong>${escapeHtml(check.label)}</strong><div>${details}</div></li>`;
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
