import { withBrowser } from "./browser.mjs";
import assert from "node:assert/strict";
await withBrowser(
  async (ctx, url) => {
    const page = await ctx.newPage();
    await page.goto(url+'/?quality=lite');
    await page.waitForSelector(".stage");
    await page.keyboard.press("Shift");
    await page.waitForSelector("video.ready", { state: "attached" });
    await page.evaluate(() =>
      scrollTo(
        0,
        ((document.querySelector("#journey").offsetHeight -
          document.querySelector(".stage").offsetHeight) *
          39.3) /
          72,
      ),
    );
    await page.waitForFunction(
      () =>
        !document.querySelector(".skip-film").hidden &&
        !document.querySelector("video").paused,
    );
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        value: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    assert.equal(await page.locator("video").evaluate((v) => v.paused), true);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForFunction(() => !document.querySelector("video").paused);
    await page.evaluate(() =>
      window.dispatchEvent(
        new PageTransitionEvent("pagehide", { persisted: false }),
      ),
    );
    assert.equal(await page.locator("#cinema canvas").count(), 0);
    assert.equal(await page.locator("video").getAttribute("src"), null);
    await page.close();
    console.log(
      "PASS: visibility handler pauses and resumes awakening; page teardown removes the renderer and media source.",
    );
  },
  {},
  5209,
);
