/**
 * Genie
 * -----
 * A stand-in for a Databricks Genie space, drawn on this screen so Kim
 * can ask a question. Wilmer: replace askGenie() with a call to the real
 * space. Keep the return shape { text, columns, rows, note }. The panel
 * only draws that shape. Do not move the answer rules into dashboard.js.
 *
 * The space should see three tables:
 *   brand_monitor.findings          this run's verdicts. Passed to askGenie
 *                                   today as the reports array.
 *   brand_monitor.hub_products      data/products.json
 *   brand_monitor.asset_downloads   data/downloads.json
 *                                   Sample counts, not Frontify. Replace
 *                                   the file. Do not treat the numbers
 *                                   as Alfa Laval's.
 *
 * Clicks are not in either file. Say so. Do not invent a click rate.
 */

const SUGGESTED = [
  "Which countries have mismatches?",
  "How is the brand spreading by source?",
  "Who downloaded logos in the last 30 days?",
  "Which templates were downloaded in the last 90 days?",
  "Which company types are using the logo?"
];

const SOURCE = {
  "alfa-laval": "Alfa Laval site",
  distributor: "Distributors",
  partner: "Partners",
  website: "Other websites",
  social: "Social"
};

let reports = [];
let downloads = [];
let root;
let turns = [];

export async function mountGenie(nextReports) {
  reports = nextReports;
  if (!downloads.length) downloads = await loadDownloads();
  root = document.getElementById("genie");
  if (!root) return;
  paintShell();
  root.addEventListener("click", onClick);
  root.querySelector("#genie-form").addEventListener("submit", onAsk);
}

export function refreshGenie(nextReports) {
  reports = nextReports;
}

async function loadDownloads() {
  const response = await fetch("data/downloads.json");
  if (!response.ok) return [];
  const body = await response.json();
  return Array.isArray(body.rows) ? body.rows : [];
}

function paintShell() {
  root.innerHTML = `
    <header class="genie-head">
      <div>
        <p class="genie-brand"><span class="genie-spark" aria-hidden="true"></span> Genie <span class="genie-stand">Stand-in</span></p>
        <p class="genie-sub">Ask about this run, or about the sample of logo and template downloads.</p>
      </div>
    </header>
    <div class="genie-log" id="genie-log"></div>
    <div class="genie-chips" id="genie-chips">
      ${SUGGESTED.map((question) => `<button type="button" data-ask="${esc(question)}">${esc(question)}</button>`).join("")}
    </div>
    <form class="genie-form" id="genie-form">
      <input id="genie-q" name="q" type="text" autocomplete="off" placeholder="Ask about countries, mismatches, logos, or templates" aria-label="Question for Genie">
      <button type="submit">Ask</button>
    </form>
  `;
  paintLog();
}

function onClick(event) {
  const button = event.target.closest("[data-ask]");
  if (!button) return;
  ask(button.dataset.ask);
}

function onAsk(event) {
  event.preventDefault();
  const input = root.querySelector("#genie-q");
  const question = input.value.trim();
  if (!question) return;
  input.value = "";
  ask(question);
}

function ask(question) {
  turns.push({ role: "you", text: question });
  turns.push({ role: "genie", ...askGenie(question) });
  if (turns.length > 8) turns = turns.slice(-8);
  paintLog();
  const last = root.querySelector("#genie-log .genie-turn:last-child");
  if (last) last.scrollIntoView({ block: "nearest" });
}

function paintLog() {
  const log = root.querySelector("#genie-log");
  if (!turns.length) {
    log.innerHTML = `<p class="genie-empty">Genie answers from the pages on this screen and from a sample download table. Pick a question or type one.</p>`;
    return;
  }
  log.innerHTML = turns.map((turn) => {
    if (turn.role === "you") return `<article class="genie-turn genie-you"><p>${esc(turn.text)}</p></article>`;
    const table = turn.columns ? renderTable(turn.columns, turn.rows) : "";
    const note = turn.note ? `<p class="genie-note">${esc(turn.note)}</p>` : "";
    return `<article class="genie-turn"><p class="genie-who">Genie</p><p>${esc(turn.text)}</p>${table}${note}</article>`;
  }).join("");
}

function renderTable(columns, rows) {
  const head = columns.map((column) => `<th>${esc(column.label)}</th>`).join("");
  const body = rows.map((row) => `
    <tr>${columns.map((column) => `<td>${cell(column, row)}</td>`).join("")}</tr>
  `).join("");
  return `<div class="genie-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function cell(column, row) {
  const value = row[column.key];
  if (column.bar) {
    return `<span class="genie-bar" style="width:${Math.max(8, Number(row.share) || 0)}%"></span> ${esc(value)}`;
  }
  return esc(value);
}

/**
 * The function to replace with the Genie space.
 * question is the text Kim typed.
 * Reads the reports and data/downloads.json already loaded.
 */
export function askGenie(question) {
  const q = question.toLowerCase();
  if (/\bclicks?\b|click rate/.test(q)) return noClicks();
  if (/download|template|logo/.test(q)) return downloadsAnswer(q);
  if (/mismatch|off brand|not on brand/.test(q)) return mismatches();
  if (/source|spread|distributor|partner|social|speaking/.test(q)) return bySource(q);
  if (/countr|world|where/.test(q)) return byCountry(q);
  if (/product/.test(q)) return byProduct();
  if (/on brand|score|how are we/.test(q)) return scoreAnswer();
  if (/30|60|90/.test(q)) return downloadsAnswer(q);
  return {
    text: "Ask which countries have mismatches, how the brand is spreading by source, or who downloaded logos and templates. Clicks are not in this stand-in.",
    note: "A connected Genie space answers in its own words from the tables."
  };
}

function noClicks() {
  return {
    text: "Clicks are not in this stand-in. What is here is where pages were found, whether they match, and a sample of logo and template downloads.",
    note: "Connect the site analytics table before asking Genie for a click rate."
  };
}

function mismatches() {
  const rows = reports.filter((report) => report.verdict === "mismatch");
  const byCountry = groupCount(rows.map((report) => report.page.country || "Country not recorded"));
  const top = byCountry[0];
  return {
    text: rows.length
      ? `${rows.length} pages are a Mismatch. ${top.label} has ${top.count}.`
      : "No mismatch is in this run.",
    columns: [
      { key: "label", label: "Country" },
      { key: "count", label: "Mismatches", bar: true }
    ],
    rows: withShare(byCountry),
    note: "Counted from this run. Review is not included."
  };
}

function bySource(q) {
  const wanted = Object.entries(SOURCE).find(([, label]) => q.includes(label.toLowerCase().replace(" site", "")) || q.includes(label.toLowerCase()));
  const groups = Object.keys(SOURCE).map((key) => {
    const group = reports.filter((report) => speakerOf(report.page) === key);
    const passed = group.filter((report) => report.verdict === "on-brand").length;
    return { label: SOURCE[key], count: `${passed} of ${group.length}`, total: group.length, passed };
  }).filter((group) => !wanted || group.label === wanted[1]);
  const shown = groups.filter((group) => group.total);
  return {
    text: "On brand by source is how many pages passed. Review and Mismatch do not pass.",
    columns: [
      { key: "label", label: "Source" },
      { key: "count", label: "On brand" }
    ],
    rows: shown,
    note: "Same count as the strip above."
  };
}

function byCountry(q) {
  const known = [...new Set(reports.map((report) => report.page.country).filter(Boolean))];
  const named = known.find((country) => q.includes(country.toLowerCase()));
  const rows = named ? reports.filter((report) => report.page.country === named) : reports;
  const groups = groupCount(rows.map((report) => report.page.country || "Country not recorded"));
  const passed = rows.filter((report) => report.verdict === "on-brand").length;
  return {
    text: named
      ? `${named}: ${passed} of ${rows.length} on brand.`
      : `${passed} of ${rows.length} pages are on brand. The split by country is below.`,
    columns: [
      { key: "label", label: "Country" },
      { key: "count", label: "Pages", bar: true }
    ],
    rows: withShare(groups),
    note: "Country is the country recorded on the page, not a visitor's location."
  };
}

function byProduct() {
  const counts = new Map();
  for (const report of reports) {
    for (const product of report.products || []) {
      if (!counts.has(product.name)) counts.set(product.name, { label: product.name, pages: 0, mismatches: 0 });
      const row = counts.get(product.name);
      row.pages += 1;
      if (report.verdict === "mismatch") row.mismatches += 1;
    }
  }
  const rows = [...counts.values()].sort((a, b) => b.mismatches - a.mismatches || b.pages - a.pages);
  return {
    text: rows.length
      ? `${rows.length} Brand Hub products are named in this run.`
      : "No Brand Hub product was named in this run.",
    columns: [
      { key: "label", label: "Product" },
      { key: "pages", label: "Pages" },
      { key: "mismatches", label: "Mismatches" }
    ],
    rows,
    note: "A page is counted when its text names the product."
  };
}

function scoreAnswer() {
  const total = reports.length;
  const passed = reports.filter((report) => report.verdict === "on-brand").length;
  const share = total ? Math.round((passed / total) * 100) : 0;
  return {
    text: `${passed} of ${total} pages are on brand, ${share}%.`,
    note: "Review does not pass. This is the same score as the tile at the top."
  };
}

function downloadsAnswer(q) {
  const windowDays = /30/.test(q) ? 30 : /60/.test(q) ? 60 : 90;
  const kind = /template/.test(q) ? "template" : /logo/.test(q) ? "logo" : "";
  const rows = downloads.filter((row) => row.ageDays <= windowDays && (!kind || row.kind === kind));
  const groupKey = /compan|type|who|using/.test(q) ? "companyType" : /countr|where/.test(q) ? "country" : "asset";
  const grouped = new Map();
  for (const row of rows) {
    const label = row[groupKey];
    grouped.set(label, (grouped.get(label) || 0) + Number(row.downloads || 0));
  }
  const table = [...grouped.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  const total = table.reduce((sum, row) => sum + row.count, 0);
  const what = kind === "logo" ? "logo" : kind === "template" ? "template" : "logo and template";
  const top = table[0];
  return {
    text: total
      ? `${total} ${what} downloads in the sample, last ${windowDays} days. ${top.label} is the largest, with ${top.count}.`
      : `No ${what} downloads in the sample for the last ${windowDays} days.`,
    columns: [
      { key: "label", label: groupKey === "companyType" ? "Company type" : groupKey === "country" ? "Country" : "Asset" },
      { key: "count", label: "Downloads", bar: true }
    ],
    rows: withShare(table),
    note: "Sample counts from data/downloads.json. Not Frontify. Replace that file with the real download table."
  };
}

function speakerOf(page) {
  if (page.channel === "social") return "social";
  return page.speaker || "website";
}

function groupCount(labels) {
  const grouped = new Map();
  for (const label of labels) grouped.set(label, (grouped.get(label) || 0) + 1);
  return [...grouped.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function withShare(rows) {
  const max = Math.max(...rows.map((row) => Number(row.count) || 0), 1);
  return rows.map((row) => ({ ...row, share: Math.round((Number(row.count) / max) * 100) }));
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
