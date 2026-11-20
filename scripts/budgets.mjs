import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";
const manifest = JSON.parse(await readFile("dist/.vite/manifest.json", "utf8"));
const visited = new Set();
function visit(key) {
  if (visited.has(key) || key === "src/realm.ts") return;
  visited.add(key);
  const chunk = manifest[key];
  for (const dep of [...(chunk.imports || []), ...(chunk.dynamicImports || [])])
    visit(dep);
}
visit("index.html");
const jsBytes = (
  await Promise.all(
    [...visited].map(
      async (key) =>
        gzipSync(await readFile("dist/" + manifest[key].file)).length,
    ),
  )
).reduce((a, b) => a + b, 0);
assert.ok(jsBytes <= 250000, "Lite gzip JavaScript exceeds the film budget");
const metrics = JSON.parse(
  await readFile("review/verify/metrics.json", "utf8"),
);
assert.equal(metrics.length, 3);
for (const r of metrics) {
  assert.equal(r.samples.length, 5);
  assert.equal(r.errors.length, 0);
  assert.ok(r.continuousScrub.presentedVideoFrames > 0);
  for (let percent = 0; percent <= 100; percent += 5)
    assert.ok(
      (
        await stat(
          "review/verify/" +
            r.name +
            "-" +
            String(percent).padStart(3, "0") +
            ".jpg",
        )
      ).size > 0,
    );
}
const lighthouse = JSON.parse(await readFile("review/lighthouse.json", "utf8"));
assert.ok(lighthouse.shell.score >= 90);
for (const name of ["desktop", "mobile", "moments"])
  assert.ok((await stat("review/sheet-" + name + ".png")).size < 3e6);
await writeFile(
  "review/budgets.json",
  JSON.stringify(
    {
      combinedGzipJsBytes: jsBytes,
      jsBudgetBytes: 250000,
      shellLighthouseScore: lighthouse.shell.score,
      shellBudget: 90,
      viewportScreenshots: 63,
      physicalLaptopFPS: "unverified",
      physicalPhoneFPS: "unverified",
    },
    null,
    2,
  ),
);
console.log(
  "Budget checks passed. Combined gzip JavaScript:",
  jsBytes,
  "bytes. Physical device FPS unverified.",
);
