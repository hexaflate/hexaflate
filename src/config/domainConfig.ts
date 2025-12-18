// Domain-based environment configuration
// Add new domain rules here to extend the configuration

type DomainRule = {
  match: (hostname: string, port: string) => boolean;
  envSuffix: string;
  name: string;
};

// Define domain rules - order matters, first match wins
const domainRules: DomainRule[] = [
  {
    name: "development",
    envSuffix: "_DEV",
    match: (hostname, port) =>
      (hostname === "localhost" && port === "4000") ||
      hostname === "web.hexaloom.com",
  },
  {
    name: "web_report",
    envSuffix: "_REPORT",
    match: (hostname, port) => hostname === "report.hexaloom.com",
  },
  // Add more domain rules here:
  // {
  //   name: 'staging',
  //   envSuffix: '_STAGING',
  //   match: (hostname) => hostname === 'staging.hexaloom.com',
  // },
  // {
  //   name: 'production',
  //   envSuffix: '_PROD',
  //   match: (hostname) => hostname.endsWith('.hexaloom.com'),
  // },
];

function getCurrentDomainInfo(): { hostname: string; port: string } {
  if (typeof window === "undefined") {
    return { hostname: "localhost", port: "" };
  }
  return {
    hostname: window.location.hostname,
    port: window.location.port,
  };
}

function getMatchedRule(): DomainRule | null {
  const { hostname, port } = getCurrentDomainInfo();
  for (const rule of domainRules) {
    if (rule.match(hostname, port)) {
      return rule;
    }
  }
  return null;
}

// Get the environment suffix for the current domain
export function getEnvSuffix(): string {
  const rule = getMatchedRule();
  return rule?.envSuffix || "";
}

// Get the domain rule name for the current domain
export function getDomainName(): string {
  const rule = getMatchedRule();
  return rule?.name || "default";
}

// Helper to get env value with domain-specific fallback
function getEnvValue(key: string): string {
  const suffix = getEnvSuffix();
  const env = import.meta.env;

  // Try suffixed version first (e.g., VITE_API_ENDPOINTS_DEV)
  if (suffix) {
    const suffixedKey = `VITE_${key}${suffix}`;
    if (env[suffixedKey] !== undefined && env[suffixedKey] !== "") {
      return env[suffixedKey];
    }
  }

  // Fall back to base VITE_ key
  const baseKey = `VITE_${key}`;
  return env[baseKey] || "";
}

// Exported config getters
export const domainConfig = {
  get apiEndpoints(): string {
    return getEnvValue("API_ENDPOINTS");
  },

  get xTokenValue(): string {
    return getEnvValue("X_TOKEN_VALUE");
  },

  get wsBackendHost(): string {
    return getEnvValue("WS_BACKEND_HOST");
  },

  get webTitle(): string {
    return getEnvValue("WEB_TITLE");
  },

  get webFavicon(): string {
    return getEnvValue("WEB_FAVICON");
  },

  get themeColor(): string {
    return getEnvValue("WEBREPORT_THEME_COLOR") || "#22C55E";
  },

  get themeColorLight(): string {
    return getEnvValue("WEBREPORT_THEME_COLOR_LIGHT") || "#4ADE80";
  },
};

// Export for debugging
export function getDomainConfig() {
  return {
    currentDomain: getCurrentDomainInfo(),
    matchedRule: getMatchedRule(),
    envSuffix: getEnvSuffix(),
    config: {
      apiEndpoints: domainConfig.apiEndpoints,
      xTokenValue: domainConfig.xTokenValue ? "***" : "",
      wsBackendHost: domainConfig.wsBackendHost,
      webTitle: domainConfig.webTitle,
      webFavicon: domainConfig.webFavicon,
      themeColor: domainConfig.themeColor,
      themeColorLight: domainConfig.themeColorLight,
    },
  };
}
