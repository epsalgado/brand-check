import { loadBrandHub } from "@/Backend/Services/BrandHubService";
import { toHubResponse } from "@/Backend/Dto/ScanDto";
import { jsonOk, jsonError } from "@/Backend/Middleware/httpError";

export async function getHub() {
  try {
    const hub = await loadBrandHub();
    return jsonOk(toHubResponse(hub));
  } catch (error) {
    return jsonError(error);
  }
}
