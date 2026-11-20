import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const blender =
  process.env.BLENDER_BIN ||
  (process.platform === "win32"
    ? "C:/Program Files/Blender Foundation/Blender 3.5/blender.exe"
    : "blender");
function run(bin, args) {
  const result = spawnSync(bin, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(bin + " failed with " + result.status);
}
run(blender, [
  "--background",
  "--factory-startup",
  "--python-exit-code",
  "1",
  "--python",
  "blender/heroes.py",
]);
mkdirSync(path.join(root, "public/realm"), { recursive: true });
for (const name of [
  "gate",
  "throne",
  "dragon",
  ...Array.from({ length: 5 }, (_, i) => "trophy" + i),
]) {
  const raw = "preflight/art/raw/" + name + ".glb";
  if (!existsSync(path.join(root, raw))) throw Error(raw);
  run(process.execPath, [
    "node_modules/@gltf-transform/cli/bin/cli.js",
    "meshopt",
    raw,
    "public/realm/" + name + ".glb",
  ]);
}
