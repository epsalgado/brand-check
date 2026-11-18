# Brand check

A page for team Round Two. It holds Alfa Laval’s own public product wording, and checks a pasted paragraph against it.

Two things on the page:

1. **Look up their words.** Search a product and read the headline and paragraphs from alfalaval.com.
2. **Check an outside text.** Paste a distributor line, a listing, or a post. The page finds product names from the catalogue and points at numbers or claims that are not on Alfa Laval’s page.

The wording was pulled on 18 Nov 2026 from Alfa Laval’s public product menu. It is their marketing catalogue, not the spare-parts shop.

## Run it on your machine

```bash
cd brand-check
python3 -m http.server 8080
```

Open http://127.0.0.1:8080

## Put it on GitHub Pages

Repo: `epsalgado/brand-check`, public, Pages from the `main` branch root.

The page is then https://epsalgado.github.io/brand-check/
