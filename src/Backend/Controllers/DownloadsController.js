import { loadDownloads } from "@/Backend/Services/DownloadsService";
import { toDownloadsResponse } from "@/Backend/Dto/ScanDto";
import { jsonOk, jsonError } from "@/Backend/Middleware/httpError";

export async function getDownloads() {
  try {
    const rows = await loadDownloads();
    return jsonOk(toDownloadsResponse(rows));
  } catch (error) {
    return jsonError(error);
  }
}
