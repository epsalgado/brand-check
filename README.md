# Brand consistency monitor

Round Two. One screen that collects pages, compares them with Alfa Laval’s own product wording and brand rules, and flags what does not match.

The public page is the prototype. Wilmer: start at the header in `js/main.js`. It records what Kim asked for on 18 Nov 2026 and which file to edit. Brand Hub, Brand Agent, the design-system MCP, and the closed systems behind the country score are not connected. The code marks each one as a stand-in.

GitHub and Databricks can exchange this repo both ways. A push here is pulled into a Databricks Git folder. A commit there can be pushed back. Collected pages and scores live in Databricks tables, not in the git files.

## What a coder walks through

Start at `js/main.js`. It runs the product in order:

| Step | File | What it does |
| --- | --- | --- |
| Brand Hub | `js/brand-hub.js` | The correct Alfa Laval version. Today this is a stand-in: the public product catalogue. When their hub connects, only this file changes. |
| Rules | `js/brand-book.js` | Colors, logo colors, hype words, claim phrases. These rules are the hub stand-in. |
| Catalogue | `js/catalogue.js` | Loads `data/products.json` (375 product pages) and finds which product names appear in a text. |
| Collect | `js/collector.js` | Loads `data/sources.json`. Each record is one found page: channel, country, site, text, colors, logo facts. |
| Brand Agent | `js/brand-agent.js` | Judges one page. Returns On brand, Review, or Mismatch, plus the reason. Today the local check is the stand-in. |
| Check | `js/analyzer.js` | The stand-in judgment: claims, logo, color, language. |
| Score | `js/score.js` | On brand in total, and per country. The score is how many pages passed: 3 of 6 is 50%. |
| Show | `js/dashboard.js` | Draws the score, the three connections, the queue, and the open case. It does not decide the verdict. |

The design system is the look of the screen only (`css/dashboard.css`). It is not one of the checks.

`index.html` is the shell. `css/dashboard.css` is the Alfa Laval visual system from the public site: navy `#0B1128`, blue `#0068FF`, warm gray `#F5F3F2`, Roboto.

## A collected page

```json
{
  "id": "distributor-compabloc",
  "origin": "seeded",
  "sourceType": "Distributor page",
  "title": "Northline Process — Compabloc offer",
  "url": "https://example.com/northline-compabloc",
  "text": "The words on the page",
  "colors": ["#E87722"],
  "logo": { "present": true, "stretched": true, "color": "#E87722", "lockup": "recolored" }
}
```

`origin` is `live` (copied from alfalaval.com) or `seeded` (written so the mismatch is obvious). `lockup` is `official-wordmark`, `recolored`, `old-wordmark`, or `missing`.

Add a page by appending to `data/sources.json`. The analyzer and the dashboard do not need a code change.

## The four checks

1. **Claims.** Numbers like `10 times`, `90%`, `60 bar`, plus phrases in the brand book. A claim passes only when Alfa Laval’s own page for that product already says it.
2. **Logo.** Missing, stretched, old, or recolored marks fail. Navy `#0B1128` and white pass.
3. **Color.** Every recorded fill must sit near the palette. Orange and purple fail. Their own blues pass.
4. **Language.** Words such as “cheapest” and “game-changer” are a review, not a broken fact.

High flags make a **Mismatch**. Only language flags make a **Review**. No flags means **On brand**.

## If Friday is a yes

The screen already has a slot for each approval:

| Approval | Where it plugs in | What the screen says today |
| --- | --- | --- |
| Brand Hub is the correct version | `js/brand-hub.js` | Stand-in. The public catalogue fills it. |
| Brand Agent returns On brand, Review, or Mismatch, with the reason | `js/brand-agent.js` | Stand-in. The four checks fill the same answer. |
| Design system is only the look | `css/dashboard.css` | Already the look. It is not a check. |
| Score is the share that passed, in total and per country | `js/score.js` | 3 of 6, and the same split on each country chip. |
| Collect websites now | `data/sources.json`, `channel: "website"` | Six website pages are in the run. |
| Social only from an approved feed | a new row with `channel: "social"` | The social card says Waiting. No feed is invented. |

## What moves to Databricks

`collector.js` is the piece that changes. A scheduled job fetches real pages and fills the same fields, including logo and color from a vision step. `brand-hub.js` then reads their hub, and `brand-agent.js` calls their agent. The dashboard still reads `verdict`, `checks`, and `flags`.

## Run it

```bash
python3 -m http.server 8080
```

Open http://127.0.0.1:8080. GitHub Pages serves the `main` branch at https://epsalgado.github.io/brand-check/
