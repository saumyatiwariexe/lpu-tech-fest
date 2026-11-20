import * as T from "three";
import { MeshBVH } from "three-mesh-bvh";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function corridors() {
  const pieces: T.BufferGeometry[] = [];
  function wall(x: number, z: number, w: number, d: number) {
    pieces.push(new T.BoxGeometry(w, 7, d).translate(x, 2, z));
  }
  for (const s of [-1, 1]) {
    wall(s * 3.78, 29, 0.6, 58);
    wall(s * 7.57, -20, 0.8, 40);
    wall(s * 5.3, 0, 5, 1);
    for (let z = -3; z >= -38; z -= 5) wall(s * 6.4, z, 1.15, 1.15);
  }
  wall(0, -39.7, 15, 0.7);
  wall(0, 57, 8, 0.6);
  const geo = mergeGeometries(pieces),
    tree = new MeshBVH(geo);
  pieces.forEach((p) => p.dispose());
  const line = new T.Line3(),
    box = new T.Box3(),
    a = new T.Vector3(),
    b = new T.Vector3();
  return (p: T.Vector3, gate: number) => {
    line.start.set(p.x, 0.42, p.z);
    line.end.set(p.x, 1.55, p.z);
    box
      .makeEmpty()
      .expandByPoint(line.start)
      .expandByPoint(line.end)
      .expandByScalar(0.39);
    tree.shapecast({
      intersectsBounds: (v) => box.intersectsBox(v),
      intersectsTriangle: (tri) => {
        const dist = tri.closestPointToSegment(line, a, b);
        if (dist < 0.38 && dist > 0.00001) {
          b.sub(a).multiplyScalar((0.38 - dist) / dist);
          line.start.add(b);
          line.end.add(b);
        }
        return false;
      },
    });
    p.x = line.start.x;
    p.z = line.start.z;
    if (gate < 0.85 && p.z < 1.5) p.z = 1.5;
    p.y = 1.72 + T.MathUtils.smoothstep(-p.z, 31.8, 33.5) * 0.5;
  };
}
