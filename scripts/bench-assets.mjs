import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
for (const name of ["mobile", "wide"]) {
  const folder = "preflight/bench/" + name;
  mkdirSync(folder, { recursive: true });
  const input = "public/media/" + name + ".mp4";
  const probe = spawnSync(
    "./node_modules/@ffprobe-installer/win32-x64/ffprobe.exe",
    [
      "-v",
      "error",
      "-show_entries",
      "packet=pos,size,pts_time,flags",
      "-show_packets",
      "-select_streams",
      "v:0",
      "-of",
      "json",
      input,
    ],
    { encoding: "utf8", maxBuffer: 8e6 },
  );
  const extra = spawnSync(
    "./node_modules/@ffprobe-installer/win32-x64/ffprobe.exe",
    [
      "-v",
      "error",
      "-show_entries",
      "stream=extradata",
      "-show_data",
      "-of",
      "json",
      input,
    ],
    { encoding: "utf8" },
  );
  const desc = JSON.parse(extra.stdout)
    .streams[0].extradata.trim()
    .split("\n")
    .map((l) => l.split(":")[1].trim().split("  ")[0].replaceAll(" ", ""))
    .join("");
  writeFileSync(
    folder + "/index.json",
    JSON.stringify({
      description: desc,
      packets: JSON.parse(probe.stdout).packets.map((p) => [
        +p.pos,
        +p.size,
        +p.pts_time,
        p.flags.includes("K"),
      ]),
    }),
  );
  const encode = spawnSync(
    "./node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe",
    [
      "-loglevel",
      "error",
      "-y",
      "-i",
      input,
      "-vf",
      "fps=8",
      "-c:v",
      "libwebp",
      "-quality",
      "67",
      "-compression_level",
      "2",
      "-threads",
      "3",
      folder + "/%04d.webp",
    ],
    { stdio: "inherit" },
  );
  if (encode.status !== 0) throw Error("WebP encode failed");
}
