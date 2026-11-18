/**
 * Score
 * -----
 * "On brand in total" and "per country" are the share of pages that
 * passed. Passed means the verdict is On brand. Review and Mismatch
 * do not pass. 3 of 6 is 50%. There is no separate 80% similarity.
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
