import { withBrowser } from "./browser.mjs";
import { mkdir, writeFile } from "node:fs/promises";
const round = process.argv[2] || "verify",
  dir = "review/" + round;
await mkdir(dir, { recursive: true });
const report = [];
await withBrowser(async (ctx, url) => {
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["tablet", 834, 1194],
    ["mobile", 390, 844],
  ]) {
    const page = await ctx.newPage(),
      errors = [];
    let bytes = 0,
      receivedEncodedBodyBytes = 0;
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    cdp.on("Network.loadingFinished", (e) => (bytes += e.encodedDataLength));
    cdp.on("Network.dataReceived", (e) => {
      receivedEncodedBodyBytes += e.encodedDataLength;
    });
    await page.setViewportSize({ width, height });
    await page.goto(url+'/?quality=lite');
    await page.waitForSelector(".stage");
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.wheel(0, 1);
    await page
      .waitForFunction(
        () =>
          document.querySelector("video.ready") ||
          document.querySelector(".load")?.textContent ===
            "Illustrated journey",
        {},
        { timeout: 25000 },
      )
      .catch((e) => errors.push("media readiness timeout"));
    const samples = [];
    for (let percent = 0; percent <= 100; percent += 5) {
      await page.evaluate(
        (n) =>
          window.scrollTo(
            0,
            ((document.documentElement.scrollHeight - innerHeight) * n) / 100,
          ),
        percent,
      );
      await page.waitForTimeout(220);
      if (await page.locator(".skip-film").isVisible())
        await page.locator(".skip-film").click();
      await page.evaluate(async () => {
        const v = document.querySelector("video");
        if (v.seeking)
          await Promise.race([
            new Promise((r) => v.addEventListener("seeked", r, { once: true })),
            new Promise((r) => setTimeout(r, 1200)),
          ]);
      });
      await page.screenshot({
        path:
          dir + "/" + name + "-" + String(percent).padStart(3, "0") + ".jpg",
        type: "jpeg",
        quality: 76,
      });
      if (percent % 25 === 0) {
        const times = await page.evaluate(async () => {
          const values = [];
          let prev = performance.now();
          for (let i = 0; i < 18; i++) {
            const t = await new Promise(requestAnimationFrame);
            values.push(t - prev);
            prev = t;
          }
          return values.slice(1).sort((a, b) => a - b);
        });
        const heap = await cdp.send("Runtime.getHeapUsage");
        samples.push({
          percent,
          medianFrameMs: times[8],
          p95FrameMs: times.at(-1),
          heapBytes: heap.usedSize,
        });
      }
    }
    const state = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      videoTime: document.querySelector("video").currentTime,
      videoReady: document.querySelector("video").readyState,
      webgl: !!document.querySelector("canvas"),
    }));
    if (state.width > width) errors.push("horizontal overflow " + state.width);
    const continuousScrub = await page.evaluate(async () => {
      const section = document.querySelector("#journey");
      const span =
        section.offsetHeight - document.querySelector(".stage").offsetHeight;
      const video = document.querySelector("video");
      scrollTo(0, (span * 52) / 72);
      await new Promise((resolve) => setTimeout(resolve, 450));
      const times = [],
        lag = [];
      let frames = 0,
        callback;
      function frame() {
        frames++;
        callback = video.requestVideoFrameCallback(frame);
      }
      callback = video.requestVideoFrameCallback(frame);
      let previous = performance.now();
      const start = previous;
      while (previous - start < 4000) {
        const now = await new Promise(requestAnimationFrame);
        const target = 52 + (now - start) / 1000;
        scrollTo(0, (span * target) / 72);
        times.push(now - previous);
        lag.push(Math.abs(target - video.currentTime));
        previous = now;
      }
      video.cancelVideoFrameCallback(callback);
      times.sort((a, b) => a - b);
      lag.sort((a, b) => a - b);
      return {
        durationMs: previous - start,
        animationCallbacks: times.length,
        presentedVideoFrames: frames,
        medianFrameMs: times[Math.floor(times.length / 2)],
        p95FrameMs: times[Math.floor(times.length * 0.95)],
        p95PlayheadDifferenceSec: lag[Math.floor(lag.length * 0.95)],
      };
    });
    report.push({
      name,
      width,
      height,
      bytes,
      receivedEncodedBodyBytes,
      continuousScrub,
      errors,
      samples,
      ...state,
    });
    await page.close();
    console.log(name, errors);
  }
});
await writeFile(dir + "/metrics.json", JSON.stringify(report, null, 2));
if (report.some((r) => r.errors.length)) process.exitCode = 1;
