import { readJsonData } from "@/Backend/Persistence/JsonFileStore";

export async function getAllPages() {
  const data = await readJsonData("sources.json");
  return data.pages;
}
