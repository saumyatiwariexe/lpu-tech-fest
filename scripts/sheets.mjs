import sharp from "sharp";
import { readFile, stat } from "node:fs/promises";
const positions = [0, 10, 20, 30, 40, 50, 60, 75, 85, 100];
async function sheet(name, items, cols, w, h) {
  const overlays = [],
    border = 12,
    label = 29,
    rows = Math.ceil(items.length / cols);
  for (const [i, item] of items.entries()) {
    const x = border + (i % cols) * (w + border),
      y = border + Math.floor(i / cols) * (h + label + border);
    const thumbnail = await sharp(item.path)
      .resize(w, h, { fit: "contain", background: "#121a19" })
      .jpeg({ quality: 78 })
      .toBuffer();
    overlays.push(
      { input: thumbnail, left: x, top: y },
      {
        input: Buffer.from(
          '<svg width="' +
            w +
            '" height="' +
            label +
            '"><text x="5" y="19" fill="#e6ceb0" font-size="13" font-family="Arial">' +
            item.label +
            "</text></svg>",
        ),
        left: x,
        top: y + h,
      },
    );
  }
  const path = "review/sheet-" + name + ".png";
  await sharp({
    create: {
      width: cols * (w + border) + border,
      height: rows * (h + label + border) + border,
      channels: 3,
      background: "#121a19",
    },
  })
    .composite(overlays)
    .png({ palette: true, colours: 192 })
    .toFile(path);
  if ((await stat(path)).size >= 3e6) throw Error(path + " exceeds 3 MB");
}
for (const [name, w, h] of [
  ["desktop", 300, 188],
  ["mobile", 162, 351],
])
  await sheet(
    name,
    positions.map((n) => ({
      path: "review/verify/" + name + "-" + String(n).padStart(3, "0") + ".jpg",
      label: n + "% scroll",
    })),
    5,
    w,
    h,
  );
const moments = JSON.parse(await readFile("review/moments/index.json", "utf8"));
await sheet(
  "moments",
  moments.map((m) => ({
    path: "review/moments/" + m.name + ".jpg",
    label: m.name + "  /  " + m.percent.toFixed(1) + "% scroll",
  })),
  5,
  300,
  188,
);
