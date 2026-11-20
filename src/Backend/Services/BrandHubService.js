/**
 * Brand Hub stand-in. Replace the catalogue source when the hub MCP connects.
 * Keep returning { id, status, label, note, catalogue }.
 */

import { getAllProducts } from "@/Backend/Repositories/ProductCatalogueRepository";

export async function loadBrandHub() {
  const catalogue = await getAllProducts();
  return {
    id: "brand-hub",
    status: "stand-in",
    label: "Brand Hub",
    note: "The correct Alfa Laval version. The Brand Agent compares each found page against this.",
    catalogue
  };
}
