import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { fest } from "./src/config.ts";

function escape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function festivalInfo() {
  const tracks = fest.categories
    .map(
      ([name, title, description, teams], i) =>
        `<article><h3>${escape(name)} · ${escape(title)}</h3><p>${escape(description)}</p><p>${escape(teams)} · ${escape(fest.competitionPrizes[i])}</p></article>`,
    )
    .join("");
  return `<main class="festival-fallback"><h1>${escape(fest.name)}</h1><p>${escape(fest.university)} · ${escape(fest.tagline)}</p><p>${escape(fest.dates)} · ${escape(fest.venue)}</p><p>Festival preview. Event details are provisional.</p><section id="disciplines"><h2>Competitions</h2>${tracks}</section><section><h2>Prizes</h2><p>${escape(fest.prize)}</p></section><section><h2>Schedule</h2>${fest.schedule.map(([day, title, detail]) => `<h3>${escape(day)} · ${escape(title)}</h3><p>${escape(detail)}</p>`).join("")}</section><section><h2>FAQ</h2>${fest.faq.map(([q, a]) => `<details><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join("")}</section><section><h2>Registration and contact</h2><p>Registration preview · ${escape(fest.contact)}</p></section><footer><a href="/credits/">Credits</a></footer></main>`;
}
function credits() {
  const rows = readFileSync(
    new URL("./docs/LICENSES.md", import.meta.url),
    "utf8",
  )
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| "))
    .slice(1);
  const items = rows
    .map((row) => {
      const [title, author, source, license, use] = row
        .split("|")
        .slice(1, -1)
        .map((s) => s.trim());
      const link = /^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/.exec(source);
      const origin = link
        ? `<a href="${escape(link[2])}">${escape(link[1])}</a>`
        : escape(source);
      return `<article><h2>${escape(title)}</h2><p>${escape(author)} · ${escape(license)}</p><p>${escape(use)}</p>${origin}</article>`;
    })
    .join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Credits · ${escape(fest.name)}</title><style>html{color-scheme:dark;background:#101a1f;color:#eee9df;font:17px/1.55 system-ui}main{max-width:46rem;margin:auto;padding:3rem 1rem}h1,h2{font-family:Georgia,serif;font-weight:normal}h1{font-size:3rem}article{border-top:1px solid #58636a;padding:1rem 0}p{margin:.4rem 0}a{color:#f1d59b}</style><main><a href="/">← ${escape(fest.name)}</a><h1>Credits</h1>${items}</main></html>`;
}
export default defineConfig({
  build: { manifest: true },
  plugins: [
    {
      name: "festival-pages",
      transformIndexHtml(html) {
        return html
          .replaceAll("__FEST_NAME__", escape(fest.name))
          .replace(
            '<div id="app"></div>',
            '<div id="app">' + festivalInfo() + "</div>",
          );
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!/^\/credits\/?(?:\?|$)/.test(req.url || "")) return next();
          res.setHeader("content-type", "text/html;charset=utf-8");
          res.end(credits());
        });
      },
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "credits/index.html",
          source: credits(),
        });
      },
    },
  ],
});
