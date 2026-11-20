/**
 * Genie panel UI. Answer rules live in Backend GenieQueryService.
 * This feature calls Frontend/Api only. Keep drawing { text, columns, rows, note }.
 */

import { ask as askGenieApi } from "@/Frontend/Api/genieApi";
import { escapeHtml as esc } from "@/Frontend/Components/escapeHtml";

const SUGGESTED = [
  "Which countries have mismatches?",
  "How is the brand spreading by source?",
  "Who downloaded logos in the last 30 days?",
  "Which templates were downloaded in the last 90 days?",
  "Which company types are using the logo?"
];

let reports = [];
let root;
let turns = [];

export async function mountGenie(nextReports) {
  reports = nextReports;
  root = document.getElementById("genie");
  if (!root) return;
  paintShell();
  root.addEventListener("click", onClick);
  root.querySelector("#genie-form").addEventListener("submit", onAsk);
}

export function refreshGenie(nextReports) {
  reports = nextReports;
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

async function ask(question) {
  turns.push({ role: "you", text: question });
  paintLog();
  try {
    const answer = await askGenieApi(question, reports);
    turns.push({ role: "genie", ...answer });
  } catch (error) {
    turns.push({
      role: "genie",
      text: error.message || "Genie could not answer.",
      note: "The Backend Genie endpoint failed."
    });
  }
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
