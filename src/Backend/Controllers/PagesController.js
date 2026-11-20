import { runScan } from "@/Backend/Services/ScanService";
import { jsonOk, jsonError } from "@/Backend/Middleware/httpError";

/** Returns judged pages from the current scan pipeline. */
export async function getPages() {
  try {
    const { reports } = await runScan();
    return jsonOk({ pages: reports.map((report) => report.page), reports });
  } catch (error) {
    return jsonError(error);
  }
}
