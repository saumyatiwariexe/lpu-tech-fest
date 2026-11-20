import { withBrowser } from "./browser.mjs";
import { writeFile } from "node:fs/promises";
await withBrowser(
  async (ctx, url) => {
    const page = await ctx.newPage(),
      cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 1600000 / 8,
      uploadThroughput: 750000 / 8,
      connectionType: "cellular4g",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const requests = [];
    page.on("request", (r) => requests.push(new URL(r.url()).pathname));
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(500);
    const paint = await page.evaluate(() =>
      performance
        .getEntriesByType("paint")
        .map((e) => ({ name: e.name, ms: e.startTime })),
    );
    const idleRequests = [...requests];
    const start = performance.now();
    await page.keyboard.press("Shift");
    await page.waitForSelector("video.ready", {
      state: "attached",
      timeout: 90000,
    });
    const warmedMs = performance.now() - start;
    await page.screenshot({
      path: "review/mobile-4g.jpg",
      type: "jpeg",
      quality: 80,
    });
    const result = {
      latencyMs: 150,
      downMbps: 1.6,
      upMbps: 0.75,
      paint,
      requestsBeforeInteraction: idleRequests,
      millisecondsFromInteractionToFirstTwoSeeks: warmedMs,
    };
    await writeFile(
      "review/network-profile.json",
      JSON.stringify(result, null, 2),
    );
    console.log(result);
  },
  {},
  5208,
);
