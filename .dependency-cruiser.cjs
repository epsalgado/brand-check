/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-repository-to-service",
      severity: "error",
      comment: "Repositories must never call Services",
      from: { path: "^src/Backend/Repositories" },
      to: { path: "^src/Backend/Services" }
    },
    {
      name: "no-controller-to-repository",
      severity: "error",
      comment: "Controllers must never call Repositories directly",
      from: { path: "^src/Backend/Controllers" },
      to: { path: "^src/Backend/Repositories" }
    },
    {
      name: "no-controller-to-persistence",
      severity: "error",
      from: { path: "^src/Backend/Controllers" },
      to: { path: "^src/Backend/Persistence" }
    },
    {
      name: "domain-isolation",
      severity: "error",
      comment: "Domain stays free of Controllers, Services, Repositories, Middleware, Dto, Persistence, Next",
      from: { path: "^src/Backend/Domain" },
      to: {
        path: "^src/Backend/(Controllers|Services|Repositories|Middleware|Dto|Persistence)|(^|/)next(/|$)|react"
      }
    },
    {
      name: "dto-isolation",
      severity: "error",
      from: { path: "^src/Backend/Dto" },
      to: {
        path: "^src/Backend/(Controllers|Services|Repositories|Middleware|Persistence)"
      }
    },
    {
      name: "no-feature-to-feature",
      severity: "error",
      comment: "Dashboard/Alerts/Genie must not import other features. App is the composition root.",
      from: { path: "^src/Frontend/Features/(Dashboard|Alerts|Genie)/" },
      to: { path: "^src/Frontend/Features/" }
    },
    {
      name: "no-components-to-features",
      severity: "error",
      from: { path: "^src/Frontend/Components" },
      to: { path: "^src/Frontend/Features" }
    },
    {
      name: "no-feature-direct-backend",
      severity: "error",
      from: { path: "^src/Frontend/Features" },
      to: { path: "^src/Backend" }
    },
    {
      name: "no-components-direct-api-fetch-layer",
      severity: "error",
      comment: "Components must not depend on Features; Features talk to Backend only via Api",
      from: { path: "^src/Frontend/Components" },
      to: { path: "^src/Frontend/Api|^src/Backend" }
    }
  ],
  options: {
    doNotFollow: {
      path: "node_modules"
    },
    tsPreCompilationDeps: false,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"]
    }
  }
};
