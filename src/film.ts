import * as T from "three";
export function createFilm(video: HTMLVideoElement, host: HTMLElement) {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  host.append(renderer.domElement);
  const tex = new T.VideoTexture(video);
  tex.generateMipmaps = false;
  const u = {
    film: { value: tex },
    aspect: { value: 1 },
    sourceAspect: { value: 16 / 9 },
    time: { value: 0 },
    fire: { value: 0 },
    pointer: { value: new T.Vector2() },
    focus: { value: 0 },
  };
  const mat = new T.ShaderMaterial({
    uniforms: u,
    depthTest: false,
    depthWrite: false,
    vertexShader:
      "varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: `
 precision mediump float;varying vec2 v;uniform sampler2D film;uniform float aspect,sourceAspect,time,fire,focus;uniform vec2 pointer;
 float hash(vec2 n){return fract(sin(dot(n,vec2(12.9898,78.233)))*43758.5453);}
 void main(){vec2 scale=min(vec2(aspect/sourceAspect,sourceAspect/aspect),1.);vec2 p=(v-.5)*scale*.994+.5+pointer*.002;
 p.x+=focus*(1.-scale.x);p.x+=sin(p.y*49.+time*2.)*.0008*fire;vec3 col=texture2D(film,p).rgb;
 vec2 maskDist=abs((p-vec2(.90625,.166667))/vec2(.033,.055));float mask=1.-smoothstep(.65,1.,max(maskDist.x,maskDist.y));
 if(mask>0.){vec3 stone=texture2D(film,clamp(p+vec2(-.055,.020),0.,1.)).rgb;col=mix(col,stone,mask*.9);}
 col=mix(vec3(dot(col,vec3(.21,.72,.07))),col,1.06)*vec3(1.025,1.0,.985);
 float mist=smoothstep(.17,.78,sin(p.x*7.+time*.12)*.17+sin(p.y*9.-time*.08)*.11+.5)*(1.-v.y);col=mix(col,vec3(.40,.46,.45),mist*.023*(1.-fire));col*=1.-.24*dot(v-.5,v-.5);col+=(hash(gl_FragCoord.xy+mod(time,11.))-.5)*.012;
 gl_FragColor=vec4(col,1.);}`,
  });
  const scene = new T.Scene(),
    camera = new T.Camera(),
    geo = new T.PlaneGeometry(2, 2);
  scene.add(new T.Mesh(geo, mat));
  const dustGeo = new T.BufferGeometry(),
    positions = new Float32Array(108 * 3);
  for (let i = 0; i < 108; i++) {
    positions[i * 3] = Math.sin(i * 143.7) * 0.5 + 0.5;
    positions[i * 3 + 1] = Math.cos(i * 59.31) * 0.5 + 0.5;
    positions[i * 3 + 2] = (i % 13) / 13;
  }
  dustGeo.setAttribute("position", new T.BufferAttribute(positions, 3));
  const dust = new T.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: u,
    vertexShader: `uniform float time,fire;varying float glow;void main(){glow=fire;vec2 p=fract(position.xy+vec2(sin(time*.18+position.y*8.)*.012,time*(.008+.016*position.z)));gl_Position=vec4(p*2.-1.,0.,1.);gl_PointSize=1.+position.z*(1.+fire*2.);}`,
    fragmentShader: `varying float glow;void main(){float a=max(0.,1.-2.*length(gl_PointCoord-.5));gl_FragColor=vec4(mix(vec3(.73,.78,.72),vec3(1.,.52,.16),glow),a*(.18+.65*glow));}`,
  });
  const particles = new T.Points(dustGeo, dust);
  particles.frustumCulled = false;
  particles.renderOrder = 1;
  scene.add(particles);
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    u.aspect.value = width / Math.max(height, 1);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const point = (e: PointerEvent) =>
    u.pointer.value.set(
      e.clientX / innerWidth - 0.5,
      0.5 - e.clientY / innerHeight,
    );
  const tilt = (e: DeviceOrientationEvent) => {
    if (e.gamma !== null && e.beta !== null)
      u.pointer.value.set(
        T.MathUtils.clamp(e.gamma / 65, -0.5, 0.5),
        T.MathUtils.clamp((e.beta - 35) / 65, -0.5, 0.5),
      );
  };
  window.addEventListener("deviceorientation", tilt, { passive: true });
  window.addEventListener("pointermove", point, { passive: true });
  return {
    draw(t: number, s: number) {
      u.time.value = t;
      u.focus.value =
        0.3 *
          T.MathUtils.smoothstep(s, 38, 43) *
          (1 - T.MathUtils.smoothstep(s, 54, 62)) -
        0.4 * T.MathUtils.smoothstep(s, 59, 68);
      u.fire.value = Math.max(0, 1 - Math.abs(s - 56) / 10);
      renderer.render(scene, camera);
    },
    dispose() {
      observer.disconnect();
      window.removeEventListener("deviceorientation", tilt);
      window.removeEventListener("pointermove", point);
      tex.dispose();
      mat.dispose();
      geo.dispose();
      dust.dispose();
      dustGeo.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
