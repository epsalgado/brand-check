import { runScan } from "@/Backend/Services/ScanService";
import { toScanResponse } from "@/Backend/Dto/ScanDto";
import { jsonOk, jsonError } from "@/Backend/Middleware/httpError";

export async function getScan() {
  try {
    const result = await runScan();
    return jsonOk(toScanResponse(result));
  } catch (error) {
    return jsonError(error);
  }
}
