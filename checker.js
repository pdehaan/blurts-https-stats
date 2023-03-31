import fs from "node:fs/promises";
import { promisify } from "node:util";

import _linkCheck from "link-check";
const linkCheck = promisify(_linkCheck);

const breaches = await fetch("https://haveibeenpwned.com/api/v3/breaches").then(res => res.json());

// Dedupe domains...
const domains = Array.from(breaches.reduce((set, b) => {
  if (b.Domain) set.add(b.Domain.toLowerCase());
  return set;
}, new Set())).sort();

const RESULTS = [];

for (const domain of domains) {
  let result;
  try {
    result = await fetcher(`https://${domain}/`);
    if (result.err) {
      // HACK: When present, this was causing some circular reference errors during `JSON.stringify()`.
      delete result.err.cert;
      result.err = { message: result.err.message, ...result.err };
    } else {
      // convert `null` to `undefined` to omit it from the JSON stringifier.
      result.err = undefined;
    }
    RESULTS.push({ ...result });
    await fs.writeFile("checker.json", JSON.stringify(RESULTS, null, 2));
  } catch (err) {
    console.error("[ERROR]", err.message);
  }
}


async function fetcher(href) {
  const fetchOpts = {
    timeout: "5s",
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
  };
  let result;
  try {
    result = await linkCheck(href, fetchOpts);
  } catch (err) {
    console.error(err.message);
  }
  return result;
}
