# Brand consistency monitor

Round Two. One screen that collects pages, compares them with Alfa Laval’s own product wording and brand rules, and flags what does not match.

The public page is the prototype. The same four steps move to Databricks later. The screen can stay.

## What a coder walks through

Start at `js/main.js`. It runs the product in order:

| Step | File | What it does |
| --- | --- | --- |
| Rules | `js/brand-book.js` | Allowed colors, logo colors, hype words, claim phrases. Change a rule here. |
| Catalogue | `js/catalogue.js` | Loads `data/products.json` (375 Alfa Laval product pages) and finds which product names appear in a text. |
| Collect | `js/collector.js` | Loads `data/sources.json`. Each record is one found page: text, colors, logo facts. |
| Analyze | `js/analyzer.js` | Compares one page with the catalogue and the brand book. Returns a report. |
| Show | `js/dashboard.js` | Draws the counts, the queue, and the open case. It does not decide the verdict. |

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

## What moves to Databricks

`collector.js` is the piece that changes. A scheduled job fetches real pages and fills the same fields, including logo and color from a vision step. `analyzer.js` can be rewritten in SQL against the same rules. The dashboard still reads reports with `verdict`, `checks`, and `flags`.

## Run it

```bash
python3 -m http.server 8080
```

Open http://127.0.0.1:8080. GitHub Pages serves the `main` branch at https://epsalgado.github.io/brand-check/
