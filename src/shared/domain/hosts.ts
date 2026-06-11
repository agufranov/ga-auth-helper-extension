const TLD_LIST = ["ru", "by", "kz", "ae", "cn", "qa", "sa"] as const;

const LOCAL_HOSTS = /^(localhost|0\.0\.0\.0|127\.0\.0\.1)$/;

const GOLDAPPLE_HOST = new RegExp(
  `^(.+\\.)?goldapple\\.(${TLD_LIST.join("|")})$`,
);

const EXCLUDED_SUBDOMAINS = new Set([
  "portal",
  "git",
  "confluence",
  "owa",
  "jitsi",
  "mm",
]);

export function isHostSupported(hostname: string): boolean {
  if (LOCAL_HOSTS.test(hostname)) {
    return true;
  }

  const match = hostname.match(GOLDAPPLE_HOST);
  if (!match) {
    return false;
  }

  const subdomain = match[1]?.slice(0, -1) ?? "";
  if (!subdomain) {
    return true;
  }

  const firstLabel = subdomain.split(".")[0];
  if (EXCLUDED_SUBDOMAINS.has(firstLabel)) {
    return false;
  }

  if (firstLabel.startsWith("jira")) {
    return false;
  }

  return true;
}
