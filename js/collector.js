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
 *   id, origin ("live" or "seeded"), channel, sourceType, speaker,
 *   country, site, title, url, fetchedAt, text, colors (array of #RRGGBB),
 *   logo { present, stretched, color, lockup }
 *
 * channel is "website" or "social".
 * speaker is who is talking. Set it on every row. Wilmer, use only these:
 *   "alfa-laval"   their own site, such as alfalaval.com
 *   "distributor"  a distributor page
 *   "partner"      a company that works with them and is not a distributor
 *   "website"      any other site, such as spare parts or news
 *   "social"       a social post. Must match channel "social".
 * A partner is checked like every other row. Do not skip the check, and
 * do not mark a partner on brand because they work with Alfa Laval.
 * Social rows with origin "live" arrive only from a feed Kim has approved.
 * The LinkedIn rows already in this file are origin "seeded": examples.
 * Four company pages were fetched on 18 Nov 2026 and marked origin "live":
 * Element Engineers, ABK Solution, AEL Heat Exchangers, and Moody Direct.
 * logo.present false means the Alfa Laval wordmark was not in the page
 * images. That is not a mismatch. They are resellers. Their own logo
 * belongs on their page. Set logo.present true, and lockup "recolored",
 * "old-wordmark", or stretched, only when the page shows the Alfa Laval
 * wordmark and that mark is wrong.
 * Do not record a reseller's own button colors as a brand miss. AEL's
 * orange is their site, not Alfa Laval's.
 * country is a country name, or "Worldwide" for Alfa Laval's own global site.
 * url is the address Kim opens. A real https address is a link on the
 * screen. example.com is a written sample and is not linked.
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
