import { readJsonData } from "@/Backend/Persistence/JsonFileStore";

export async function getAllProducts() {
  const data = await readJsonData("products.json");
  return data.products;
}
