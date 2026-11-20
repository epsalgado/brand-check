import { postGenie } from "@/Backend/Controllers/GenieController";

export async function POST(request) {
  return postGenie(request);
}
