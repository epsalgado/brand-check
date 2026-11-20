/**
 * Alerts
 * ------
 * The bell at the top right. Kim adds a person, then every place that
 * person should be notified. One person can have an email, a Teams
 * webhook, a Slack webhook, and a Discord webhook at the same time.
 * The next person is added the same way, so three people can each
 * have all four. The same kind can also be repeated, such as two emails
 * for one person. Each address keeps its own schedule.
 *
 * Address formats, checked here:
 *   email        one email address. Not a Slack or Teams username.
 *   slack        incoming webhook. https://hooks.slack.com/services/T…/B…/…
 *                The URL is already tied to one channel.
 *   teams        the Workflow webhook Teams gives you. powerplatform.com,
 *                logic.azure.com, or the older webhook.office.com URL.
 *   discord      https://discord.com/api/webhooks/…
 *   google-chat  https://chat.googleapis.com/v1/spaces/…/messages?…
 *   webhook      any other https address that accepts the alert.
 *
 * This browser stores the people under "brand-check-alerts". Databricks
 * sends. Do not write a webhook or an email address into git.
 */

const STORE_KEY = "brand-check-alerts";

const CHANNELS = {
  email: {
    label: "Email",
    placeholder: "kim@company.com",
    hint: "This person's email address. Not a Slack or Teams username."
  },
  slack: {
    label: "Slack",
    placeholder: "https://hooks.slack.com/services/T…/B…/…",
    hint: "The incoming webhook for this person's Slack channel. A @username does not receive this."
  },
  teams: {
    label: "Microsoft Teams",
    placeholder: "https://….environment.api.powerplatform.com/…",
    hint: "The Workflow webhook for this person's Teams channel. Their email belongs on the Email line."
  },
  discord: {
    label: "Discord",
    placeholder: "https://discord.com/api/webhooks/…/…",
    hint: "The webhook for this person's Discord channel. Discord does not use a username for this."
  },
  "google-chat": {
    label: "Google Chat",
    placeholder: "https://chat.googleapis.com/v1/spaces/…/messages?key=…&token=…",
    hint: "The webhook for this person's Google Chat space."
  },
  webhook: {
    label: "Other webhook",
    placeholder: "https://…",
    hint: "Any other https address for this person."
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
let people = loadPeople();
let dialog;

export function mountAlerts(nextReports) {
  reports = nextReports;
  if (!dialog) dialog = buildDialog();
  document.getElementById("alerts-open").addEventListener("click", openDialog);
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
          <h2 id="alerts-title">Who should hear about it?</h2>
        </div>
        <button type="button" class="alerts-close" data-close="1" aria-label="Close">Close</button>
      </header>
      <p class="alerts-lead">Add a person, then each place they should be notified: email, Teams, Slack, and Discord. Add the next person the same way. Three people can each have all four. Every address keeps its own schedule.</p>
      <div id="alerts-now"></div>
      <div id="alerts-routes"></div>
      <form id="alerts-form" class="alerts-form">
        <h3>Add a person</h3>
        <label>Name
          <input id="alerts-person" name="person" type="text" maxlength="80" placeholder="Kim Gustafsson" autocomplete="name" required>
        </label>
        <div id="alerts-blocks"></div>
        <div class="add-channels">
          ${Object.entries(CHANNELS).map(([id, item]) =>
            `<button type="button" data-add-channel="${id}">Add ${item.label}</button>`
          ).join("")}
        </div>
        <p class="alerts-error" id="alerts-error" hidden></p>
        <button type="submit">Save this person</button>
      </form>
      <div class="alerts-test">
        <button type="button" id="alerts-test">Send test to everyone</button>
        <p id="alerts-test-note"></p>
      </div>
    </section>
  `;
  document.body.appendChild(node);
  addBlock("email");

  node.addEventListener("click", (event) => {
    if (event.target.closest("[data-close]")) closeDialog();
    const adder = event.target.closest("[data-add-channel]");
    if (adder) addBlock(adder.dataset.addChannel, true);
    const channelRemove = event.target.closest("[data-remove-channel]");
    if (channelRemove) removeChannel(channelRemove.dataset.person, channelRemove.dataset.channel);
    const personRemove = event.target.closest("[data-remove-person]");
    if (personRemove) {
      people = people.filter((person) => person.id !== personRemove.dataset.removePerson);
      savePeople();
      paint();
    }
    const draftRemove = event.target.closest("[data-remove-draft]");
    if (draftRemove) draftRemove.closest(".channel-block").remove();
  });

  node.querySelector("#alerts-form").addEventListener("submit", onAdd);
  node.querySelector("#alerts-test").addEventListener("click", onTest);
  return node;
}

function addBlock(channelId, focus) {
  const channel = CHANNELS[channelId];
  const root = dialog || document.getElementById("alerts-dialog");
  if (!channel || !root) return;
  const block = document.createElement("fieldset");
  block.className = "channel-block";
  block.dataset.channel = channelId;
  block.innerHTML = `
    <legend>${esc(channel.label)}</legend>
    <button type="button" data-remove-draft="1">Remove</button>
    <label>Address
      <input name="address" type="text" autocomplete="off" placeholder="${esc(channel.placeholder)}">
    </label>
    <p class="alerts-hint">${esc(channel.hint)}</p>
    <div class="alerts-split">
      <label>Send when
        <select name="when">${options(WHEN_LABEL)}</select>
      </label>
      <label>How often
        <select name="often">${options(OFTEN_LABEL)}</select>
      </label>
    </div>
    <label>Reminder
      <select name="reminder">${options(REMIND_LABEL)}</select>
    </label>
  `;
  root.querySelector("#alerts-blocks").appendChild(block);
  if (focus) block.querySelector("[name=address]").focus();
}

function options(map) {
  return Object.entries(map)
    .map(([id, label]) => `<option value="${id}">${esc(label)}</option>`)
    .join("");
}

function onAdd(event) {
  event.preventDefault();
  const name = dialog.querySelector("#alerts-person").value.trim();
  const errorNode = dialog.querySelector("#alerts-error");
  if (!name) {
    showError("Add the person's name first.");
    return;
  }
  const channels = [];
  for (const block of dialog.querySelectorAll(".channel-block")) {
    const channel = block.dataset.channel;
    const address = block.querySelector("[name=address]").value.trim();
    if (!address) continue;
    const error = validate(channel, address);
    if (error) {
      showError(`${CHANNELS[channel].label}: ${error}`);
      return;
    }
    channels.push({
      id: `${Date.now()}-${channels.length}`,
      channel,
      address,
      when: block.querySelector("[name=when]").value,
      often: block.querySelector("[name=often]").value,
      reminder: block.querySelector("[name=reminder]").value
    });
  }
  if (!channels.length) {
    showError("Add at least one address. The same person can have email, Teams, Slack, and Discord.");
    return;
  }
  errorNode.hidden = true;
  const existing = people.find((person) => person.name.toLowerCase() === name.toLowerCase());
  if (existing) existing.channels.push(...channels);
  else people.push({ id: `${Date.now()}`, name, channels });
  savePeople();
  dialog.querySelector("#alerts-person").value = "";
  dialog.querySelector("#alerts-blocks").replaceChildren();
  addBlock("email");
  dialog.querySelector("#alerts-person").focus();
  paint();
}

function showError(message) {
  const errorNode = dialog.querySelector("#alerts-error");
  errorNode.hidden = false;
  errorNode.textContent = message;
}

function removeChannel(personId, channelId) {
  people = people.flatMap((person) => {
    if (person.id !== personId) return [person];
    const channels = person.channels.filter((item) => item.id !== channelId);
    return channels.length ? [{ ...person, channels }] : [];
  });
  savePeople();
  paint();
}

function onTest() {
  const note = dialog.querySelector("#alerts-test-note");
  const channels = allChannels();
  if (!channels.length) {
    note.textContent = "Add a person first. The test goes to every address you saved, including a second and third person.";
    return;
  }
  const stamp = new Date().toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  people = people.map((person) => ({
    ...person,
    channels: person.channels.map((item) => ({ ...item, testedAt: stamp }))
  }));
  savePeople();
  const plan = people.map((person) => {
    const bits = person.channels.map((item) => `${CHANNELS[item.channel].label} ${OFTEN_LABEL[item.often].toLowerCase()}`);
    return `${person.name}: ${bits.join(", ")}`;
  }).join(" · ");
  note.innerHTML = `
    <strong>Test saved at ${esc(stamp)} for ${people.length} ${people.length === 1 ? "person" : "people"}.</strong>
    ${esc(plan)}.
    Databricks sends that message to every address. This screen keeps the people and the schedules.
    <pre>${esc(messageFor(channels[0]))}</pre>
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
  const count = allChannels().length;
  list.innerHTML = people.length
    ? `<h3>${people.length} ${people.length === 1 ? "person" : "people"} · ${count} notification${count === 1 ? "" : "s"}</h3>
       ${people.map(personCard).join("")}`
    : `<p class="alerts-empty">No one is on the list yet. Save the first person with the addresses they want, then save the next person.</p>`;
}

function personCard(person) {
  return `
    <article class="person-card">
      <header>
        <h3>${esc(person.name)}</h3>
        <button type="button" data-remove-person="${esc(person.id)}">Remove person</button>
      </header>
      <ul class="route-list">
        ${person.channels.map((item) => channelItem(person, item)).join("")}
      </ul>
    </article>
  `;
}

function channelItem(person, item) {
  const tested = item.testedAt ? `<span class="route-tested">Test queued ${esc(item.testedAt)}</span>` : "";
  return `
    <li>
      <div>
        <span class="route-channel">${esc(CHANNELS[item.channel].label)}</span>
        <code>${esc(mask(item.channel, item.address))}</code>
        <span>${esc(WHEN_LABEL[item.when])}. ${esc(OFTEN_LABEL[item.often])}. ${esc(REMIND_LABEL[item.reminder])}.</span>
        ${tested}
      </div>
      <button type="button" data-person="${esc(person.id)}" data-channel="${esc(item.id)}" data-remove-channel="1">Remove</button>
    </li>
  `;
}

function waitingItem(report) {
  const first = report.flags[0] ? report.flags[0].detail : "";
  return `<li><strong>${esc(report.page.title)}</strong><span>${esc(first)}</span></li>`;
}

function allChannels() {
  return people.flatMap((person) => person.channels);
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return "Use one email address. Add another Email line for a second inbox.";
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

function loadPeople() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    if (saved.some((item) => Array.isArray(item.channels))) {
      return saved.filter((person) => person && person.name && Array.isArray(person.channels));
    }
    return saved.filter((route) => CHANNELS[route.channel]).map((route) => ({
      id: route.id,
      name: route.label || CHANNELS[route.channel].label,
      channels: [route]
    }));
  } catch {
    return [];
  }
}

function savePeople() {
  localStorage.setItem(STORE_KEY, JSON.stringify(people));
}

function openDialog() {
  dialog.hidden = false;
  paint();
  dialog.querySelector("#alerts-person").focus();
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
