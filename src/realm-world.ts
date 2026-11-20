import { strata } from "./realm-materials";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
export async function sculpture(n: string) {
  return (await loader.loadAsync("/realm/" + n + ".glb")).scene;
}
export function realm(scene: T.Scene, high: boolean) {
  const skyPhoto = new T.TextureLoader().load("/realm/dusk.webp");
  skyPhoto.wrapS = T.RepeatWrapping;
  let seed = 1717;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const sky = new T.Mesh(
    new T.SphereGeometry(260, 32, 16),
    new T.ShaderMaterial({
      uniforms: { skyPhoto: { value: skyPhoto } },
      side: T.BackSide,
      depthWrite: false,
      vertexShader:
        "varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: `uniform sampler2D skyPhoto;varying vec3 d;float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(fract(sin(dot(i,vec2(127.1,311.7)))*43758.54),fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.54),f.x),mix(fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.54),fract(sin(dot(i+1.,vec2(127.1,311.7)))*43758.54),f.x),f.y);}void main(){vec3 n=normalize(d);vec2 p=n.xz/(.17+max(.0,n.y))*1.8;float c=noise(p)*.55+noise(p*2.3)*.3+noise(p*6.)*.15;float h=smoothstep(-.06,.52,n.y);vec3 col=mix(vec3(.48,.48,.50),vec3(.077,.13,.21),h);col+=vec3(.50,.23,.07)*exp(-8.*abs(n.y-.04))*max(0.,-n.x);col=mix(col,col*.43,smoothstep(.34,.72,c));vec2 eq=vec2(atan(n.z,n.x)/6.283185+.74,asin(clamp(n.y,-1.,1.))/3.141593+.5);vec3 skyRGB=texture2D(skyPhoto,eq).rgb;gl_FragColor=vec4(mix(col,pow(skyRGB,vec3(1.45))*vec3(.37,.49,.63),.94),1.);}`,
    }),
  );
  scene.add(sky);
  scene.fog = new T.FogExp2(0x364755, 0.009);
  const hemi = new T.HemisphereLight(0x9ab5d1, 0x333b3e, 0.65),
    sun = new T.DirectionalLight(0xffc58d, 1.22);
  sun.position.set(-28, 37, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(high ? 2048 : 1024);
  Object.assign(sun.shadow.camera, {
    left: -43,
    right: 43,
    top: 42,
    bottom: -42,
    far: 135,
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.05;
  sun.shadow.bias = -0.00045;
  scene.add(hemi, sun);
  const stone = new T.MeshStandardMaterial({
      color: 0x849096,
      roughness: 0.83,
    }),
    trim = new T.MeshStandardMaterial({ color: 0x485861, roughness: 0.64 }),
    dark = new T.MeshStandardMaterial({ color: 0x23333c, roughness: 0.85 }),
    metal = new T.MeshStandardMaterial({
      color: 0x604729,
      metalness: 0.55,
      roughness: 0.45,
    }),
    rug = new T.MeshStandardMaterial({ color: 0x742c2e, roughness: 0.96 });
  const tex = new T.TextureLoader().load("/realm/masonry.webp");
  tex.colorSpace = T.SRGBColorSpace;
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.repeat.set(2, 2);
  stone.map = tex;
  const normal = new T.TextureLoader().load("/realm/masonry-normal.webp");
  normal.wrapS = normal.wrapT = T.RepeatWrapping;
  normal.repeat.copy(tex.repeat);
  stone.normalMap = normal;
  stone.normalScale.set(0.62, 0.62);
  for (const surface of [stone, trim, dark, rug]) {
    surface.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "varying vec3 masonryWorld;\n" +
        shader.vertexShader.replace(
          "#include <project_vertex>",
          "#include <project_vertex>\nmasonryWorld=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;",
        );
      shader.fragmentShader =
        "varying vec3 masonryWorld;\n" +
        shader.fragmentShader.replace(
          "#include <emissivemap_fragment>",
          "#include <emissivemap_fragment>\nfloat outRoad=step(0.,masonryWorld.z);float phase=mix(mod(masonryWorld.z+3.+2.5,5.)-2.5,mod(masonryWorld.z-58.+4.375,8.75)-4.375,outRoad);vec3 delta=vec3(abs(masonryWorld.x)-mix(5.8,3.48,outRoad),masonryWorld.y-2.1,phase);float torchPool=exp(-dot(delta,delta)*.24);totalEmissiveRadiance+=diffuseColor.rgb*vec3(1.25,.42,.06)*torchPool; vec3 n=normal;",
        );
    };
  }
  const oldStone = stone.onBeforeCompile;
  stone.onBeforeCompile = (sh, r) => {
    oldStone.call(stone, sh, r);
    sh.vertexShader = sh.vertexShader.replace(
      "masonryWorld=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;",
      "masonryWorld=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;vec3 faceAxis=abs(normalize(mat3(instanceMatrix)*normal));vec2 masonryUV=faceAxis.y>.65?masonryWorld.xz:vec2(faceAxis.x>.65?masonryWorld.z:masonryWorld.x,masonryWorld.y);vMapUv=masonryUV*.22;vNormalMapUv=vMapUv;",
    );
  };
  for (const m of [stone, trim, dark, rug]) {
    const hook = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      hook.call(m, sh, r);
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <opaque_fragment>",
        "float room=smoothstep(1.,5.,-masonryWorld.z);float shade=mix(.45,.19,smoothstep(-6.,5.,masonryWorld.x));outgoingLight*=mix(vec3(1.),vec3(.73,.86,1.)*shade,room);\n#include <opaque_fragment>",
      );
    };
  }
  const cube = new T.BoxGeometry(),
    cyl = new T.CylinderGeometry(1, 1, 1, high ? 20 : 12),
    peak = new T.ConeGeometry(1, 1, 8),
    rock = new T.IcosahedronGeometry(1, high ? 1 : 0);
  const cliff = strata();
  const rockPoints = rock.attributes.position;
  for (let i = 0; i < rockPoints.count; i++) {
    const x = rockPoints.getX(i),
      y = rockPoints.getY(i),
      z = rockPoints.getZ(i);
    const cut = 0.87 + 0.19 * Math.sin(x * 14 + y * 8 + z * 17);
    rockPoints.setXYZ(i, x * cut + 0.14 * y, y * cut, z * cut);
  }
  rock.computeVertexNormals();
  const cache = new Map<
    string,
    { g: T.BufferGeometry; m: T.Material; t: T.Matrix4[]; colors: T.Color[] }
  >();
  const dummy = new T.Object3D();
  function add(
    g: T.BufferGeometry,
    m: T.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rz = 0,
    ry = 0,
  ) {
    const id = g.uuid + m.uuid;
    let v = cache.get(id);
    if (!v) {
      v = { g, m, t: [], colors: [] };
      cache.set(id, v);
    }
    dummy.position.set(x, y, z);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(0, ry, rz);
    dummy.updateMatrix();
    v.t.push(dummy.matrix.clone());
    v.colors.push(new T.Color().setScalar(0.73 + rand() * 0.27));
  }
  function flush() {
    for (const v of cache.values()) {
      const inst = new T.InstancedMesh(v.g, v.m, v.t.length);
      v.t.forEach((m, i) => {
        inst.setMatrixAt(i, m);
        inst.setColorAt(i, v.colors[i]);
      });
      inst.castShadow = v.m !== flame;
      inst.receiveShadow = true;
      scene.add(inst);
    }
    cache.clear();
  }
  function tower(x: number, z: number, r: number, h: number, spire: boolean) {
    add(cyl, stone, x, h / 2 - 1, z, r, h + 2, r);
    for (const fraction of [0.09, 0.6, 0.91, 1])
      add(cyl, trim, x, h * fraction, z, r * 1.08, 0.35, r * 1.08);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      add(
        cube,
        trim,
        x + Math.cos(a) * r,
        h + 0.64,
        z + Math.sin(a) * r,
        0.7,
        1.34,
        0.76,
        0,
        -a,
      );
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      add(
        cube,
        dark,
        x + Math.cos(a) * r,
        h * 0.74,
        z + Math.sin(a) * r,
        0.18,
        1.45,
        0.38,
        0,
        -a,
      );
    }
    if (spire) {
      add(peak, dark, x, h + r * 1.4, z, r * 1.14, r * 2.8, r * 1.14);
      add(peak, metal, x, h + r * 2.93, z, 0.1, 1.5, 0.1);
    }
  }
  const windowDark = new T.MeshBasicMaterial({ color: 0x18232c }),
    windowLit = new T.MeshBasicMaterial({
      color: new T.Color(1.05, 0.37, 0.075),
    });
  function keep(x: number, z: number, w: number, h: number, d: number) {
    add(cube, stone, x, h / 2, z, w, h, d);
    add(cube, trim, x, h - 0.35, z, w + 0.45, 0.7, d + 0.45);
    for (let k = 0; k < Math.floor(w / 1.25); k++)
      add(
        cube,
        stone,
        x - w / 2 + 0.55 + k * 1.25,
        h + 0.46,
        z + d / 2,
        0.69,
        0.98,
        0.7,
      );
    for (let y = 4; y < h - 1; y += 3.15)
      for (let u = -w / 2 + 1; u < w / 2; u += 2.15) {
        const m = rand() < 0.24 ? windowLit : windowDark;
        add(cube, m, x + u, y, z + d / 2 + 0.015, 0.35, 1.1, 0.04);
        add(cube, trim, x + u, y - 0.63, z + d / 2 + 0.08, 0.61, 0.13, 0.21);
      }
    for (const side of [-1, 1])
      add(
        cube,
        trim,
        x + side * (w / 2 - 0.2),
        h * 0.48,
        z + d / 2,
        0.52,
        h * 0.97,
        0.36,
      );
  }
  function arch(x: number, z: number, r: number, base: number, depth: number) {
    for (let i = 0; i < 19; i++) {
      const a = ((i + 0.5) * Math.PI) / 19;
      add(
        cube,
        trim,
        x + Math.cos(a) * r,
        base + Math.sin(a) * r,
        z,
        ((r * Math.PI) / 19) * 1.01,
        0.53,
        depth,
        a - Math.PI / 2,
      );
    }
    for (const side of [-1, 1]) {
      add(cube, trim, x + side * r, base / 2, z, 0.53, base, depth);
      add(cube, metal, x + side * r, base, z, 0.7, 0.17, depth * 1.15);
    }
  }
  const flame = new T.MeshBasicMaterial({
      color: new T.Color(3.6, 1.23, 0.24),
    }),
    glows: number[] = [];
  function torch(x: number, z: number, y = 2.1) {
    add(cyl, metal, x, y * 0.5, z, 0.11, y, 0.11);
    add(peak, metal, x, y, z, 0.26, 0.4, 0.26, Math.PI);
    add(peak, flame, x, y + 0.42, z, 0.17, 0.63, 0.17);
    glows.push(x, y + 0.32, z);
  }
  function glowTex() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!,
      grad = g.createRadialGradient(32, 32, 1, 32, 32, 31);
    grad.addColorStop(0, "#fff");
    grad.addColorStop(0.18, "#ffaa43");
    grad.addColorStop(0.6, "rgba(244,96,10,.14)");
    grad.addColorStop(1, "transparent");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }
  const glow = glowTex();
  function lamps() {
    const g = new T.BufferGeometry();
    g.setAttribute(
      "position",
      new T.Float32BufferAttribute(glows.splice(0), 3),
    );
    scene.add(
      new T.Points(
        g,
        new T.PointsMaterial({
          size: 2.2,
          map: glow,
          transparent: true,
          depthWrite: false,
          blending: T.AdditiveBlending,
        }),
      ),
    );
  }
  for (let row = 0; row < 47; row++) {
    const z = 58 - row * 1.25;
    for (let col = 0; col < 5; col++)
      add(cube, stone, (col - 2) * 1.36, -0.19, z, 1.345, 0.37, 1.24);
    for (const s of [-1, 1]) {
      add(cube, dark, s * 3.64, 0.29, z, 0.49, 0.62, 1.25);
      if (row % 3 === 0) add(cube, trim, s * 3.64, 0.8, z, 0.64, 0.5, 0.7);
      if (row % 7 === 0) torch(s * 3.48, z);
    }
  }
  add(cube, dark, 0, -2, 29, 7.8, 3.7, 62);
  for (let i = 0; i < 8; i++) {
    for (const s of [-1, 1]) add(cube, stone, s * 3.5, -7, i * 8, 1.4, 13, 2.8);
  }
  for (let i = 0; i < 140; i++) {
    const x = (rand() - 0.5) * 170,
      z = (rand() - 0.6) * 145;
    if (Math.abs(x) < 19 && z > -57) continue;
    add(
      rock,
      cliff,
      x,
      -8 - rand() * 8,
      z,
      3 + rand() * 10,
      3 + rand() * 12,
      4 + rand() * 12,
      rand(),
      rand() * 6,
    );
  }
  for (const s of [-1, 1]) {
    add(cube, stone, s * 14, 3.6, 0, 22, 7.2, 3);
    for (let j = 0; j < 16; j++)
      add(cube, trim, s * (3.6 + j * 1.37), 7.66, 1, 0.74, 1.05, 0.85);
    tower(s * 6.6, 0.2, 3.2, 11, false);
    tower(s * 22, -3, 3.7, 13, true);
    tower(s * 12, -20, 3, 16, true);
    tower(s * 8, -41, 3.4, 21, true);
    torch(s * 3.65, 2, 3.0);
  }
  arch(0, 1, 3, 3.35, 1.4);
  add(cube, stone, 0, 7.6, -0.3, 6.6, 2.1, 2.4);
  for (let j = -2; j <= 2; j++) add(cube, trim, j * 1.3, 9, 0.7, 0.7, 0.8, 0.9);
  keep(-4, -47, 15, 25, 9);
  keep(5, -52, 10, 30, 8);
  keep(-16, -33, 9, 12, 8);
  keep(17, -31, 12, 15, 10);
  for (const [x, z, rr, h] of [
    [-10, -48, 2.1, 28],
    [1, -49, 1.9, 30],
    [9, -50, 2.2, 34],
    [-3, -62, 2.8, 40],
    [-19, -37, 2, 16],
    [21, -35, 2, 19],
  ])
    tower(x, z, rr, h, true);
  for (const s of [-1, 1]) {
    for (let j = 1; j < 8; j++) {
      const x = s * (4 + j * 2.55);
      add(cube, trim, x, 3.4, 1.65, 0.64, 6.8, 0.95);
      add(cube, trim, x, 0.95, 2.05, 1, 1.9, 1);
      add(cube, windowDark, x, 5.3, 2.16, 0.18, 0.92, 0.07);
    }
    for (let i = 0; i < 12; i++) {
      const a = i * 0.5236;
      const t = s * 6.6;
      for (const y of [3.4, 7.7]) {
        add(
          cube,
          windowDark,
          t + Math.cos(a) * 3.2,
          y,
          0.2 + Math.sin(a) * 3.2,
          0.07,
          1.05,
          0.32,
          0,
          -a,
        );
        if (i % 3 === 1)
          add(
            cube,
            windowLit,
            t + Math.cos(a) * 3.24,
            y - 0.06,
            0.2 + Math.sin(a) * 3.24,
            0.05,
            0.59,
            0.11,
            0,
            -a,
          );
      }
    }
  }
  for (let j = 0; j < 17; j++) {
    const x = (j - 8) * 12;
    add(
      rock,
      cliff,
      x,
      -3,
      -76 - rand() * 12,
      12 + rand() * 6,
      11 + rand() * 13,
      13,
      rand() * 0.4,
      rand() * 6,
    );
  }
  for (let i = 0; i < 53; i++) {
    const x = ((i % 17) - 8) * 3.75;
    const z = -3 - Math.floor(i / 17) * 12;
    if (Math.abs(x) < 18) continue;
    add(
      rock,
      cliff,
      x,
      -5 - rand() * 1.8,
      z,
      4 + rand() * 4,
      5 + rand() * 2.4,
      6 + rand() * 3,
      0,
      rand(),
    );
  }
  for (let j = 0; j < 4; j++) {
    const z = 48 - j * 8;
    add(
      rock,
      cliff,
      -17 - j * 2,
      -5,
      z,
      6 + j,
      6 + j * 1.5,
      9,
      0.15,
      1 + j * 0.23,
    );
    add(rock, cliff, 26 + j * 5, -8, z - 12, 10, 8 + j * 1.8, 9, 0.3, j);
  }
  const cloth = new T.MeshStandardMaterial({
    color: 0x642735,
    roughness: 0.96,
    side: T.DoubleSide,
  });
  function banner(x: number, y: number, z: number, w: number, h: number) {
    const g = new T.PlaneGeometry(w, h, 8, 6);
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const u = a.getX(i) / w + 0.5,
        v = a.getY(i) / h + 0.5;
      a.setXYZ(
        i,
        a.getX(i),
        a.getY(i) + (1 - v) ** 4 * Math.abs(u - 0.5) * w * 0.55,
        0.065 * Math.cos(u * Math.PI * 5) * (1.3 - v),
      );
    }
    g.computeVertexNormals();
    const b = new T.Mesh(g, cloth);
    b.position.set(x, y, z);
    b.castShadow = true;
    scene.add(b);
    add(cube, metal, x, y + h / 2 + 0.07, z, w + 0.27, 0.09, 0.12);
    add(cube, metal, x, y + 0.25, z + 0.09, w * 0.39, 0.05, 0.03, 0.78);
    add(cube, metal, x, y + 0.25, z + 0.09, w * 0.39, 0.05, 0.03, -0.78);
  }
  for (const s of [-1, 1]) banner(s * 6.6, 6.9, 3.49, 1.02, 3.9);
  const sea = new T.Mesh(
    new T.PlaneGeometry(420, 420),
    new T.ShaderMaterial({
      uniforms: { u: { value: 0 } },
      vertexShader:
        "varying vec3 w;void main(){w=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}",
      fragmentShader:
        "varying vec3 w;uniform float u;void main(){float a=sin(w.x*.81+sin(w.z*.65+u*.6)*2.+u)+sin(w.z*2.3+w.x*.29+u*.7);float b=sin(w.z*5.2+sin(w.x*3.1+u)+u*.6);vec3 c=mix(vec3(.023,.060,.081),vec3(.14,.24,.26),smoothstep(.34,2.,a)*(.55+.14*b));c+=vec3(.17,.21,.21)*smoothstep(1.85,1.98,a)*smoothstep(-.1,.9,b);gl_FragColor=vec4(c,1.);}",
    }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -6;
  scene.add(sea);
  flush();
  lamps();
  function hall() {
    add(cube, stone, 0, -0.22, -20, 15, 0.44, 40);
    add(cube, rug, 0, 0.022, -19, 2.8, 0.04, 36);
    for (const s of [-1, 1]) {
      add(cube, metal, s * 1.42, 0.05, -19, 0.05, 0.024, 36);
      add(cube, stone, s * 7.6, 5.5, -20, 0.8, 11, 40);
    }
    add(cube, stone, 0, 5.5, -40, 16, 11, 0.8);
    add(cube, dark, 0, 12, -20, 16, 0.6, 41);
    for (let z = -3; z >= -38; z -= 5) {
      arch(0, z, 6.4, 4.7, 0.86);
      for (const s of [-1, 1]) {
        add(cyl, trim, s * 6.4, 2.35, z, 0.64, 4.7, 0.64);
        add(cyl, metal, s * 6.4, 4.45, z, 0.78, 0.21, 0.78);
        if (s < 0 || z % 2 === 0) torch(s * 5.8, z, 1.65);
      }
    }
    for (let i = 0; i < 3; i++)
      add(
        cube,
        trim,
        0,
        0.1 + i * 0.16,
        -35 - i * 0.23,
        9.3 - i * 0.45,
        0.2 + i * 0.15,
        5.3 - i * 0.42,
      );
    // The bronze lip meets the bottom of each raised sculpture at y = 1.03.
    for (let i = -2; i <= 2; i++) {
      const x = i * 1.65;
      add(cyl, trim, x, 0.825, -35.25, 0.52, 0.31, 0.52);
      add(cyl, metal, x, 1.005, -35.25, 0.55, 0.05, 0.55);
    }
    for (const s of [-1, 1]) {
      for (let z = -5; z > -40; z -= 5) {
        add(cube, dark, s * 7.02, 0.76, z, 0.48, 1.52, 5);
        add(cube, trim, s * 6.97, 1.54, z, 0.63, 0.17, 5);
        add(cube, trim, s * 6.94, 7.6, z, 0.6, 0.32, 5);
        if (s < 0) {
          add(cube, windowDark, s * 7.1, 5.1, z, 0.09, 5, 0.98);
          add(cube, windowLit, s * 7.02, 5.4, z, 0.05, 2.7, 0.1);
        }
      }
    }
    for (let j = -2; j <= 2; j++) {
      const x = j * 2.8;
      add(cube, dark, x, 5.9, -39.42, 2.2, 8, 0.38);
      arch(x, -39.12, 1.01, 7.35, 0.4);
      if (j !== 0) banner(x, 5.48, -39.08, 1.06, 3.65);
    }
    for (let i = 0; i < 3; i++) {
      const ring = new T.Mesh(
        new T.TorusGeometry(1.94 - i * 0.22, 0.038, 6, 40),
        metal,
      );
      ring.position.set(0, 7.0, -38.8);
      scene.add(ring);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      add(
        cube,
        metal,
        Math.sin(a) * 1.08,
        7 + Math.cos(a) * 1.08,
        -38.8,
        0.045,
        1.3,
        0.07,
        -a,
      );
    }
    for (const s of [-1, 1])
      for (let i = 0; i < 4; i++) banner(s * 5.96, 5.46, -7 - i * 9, 0.68, 2.6);
    flush();
    lamps();
    const cold = new T.PointLight(0x9dd6ff, 58, 26, 1.5);
    cold.position.set(-4.8, 7, -29);
    scene.add(cold);
    const beam = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: T.FrontSide,
      blending: T.AdditiveBlending,
      vertexShader:
        "varying vec3 local;varying vec3 norm;varying vec3 eye;void main(){local=position;vec4 mv=modelViewMatrix*vec4(position,1.);norm=normalMatrix*normal;eye=-mv.xyz;gl_Position=projectionMatrix*mv;}",
      fragmentShader:
        "varying vec3 local;varying vec3 norm;varying vec3 eye;void main(){float edge=abs(dot(normalize(norm),normalize(eye)));float fade=smoothstep(-5.5,-2.,local.y)*(1.-smoothstep(2.,5.5,local.y));gl_FragColor=vec4(.48,.64,.87,.11*edge*fade);}",
    });
    for (let i = 0; i < (high ? 7 : 4); i++) {
      const b = new T.Mesh(new T.ConeGeometry(1.3, 11, 12, 1, true), beam);
      b.rotation.z = -0.56;
      b.position.set(-3.3, 5.1, -7 - i * 4.7);
      scene.add(b);
    }
  }
  return {
    hall,
    glow,
    tick(t: number) {
      sea.material.uniforms.u.value = t;
    },
  };
}
