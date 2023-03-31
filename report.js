import _groupBy from "lodash.groupby";
import results from "./checker.json"  assert { type: "json" };

const { dead: deadLinks } = _groupBy(results, "status");

console.log("# 'DEAD' LINKS\n");
console.log(`STATUS<br/>CODE | DOMAIN | MESSAGE\n:----:|:----|:-----`);
for (const {link, statusCode, err} of deadLinks) {
  console.log(`${statusCode} | ${new URL(link).hostname} | ${truncate(err?.message)}`);
}

function truncate(str = "", len = 50) {
  const suffix = str.length > len ? "…" : "";
  return str.slice(0, len-1).trim() + suffix;
}
