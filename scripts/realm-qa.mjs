import { withBrowser } from "./browser.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";
const hardware = process.env.REALM_QA_GPU === "hardware";
const outputDirectory = hardware ? "review/realm/hardware" : "review/realm";
const viewport = hardware ? { width:1440, height:900 } : { width:960, height:600 };
await mkdir(outputDirectory, {recursive:true});
const tiers = process.argv.slice(2);
if (!tiers.length) tiers.push("standard", "high");
for (const tier of tiers)
  await withBrowser(
    async (ctx, url) => {
      const p = await ctx.newPage();
      await p.setViewportSize(viewport);
      const renderer = await p.evaluate(()=>{
        const gl=document.createElement("canvas").getContext("webgl2");
        if(!gl)throw Error("WebGL2 unavailable");
        const ext=gl.getExtension("WEBGL_debug_renderer_info");
        const name=gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return name;
      });
      if(hardware && /swiftshader|llvmpipe|software/i.test(renderer))throw Error("Hardware backend unavailable: "+renderer);
      console.log(tier, renderer, viewport);
      const errors = [],
        screen = [],
        assets = new Map();
      p.on("pageerror", (e) => {
        errors.push(e.message);
        console.log(e.message);
      });
      p.on("console", (m) => {
        if (m.type() === "error") {
          errors.push(m.text());
          console.log(m.text().slice(0, 300));
        }
      });
      p.on("response", async (res) => {
        if (res.ok() && res.url().startsWith(url)) {
          try {
            const data = await res.body();
            assets.set(
              new URL(res.url()).pathname,
              /javascript|html|css/.test(res.headers()["content-type"] || "")
                ? gzipSync(data).length
                : data.length,
            );
          } catch {}
        }
      });
      await p.addInitScript(() => {
        const gl = WebGL2RenderingContext.prototype,
          alloc = new Map();
        for (const method of ["texStorage2D", "texImage2D", "deleteTexture"]) {
          const orig = gl[method];
          gl[method] = function (...a) {
            const v = orig.apply(this, a);
            if (method === "deleteTexture") {
              alloc.delete(a[0]);
              return v;
            }
            const target = a[0],
              cube =
                target === this.TEXTURE_CUBE_MAP ||
                (target >= 34069 && target <= 34074);
            const tex = this.getParameter(
              cube ? this.TEXTURE_BINDING_CUBE_MAP : this.TEXTURE_BINDING_2D,
            );
            if (tex) {
              let w = a[3],
                h = a[4];
              if (method === "texImage2D" && a.length === 6) {
                const im = a[5];
                w = im?.width || 0;
                h = im?.height || 0;
              }
              const bytes =
                {
                  34842: 8,
                  34836: 16,
                  33325: 2,
                  33326: 4,
                  6407: 3,
                  32849: 3,
                  33189: 2,
                }[a[2]] || 4;
              const levels =
                method === "texStorage2D"
                  ? Array.from({ length: a[1] }, (_, l) => l)
                  : [a[1]];
              const entries = alloc.get(tex) || new Map();
              for (const l of levels)
                entries.set(
                  target + "-" + l,
                  Math.max(1, w >> (method === "texStorage2D" ? l : 0)) *
                    Math.max(1, h >> (method === "texStorage2D" ? l : 0)) *
                    bytes *
                    (target === this.TEXTURE_CUBE_MAP ? 6 : 1),
                );
              alloc.set(tex, entries);
            }
            return v;
          };
        }
        window.frameTimes = [];
        let prev = 0;
        function measure(t) {
          if (
            prev &&
            document.querySelector("#app")?.dataset.stats &&
            !document.hidden
          )
            window.frameTimes.push(t - prev);
          prev = t;
          requestAnimationFrame(measure);
        }
        requestAnimationFrame(measure);
        window.textureBytes = () =>
          Array.from(alloc.values()).reduce(
            (s, m) => s + [...m.values()].reduce((a, b) => a + b, 0),
            0,
          );
      });
      p.setDefaultTimeout(60000);
      await p.goto(url + "/?quality=" + tier);
      await p.waitForFunction(
        () => document.querySelector("#start")?.disabled === false,
        null,
        { timeout: 120000 },
      );
      const stats = () =>
        p.evaluate(() => ({
          ...JSON.parse(document.querySelector("#app").dataset.stats || "{}"),
          textureBytes: window.textureBytes(),
        }));
      const size = () => [...assets.values()].reduce((a, b) => a + b, 0);
      async function shot(n) {
        await p.screenshot({
          path: outputDirectory + "/" + tier + "-" + n + ".jpg",
          type: "jpeg",
          quality: 82,
        });
        screen.push({ shot: n, ...(await stats()) });
        console.log(tier, n, screen.at(-1).phase);
      }
      await shot("approach");
      const first = size();
      await p.locator("#start").click();
      await p.keyboard.down("Shift");
      await p.keyboard.down("w");
      const wait = (fn, arg) => p.waitForFunction(fn, arg, { timeout: 150000 });
      await wait(
        () =>
          JSON.parse(document.querySelector("#app").dataset.stats).phase === 1,
      );
      await p.keyboard.up("w");
      await shot("gate");
      await p.keyboard.press("e");
      await wait(
        () =>
          JSON.parse(document.querySelector("#app").dataset.stats).phase === 2,
      );
      await p.keyboard.down("w");
      await wait(
        () => JSON.parse(document.querySelector("#app").dataset.stats).z < -15,
      );
      await p.keyboard.up("w");
      await shot("hall");
      await p.keyboard.down("w");
      await wait(
        () =>
          JSON.parse(document.querySelector("#app").dataset.stats).phase === 3,
      );
      await p.keyboard.up("w");
      await wait(
        () =>
          JSON.parse(document.querySelector("#app").dataset.stats).beat > 5.15,
      );
      await shot("awakening");
      await wait(
        () =>
          JSON.parse(document.querySelector("#app").dataset.stats).phase === 4,
      );
      await p.waitForFunction(
        () =>
          parseFloat(document.querySelector("#app").dataset.rise || "0") > 0.94,
      );
      await shot("reveal");
      await p.keyboard.down("w");
      await wait(
        () =>
          JSON.parse(document.querySelector("#app").dataset.stats).z < -32.4,
      );
      await p.keyboard.up("w");
      await p.keyboard.up("Shift");
      await shot("trophies");
      for (const x of [0, -1.65, -3.3, 1.65, 3.3]) {
        const cur = await stats();
        console.log("collect target", x, cur.x, cur.z);
        if (Math.abs(cur.x - x) > 0.4) {
          const k = cur.x < x ? "d" : "a";
          await p.keyboard.down(k);
          await wait(
            ({ x, k }) => {
              const n = JSON.parse(
                document.querySelector("#app").dataset.stats,
              ).x;
              return k === "d" ? n >= x - 0.25 : n <= x + 0.25;
            },
            { x, k },
          );
          await p.keyboard.up(k);
        }
        await p.waitForFunction(
          (name) =>
            document
              .querySelector("#act")
              ?.textContent.includes("Inspect " + name),
          {
            0: "Algorithms",
            "-1.65": "Robotics",
            "-3.3": "Hackathon",
            1.65: "Design",
            3.3: "Innovation",
          }[x],
          { timeout: 20000 },
        );
        await p.keyboard.press("e");
        await p.waitForSelector("dialog[open]");
        await p.locator("#close").click();
      }
      assert.equal((await stats()).collected, 5);
      await p.locator("#replay").click();
      await p.locator("#skipbeat").click();
      await p.locator("#menu").click();
      await p.getByRole("button", { name: "Register", exact: true }).click();
      await p.getByLabel("Name", { exact: true }).fill("Visitor");
      await p.getByLabel("Email").fill("visitor@example.invalid");
      await p.getByRole("button", { name: "Preview registration" }).click();
      await p.waitForSelector("output:not(:empty)");
      const final = await stats();
      const texturePeak = Math.max(
        ...screen.map((s) => s.textureBytes),
        final.textureBytes,
      );
      assert.ok(final.peakCalls <= (tier === "high" ? 300 : 150));
      assert.ok(final.peakTriangles <= (tier === "high" ? 1500000 : 500000));
      assert.ok(texturePeak <= (tier === "high" ? 300 : 128) * 1000000);
      assert.ok(first <= 8000000);
      if (tier === "high") assert.ok(size() <= 35000000);
      const timing = await p.evaluate(() => {
        const a = window.frameTimes.sort((x, y) => x - y);
        return {
          frames: a.length,
          medianFrameMs: a[Math.floor(a.length * 0.5)],
          p95FrameMs: a[Math.floor(a.length * 0.95)],
        };
      });
      const report = {
        tier,
        timing,
        peakCalls: final.peakCalls,
        peakTriangles: final.peakTriangles,
        sampledTexturePeakBytes: texturePeak,
        renderer, viewport: [viewport.width, viewport.height],
        firstPlayableBytes: first,
        totalBytes: size(),
        screen,
        assets: Object.fromEntries(assets),
        errors,
      };
      await writeFile(
        outputDirectory + "/" + tier + ".json",
        JSON.stringify(report, null, 2),
      );
      assert.deepEqual(errors, []);
      await p.close();
    },
    hardware ? {args:["--use-angle=d3d11"]} : {},
    (hardware ? 2 : 0) + (tier === "high" ? 5221 : 5220),
  );
