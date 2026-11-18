/**
 * Collector
 * ---------
 * Gathers the pages the monitor should look at.
 *
 * Today it reads snapshots in data/sources.json. Some were copied from
 * Alfa Laval's own site. Some were written by the team so a mismatch is
 * visible in the room. Every snapshot has the same shape, so the analyzer
 * does not care which is which.
 *
 * On Databricks this module goes away. A scheduled job will fetch real
 * pages and write the same fields: text, colors, and what the logo looked
 * like. The dashboard stays.
 *
 * Page snapshot shape:
 *   id, origin ("live" or "seeded"), channel, sourceType, country, site,
 *   title, url, fetchedAt, text, colors (array of #RRGGBB),
 *   logo { present, stretched, color, lockup }
 * channel is "website", "social", or "other". Social rows arrive only from
 * a feed Alfa Laval has approved. country is a country name, or "Worldwide"
 * for Alfa Laval's own global site. site is the website name.
 * lockup is one of: official-wordmark, recolored, old-wordmark, missing.
 */

export async function collectPages() {
  const response = await fetch("data/sources.json");
  if (!response.ok) {
    throw new Error("Could not load data/sources.json");
  }
  const data = await response.json();
  return data.pages;
}
