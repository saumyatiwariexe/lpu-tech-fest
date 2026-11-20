import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const dir = "public/media";
mkdirSync(dir, { recursive: true });
const ff = "./node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe";
const input = "source/stormbound.mp4";
const clean = "delogo=x=1128:y=568:w=64:h=64";
function encode(args) {
  const result = spawnSync(
    ff,
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(1);
}
for (const [name, time] of Object.entries({
  fortress: 0,
  gate: 19,
  throne: 32,
  wyrm: 43,
  fire: 55,
  crowns: 69,
})) {
  encode([
    "-ss",
    String(time),
    "-i",
    input,
    "-vf",
    clean,
    "-frames:v",
    "1",
    "-q:v",
    "3",
    dir + "/" + name + ".jpg",
  ]);
}
encode([
  "-i",
  input,
  "-vf",
  clean + ",fps=1/2,scale=192:108,tile=6x6",
  "-frames:v",
  "1",
  "preflight/story.jpg",
]);
for (const [name, width, rate, quality] of [
  ["mobile", 768, 18, 27],
  ["wide", 1280, 24, 26],
]) {
  encode([
    "-i",
    input,
    "-an",
    "-vf",
    clean + ",scale=" + width + ":-2,fps=" + rate,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-threads",
    "4",
    "-g",
    "12",
    "-keyint_min",
    "12",
    "-sc_threshold",
    "0",
    "-crf",
    String(quality),
    "-movflags",
    "+faststart",
    dir + "/" + name + ".mp4",
  ]);
}
