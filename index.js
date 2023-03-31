// import cp from "node:child_process";
import fs from "node:fs/promises";

const TIMEOUT_SEC = 8;

const breaches = await fetch("https://haveibeenpwned.com/api/v3/breaches").then(res => res.json());

// Dedupe domains...
const domains = Array.from(breaches.reduce((set, b) => {
  if (b.Domain) set.add(b.Domain.toLowerCase());
  return set;
}, new Set())).sort();

const linkStats = new Map();

for (const domain of domains) {
  const data = {
    hostname: domain,
    href: `https://${domain}`,
  };
  let res;
  try {
    res = await fetchWithTimeout(data.href);
  } catch (err) {
    data.error = err.message;
  }
  data.status = res?.status || 0;
  data.statusText = res?.statusText || "ERROR";
  linkStats.set(domain, data);
  const contents = Object.values(Object.fromEntries(linkStats));
  await fs.writeFile("curl.json", JSON.stringify(contents, null, 2));
}

console.log(JSON.stringify(Object.values(Object.fromEntries(linkStats)), null, 2));
process.exit(0);

async function fetchWithTimeout(href, options = {}) {
  const { timeout = TIMEOUT_SEC * 1000 } = options;
  const headers = new Headers({
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
  });
  
  const controller = new AbortController();
  const id = setTimeout(() => {
    controller.abort();
  }, timeout);
  const response = await fetch(href, {
    method: "GET",
    headers,
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}

// async function curl(href, { timeout = TIMEOUT_SEC}) {
//     const res = cp.execSync(`curl --head -fs --connect-timeout ${timeout} ${href}`);
//     return res.toString().split("\n", 1).at(0).trim();
// }
