import { runScan } from "@/Backend/Services/ScanService";
import { askGenie } from "@/Backend/Services/GenieQueryService";
import { loadDownloads } from "@/Backend/Services/DownloadsService";
import { toGenieRequest, toGenieResponse } from "@/Backend/Dto/ScanDto";
import { jsonOk, jsonError } from "@/Backend/Middleware/httpError";

export async function postGenie(request) {
  try {
    const body = await request.json();
    const { question, reports: clientReports } = toGenieRequest(body);
    if (!question) {
      return jsonError(new Error("question is required"), 400);
    }

    let reports = clientReports;
    if (!reports) {
      const scan = await runScan();
      reports = scan.reports;
    }

    const downloads = await loadDownloads();
    const answer = askGenie(question, reports, downloads);
    return jsonOk(toGenieResponse(answer));
  } catch (error) {
    return jsonError(error);
  }
}
