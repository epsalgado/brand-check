import { readFile } from "node:fs/promises";
import path from "node:path";

const dataRoot = path.join(process.cwd(), "data");

/**
 * Reads a JSON file from the repo `data/` folder.
 * Swap this persistence for Databricks tables later.
 * @param {string} fileName
 * @returns {Promise<object>}
 */
export async function readJsonData(fileName) {
  const filePath = path.join(dataRoot, fileName);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}
