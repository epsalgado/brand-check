/**
 * Collector
 * ---------
 * Gathers the pages the monitor should look at.
 *
 * Kim's first task is to gather the data. He has not said a social scrape
 * is allowed, because a scrape includes personal data. Wilmer: add public
 * company pages here (distributor sites, spare-part shops, news). The two
 * LinkedIn rows in sources.json are written examples, origin "seeded".
 * A real social row, origin "live", waits until Kim names an approved feed.
 *
 * Today this reads snapshots in data/sources.json. Some were copied from
 * Alfa Laval's own site. Some were written by the team so a mismatch is
 * visible in the room. Every snapshot has the same shape.
 *
 * On Databricks a scheduled job replaces this file and writes the same
 * fields. The dashboard stays. Git can move this code into a Databricks
 * Git folder and back. The collected rows themselves live in tables, not
 * in the git push.
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
