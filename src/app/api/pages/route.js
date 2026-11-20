import { getPages } from "@/Backend/Controllers/PagesController";

export async function GET() {
  return getPages();
}
