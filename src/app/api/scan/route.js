import { getScan } from "@/Backend/Controllers/ScanController";

export async function GET() {
  return getScan();
}
