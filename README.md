# Brand consistency monitor

Round Two. One screen that collects pages. The Brand Agent compares each page with the Brand Hub and raises one flag per problem. The open case numbers those flags so the count matches the list.

The public page is the prototype. Wilmer: start at the header in `js/main.js`. It records what Kim asked for on 18 Nov 2026 and which file to edit. Brand Hub, Brand Agent, the design-system MCP, and the closed systems behind the country score are not connected. The code marks each one as a stand-in.

GitHub and Databricks can exchange this repo both ways. A push here is pulled into a Databricks Git folder. A commit there can be pushed back. Collected pages and scores live in Databricks tables, not in the git files.

## What a coder walks through

Start at `js/main.js`. It runs the product in order:

| Step | File | What it does |
| --- | --- | --- |
| Brand Hub | `js/brand-hub.js` | The correct Alfa Laval version. Today this is a stand-in: the public product catalogue. When their hub connects, only this file changes. |
| Rules | `js/brand-book.js` | Colors, logo colors, hype words, claim phrases. These rules are the hub stand-in. |
| Catalogue | `js/catalogue.js` | Loads `data/products.json` (375 product pages) and finds which product names appear in a text. |
| Collect | `js/collector.js` | Loads `data/sources.json`. Each record is one found page: speaker, channel, country, site, text, colors, logo facts. |
| Brand Agent | `js/brand-agent.js` | Judges one page. Returns On brand, Review, or Mismatch, plus one reason per flag. Today the local check is the stand-in. |
| Check | `js/analyzer.js` | The stand-in judgment: claims, logo, color, language. |
| Score | `js/score.js` | On brand in total, and per country. The score is how many pages passed. Review does not pass. |
| Show | `js/dashboard.js` | Draws the score, the source counts, the queue, and the open case. It numbers the flags. It does not decide the verdict. |
| Notify | `js/alerts.js` | The bell. Kim adds where an alert goes, when, how often, and whether to remind. Each destination keeps its own schedule. |

The design system is the look of the screen only (`css/dashboard.css`). It is not one of the checks.

`index.html` is the shell. `css/dashboard.css` is the Alfa Laval visual system from the public site: navy `#0B1128`, blue `#0068FF`, warm gray `#F5F3F2`, Roboto.

## A collected page

```json
{
  "id": "distributor-compabloc",
  "origin": "seeded",
  "channel": "website",
  "sourceType": "Distributor page",
  "speaker": "distributor",
  "country": "United States",
  "site": "northlineprocess.com",
  "title": "Northline Process — Compabloc offer",
  "url": "https://example.com/northline-compabloc",
  "text": "The words on the page",
  "colors": ["#E87722"],
  "logo": { "present": true, "stretched": true, "color": "#E87722", "lockup": "recolored" }
}
```

`origin` is `live` (copied on 18 Nov 2026) or `seeded` (written so the result is obvious). `lockup` is `official-wordmark`, `recolored`, `old-wordmark`, or `missing`. `logo.ground` is the measured blue behind the logo. `logo.image` is a file under `assets/` shown beside the Brand Hub logo when that check fails.

A collected row stays marked **New** until Kim clicks it. The mark is shaded, bold, and labeled. This browser remembers the click. A page added later shows **New** again. Opening the case on load does not clear it. Urgent and In progress are not on the screen until Kim asks for them.

`speaker` is the source group on the screen, under **On brand by source**. It is not a person talking. Use only `alfa-laval`, `distributor`, `partner`, `website`, or `social`. A partner is a company that works with Alfa Laval and is not their own site and not a distributor. Partners are still checked. Do not mark one on brand because of the relationship.

Add a page by appending to `data/sources.json`. Set `speaker`. The analyzer and the dashboard do not need a code change. A social row with `origin` `live` waits until Kim names an approved feed. The LinkedIn rows already in the file are `seeded` examples.

`url` is what Kim clicks. A real `https` address becomes a link on the row and in the open case. `example.com` is a written sample and is not linked.

The bell at the top right is where Kim sets alerts. Email takes one or more email addresses. Slack, Teams, Discord, and Google Chat take the webhook address that tool gives you, not a username. A webhook row is any other https address. Several destinations can be on at once, and each one has its own timing: immediately, hourly, daily, or weekly, and an optional reminder if the page is still unopened. The addresses stay in this browser. Databricks is what sends. Do not commit a webhook.

## The four checks

The Brand Agent writes every reason. The comparison is the Brand Hub, not Alfa Laval’s public website. Each failed item is its own flag. The case numbers them 1, 2, 3 in the same order as the count on the row.

1. **Claims.** Numbers like `10 times`, `90%`, `60 bar`, plus phrases in the brand book. A claim passes only when the Brand Hub entry for that product already says it. Each missing claim is one flag.
2. **Logo.** A reseller’s own logo is not a miss. The Alfa Laval logo is checked when the page shows it. Stretched, old, or recolored marks each fail on their own. Navy `#0B1128` and white pass. A missing logo fails only on Alfa Laval’s own site. `logo.ground` is the blue behind the letters. Element’s letters match and are white. The mismatch is the field `#11387F`, which is 96 away from navy `#0B1128`. The limit is 80. When the check fails and `logo.image` is set, the case shows that file beside the Brand Hub logo.
3. **Color.** Fills are checked against the Brand Hub on Alfa Laval’s own pages. A reseller’s own button color is not a miss. The color of an Alfa Laval logo is the logo check.
4. **Language.** Words such as “cheapest” and “game-changer” are a review, not a broken fact. Each word is one flag.

A high flag makes a **Mismatch**. Only language flags make a **Review**. No flags means **On brand**.

## If Friday is a yes

The screen already has a slot for each approval:

| Approval | Where it plugs in | What the screen says today |
| --- | --- | --- |
| Brand Hub is the correct version | `js/brand-hub.js` | Stand-in. The public catalogue fills it. |
| Brand Agent returns On brand, Review, or Mismatch, with one reason per flag | `js/brand-agent.js` | Stand-in. The four checks fill the same answer. The case numbers the flags. |
| Design system is only the look | `css/dashboard.css` | Already the look. It is not a check. |
| Score is the share that passed, in total and per country | `js/score.js` | Passed of total on the blue tile, and the same split on each country chip. Review does not pass. |
| On brand by source | `speaker` on each row in `data/sources.json` | Alfa Laval site, Distributors, Partners, Other websites, Social. The strip shows passed of total for each. |
| Social only from an approved feed | a new row with `channel` and `speaker` set to `social`, `origin` `live` | The two LinkedIn rows are seeded examples. The card says “Examples only.” |

## What moves to Databricks

`collector.js` is the piece that changes. A scheduled job fetches real pages and fills the same fields, including logo and color from a vision step. `brand-hub.js` then reads their hub, and `brand-agent.js` calls their agent. The dashboard still reads `verdict`, `checks`, and `flags`.

## Run it

```bash
python3 -m http.server 8080
```

Open http://127.0.0.1:8080. GitHub Pages serves the `main` branch at https://epsalgado.github.io/brand-check/
