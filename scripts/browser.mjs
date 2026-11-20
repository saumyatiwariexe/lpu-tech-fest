import path from "node:path";
import { preview } from "vite";
process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve("preflight/browsers");
const { chromium } = await import("playwright");
export async function withBrowser(run, options = {}, port = 5199) {
  const server = await preview({
    preview: { host: "127.0.0.1", port, strictPort: true },
    logLevel: "error",
  });
  let browser;
  try {
    const { args = ["--enable-unsafe-swiftshader"], ...contextOptions } =
      options;
    browser = await chromium.launch({ headless: true, args });
    const context = await browser.newContext(contextOptions);
    return await run(context, "http://127.0.0.1:" + port);
  } finally {
    try {
      await browser?.close();
    } finally {
      await server.close();
    }
  }
}
