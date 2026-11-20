import { getDownloads } from "@/Backend/Controllers/DownloadsController";

export async function GET() {
  return getDownloads();
}
