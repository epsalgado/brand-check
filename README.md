# Brand consistency monitor

Round Two. One screen that collects pages. The Brand Agent compares each page with the Brand Hub and raises one flag per problem. The open case numbers those flags so the count matches the list.

The app is a Next.js prototype with clean architecture under `src/Backend` and `src/Frontend`. Wilmer: start at `src/Frontend/Features/App/bootstrap.js` (UI) and `src/Backend/Services/` (judgment). Brand Hub, Brand Agent, the design-system MCP, and the closed systems behind the country score are not connected. The code marks each one as a stand-in.

GitHub and Databricks can exchange this repo both ways. A push here is pulled into a Databricks Git folder. A commit there can be pushed back. Collected pages and scores live in Databricks tables, not in the git files. A pull brings this repo. It does not start the model or the send. The steps after the pull are under **After you pull this into Databricks**.

Layer rules live in `rules/backend-architecture.mdc` and `rules/frontend-architecture.mdc`. Call direction: `Controller → Service → Repository → Persistence`. The UI talks to the Backend only through `src/Frontend/Api/` and `/api/*`.

## What a coder walks through

| Step | File | What it does |
| --- | --- | --- |
| Brand Hub | `src/Backend/Services/BrandHubService.js` | The correct Alfa Laval version. Today this is a stand-in: the public product catalogue. When their hub connects, only this service changes. |
| Rules | `src/Backend/Domain/BrandRules.js` | Colors, logo colors, hype words, claim phrases. These rules are the hub stand-in. |
| Catalogue | `src/Backend/Domain/CatalogueMatching.js` + `ProductCatalogueRepository.js` | Loads `data/products.json` (375 product pages) and finds which product names appear in a text. |
| Collect | `src/Backend/Repositories/PageRepository.js` | Loads `data/sources.json`. Each record is one found page: speaker, channel, country, site, text, colors, logo facts. |
| Brand Agent | `src/Backend/Services/BrandAgentService.js` | Judges one page. Returns On brand, Review, or Mismatch, plus one reason per flag. Today the local check is the stand-in. |
| Check | `src/Backend/Services/PageAnalysisService.js` | The stand-in judgment: claims, logo, color, language. |
| Score | `src/Backend/Services/ScoringService.js` | On brand in total, and per country. The score is how many pages passed. Review does not pass. |
| API | `src/app/api/scan`, `src/app/api/genie` | Thin Next.js routes that call Backend Controllers. |
| Show | `src/Frontend/Features/Dashboard/` | Draws the score, the source counts, the queue, and the open case. It numbers the flags. It does not decide the verdict. |
| Notify | `src/Frontend/Features/Alerts/` | The bell. Kim adds people and their addresses. The header of that file is the Databricks send. |
| Genie | `src/Backend/Services/GenieQueryService.js` + `src/Frontend/Features/Genie/` | Server answers; the panel only draws `{ text, columns, rows, note }`. |

The design system is the look of the screen only (`src/app/dashboard.css`). It is not one of the checks.

`src/app/page.js` is the shell. Styles are the Alfa Laval visual system from the public site: navy `#0B1128`, blue `#0068FF`, warm gray `#F5F3F2`, Roboto.

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

The bell at the top right is where Kim sets alerts. He adds a person, then that person's email, Teams, Slack, Discord, Google Chat, or another webhook. The same person can have all of them. He then adds the next person, so several people can each receive the same kinds of alert. Chat tools take the webhook address that tool gives you, not a username. Every address has its own timing: immediately, hourly, daily, or weekly, and an optional reminder if the page is still unopened. The addresses stay in this browser under `brand-check-alerts`. The screen does not send them.

## Connect the send

Wilmer and Riman: the steps are in the header of `src/Frontend/Features/Alerts/alerts.js`. Short version:

The screen is the form. Databricks sends. A workspace admin adds one notification destination per address under Settings, Notifications. Email, Slack, and Teams are destination types, and Databricks writes those messages. Discord and Google Chat are not, so a Job posts those.

A SQL Alert has one schedule. Make one alert per cadence (15 minutes, hourly, daily at 08:00 Europe/Stockholm, Monday 08:00) and subscribe only the destinations on that cadence. The mismatch query is `verdict = 'mismatch'` and `opened_at` is empty. A second query covers Review, and only people who chose "Mismatch or Review" subscribe to it. Leave retrigger off.

Reminders are a daily Job, not the alert retrigger. `1d` and `3d` send once. `daily-until-open` sends each day until the queue click sets `opened_at`. The click today only fills `brand-check-seen` in the browser. Point that click at the finding row or the alert keeps firing.

The SQL Alert webhook payload is an alert state change. It does not include the page rows. Put the page title and the first reason in the alert's custom subject and body for email, Slack, and Teams. Do not commit a webhook.

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
| Brand Hub is the correct version | `src/Backend/Services/BrandHubService.js` | Stand-in. The public catalogue fills it. |
| Brand Agent returns On brand, Review, or Mismatch, with one reason per flag | `src/Backend/Services/BrandAgentService.js` | Stand-in. The four checks fill the same answer. The case numbers the flags. |
| Design system is only the look | `src/app/dashboard.css` | Already the look. It is not a check. |
| Score is the share that passed, in total and per country | `src/Backend/Services/ScoringService.js` | Passed of total on the blue tile, and the same split on each country chip. Review does not pass. |
| On brand by source | `speaker` on each row in `data/sources.json` | Alfa Laval site, Distributors, Partners, Other websites, Social. The strip shows passed of total for each. |
| Social only from an approved feed | a new row with `channel` and `speaker` set to `social`, `origin` `live` | The two LinkedIn rows are seeded examples. The card says “Examples only.” |
| Genie answers from the tables | `askGenie()` in `GenieQueryService.js` | Stand-in. It answers this run, plus sample logo and template downloads in `data/downloads.json`. Clicks are not invented. |

## After you pull this into Databricks

Wilmer and Riman: do these in order. The GitHub page keeps working as the prototype while you do them. Leave `verdict`, `checks`, and `flags` in the shape `dashboard.js` already reads.

The model list the team was sent, 20 Nov 2026:

https://docs.databricks.com/aws/en/machine-learning/model-serving/foundation-model-overview

That page is the menu of models. A name on the page can still be missing in this workspace. Open Unity Gateway and confirm the service exists, and that you can query it, before you write the job. Use a `system.ai` model on pay-per-token. This batch is small. Do not reserve provisioned throughput.

Call the model with `ai_query` from a SQL warehouse that supports AI Functions, or from a Job on Databricks Runtime 15.4 LTS or newer. Classic SQL warehouses cannot run `ai_query`.

### 1. Load what this repo already collected

| Load this | Into | Why |
| --- | --- | --- |
| `data/products.json` | `brand_monitor.hub_products` | The Brand Hub stand-in. 375 product pages copied from alfalaval.com on 18 Nov 2026. The real hub, when Gautam connects it, replaces `BrandHubService` only. |
| `data/sources.json` | `brand_monitor.pages` | The found pages. `speaker`, `origin`, `country`, `text`, and `logo` stay as they are. |
| `public/assets/alfa-laval-logo.svg` and `public/assets/found/` | a Unity Catalog Volume | The Brand Hub logo, the Element plaque, and the written stretched-logo example. The vision step reads these files. |

`origin` `live` was copied on 18 Nov 2026. `origin` `seeded` was written so the miss is obvious. Keep that column. Social rows stay seeded until Kim names an approved feed.

### 2. Three model calls, then one findings table

The stand-in judge is `PageAnalysisService`. Keep it until the table below agrees with it on the seeded rows. Then `BrandAgentService` can read the table. The return shape stays `verdict` plus one reason per flag.

| Job | Model to ask for | What it must return |
| --- | --- | --- |
| Pick which of the 375 products the page is about | An embedding model. GTE Large (English), or Qwen3-Embedding. | The nearest hub row. This does not decide On brand or Mismatch. |
| Judge the words | A text model such as Claude Sonnet. Haiku is enough if the workspace is limiting cost. | `on-brand`, `review`, or `mismatch`, and one reason per problem. A high flag is a Mismatch. Language-only is a Review. No flags is On brand. |
| Judge the logo, when `logo.image` is set | A vision model. Llama 4 Maverick, or Claude Sonnet. Pass the found image and `assets/alfa-laval-logo.svg`. | Its own flag when the mark does not match the hub logo. Element is a mismatch because the blue field is `#11387F`, 96 away from navy `#0B1128`. The letters match. |

The Gemini image models on that page make pictures. They are the wrong call, and they are not available to `ai_query`.

Sentiment models are on the same page. Leave them off the alert. A page can sound positive and still be off brand.

Write `brand_monitor.findings` with `page_id`, `title`, `verdict`, `flag_count`, `first_reason`, `page_url`, `speaker`, `country`, `detected_at`, `opened_at`, `status`. The score, the queue, and the alert read this table. `status` starts as `new`. `opened_at` stays empty until someone opens the page.

A Lakeflow pipeline or a scheduled Job can run the three calls. Bronze is `pages`. Gold is `findings`.

### 3. Point the screen and the alert at that table

The Dashboard feature draws the gold rows. It does not judge them. The **New** click today writes `brand-check-seen` in the browser. The same click has to set `opened_at` on the finding. Until it does, an alert keeps firing after Kim has opened the page.

The bell stores people and schedules in this browser under `brand-check-alerts`. It does not send. Create the destinations and the SQL Alerts only after `findings` has rows. The header of `src/Frontend/Features/Alerts/alerts.js` is the send: one destination per address, one alert per cadence, a separate Job for Discord, Google Chat, and reminders. Do not commit a webhook.

### 4. What can wait for Kim

The public catalogue can load before the real Brand Hub exists. The seeded pages can be judged before a social feed exists. Real email and webhook addresses wait until Kim types them into the bell. Do not scrape LinkedIn, Instagram, Facebook, or X until he names an approved feed.

## Run it

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000.

```bash
npm test          # Backend unit + architecture boundary tests
npm run arch      # dependency-cruiser layer rules
npm run build && npm start
```
