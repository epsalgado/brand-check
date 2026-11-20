/**
 * Alerts
 * ------
 * The bell at the top right. Kim chooses where a notification goes,
 * when it goes, how often, and whether a reminder follows.
 *
 * Address formats, checked here:
 *   email        one or more email addresses, separated by commas.
 *                Not a Slack or Teams username.
 *   slack        incoming webhook. https://hooks.slack.com/services/T…/B…/…
 *                The URL is already tied to one channel.
 *   teams        the Workflow webhook Teams gives you. powerplatform.com,
 *                logic.azure.com, or the older webhook.office.com URL.
 *                A person's email belongs in the email row.
 *   discord      https://discord.com/api/webhooks/…
 *   google-chat  https://chat.googleapis.com/v1/spaces/…/messages?…
 *   webhook      any other https address that accepts the alert.
 *
 * Several rows can be active together. An email every morning and a
 * Slack message the moment a mismatch appears are two rows, each with
 * its own schedule.
 *
 * This browser stores the rows under "brand-check-alerts". Databricks
 * sends. Do not write a webhook or an email address into git.
 */

const STORE_KEY = "brand-check-alerts";

const CHANNELS = {
  email: {
    label: "Email",
    placeholder: "kim@company.com, brand-team@company.com",
    hint: "One email address, or several separated by commas. This is not a Slack or Teams username."
  },
  slack: {
    label: "Slack",
    placeholder: "https://hooks.slack.com/services/T…/B…/…",
    hint: "Paste the incoming webhook Slack gives you. That URL already points at one channel. A @username does not receive this."
  },
  teams: {
    label: "Microsoft Teams",
    placeholder: "https://….environment.api.powerplatform.com/…",
    hint: "Paste the Workflow webhook from Teams. It is a Power Automate address. A person's email is the Email choice, not this one."
  },
  discord: {
    label: "Discord",
    placeholder: "https://discord.com/api/webhooks/…/…",
    hint: "Paste the channel webhook from Discord. Server settings, Integrations, Webhooks. Discord does not use a username for this."
  },
  "google-chat": {
    label: "Google Chat",
    placeholder: "https://chat.googleapis.com/v1/spaces/…/messages?key=…&token=…",
    hint: "Paste the incoming webhook for the Chat space. The URL is tied to that space."
  },
  webhook: {
    label: "Other webhook",
    placeholder: "https://…",
    hint: "Any other https address that should receive the alert, such as another tool your team already uses."
  }
};

const WHEN_LABEL = {
  mismatch: "Only a new Mismatch",
  "mismatch-review": "A new Mismatch or a Review"
};

const OFTEN_LABEL = {
  immediate: "As soon as it is found",
  hourly: "Once an hour, as one digest",
  daily: "Once a day, as one digest",
  weekly: "Once a week, as one digest"
};

const REMIND_LABEL = {
  none: "No reminder",
  "1d": "Remind the next day if it is still unopened",
  "3d": "Remind after 3 days if it is still unopened",
  "daily-until-open": "Remind every day until someone opens the page"
};

let reports = [];
let routes = loadRoutes();
let dialog;

export function mountAlerts(nextReports) {
  reports = nextReports;
  if (!dialog) dialog = buildDialog();
  const openButton = document.getElementById("alerts-open");
  openButton.addEventListener("click", openDialog);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDialog();
  });
  paint();
}

export function refreshAlerts(nextReports) {
  reports = nextReports;
  paint();
}

function buildDialog() {
  const node = document.createElement("div");
  node.className = "alerts-layer";
  node.id = "alerts-dialog";
  node.hidden = true;
  node.innerHTML = `
    <div class="alerts-backdrop" data-close="1"></div>
    <section class="alerts-panel" role="dialog" aria-modal="true" aria-labelledby="alerts-title">
      <header class="alerts-head">
        <div>
          <p class="eyebrow">Notifications</p>
          <h2 id="alerts-title">Where should an alert go?</h2>
        </div>
        <button type="button" class="alerts-close" data-close="1" aria-label="Close">Close</button>
      </header>
      <p class="alerts-lead">Add every place that should hear about a problem. An email each morning and a Slack message the moment a mismatch appears are two rows. Each row keeps its own schedule.</p>
      <div id="alerts-now"></div>
      <div id="alerts-routes"></div>
      <form id="alerts-form" class="alerts-form">
        <h3>Add a destination</h3>
        <label>Where
          <select name="channel" id="alerts-channel"></select>
        </label>
        <label>Name <span>optional</span>
          <input name="label" type="text" maxlength="80" placeholder="Brand team" autocomplete="off">
        </label>
        <label>Address
          <input name="address" id="alerts-address" type="text" autocomplete="off" required>
        </label>
        <p class="alerts-hint" id="alerts-hint"></p>
        <div class="alerts-split">
          <label>Send when
            <select name="when">
              ${options(WHEN_LABEL)}
            </select>
          </label>
          <label>How often
            <select name="often">
              ${options(OFTEN_LABEL)}
            </select>
          </label>
        </div>
        <label>Reminder
          <select name="reminder">
            ${options(REMIND_LABEL)}
          </select>
        </label>
        <p class="alerts-error" id="alerts-error" hidden></p>
        <button type="submit">Add this destination</button>
      </form>
      <div class="alerts-test">
        <button type="button" id="alerts-test">Send test</button>
        <p id="alerts-test-note"></p>
      </div>
    </section>
  `;
  document.body.appendChild(node);

  const channel = node.querySelector("#alerts-channel");
  channel.innerHTML = Object.entries(CHANNELS)
    .map(([id, item]) => `<option value="${id}">${item.label}</option>`)
    .join("");
  channel.addEventListener("change", syncHint);
  syncHint();

  node.addEventListener("click", (event) => {
    const closer = event.target.closest("[data-close]");
    if (closer) closeDialog();
    const remover = event.target.closest("[data-remove]");
    if (remover) {
      routes = routes.filter((route) => route.id !== remover.dataset.remove);
      saveRoutes();
      paint();
    }
  });

  node.querySelector("#alerts-form").addEventListener("submit", onAdd);
  node.querySelector("#alerts-test").addEventListener("click", onTest);
  return node;
}

function options(map) {
  return Object.entries(map)
    .map(([id, label]) => `<option value="${id}">${label}</option>`)
    .join("");
}

function syncHint() {
  const channel = CHANNELS[dialog.querySelector("#alerts-channel").value];
  const address = dialog.querySelector("#alerts-address");
  address.placeholder = channel.placeholder;
  dialog.querySelector("#alerts-hint").textContent = channel.hint;
}

function onAdd(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const channel = String(data.get("channel"));
  const address = String(data.get("address") || "").trim();
  const error = validate(channel, address);
  const errorNode = dialog.querySelector("#alerts-error");
  if (error) {
    errorNode.hidden = false;
    errorNode.textContent = error;
    return;
  }
  errorNode.hidden = true;
  routes.push({
    id: `${Date.now()}-${routes.length}`,
    channel,
    address,
    label: String(data.get("label") || "").trim(),
    when: String(data.get("when")),
    often: String(data.get("often")),
    reminder: String(data.get("reminder"))
  });
  saveRoutes();
  form.reset();
  syncHint();
  paint();
}

function onTest() {
  const note = dialog.querySelector("#alerts-test-note");
  if (!routes.length) {
    note.textContent = "Add a destination first. Then this sends one test through every row you saved.";
    return;
  }
  const stamp = new Date().toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  routes = routes.map((route) => ({ ...route, testedAt: stamp }));
  saveRoutes();
  const plan = routes.map((route) => {
    const name = route.label || CHANNELS[route.channel].label;
    return `${name}: ${OFTEN_LABEL[route.often].toLowerCase()}`;
  }).join(" · ");
  note.innerHTML = `
    <strong>Test saved at ${esc(stamp)}.</strong>
    ${esc(plan)}.
    Databricks sends that message. This screen keeps the addresses and the schedule.
    <pre>${esc(messageFor(routes[0]))}</pre>
  `;
  paint();
}

function paint() {
  const waiting = reports.filter((report) => report.verdict === "mismatch");
  const badge = document.getElementById("bell-count");
  if (badge) {
    badge.hidden = waiting.length === 0;
    badge.textContent = String(waiting.length);
  }
  if (!dialog) return;

  const now = dialog.querySelector("#alerts-now");
  now.innerHTML = waiting.length
    ? `<p class="alerts-kicker">${waiting.length} mismatch${waiting.length === 1 ? "" : "es"} would go out now</p>
       <ul class="alerts-waiting">${waiting.map(waitingItem).join("")}</ul>`
    : `<p class="alerts-kicker">No mismatch is waiting.</p>`;

  const list = dialog.querySelector("#alerts-routes");
  list.innerHTML = routes.length
    ? `<h3>Sending to ${routes.length} destination${routes.length === 1 ? "" : "s"}</h3>
       <ul class="route-list">${routes.map(routeItem).join("")}</ul>`
    : `<p class="alerts-empty">No destination yet. Add an email and a Slack webhook if both should fire. They do not have to share a schedule.</p>`;
}

function waitingItem(report) {
  const page = report.page;
  const first = report.flags[0] ? report.flags[0].detail : "";
  return `<li><strong>${esc(page.title)}</strong><span>${esc(first)}</span></li>`;
}

function routeItem(route) {
  const name = route.label || CHANNELS[route.channel].label;
  const tested = route.testedAt ? `<span class="route-tested">Test queued ${esc(route.testedAt)}</span>` : "";
  return `
    <li>
      <div>
        <strong>${esc(name)}</strong>
        <span class="route-channel">${esc(CHANNELS[route.channel].label)}</span>
        <code>${esc(mask(route.channel, route.address))}</code>
        <span>${esc(WHEN_LABEL[route.when])}. ${esc(OFTEN_LABEL[route.often])}. ${esc(REMIND_LABEL[route.reminder])}.</span>
        ${tested}
      </div>
      <button type="button" data-remove="${esc(route.id)}">Remove</button>
    </li>
  `;
}

function messageFor(route) {
  const included = reports.filter((report) => {
    if (report.verdict === "mismatch") return true;
    return route.when === "mismatch-review" && report.verdict === "review";
  });
  const lines = included.map((report, index) => {
    const reason = report.flags[0] ? report.flags[0].detail : report.verdict;
    return `${index + 1}. ${report.page.title} — ${report.flags.length} flag${report.flags.length === 1 ? "" : "s"}\n   ${reason}`;
  });
  const title = included.length === 1 ? "1 page needs a look" : `${included.length} pages need a look`;
  return `Brand consistency monitor\n${title}\n\n${lines.join("\n\n")}`;
}

function validate(channel, address) {
  if (!address) return "Add the address first.";
  if (channel === "email") {
    const people = address.split(",").map((item) => item.trim()).filter(Boolean);
    const bad = people.find((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
    if (!people.length || bad) return "Use a real email address. For more than one, separate them with commas.";
    return "";
  }
  if (!/^https:\/\/.+/i.test(address)) return "Paste the full https address.";
  if (channel === "slack" && !/^https:\/\/hooks\.slack\.com\/services\/.+/i.test(address)) {
    return "That is not a Slack webhook. It starts with https://hooks.slack.com/services/";
  }
  if (channel === "discord" && !/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/.+/i.test(address)) {
    return "That is not a Discord webhook. It starts with https://discord.com/api/webhooks/";
  }
  if (channel === "google-chat" && !/^https:\/\/chat\.googleapis\.com\/.+/i.test(address)) {
    return "That is not a Google Chat webhook. It starts with https://chat.googleapis.com/";
  }
  if (channel === "teams" && !/powerplatform\.com|logic\.azure\.com|webhook\.office\.com|office\.com\/webhook/i.test(address)) {
    return "That is not a Teams workflow URL. Paste the full address Teams created. It usually contains powerplatform.com or logic.azure.com.";
  }
  return "";
}

function mask(channel, address) {
  if (channel === "email") return address;
  try {
    const url = new URL(address);
    const tail = url.pathname.split("/").filter(Boolean).slice(-1)[0] || "";
    const hidden = tail.length > 6 ? `${tail.slice(0, 4)}…` : "…";
    return `${url.origin}/…/${hidden}`;
  } catch {
    return "https://…";
  }
}

function loadRoutes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((route) => CHANNELS[route.channel]) : [];
  } catch {
    return [];
  }
}

function saveRoutes() {
  localStorage.setItem(STORE_KEY, JSON.stringify(routes));
}

function openDialog() {
  dialog.hidden = false;
  paint();
  dialog.querySelector("#alerts-address").focus();
}

function closeDialog() {
  if (dialog) dialog.hidden = true;
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
