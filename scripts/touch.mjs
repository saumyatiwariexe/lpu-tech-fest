import { withBrowser } from "./browser.mjs";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
await withBrowser(
  async (ctx, url) => {
    const page = await ctx.newPage();
    await page.goto(url+'/?quality=lite');
    await page.waitForSelector(".stage");
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 160, y: 650 }],
    });
    for (let i = 1; i <= 9; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 160, y: 650 - i * 35 }],
      });
      await page.waitForTimeout(22);
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForFunction(
      () => scrollY > 50 && document.querySelector("video.ready"),
    );
    await page.locator(".register").tap();
    await page.waitForFunction(
      () =>
        Math.abs(scrollY - document.querySelector("#register").offsetTop) < 135,
      null,
      { timeout: 6000 },
    );
    assert.equal(await page.locator(".skip-film").isVisible(), false);
    await page.locator(".brand").tap();
    await page.waitForFunction(() => scrollY === 0, null, { timeout: 6000 });
    await page.locator('button[data-chapter="5"]').tap();
    await page.waitForFunction(() => Math.abs(document.querySelector("video").currentTime - 64.12) < .25);
    await page.evaluate(() =>
      scrollTo(
        0,
        ((document.querySelector("#journey").offsetHeight -
          document.querySelector(".stage").offsetHeight) *
          69) /
          72,
      ),
    );
    await page.waitForFunction(
      () =>
        !document.querySelector("video").seeking &&
        Math.abs(document.querySelector("video").currentTime - 69) < 0.25,
    );
    await page.waitForTimeout(400);
    await page.screenshot({
      path: "review/mobile-trophies.jpg",
      type: "jpeg",
      quality: 80,
      scale: "css",
    });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    const result = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      pixelRatio: devicePixelRatio,
      renderWidth: document.querySelector("canvas")?.width,
      src: document.querySelector("video")?.currentSrc.split("/").pop(),
      registerVisible:
        document.querySelector(".register").getBoundingClientRect().bottom > 0,
    }));
    assert.equal(result.viewport, result.documentWidth);
    assert.ok(result.renderWidth <= 844 * 1.5 + 1);
    await writeFile("review/touch.json", JSON.stringify(result, null, 2));
    console.log(result);
  },
  {
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  },
  5210,
);
