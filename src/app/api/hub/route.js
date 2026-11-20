import { getHub } from "@/Backend/Controllers/HubController";

export async function GET() {
  return getHub();
}
