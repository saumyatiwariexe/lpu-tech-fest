import { fest } from "./config";
import { compass } from "./marks";
import "@fontsource/cinzel/latin-500.css";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-600.css";
import "./gateway.css";

const params = new URLSearchParams(location.search);
const requested =
  params.get("quality") || localStorage.getItem("realm-quality") || "auto";
const manual = ["auto", "high", "standard", "lite"].includes(requested)
  ? requested
  : "auto";
if (
  params.has("quality") &&
  ["auto", "high", "standard", "lite"].includes(manual)
)
  localStorage.setItem("realm-quality", manual);

function showGateway() {
  document.title = `Choose your journey · ${fest.name}`;
  document.querySelector<HTMLElement>("body > .skip")!.hidden = true;
  document.querySelector("#app")!.innerHTML = `
    <main class="experience-gateway">
      <div class="gateway-atmosphere" aria-hidden="true"></div>
      <header class="gateway-brand">
        <span class="gateway-mark">${compass()}</span>
        <span>${fest.name}</span>
      </header>
      <section class="gateway-intro" aria-labelledby="gateway-title">
        <p class="gateway-place">${fest.dates} · ${fest.venue}</p>
        <h1 id="gateway-title">Choose how<br>you enter.</h1>
        <p class="gateway-lede">Walk the fortress yourself, or direct the original cinematic with your scroll.</p>
      </section>
      <nav class="gateway-choices" aria-label="Choose an experience">
        <a class="gateway-choice gateway-choice-primary" href="?quality=high">
          <span class="gateway-choice-number">I</span>
          <span class="gateway-choice-copy">
            <strong>Enter the 3D fortress</strong>
            <small>WASD · mouse look · interactive journey</small>
          </span>
          <span class="gateway-arrow" aria-hidden="true"></span>
        </a>
        <a class="gateway-choice" href="?quality=lite">
          <span class="gateway-choice-number">II</span>
          <span class="gateway-choice-copy">
            <strong>Play the scroll film</strong>
            <small>Scroll to guide the cinematic</small>
          </span>
          <span class="gateway-arrow" aria-hidden="true"></span>
        </a>
      </nav>
      <footer class="gateway-footer">
        <span>${fest.university}</span>
        <a href="/credits/">Credits</a>
      </footer>
    </main>`;
}

async function assess() {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 360;
  const gl = c.getContext("webgl2", { antialias: false });
  if (!gl) return "lite";
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  const gpu = String(
    gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
  );
  const n = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const vs = gl.createShader(gl.VERTEX_SHADER)!,
    fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(
    vs,
    "#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}",
  );
  gl.shaderSource(
    fs,
    "#version 300 es\nprecision mediump float;out vec4 o;void main(){float s=gl_FragCoord.x*.002;for(int i=0;i<24;i++)s=sin(s+gl_FragCoord.y*.001);o=vec4(s*.5+.5,.2,.3,1);}",
  );
  gl.compileShader(vs);
  gl.compileShader(fs);
  const pr = gl.createProgram()!;
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.linkProgram(pr);
  gl.useProgram(pr);
  let count = 0;
  const start = performance.now();
  while (performance.now() - start < 1950) {
    await new Promise(requestAnimationFrame);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
    count++;
  }
  const fps = (count * 1000) / (performance.now() - start);
  gl.deleteProgram(pr);
  gl.deleteShader(fs);
  gl.deleteShader(vs);
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  if (
    n.connection?.saveData ||
    /2g/.test(n.connection?.effectiveType || "") ||
    /swiftshader|llvmpipe/i.test(gpu) ||
    fps < 22
  )
    return "lite";
  return matchMedia("(pointer:coarse)").matches ||
    n.connection?.effectiveType === "3g" ||
    innerWidth < 800 ||
    fps < 47 ||
    (n.deviceMemory ?? 8) < 6 ||
    n.hardwareConcurrency < 6
    ? "standard"
    : "high";
}
async function boot() {
  if (location.pathname.replace(/\/$/, "") === "/credits") {
    location.replace("/credits/index.html" + location.search + location.hash);
    return;
  }
  if (params.has("info")) return;
  if (
    !params.has("quality") &&
    !params.has("motion") &&
    !location.hash
  ) {
    showGateway();
    return;
  }
  const lite =
    params.has("motion") || (location.hash && location.hash !== "#realm");
  let tier = manual;
  if (!lite && tier === "auto") {
    document.querySelector("#app")!.innerHTML =
      '<div class="realm-probe"><span>' +
      fest.name +
      '</span><p>Preparing the causeway…</p><a href="?quality=lite">Open classic site ↗</a></div>';
    tier = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "lite"
      : await assess().catch(() => "lite");
  }
  if (lite || tier === "lite") {
    await import("./main");
    return;
  }
  try {
    await (await import("./realm")).enter(tier === "high");
  } catch (e) {
    console.warn("Realm unavailable", e);
    location.replace("?quality=lite");
  }
}
void boot();
