/**
 * API boundary shapes. Controllers map Service results through these.
 * Domain stays free of Next.js / HTTP types.
 */

export function toScanResponse({ hub, reports, score }) {
  return {
    hub: {
      id: hub.id,
      status: hub.status,
      label: hub.label,
      note: hub.note,
      catalogueCount: hub.catalogue.length
    },
    reports,
    score
  };
}

export function toGenieRequest(body) {
  return {
    question: String(body?.question || "").trim(),
    reports: Array.isArray(body?.reports) ? body.reports : null
  };
}

export function toGenieResponse(answer) {
  return {
    text: answer.text || "",
    columns: answer.columns || null,
    rows: answer.rows || null,
    note: answer.note || null
  };
}

export function toHubResponse(hub) {
  return {
    id: hub.id,
    status: hub.status,
    label: hub.label,
    note: hub.note,
    catalogueCount: hub.catalogue.length
  };
}

export function toDownloadsResponse(rows) {
  return { rows };
}
