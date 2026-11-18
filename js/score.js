/**
 * Score
 * -----
 * Kim asked for "how on-brand are we in total, per country". He said the
 * real numbers need Alfa Laval's closed systems. Those systems are not
 * connected. Wilmer: this file is the score. Change it only if Kim changes
 * what counts as passed. Do not invent a similarity percent.
 *
 * The score is the share of pages that passed. Passed means the verdict
 * is On brand. Review and Mismatch do not pass. The same count is repeated
 * for each country. The "Who is speaking" strip uses this same rule. It is
 * drawn in dashboard.js from the verdict, not from a second formula.
 */

export function scoreRun(reports) {
  const total = reports.length;
  const passed = reports.filter((report) => report.verdict === "on-brand").length;
  const groups = new Map();

  for (const report of reports) {
    const country = report.page.country || "Country not recorded";
    if (!groups.has(country)) groups.set(country, { country, passed: 0, total: 0 });
    const group = groups.get(country);
    group.total += 1;
    if (report.verdict === "on-brand") group.passed += 1;
  }

  const byCountry = [...groups.values()].map((group) => ({
    ...group,
    share: shareOf(group.passed, group.total)
  }));

  return { passed, total, share: shareOf(passed, total), byCountry };
}

function shareOf(passed, total) {
  if (!total) return 0;
  return Math.round((passed / total) * 100);
}
