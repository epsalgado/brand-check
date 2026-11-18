/**
 * Brand Hub
 * ---------
 * NOT CONNECTED. Wilmer: this is the file to change when Gautam opens
 * the hub MCP.
 *
 * Kim said the Brand Hub holds the guidelines and assets, and that it
 * can be reached through an MCP. A found page is compared against that
 * hub. The public website is the world we check. The hub is the correct
 * Alfa Laval version.
 *
 * status "stand-in" means the MCP is not open. data/products.json, copied
 * from alfalaval.com on 18 Nov 2026, fills the slot. brand-book.js holds
 * the color and logo rules for the same reason.
 *
 * When the hub connects: load the hub here, set status to "connected",
 * and keep returning { id, status, label, note, catalogue }. The agent
 * and the dashboard read those fields. They should not learn a new shape.
 */

import { loadCatalogue } from "./catalogue.js";

export async function loadBrandHub() {
  const catalogue = await loadCatalogue();
  return {
    id: "brand-hub",
    status: "stand-in",
    label: "Brand Hub",
    note: "Public site stand-in until Alfa Laval connects the hub.",
    catalogue
  };
}
