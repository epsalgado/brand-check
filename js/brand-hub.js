/**
 * Brand Hub
 * ---------
 * The correct Alfa Laval version a found page is compared against:
 * product names, approved wording, and the brand rules.
 *
 * status "stand-in" means the hub is not connected yet. The public
 * product catalogue fills the same slot. When Alfa Laval opens the hub,
 * this function is the only place that changes. The agent and the
 * dashboard keep reading `hub.catalogue` and `hub.status`.
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
