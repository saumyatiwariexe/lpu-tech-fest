import { withBrowser } from "./browser.mjs";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
const results = [];
await withBrowser(
  async (ctx, url) => {
    for (const name of ["mobile", "wide"]) {
      const local = "preflight/bench/" + name;
      const frames = (await readdir(local)).filter((f) => f.endsWith(".webp"));
      const seqBytes = (
        await Promise.all(
          frames.map(async (f) => (await stat(local + "/" + f)).size),
        )
      ).reduce((a, b) => a + b, 0);
      const videoBytes = (await stat("public/media/" + name + ".mp4")).size;
      for (const method of ["native", "webcodecs", "sequence"]) {
        const page = await ctx.newPage();
        const cdp = await ctx.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
        let networkBytes = 0;
        cdp.on(
          "Network.loadingFinished",
          (event) => (networkBytes += event.encodedDataLength),
        );
        await page.route("**/bench.html", (r) =>
          r.fulfill({
            contentType: "text/html",
            body: '<video muted playsinline></video><canvas width="640" height="360"></canvas>',
          }),
        );
        await page.route("**/frame/*.webp", (r) =>
          r.fulfill({
            path: local + "/" + r.request().url().split("/").pop(),
            contentType: "image/webp",
          }),
        );
        await page.goto(url + "/bench.html");
        const baseline = await cdp.send("Runtime.getHeapUsage");
        try {
          const index = JSON.parse(
            await readFile(local + "/index.json", "utf8"),
          );
          const result = await page.evaluate(
            async ({ name, method, index }) => {
              const samples = [],
                v = document.querySelector("video"),
                g = document.querySelector("canvas").getContext("2d"),
                url = "/media/" + name + ".mp4";
              let bytes = 0,
                cache = [],
                decoder;
              function once(el, ev) {
                return new Promise((res, rej) => {
                  const timer = setTimeout(
                    () => rej(Error("timeout " + ev)),
                    8000,
                  );
                  el.addEventListener(
                    ev,
                    () => {
                      clearTimeout(timer);
                      res();
                    },
                    { once: true },
                  );
                });
              }
              if (method === "native") {
                const load = once(v, "loadedmetadata");
                v.src = url;
                await load;
              }
              if (method === "webcodecs") {
                const description = new Uint8Array(
                  index.description.match(/../g).map((x) => parseInt(x, 16)),
                );
                decoder = new VideoDecoder({
                  output(frame) {
                    cache.push(frame);
                    if (cache.length > 24) cache.shift().close();
                  },
                  error(e) {
                    console.error(e);
                  },
                });
                decoder.configure({
                  codec: "avc1." + index.description.slice(2, 8),
                  description,
                });
              }
              const startFrames =
                v.getVideoPlaybackQuality().droppedVideoFrames;
              for (const t of [
                1, 6, 12, 19.5, 26, 37, 42.5, 48, 55, 63, 69, 38, 15, 16,
                16.125, 16.25,
              ]) {
                const start = performance.now();
                if (method === "native") {
                  const wait = once(v, "seeked");
                  v.currentTime = t;
                  await wait;
                  g.drawImage(v, 0, 0, 640, 360);
                }
                if (method === "sequence") {
                  const blob = await (
                    await fetch(
                      "/frame/" +
                        String(1 + Math.floor(t * 8)).padStart(4, "0") +
                        ".webp",
                    )
                  ).blob();
                  bytes += blob.size;
                  const bmp = await createImageBitmap(blob);
                  g.drawImage(bmp, 0, 0, 640, 360);
                  bmp.close();
                }
                if (method === "webcodecs") {
                  const target = index.packets.reduce(
                    (best, p, i) =>
                      Math.abs(p[2] - t) < Math.abs(index.packets[best][2] - t)
                        ? i
                        : best,
                    0,
                  );
                  const stamp = Math.round(index.packets[target][2] * 1e6);
                  if (!cache.some((f) => f.timestamp === stamp)) {
                    cache.forEach((f) => f.close());
                    cache = [];
                    let a = target,
                      b = target + 1;
                    while (a && !index.packets[a][3]) a--;
                    while (b < index.packets.length && !index.packets[b][3])
                      b++;
                    const group = index.packets.slice(a, b),
                      offset = group[0][0],
                      end = group.at(-1)[0] + group.at(-1)[1] - 1;
                    const res = await fetch(url, {
                      headers: { Range: "bytes=" + offset + "-" + end },
                    });
                    if (res.status !== 206)
                      throw Error("Range request unsupported");
                    const data = new Uint8Array(await res.arrayBuffer());
                    bytes += data.length;
                    for (const [pos, size, pts, key] of group)
                      decoder.decode(
                        new EncodedVideoChunk({
                          type: key ? "key" : "delta",
                          timestamp: Math.round(pts * 1e6),
                          data: data.subarray(
                            pos - offset,
                            pos - offset + size,
                          ),
                        }),
                      );
                    await decoder.flush();
                  }
                  const frame = cache.find((f) => f.timestamp === stamp);
                  if (!frame) throw Error("missing decoded frame");
                  g.drawImage(frame, 0, 0, 640, 360);
                }
                samples.push(performance.now() - start);
              }
              cache.forEach((f) => f.close());
              decoder?.close();
              return {
                samples,
                requestsOverFrameBudget: samples.filter((n) => n > 1000 / 24)
                  .length,
                decodedPayloadBytes: bytes,
                reportedVideoDrops:
                  method === "native"
                    ? v.getVideoPlaybackQuality().droppedVideoFrames -
                      startFrames
                    : null,
              };
            },
            { name, method, index },
          );
          results.push({
            name,
            method,
            ...result,
            sourceBytes: method === "sequence" ? seqBytes : videoBytes,
            networkBytes,
            heapDelta:
              (await cdp.send("Runtime.getHeapUsage")).usedSize -
              baseline.usedSize,
          });
        } catch (e) {
          results.push({ name, method, error: String(e) });
        } finally {
          await page.close();
        }
      }
    }
  },
  {},
  5203,
);
await writeFile(
  "preflight/scrub-metrics.json",
  JSON.stringify(results, null, 2),
);
console.log(results.map(({ samples, ...r }) => r));
