const GENERIC = new Set([
  "multi", "pumps", "valves", "cooker", "modules", "sani", "systems",
  "models", "overview", "tubes", "filters", "heaters", "boilers"
]);

const EXAMPLES = {
  match: "The Alfa Laval MaxiLobe rotary lobe pump is for hygienic duties in dairy, food, beverage, and home and personal care. It is built for higher efficiency, a broader operating range, and simpler maintenance.",
  drift: "Our catalogue lists the Alfa Laval Compabloc heat exchanger as 10 times more efficient than a shell-and-tube, food-grade, and safe for any dairy plant."
};

let products = [];

const $ = (id) => document.getElementById(id);

function norm(value) {
  return (value || "")
    .toLowerCase()
    .replace(/®/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function excerpt(text, max) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function searchProducts(query) {
  const q = norm(query);
  if (!q) return [];
  const scored = [];
  for (const product of products) {
    const name = norm(product.name);
    const group = norm(product.group);
    const headline = norm(product.headline);
    const blob = norm(product.blurb + " " + product.words);
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if (group.includes(q) || headline.includes(q)) score = 40;
    else if (blob.includes(q)) score = 20;
    if (score) scored.push({ product, score });
  }
  scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
  return scored.slice(0, 8).map((item) => item.product);
}

function renderCards(list, target, emptyText) {
  if (!list.length) {
    target.innerHTML = `<p class="empty">${escapeHtml(emptyText)}</p>`;
    return;
  }
  target.innerHTML = list.map(cardHtml).join("");
}

function cardHtml(product, flags) {
  const words = excerpt(product.words || product.blurb, 420);
  const flagHtml = flags && flags.length
    ? `<ul class="flags">${flags.map((flag) => `<li>${escapeHtml(flag)}</li>`).join("")}</ul>`
    : "";
  return `
    <article class="card">
      <h3>${escapeHtml(product.name)}</h3>
      <p class="meta">${escapeHtml(product.group)}</p>
      ${product.headline ? `<p class="headline">${escapeHtml(product.headline)}</p>` : ""}
      <p class="words">${escapeHtml(words || "Alfa Laval’s page has the name, and little other text.")}</p>
      <p class="meta"><a href="${escapeHtml(product.url)}" target="_blank" rel="noreferrer">Their page</a></p>
      ${flagHtml}
    </article>`;
}

function boundaryPattern(name) {
  const cleaned = norm(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${cleaned}(?=$|[^a-z0-9])`, "i");
}

function findMentions(text) {
  const haystack = norm(text);
  const mentions = [];
  const sorted = [...products].sort((a, b) => norm(b.name).length - norm(a.name).length);
  for (const product of sorted) {
    const name = norm(product.name);
    if (name.length < 4) continue;
    const match = haystack.match(boundaryPattern(name));
    if (!match) continue;
    const index = match.index + (match[0].toLowerCase().startsWith(name) ? 0 : match[0].length - name.length);
    const nearBrand = haystack.slice(Math.max(0, index - 80), index).includes("alfa laval");
    if (GENERIC.has(name) && !nearBrand) continue;
    const start = index;
    const end = index + name.length;
    const insideLonger = mentions.some((item) => start >= item.start && end <= item.end);
    if (insideLonger) continue;
    mentions.push({ product, start, end });
  }
  return mentions.slice(0, 6);
}

function claimsIn(text) {
  const found = [];
  const numberPattern = /\b\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*(?:%|percent|times|bar)\b/gi;
  for (const match of text.matchAll(numberPattern)) found.push(match[0].replace(/\s+/g, " ").trim());
  const phrases = ["food-grade", "food grade", "chemical-free", "chemical free", "fda approved", "iso 9001", "certified organic"];
  const lower = text.toLowerCase();
  for (const phrase of phrases) {
    if (lower.includes(phrase)) found.push(phrase);
  }
  return [...new Set(found)];
}

function checkText(text) {
  const mentions = findMentions(text);
  const claims = claimsIn(text);
  const target = $("check-results");
  if (!text.trim()) {
    target.innerHTML = `<p class="empty">Paste some text first.</p>`;
    return;
  }
  if (!mentions.length) {
    target.innerHTML = `<p class="verdict quiet">No product from Alfa Laval’s catalogue showed up by name. Search above if you know which machine they mean.</p>`;
    return;
  }
  const blocks = mentions.map((mention) => {
    const own = norm(`${mention.product.words} ${mention.product.blurb} ${mention.product.headline}`);
    const flags = claims
      .filter((claim) => !own.includes(norm(claim)))
      .map((claim) => `“${claim}” is not on Alfa Laval’s page for ${mention.product.name}.`);
    return { product: mention.product, flags };
  });
  const flagged = blocks.reduce((sum, block) => sum + block.flags.length, 0);
  const names = blocks.map((block) => block.product.name).join(", ");
  const verdict = flagged
    ? `This text names ${names}. ${flagged === 1 ? "One claim" : flagged + " claims"} do not appear on the matching Alfa Laval page.`
    : `This text names ${names}. The numbers and claims we checked also appear in Alfa Laval’s own wording.`;
  target.innerHTML = `<p class="verdict ${flagged ? "warn" : "ok"}">${escapeHtml(verdict)}</p>`
    + blocks.map((block) => cardHtml(block.product, block.flags)).join("");
}

function runSearch(query) {
  const found = searchProducts(query);
  $("search-hint").textContent = query.trim()
    ? `${found.length} shown for “${query.trim()}”.`
    : "375 products from Alfa Laval’s public site, pulled 18 Nov 2026.";
  renderCards(found, $("search-results"), "Nothing in the catalogue matches that.");
}

async function start() {
  const response = await fetch("data/products.json");
  const data = await response.json();
  products = data.products;
  $("search-hint").textContent = `${data.count} products from Alfa Laval’s public site, pulled ${data.built}.`;
  $("search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch($("q").value);
  });
  $("q").addEventListener("input", () => {
    if ($("q").value.trim().length >= 2) runSearch($("q").value);
  });
  $("run-check").addEventListener("click", () => checkText($("outside").value));
  $("example-match").addEventListener("click", () => {
    $("outside").value = EXAMPLES.match;
    checkText(EXAMPLES.match);
  });
  $("example-drift").addEventListener("click", () => {
    $("outside").value = EXAMPLES.drift;
    checkText(EXAMPLES.drift);
  });
}

start().catch(() => {
  $("search-hint").textContent = "The product file did not load. Open this page through a local server or GitHub Pages, not as a bare file.";
});
