import { withBrowser } from "./browser.mjs";
import { writeFile } from "node:fs/promises";
const release = process.argv.includes("--release");
await withBrowser(
  async (ctx, url) => {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 834, height: 1194 });
    await page.goto(url);
    await page.mouse.wheel(0, 1);
    await page.waitForSelector("video.ready", { state: "attached" });
    const session = await ctx.newCDPSession(page),
      samples = [];
    const start = Date.now(),
      end = start + 600000;
    let next = start;
    while (Date.now() < end) {
      const t = (Date.now() - start) / 1000;
      await page.evaluate(
        (t) =>
          window.scrollTo(
            0,
            (document.documentElement.scrollHeight - innerHeight) *
              (0.5 - 0.5 * Math.cos(t * 0.12)),
          ),
        t,
      );
      if (await page.locator(".skip-film").isVisible())
        await page.locator(".skip-film").click();
      if (Date.now() >= next) {
        await session.send("HeapProfiler.collectGarbage");
        samples.push({
          seconds: t,
          ...(await session.send("Runtime.getHeapUsage")),
        });
        next += 60000;
      }
      await page.waitForTimeout(250);
    }
    await session.send("HeapProfiler.collectGarbage");
    samples.push({
      seconds: (Date.now() - start) / 1000,
      ...(await session.send("Runtime.getHeapUsage")),
    });
    await writeFile(
      release ? "review/soak-final.json" : "review/soak.json",
      JSON.stringify(samples, null, 2),
    );
    console.log(samples.map((s) => [s.seconds, s.usedSize]));
  },
  {},
  release ? 5207 : 5204,
);
