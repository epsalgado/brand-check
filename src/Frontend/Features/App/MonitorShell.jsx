"use client";

import { useEffect } from "react";
import { startMonitor } from "@/Frontend/Features/App/bootstrap";

export default function MonitorShell() {
  useEffect(() => {
    startMonitor().catch((error) => {
      const caseNode = document.getElementById("case");
      if (caseNode) caseNode.textContent = error.message;
    });
  }, []);

  return (
    <>
      <header className="mast">
        <div className="mast-brand">
          <img src="/assets/alfa-laval-logo.svg" alt="Alfa Laval" width={140} height={40} />
          <div>
            <p className="product-name">Brand consistency monitor</p>
            <p className="product-team">Round Two</p>
          </div>
        </div>
        <div className="mast-actions">
          <button type="button" className="bell" id="alerts-open" aria-haspopup="dialog" aria-controls="alerts-dialog">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="currentColor" d="M12 22a2.4 2.4 0 0 0 2.3-1.8h-4.6A2.4 2.4 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.7V3.5a2 2 0 1 0-4 0v.8A7 7 0 0 0 5 11v5l-1.7 1.7A1 1 0 0 0 4 19h16a1 1 0 0 0 .7-1.7L19 16Z" />
            </svg>
            <span className="bell-count" id="bell-count" hidden>0</span>
            <span className="visually-hidden">Notifications</span>
          </button>
          <button type="button" id="scan">Scan collected pages</button>
        </div>
      </header>

      <main>
        <p className="run-note" id="run-note">Loading the catalogue…</p>
        <section className="kpis" id="kpis" aria-label="This run" />
        <section className="links" id="links" aria-label="Brand Hub, Brand Agent, and social feed" />
        <section className="coverage" id="speakers" aria-label="On brand by source" />
        <section className="coverage" id="coverage" aria-label="On brand by country" />
        <section className="genie" id="genie" aria-label="Genie" />

        <section className="board">
          <div className="queue-wrap">
            <h2>Collected pages</h2>
            <div className="queue-head" aria-hidden="true">
              <span>Page</span><span>Source</span><span>Result</span><span>Flags</span>
            </div>
            <div id="queue" />
          </div>
          <article className="case" id="case">
            <p>Select a collected page.</p>
          </article>
        </section>
      </main>
    </>
  );
}
