import { withBrowser } from "./browser.mjs";
import lighthouse from "lighthouse";
import { writeFile, mkdir } from "node:fs/promises";
await mkdir("review", { recursive: true });
await withBrowser(
  async (_, url) => {
    const results = {};
    for (const [name, suffix] of [
      ["shell", "/?motion=still"],
      ["journey", "/?quality=lite"],
    ]) {
      const runs = [];
      for (let trial = 0; trial < (name === "shell" ? 3 : 1); trial++) {
        const run = await lighthouse(url + suffix, {
          port: 9231,
          output: "json",
          logLevel: "error",
          onlyCategories: ["performance", "accessibility"],
          formFactor: "mobile",
          throttlingMethod: "simulate",
        });
        const { categories, audits } = run.lhr;
        runs.push({
          score: Math.round(categories.performance.score * 100),
          accessibility: Math.round(categories.accessibility.score * 100),
          FCPms: audits["first-contentful-paint"].numericValue,
          LCPms: audits["largest-contentful-paint"].numericValue,
          CLS: audits["cumulative-layout-shift"].numericValue,
          TBTms: audits["total-blocking-time"].numericValue,
          failures: Object.values(audits)
            .filter((a) => a.score === 0 && a.scoreDisplayMode === "binary")
            .map((a) => a.title),
        });
      }
      const ordered = [...runs].sort((a, b) => a.score - b.score);
      results[name] = { ...ordered[Math.floor(ordered.length / 2)], runs };
    }
    await writeFile("review/lighthouse.json", JSON.stringify(results, null, 2));
    console.log("Lighthouse mobile", results);
    if (results.shell.score < 90)
      throw Error("Mobile shell performance budget missed");
  },
  { args: ["--enable-unsafe-swiftshader", "--remote-debugging-port=9231"] },
  5205,
);
