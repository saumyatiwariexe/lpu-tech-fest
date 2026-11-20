import { withBrowser } from "./browser.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("review/moments", { recursive: true });
await withBrowser(
  async (ctx, url) => {
    const p = await ctx.newPage();
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.goto(url+'/?quality=lite');
    await p.waitForSelector(".stage");
    assert.equal(await p.locator("video").getAttribute("src"), null);
    await p.keyboard.press("Shift");
    await p.waitForSelector("video.ready", { state: "attached" });
    async function go(t) {
      await p.evaluate((t) => {
        const j = document.querySelector("#journey"),
          s = document.querySelector(".stage");
        window.scrollTo(0, ((j.offsetHeight - s.offsetHeight) * t) / 72);
      }, t);
      await p.waitForTimeout(150);
    }
    async function settle(t) {
      await p
        .waitForFunction(
          (t) => {
            const v = document.querySelector("video");
            return !v.seeking && Math.abs(v.currentTime - t) < 0.28;
          },
          t,
          { timeout: 6000 },
        )
        .catch(async (err) => {
          console.error(
            "seek target",
            t,
            await p.evaluate(() => ({
              scroll: scrollY,
              span:
                document.querySelector("#journey").offsetHeight -
                document.querySelector(".stage").offsetHeight,
              time: document.querySelector("video").currentTime,
              seeking: document.querySelector("video").seeking,
              ready: document.querySelector("video").readyState,
              hidden: document.hidden,
              title: document.querySelector("h1").textContent,
            })),
          );
          throw err;
        });
    }
    await go(38.7);
    await settle(38.7);
    await go(39.2);
    await p.waitForFunction(
      () =>
        !document.querySelector(".skip-film").hidden &&
        !document.querySelector("video").paused,
    );
    await p.waitForFunction(
      () => document.querySelector("video").currentTime > 40,
    );
    await p.locator(".skip-film").click();
    await settle(49);
    await go(34);
    await settle(34);
    await go(38.8);
    await settle(38.8);
    await go(39.3);
    await p.waitForFunction(() => !document.querySelector(".skip-film").hidden);
    await p.waitForFunction(
      () => document.querySelector(".skip-film").hidden,
      null,
      { timeout: 16000 },
    );
    const moments = [];
    for (const [name, t] of [
      ["arrival", 0],
      ["approach", 12],
      ["gate", 21],
      ["throne", 32],
      ["awakening", 43],
      ["lunge", 47],
      ["fire", 55],
      ["smoke", 63],
      ["trophies", 69],
      ["disciplines", 73],
    ]) {
      if (t === 73) {
        await p
          .locator("#disciplines")
          .evaluate((el) => window.scrollTo(0, el.offsetTop - 76));
        await p.waitForTimeout(350);
      } else {
        await go(t);
        await settle(t);
        await p.waitForTimeout(340);
      }
      const percent = await p.evaluate(
        () =>
          (100 * scrollY) /
          (document.documentElement.scrollHeight - innerHeight),
      );
      moments.push({ name, t, percent });
      await p.screenshot({
        path: "review/moments/" + name + ".jpg",
        type: "jpeg",
        quality: 80,
      });
    }
    await writeFile(
      "review/moments/index.json",
      JSON.stringify(moments, null, 2),
    );
    await p.locator("#register").scrollIntoViewIfNeeded();
    await p.getByLabel("Name", { exact: true }).fill("Demo Student");
    await p.getByLabel("Email", { exact: true }).fill("demo@example.invalid");
    await p.getByLabel("Competition", { exact: true }).selectOption("Robotics");
    await p.locator("button.submit").click();
    assert.match(await p.locator("output").innerText(), /Preview complete/);
    await p.locator("summary").first().click();
    assert.equal(await p.locator("details[open]").count(), 1);
    // Change motion preferences outside the film, whose media-query listener reloads it.
    await p.goto("about:blank");
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.goto(url+'/?quality=lite');
    await p.waitForSelector(".stage");
    assert.equal(await p.locator("video").getAttribute("src"), null);
    await p.keyboard.press("Tab");
    assert.equal(
      await p.evaluate(() => document.activeElement.className),
      "skip",
    );
    await p.keyboard.press("Enter");
    assert.equal(new URL(p.url()).hash, "#disciplines");
    // Change motion preferences outside the film, whose media-query listener reloads it.
    await p.goto("about:blank");
    await p.emulateMedia({ reducedMotion: "no-preference" });
    await p.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (k, ...args) {
        if (k === "webgl2" || k === "webgl") return null;
        return get.call(this, k, ...args);
      };
    });
    await p.goto(url+'/?quality=lite');
    await p.waitForSelector(".stage");
    await p.keyboard.press("Shift");
    await p.waitForSelector("video.ready", { state: "attached" });
    assert.equal(await p.locator("#cinema canvas").count(), 0);
    await p.close();
    console.log(
      "PASS: poster, automatic awakening, skip, reverse, natural release, milestones, stub form, FAQ, reduced motion, keyboard skip and native video fallback.",
    );
  },
  {},
  5206,
);
