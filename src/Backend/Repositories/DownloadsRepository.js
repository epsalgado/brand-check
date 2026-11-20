import { readJsonData } from "@/Backend/Persistence/JsonFileStore";

export async function getAllDownloads() {
  try {
    const data = await readJsonData("downloads.json");
    return Array.isArray(data.rows) ? data.rows : [];
  } catch {
    return [];
  }
}
