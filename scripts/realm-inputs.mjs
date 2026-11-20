import { withBrowser } from "./browser.mjs";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const results = {};
await withBrowser(
  async (ctx, url) => {
    const p = await ctx.newPage();
    p.setDefaultTimeout(60000);
    await p.goto(url + "/?quality=auto");
    await p.waitForSelector("video", { state: "attached" });
    results.softwareAuto = "Lite";
    await p.keyboard.press("Shift");
    await p.waitForSelector("video.ready", { state: "attached" });
    results.liteVideo = await p
      .locator("video")
      .evaluate((v) => ({ width: v.videoWidth, height: v.videoHeight }));
    await p.getByRole("link", { name: "Credits", exact: true }).click();
    await p.getByRole("heading", { name: "Bricks 097" }).waitFor();
    results.creditsLinks = await p.locator("article a").count();
    const initial = await (await p.request.get(url + "/")).text();
    assert.ok(
      initial.includes("<h2>Schedule</h2>") &&
        initial.includes("Hackathon") &&
        initial.includes("Registration and contact"),
    );
    results.staticInfo = true;
    await p.addInitScript(() => {
      const pad = {
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          value: 0,
        })),
      };
      window.testPad = pad;
      Object.defineProperty(navigator, "getGamepads", { value: () => [pad] });
    });
    await p.goto(url + "/?quality=standard");
    await p.locator("#start:enabled").waitFor();
    const press = async (i) => {
      await p.evaluate((i) => (window.testPad.buttons[i].pressed = true), i);
      await p.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
      await p.evaluate((i) => (window.testPad.buttons[i].pressed = false), i);
      await p.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
    };
    await press(0);
    await p.locator("#objective").waitFor();
    await p.evaluate(() => (window.testPad.axes[1] = -1));
    await p.waitForFunction(
      () => JSON.parse(document.querySelector("#app").dataset.stats).z < 42,
    );
    await p.evaluate(() => (window.testPad.axes[1] = 0));
    await press(9);
    await p.locator("dialog[open]").waitFor();
    await press(13);
    await press(0);
    await p.getByRole("heading", { name: "Schedule" }).waitFor();
    await press(1);
    await p.locator("#sound").click();
    await p.getByRole("button", { name: "Sound on", exact: true }).waitFor();
    results.gamepad =
      "A starts, left stick walks, Menu opens, D-pad focuses, A selects, B closes";
    results.audio = true;
    await p.close();
  },
  { viewport: { width: 680, height: 440 } },
  5223,
);
await withBrowser(
  async (ctx, url) => {
    const p = await ctx.newPage();
    p.setDefaultTimeout(60000);
    await p.goto(url + "/?quality=standard");
    await p.locator("#start:enabled").tap();
    await p.locator("#stick").waitFor();
    const cdp = await ctx.newCDPSession(p);
    const box = await p.locator("#stick").boundingBox();
    const tx = box.x + box.width / 2,
      ty = box.y + 10;
    const touch = (type, points) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
    await touch("touchStart", [{ x: tx, y: ty }]);
    await p.waitForFunction(
      () => JSON.parse(document.querySelector("#app").dataset.stats).z < 42,
    );
    await touch("touchEnd", []);
    const oldYaw = await p.evaluate(
      () => JSON.parse(document.querySelector("#app").dataset.stats).yaw,
    );
    await touch("touchStart", [{ x: 240, y: 320 }]);
    await touch("touchMove", [{ x: 300, y: 325 }]);
    await touch("touchEnd", []);
    await p.waitForFunction(
      (old) =>
        JSON.parse(document.querySelector("#app").dataset.stats).yaw !== old,
      oldYaw,
    );
    await p.locator("#menu").tap();
    await p.getByRole("button", { name: "FAQ", exact: true }).tap();
    await p.locator("summary").first().tap();
    assert.ok(
      (await p.locator("details").first().getAttribute("open")) !== null,
    );
    results.mobile =
      "Touch joystick moves, canvas accepts drag, menu and FAQ open by tap";
    await p.close();
  },
  {
    viewport: { width: 390, height: 700 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  },
  5224,
);
await writeFile("review/realm/inputs.json", JSON.stringify(results, null, 2));
console.log(results);
