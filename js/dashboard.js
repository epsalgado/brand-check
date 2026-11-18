/**
 * Dashboard
 * ---------
 * Draws one screen: the score, the connection cards, the queue, and the
 * open case. Wilmer: do not put a new brand rule in this file. The Brand
 * Agent already decided. This file only presents verdict, reasons, and the
 * pass share from score.js.
 *
 * The cards say Stand-in or Waiting on purpose. Brand Hub, Brand Agent,
 * and a live social feed are not connected.
 *
 * "Who is speaking" is a count, not a new check. The groups are:
 *   alfa-laval   Alfa Laval's own site
 *   distributor  a distributor page
 *   partner      a company that works with Alfa Laval. Still checked.
 *                Harbour Hygienic is Review, so Partners is 0 of 1.
 *   website      any other site, such as a spare-parts listing
 *   social       a post. Seeded rows are samples. Live rows need Kim's feed.
 * The chip is "passed of total" for that group. Review does not pass.
 * Wilmer: set page.speaker in data/sources.json. This file only reads it.
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

const SPEAKER_ORDER = ["alfa-laval", "distributor", "partner", "website", "social"];

const SPEAKER_LABEL = {
  "alfa-laval": "Alfa Laval",
  distributor: "Distributors",
  partner: "Partners",
  website: "Websites",
  social: "Social"
};

const SPEAKER_ROW = {
  "alfa-laval": "Alfa Laval",
  distributor: "Distributor",
  partner: "Partner",
  website: "Website",
  social: "Social"
};

let selectedId = "";

export function renderDashboard(reports, context) {
  if (!selectedId || !reports.some((report) => report.page.id === selectedId)) {
    const firstProblem = reports.find((report) => report.verdict !== "on-brand");
    selectedId = (firstProblem || reports[0]).page.id;
  }
  renderCounts(reports, context.score);
  renderLinks(reports, context.hub);
  renderSpeakers(reports);
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
  const socialReports = reports.filter((report) => speakerOf(report.page) === "social");
  const socialLive = socialReports.some((report) => report.page.origin === "live");
  const socialState = socialReports.length === 0
    ? "Waiting"
    : socialLive
      ? `${socialReports.length} posts`
      : `${socialReports.length} samples`;
  const socialNote = socialReports.length === 0
    ? "Social waits for an approved feed."
    : socialLive
      ? "From the approved feed."
      : "Examples only. Not a live scrape.";
  document.getElementById("links").innerHTML = `
    ${linkCard("Brand Hub", "Stand-in", hub.note)}
    ${linkCard("Brand Agent", "Stand-in", "Returns On brand, Review, or Mismatch, with the reason.")}
    ${linkCard("Social feed", socialState, socialNote)}`;
}

function linkCard(title, state, note) {
  return `<article><p>${escapeHtml(title)}</p><strong>${escapeHtml(state)}</strong><span>${escapeHtml(note)}</span></article>`;
}

function kpi(label, value, note, tone) {
  return `<article class="kpi kpi-${tone}"><p>${escapeHtml(label)}</p><strong>${value}</strong><span>${escapeHtml(note)}</span></article>`;
}

function renderSpeakers(reports) {
  const chips = SPEAKER_ORDER.map((speaker) => {
    const group = reports.filter((report) => speakerOf(report.page) === speaker);
    const passed = group.filter((report) => report.verdict === "on-brand").length;
    return `<li><span>${escapeHtml(SPEAKER_LABEL[speaker])}</span> ${passed} of ${group.length}</li>`;
  }).join("");
  document.getElementById("speakers").innerHTML = `
    <p>Who is speaking</p>
    <ul>${chips}</ul>`;
}

function speakerOf(page) {
  if (page.channel === "social") return "social";
  return page.speaker || "website";
}

function sourceLine(page) {
  const speaker = speakerOf(page);
  const label = SPEAKER_ROW[speaker] || "Website";
  if (speaker === "social") return `${label} · ${page.sourceType}`;
  if (speaker === "website") return `${label} · ${page.sourceType}`;
  return label;
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
    return `
      <button type="button" class="queue-row${selected}" data-id="${escapeHtml(report.page.id)}">
        <span class="queue-title">${escapeHtml(report.page.title)}<span class="queue-where">${escapeHtml(whereLine(report.page))}</span></span>
        <span class="queue-type">${escapeHtml(sourceLine(report.page))}</span>
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
