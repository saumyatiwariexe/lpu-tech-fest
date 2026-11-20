import * as T from "three";
export function fireAtlas() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  for (let frame = 0; frame < 16; frame++) {
    const x = (frame % 4) * 64,
      y = Math.floor(frame / 4) * 64;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, 64, 64);
    ctx.clip();
    for (let p = 0; p < 22; p++) {
      const u = (p / 22 + frame / 80) % 1;
      const px = x + 32 + Math.sin(p * 5.3 + u * 7) * 12 * u,
        py = y + 48 - u * 35,
        r = 3 + 11 * (1 - u);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, "rgba(255,249,199,.92)");
      g.addColorStop(0.28, "rgba(255,161,57,.82)");
      g.addColorStop(0.68, "rgba(234,69,12,.47)");
      g.addColorStop(1, "rgba(158,34,7,0)");
      ctx.fillStyle = g;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }
    ctx.restore();
  }
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  return tex;
}
export function drifting(scene: T.Scene, atlas: T.Texture) {
  const g = new T.BufferGeometry(),
    v = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    v[i * 3] = (i % 15) / 15;
    v[i * 3 + 1] = Math.sin(i * 57.4) * 0.5 + 0.5;
    v[i * 3 + 2] = i / 180;
  }
  g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
  const m = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      gate: { value: 0 },
      atlas: { value: atlas },
    },
    vertexShader: `uniform float time,gate;varying float life;varying float dust;void main(){float u=fract(position.x+time*(.15+position.y*.12));dust=step(.78,position.z);float lampZ=58.-floor(position.z*19.)*8.75;float lane=lampZ>0.?3.48:5.8;vec3 p=vec3(mix(-lane,lane,step(.5,position.y)),2.4+u*1.8,lampZ);p.x+=sin(position.z*92.+time+u)*u*.4;if(dust>.5){p=vec3((position.y-.5)*6.,.12+u*.8,1.+u);};gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=dust>.5?18.:3.;life=(1.-u)*mix(.83,gate,dust);}`,
    fragmentShader: `uniform sampler2D atlas;uniform float time;varying float life;varying float dust;void main(){float f=mod(floor(time*12.),16.);vec2 uv=(vec2(mod(f,4.),floor(f/4.))+gl_PointCoord)/4.;float a=texture2D(atlas,uv).a;gl_FragColor=vec4(mix(vec3(2.2,.65,.17),vec3(.45,.38,.28),dust),a*life);}`,
  });
  const pts = new T.Points(g, m);
  pts.frustumCulled = false;
  scene.add(pts);
  return (t: number, d: number) => {
    m.uniforms.time.value = t;
    m.uniforms.gate.value = d;
  };
}
