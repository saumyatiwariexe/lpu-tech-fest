import {Box3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const assets = [];
async function inventory(file, tier, proof, extra = {}) {
  const data = await readFile(file);
  const entry = {
    path: file,
    bytes: data.byteLength,
    sha256: createHash("sha256").update(data).digest("hex"),
    tris: 0,
    tier,
    proof: "docs/licenses/" + proof + ".txt",
    ...extra,
  };
  await stat(entry.proof);
  if (file.endsWith(".glb")) {
    const root = (await io.read(file)).getRoot();
    const name = path.basename(file, ".glb");
    const loaded=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
    loaded.scene.updateMatrixWorld(true);
    loaded.scene.traverse(o=>o.skeleton?.update());
    const bounds=new Box3().setFromObject(loaded.scene,true);
    entry.boundsMetres={min:bounds.min.toArray(),max:bounds.max.toArray()};
    entry.tris = root
      .listMeshes()
      .flatMap((m) => m.listPrimitives())
      .reduce(
        (n, p) =>
          n + (p.getIndices() || p.getAttribute("POSITION")).getCount() / 3,
        0,
      );
    entry.materials = root.listMaterials().map((m) => m.getName());
    entry.skinJoints = root
      .listSkins()
      .flatMap((s) => s.listJoints().map((j) => j.getName()));
    entry.skinJoints=[...new Set(entry.skinJoints)];
    entry.embeddedClips = root.listAnimations().length;
    entry.textureCount = root.listTextures().length;
    entry.requiredExtensions = root
      .listExtensionsRequired()
      .map((e) => e.extensionName);
    entry.units = "metres, Y up";
    entry.runtimeMotion =
      name === "dragon"
        ? "Neck hierarchy, head and jaw posing, root lunge and breathing"
        : name === "gate"
          ? "Rotated at side jamb using outer group"
          : name === "throne"
            ? "Emissive-edge threshold dissolve"
            : "Vertical rise and slow turn around base";
    entry.pivot =
      name === "gate"
        ? "Hinge at outer jamb; mirrored for opposite door"
        : name === "dragon"
          ? "Bust base, local skeleton pose"
          : "Base on dais";
    if (
      name === "dragon" &&
      !["Neck", "Skull", "Jaw"].every((j) => entry.skinJoints.includes(j))
    )
      throw Error("Dragon skeleton lost joints");
    if (!entry.requiredExtensions.includes("EXT_meshopt_compression"))
      throw Error("Uncompressed hero: " + file);
  } else if (/\.(webp|jpg|png)$/.test(file)) {
    const m = await sharp(data).metadata();
    entry.pixels = [m.width, m.height];
  }
  assets.push(entry);
}
for (const file of (await readdir("public/realm")).sort()) {
  const glb = file.endsWith(".glb");
  await inventory(
    "public/realm/" + file,
    glb ? "Original" : "A",
    glb ? "original" : file === "dusk.webp" ? "kloppenheim" : "bricks097",
  );
}
for (const file of (await readdir("public/media")).sort())
  await inventory("public/media/" + file, "Supplied classic reference", "film");
for (const file of (await readdir("reference"))
  .filter((f) => /\.jpg$/.test(f))
  .sort())
  await inventory("reference/" + file, "Supplied classic reference", "film");
for (const [font, weights] of [
  ["cinzel", [500]],
  ["barlow", [400, 600]],
])
  for (const weight of weights)
    for (const ext of ["woff", "woff2"])
      await inventory(
        "node_modules/@fontsource/" +
          font +
          "/files/" +
          font +
          "-latin-" +
          weight +
          "-normal." +
          ext,
        "A",
        font,
      );
for (const file of [
  "src/realm-world.ts",
  "src/realm-fx.ts",
  "src/realm-sprites.ts",
  "src/realm-materials.ts",
  "src/realm-audio.ts",
  "src/marks.ts",
])
  await inventory(file, "Original", "original", { generatedAtRuntime: true });
await writeFile(
  "docs/ASSET_MANIFEST.json",
  JSON.stringify(
    {
      downloadHosts: [
        "ambientcg.com",
        "acg-download.struffelproductions.com",
        "dl.polyhaven.org",
        "registry.npmjs.org",
        "raw.githubusercontent.com",
      ],
      assets,
    },
    null,
    2,
  ) + "\n",
);
console.log("Inventoried", assets.length, "assets");
