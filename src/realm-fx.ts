import * as T from "three";
import {
  Effect,
  LookupTexture,
  LUT3DEffect,
  ToneMappingEffect,
  ToneMappingMode,
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  VignetteEffect,
  NoiseEffect,
  ChromaticAberrationEffect,
  BlendFunction,
} from "postprocessing";
export function effects(
  r: T.WebGLRenderer,
  s: T.Scene,
  c: T.PerspectiveCamera,
  high: boolean,
) {
  const composer = new EffectComposer(r, { multisampling: 0 });
  composer.addPass(new RenderPass(s, c));
  const bloom = new BloomEffect({
    intensity: high ? 0.55 : 0.28,
    luminanceThreshold: 0.95,
    mipmapBlur: true,
  });
  const vig = new VignetteEffect({ darkness: 0.38 });
  const chroma = new ChromaticAberrationEffect({
    offset: new T.Vector2(0.00028, 0.00012),
    radialModulation: true,
    modulationOffset: 0.65,
  });
  const grain = new NoiseEffect({ blendFunction: BlendFunction.SOFT_LIGHT });
  grain.blendMode.opacity.value = 0.085;
  const lut = LookupTexture.createNeutral(16);
  const values = lut.image.data as Float32Array;
  for (let i = 0; i < values.length; i += 4) {
    const max = values instanceof Uint8Array ? 255 : 1;
    for (let j = 0; j < 3; j++) {
      const v = values[i + j] / max;
      values[i + j] =
        Math.min(
          1,
          Math.max(
            0,
            v +
              (j === 2 ? 0.018 : -0.01) * (1 - v) * v +
              (v - 0.5) * v * (1 - v) * 0.28,
          ),
        ) * max;
    }
  }
  lut.needsUpdate = true;
  const heatUniform = new T.Uniform(0);
  const heat = new Effect(
    "Heat ripple",
    "uniform float intensity;void mainUv(inout vec2 uv){uv.x+=sin(uv.y*58.+time*4.)*sin(uv.y*13.-time)*intensity*.0016;}",
    { uniforms: new Map([["intensity", heatUniform]]) },
  );
  const grade = new LUT3DEffect(lut);
  const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
  composer.addPass(new EffectPass(c, heat));
  if (high) {
    composer.addPass(new EffectPass(c, new SMAAEffect()));
    composer.addPass(new EffectPass(c, chroma));
  }
  composer.addPass(
    new EffectPass(
      c,
      ...(high ? [bloom, vig, grain, tone, grade] : [bloom, vig, tone, grade]),
    ),
  );
  return Object.assign(composer, { heatUniform });
}
export function breath(s: T.Scene, glow: T.Texture) {
  const count = 250,
    g = new T.BufferGeometry(),
    v = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    v[i * 3] = Math.sin(i * 122.1) * 0.5 + 0.5;
    v[i * 3 + 1] = Math.cos(i * 72.9) * 0.5 + 0.5;
    v[i * 3 + 2] = (i % 43) / 43;
  }
  g.setAttribute("position", new T.BufferAttribute(v, 3));
  const m = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    uniforms: {
      muzzle: { value: new T.Vector3() },
      clock: { value: 0 },
      strength: { value: 0 },
      smoke: { value: 0 },
      glow: { value: glow },
    },
    vertexShader: `uniform vec3 muzzle;uniform float clock,strength,smoke;varying float life;void main(){float t=fract(position.z+clock*.83);life=sin(t*3.14159)*strength;vec3 p=mix(muzzle,vec3(-1.,1.8,-35.),t);p.x+=(position.x-.5)*(t*4.+.25);p.z+=(position.y-.5)*t*3.;p.y+=sin(position.x*7.+clock)*t+smoke*t*5.;vec4 vm=modelViewMatrix*vec4(p,1);gl_Position=projectionMatrix*vm;gl_PointSize=min(160.,(220.+490.*t)*strength/max(1.,-vm.z));}`,
    fragmentShader: `uniform sampler2D glow;uniform float smoke,clock;varying float life;void main(){float f=mod(floor(clock*16.),16.);vec2 uv=(vec2(mod(f,4.),floor(f/4.))+gl_PointCoord)/4.;vec4 v=texture2D(glow,uv);gl_FragColor=vec4(mix(v.rgb*vec3(2.8,1.4,.7),vec3(.35,.40,.42),smoke),v.a*life*.63);}`,
  });
  const p = new T.Points(g, m);
  p.frustumCulled = false;
  s.add(p);
  return (t: number, amount: number, smoke: number, muzzle: T.Vector3) => {
    m.uniforms.muzzle.value.copy(muzzle);
    p.visible = amount > 0.01;
    m.uniforms.clock.value = t;
    m.uniforms.strength.value = amount;
    m.uniforms.smoke.value = smoke;
  };
}
