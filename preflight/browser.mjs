import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve("preflight/browsers");
const { chromium } = await import("playwright");
const profile = await mkdtemp(path.resolve("preflight/probe-"));
let context;
try {
  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    args: ["--enable-unsafe-swiftshader"],
  });
  const page = await context.newPage();
  await page.setContent("<canvas></canvas>");
  const renderer = await page.evaluate(() => {
    const gl = document.querySelector("canvas").getContext("webgl2");
    if (!gl) throw Error("WebGL2 unavailable");
    gl.clearColor(0.08, 0.16, 0.21, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
  });
  await page.screenshot({ path: "preflight/webgl.png" });
  console.log(renderer);
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
