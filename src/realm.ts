import { finishGate } from "./realm-materials";
import { fireAtlas, drifting } from "./realm-sprites";
import "@fontsource/cinzel/latin-500.css";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-600.css";
import "./realm.css";
import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { fest as f } from "./config";
import { compass } from "./marks";
import { realm, sculpture } from "./realm-world";
import { effects, breath } from "./realm-fx";
import { Atmosphere } from "./realm-audio";
import { corridors } from "./realm-collision";
export async function enter(high: boolean) {
  const root = document.querySelector<HTMLElement>("#app")!;
  root.innerHTML = `<main class="realm"><div id="world"></div><header class="hudbar"><div class="wordmark">${compass()}<span>${f.name}</span></div><div><button id="sound">Sound off</button><button id="menu">Menu <kbd>Esc</kbd></button></div></header>
 <section id="opening"><p class="rune">THE LANTERN CAUSEWAY</p><h1>${f.name}</h1><p>${f.tagline}</p><button class="gold" id="start" disabled>Preparing gate…</button><a href="?quality=lite">Classic site ↗</a></section>
 <div id="objective" role="status" hidden><small></small><strong></strong></div><div id="reticle" hidden>·</div><div id="playbar" hidden><button id="act">Interact <kbd>E</kbd></button><span id="hint">WASD · Walk &nbsp; Shift · Sprint &nbsp; Mouse · Look</span><button id="register-unlocked" hidden>Register ↗</button><button id="replay" hidden>Replay awakening</button></div><button id="skipbeat" hidden>Skip scene →</button>
 <div id="stick" aria-label="Virtual movement joystick"><i></i></div><dialog id="atlas"><button id="close">Close ×</button><div id="panel"></div></dialog>
 <footer><span>${f.dates} · ${f.venue}</span><a href="/credits/">Credits</a></footer></main>`;
  const el = <E extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as E;
  const scene = new T.Scene(),
    cam = new T.PerspectiveCamera(64, 1, 0.08, 330),
    r = new T.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
    });
  r.shadowMap.enabled = true;
  r.shadowMap.type = T.PCFShadowMap;
  r.shadowMap.autoUpdate = false;
  r.shadowMap.needsUpdate = true;
  r.toneMapping = T.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.18;
  r.info.autoReset = false;
  el("world").append(r.domElement);
  const env = new RoomEnvironment(),
    gen = new T.PMREMGenerator(r),
    envMap = gen.fromScene(env, 0.06);
  scene.environment = envMap.texture;
  scene.environmentIntensity = 0.38;
  env.dispose();
  gen.dispose();
  const world = realm(scene, high),
    compose = effects(r, scene, cam, high),
    atlas = fireAtlas(),
    dust = drifting(scene, atlas),
    fire = breath(scene, atlas),
    collide = corridors(),
    sound = new Atmosphere();
  const gateMesh = await sculpture("gate"),
    left = new T.Group(),
    right = new T.Group();
  finishGate(gateMesh);
  left.position.set(-2.88, 0, 0.7);
  right.position.set(2.88, 0, 0.7);
  left.add(gateMesh);
  const other = gateMesh.clone(true);
  other.scale.x = -1;
  right.add(other);
  scene.add(left, right);
  let hallReady = false,
    relicsReady = false;
  let throne: T.Object3D,
    dragon: T.Object3D,
    jaw: T.Object3D | undefined,
    head: T.Object3D | undefined;
  const jawRest = new T.Quaternion(),
    headRest = new T.Quaternion(),
    bend = new T.Quaternion(),
    hinge = new T.Vector3(1, 0, 0),
    roll = new T.Vector3(0, 0, 1),
    muzzle = new T.Vector3();
  const trophies: T.Group[] = [];
  const dissolve = { value: 0 };
  const collected = new Set<number>();
  let hallTask: Promise<void> | undefined, relicTask: Promise<void> | undefined;
  function hall() {
    return (hallTask ??= (async () => {
      world.hall();
      throne = await sculpture("throne");
      throne.position.set(0, 0.55, -35);
      throne.rotation.y = 0;
      scene.add(throne);
      throne.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.receiveShadow = true;
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of ms) {
            m.onBeforeCompile = (sh: T.WebGLProgramParametersWithUniforms) => {
              sh.uniforms.burn = dissolve;
              sh.vertexShader =
                "varying vec3 localP;\n" +
                sh.vertexShader.replace(
                  "#include <begin_vertex>",
                  "#include <begin_vertex>\nlocalP=position;",
                );
              sh.fragmentShader =
                "uniform float burn;varying vec3 localP;\n" +
                sh.fragmentShader.replace(
                  "#include <emissivemap_fragment>",
                  "#include <emissivemap_fragment>\nfloat n=clamp(.5+.25*sin(localP.y*3.+sin(localP.z*8.))+.24*sin(localP.x*6.+localP.y),0.,1.);if(n<burn)discard;if(burn>0.&&n<burn+.09)totalEmissiveRadiance+=vec3(3.,.62,.04);",
                );
            };
          }
        }
      });
      r.shadowMap.needsUpdate = true;
      hallReady = true;
    })());
  }
  function relics() {
    return (relicTask ??= (async () => {
      await hall();
      const models = await Promise.all(
        ["dragon", ...f.categories.map((_, i) => "trophy" + i)].map(sculpture),
      );
      dragon = models[0];
      dragon.position.set(4.8, 1, -34);
      dragon.rotation.y = -0.85;
      dragon.visible = false;
      scene.add(dragon);
      jaw = dragon.getObjectByName("Jaw");
      head = dragon.getObjectByName("Skull");
      if (jaw) jawRest.copy(jaw.quaternion);
      if (head) headRest.copy(head.quaternion);
      dragon.traverse((o) => {
        if (!(o instanceof T.Mesh)) return;
        o.receiveShadow = true;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m.name !== "Basalt scales") continue;
          m.onBeforeCompile = (sh: T.WebGLProgramParametersWithUniforms) => {
            sh.vertexShader =
              "varying vec3 hideP;\n" +
              sh.vertexShader.replace(
                "#include <begin_vertex>",
                "#include <begin_vertex>\nhideP=position;",
              );
            sh.fragmentShader =
              "varying vec3 hideP;\n" +
              sh.fragmentShader.replace(
                "#include <color_fragment>",
                "#include <color_fragment>\nvec2 uv=vec2(hideP.z*17.+hideP.x*6.,hideP.y*17.);uv.x+=.5*mod(floor(uv.y),2.);vec2 cell=fract(uv)-.5;float scute=1.-smoothstep(.22,.54,length(cell*vec2(.91,1.1)));diffuseColor.rgb*=.65+.50*scute;",
              );
          };
        }
      });
      for (let i = 0; i < 5; i++) {
        const g = models[i + 1];
        g.position.set((i - 2) * 1.65, -2, -35.25);
        g.scale.setScalar(1.1);
        scene.add(g);
        trophies.push(g);
      }
      relicsReady = true;
    })());
  }
  let active = false,
    phase = 0,
    open = 0,
    openingGate = false,
    beat = -1,
    seen = sessionStorage.getItem("realm-seen") === "1",
    yaw = 0,
    pitch = 0.025,
    scale = high ? 1 : 0.8,
    age = 0,
    last = 0,
    avg = 16,
    tune = 0,
    dead = false,
    near = -1;
  const pos = new T.Vector3(0, 1.72, 43),
    keys = new Set<string>(),
    forward = new T.Vector3(),
    side = new T.Vector3(),
    dir = new T.Vector3(),
    base = new T.Quaternion(),
    targetCam = new T.PerspectiveCamera();
  const dialog = el<HTMLDialogElement>("atlas");
  const joy = { x: 0, y: 0 };
  cam.rotation.order = "YXZ";
  function resize() {
    const pixelCap = Math.sqrt((high ? 2073600 : 1440000) / Math.max(1, innerWidth * innerHeight));
    r.setPixelRatio(Math.min(devicePixelRatio, 1.5, pixelCap) * scale);
    r.setSize(innerWidth, innerHeight);
    compose.setSize(innerWidth, innerHeight);
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);
  const chapters = ["Approach", "Gate", "Hall", "Awakening", "Trophies"];
  const objectives = [
    "Follow the lamps to the gate",
    "Open the bronze gate",
    "Approach the obsidian throne",
    "Witness the awakening",
    "Discover the five disciplines",
  ];
  function hud() {
    el("objective").querySelector("small")!.textContent =
      "CHAPTER " +
      ["I", "II", "III", "IV", "V"][phase] +
      " / " +
      chapters[phase];
    el("objective").querySelector("strong")!.textContent =
      phase === 4
        ? collected.size === 5
          ? "Registration open"
          : objectives[4] + " · " + collected.size + "/5"
        : objectives[phase];
  }
  const links = `<div class="menulinks">${["Schedule", "Prizes", "FAQ", "Contact", "Register", "Quality", "Sound", "Classic site", "Skip to info"].map((x) => '<button data-item="' + x + '">' + x + "</button>").join("")}</div>`;
  function panel(title: string, html: string) {
    document.exitPointerLock?.();
    keys.clear();
    joy.x = joy.y = 0;
    el("panel").innerHTML =
      '<p class="rune">FESTIVAL FIELD GUIDE</p><h2>' + title + "</h2>" + html;
    if (!dialog.open) dialog.showModal();
    el("close").focus();
  }
  function menu(item = "Menu") {
    switch (item) {
      case "Menu":
        panel(f.name, links);
        break;
      case "Schedule":
        panel(
          item,
          f.schedule
            .map(
              ([d, t, p]) => "<h3>" + d + " · " + t + "</h3><p>" + p + "</p>",
            )
            .join(""),
        );
        break;
      case "Prizes":
        panel(
          item,
          "<h3>" +
            f.prize +
            "</h3><p>Provisional festival prize pool across five disciplines.</p>",
        );
        break;
      case "FAQ":
        panel(
          item,
          f.faq
            .map(
              ([q, a]) =>
                "<details><summary>" +
                q +
                "</summary><p>" +
                a +
                "</p></details>",
            )
            .join(""),
        );
        break;
      case "Contact":
        panel(item, "<p>" + f.university + " · " + f.contact + "</p>");
        break;
      case "Register":
        panel(
          item,
          '<p>Preview registration. No information is transmitted.</p><form><label>Name<input required></label><label>Email<input type="email" required></label><button class="gold">Preview registration</button><output></output></form>',
        );
        el("panel").querySelector("form")!.onsubmit = (e) => {
          e.preventDefault();
          el("panel").querySelector("output")!.textContent =
            "Preview complete. No details were saved.";
        };
        break;
      case "Quality":
        panel(
          item,
          "<p>Current tier · " +
            (high ? "High" : "Standard") +
            "</p>" +
            ["auto", "high", "standard", "lite"]
              .map(
                (q) =>
                  '<a class="tier" href="?quality=' + q + '">' + q + "</a>",
              )
              .join(""),
        );
        break;
      case "Sound":
        void toggleSound();
        break;
      case "Classic site":
        location.assign("?quality=lite");
        break;
      case "Skip to info":
        location.assign("?info#disciplines");
        break;
    }
  }
  el("panel").onclick = (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-item]");
    if (b) menu(b.dataset.item);
  };
  async function toggleSound() {
    el("sound").textContent = (await sound.toggle()) ? "Sound on" : "Sound off";
  }
  el("sound").onclick = toggleSound;
  el("menu").onclick = () => menu();
  el("close").onclick = () => dialog.close();
  dialog.oncancel = (e) => {
    e.preventDefault();
    dialog.close();
  };
  function beginBeat() {
    if (!relicsReady) return;
    phase = 3;
    beat = 0;
    base.copy(cam.quaternion);
    dragon.visible = true;
    throne.visible = true;
    dissolve.value = 0;
    document.body.classList.add("letterbox");
    el("skipbeat").hidden = !seen;
    el("replay").hidden = true;
    trophies.forEach((g) => (g.position.y = -2));
    hud();
  }
  function finishBeat() {
    beat = -1;
    phase = 4;
    seen = true;
    sessionStorage.setItem("realm-seen", "1");
    dragon.visible = false;
    throne.visible = false;
    cam.fov = 64;
    cam.updateProjectionMatrix();
    document.body.classList.remove("letterbox");
    el("skipbeat").hidden = true;
    el("replay").hidden = false;
    hud();
  }
  function interact() {
    if (!active || dialog.open) return;
    if (phase === 1 && !openingGate) {
      openingGate = true;
      sound.pulse(1.1);
      void relics().catch(() => menu("Classic site"));
    } else if (phase === 4 && near >= 0) {
      const i = near;
      collected.add(i);
      el("register-unlocked").hidden = collected.size !== 5;
      sound.pulse(0.45);
      hud();
      const [cat, name, desc, team] = f.categories[i];
      panel(
        cat,
        "<h3>" +
          name +
          "</h3><p>" +
          desc +
          "</p><p>" +
          team +
          " · Provisional track prize " +
          f.competitionPrizes[i] +
          '</p><button class="gold" data-item="Register">Register ↗</button>' +
          (collected.size === 5
            ? "<p>Registration open · All five disciplines discovered.</p>"
            : ""),
      );
    } else if (phase === 4 && collected.size === 5) menu("Register");
  }
  document.querySelector<HTMLAnchorElement>("body>.skip")!.onclick = (e) => {
    e.preventDefault();
    menu("Skip to info");
  };
  el("act").onclick = interact;
  el("register-unlocked").onclick = () => menu("Register");
  el("skipbeat").onclick = finishBeat;
  el("replay").onclick = () => {
    pos.set(0, 1.72, -29);
    beginBeat();
  };
  function look(dx: number, dy: number) {
    if (beat >= 0 || dialog.open) return;
    yaw -= dx * 0.0022;
    pitch = T.MathUtils.clamp(pitch - dy * 0.0022, -1.2, 1.25);
  }
  function lock() {
    if (matchMedia("(pointer:fine)").matches)
      r.domElement.requestPointerLock?.()?.catch(() => {});
  }
  el<HTMLButtonElement>("start").disabled = false;
  el("start").textContent = "Enter the fortress →";
  el("start").onclick = () => {
    active = true;
    el("opening").hidden = true;
    el("objective").hidden =
      el("reticle").hidden =
      el("playbar").hidden =
        false;
    document.body.classList.add("walking");
    hud();
    lock();
    void hall().catch(() => menu("Classic site"));
  };
  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      if (!dialog.open) menu();
      return;
    }
    if (!active || dialog.open || e.target instanceof HTMLInputElement) return;
    if (
      [
        "KeyW",
        "KeyS",
        "KeyA",
        "KeyD",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ShiftLeft",
        "ShiftRight",
        "KeyE",
      ].includes(e.code)
    ) {
      e.preventDefault();
      keys.add(e.code);
      if (e.code === "KeyE" && !e.repeat) interact();
    }
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => keys.clear());
  let locked = false;
  document.addEventListener("pointerlockchange", () => {
    const now = !!document.pointerLockElement;
    if (locked && !now && !dialog.open && active) menu();
    locked = now;
  });
  document.addEventListener("mousemove", (e) => {
    if (locked) look(e.movementX, e.movementY);
  });
  r.domElement.onclick = () => {
    if (active && !dialog.open) lock();
  };
  let drag = -1,
    px = 0,
    py = 0;
  r.domElement.onpointerdown = (e) => {
    if (active && !locked) {
      drag = e.pointerId;
      px = e.clientX;
      py = e.clientY;
      r.domElement.setPointerCapture(drag);
    }
  };
  r.domElement.onpointermove = (e) => {
    if (e.pointerId === drag) {
      look(e.clientX - px, e.clientY - py);
      px = e.clientX;
      py = e.clientY;
    }
  };
  r.domElement.onpointerup = r.domElement.onpointercancel = () => (drag = -1);
  const stick = el("stick");
  function joystick(e: PointerEvent) {
    const b = stick.getBoundingClientRect();
    joy.x = T.MathUtils.clamp((e.clientX - b.left - b.width / 2) / 35, -1, 1);
    joy.y = T.MathUtils.clamp((e.clientY - b.top - b.height / 2) / 35, -1, 1);
    stick.firstElementChild!.setAttribute(
      "style",
      "transform:translate(" + joy.x * 25 + "px," + joy.y * 25 + "px)",
    );
  }
  stick.onpointerdown = (e) => {
    stick.setPointerCapture(e.pointerId);
    joystick(e);
  };
  stick.onpointermove = (e) => {
    if (stick.hasPointerCapture(e.pointerId)) joystick(e);
  };
  stick.onpointerup = stick.onpointercancel = () => {
    joy.x = joy.y = 0;
    stick.firstElementChild!.removeAttribute("style");
  };
  let peakCalls = 0,
    peakTriangles = 0;
  let padA = false,
    padMenu = false,
    padBack = false,
    padNav = false;
  const flameLight = new T.PointLight(0xff913e, 0, 18, 1.5);
  flameLight.position.set(1, 3, -31);
  scene.add(flameLight);
  const eyes = new T.Group();
  for (const x of [-0.36, 0.36]) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: world.glow,
        color: 0xff6c22,
        blending: T.AdditiveBlending,
        depthWrite: false,
      }),
    );
    sp.position.x = x;
    sp.scale.setScalar(0.35);
    eyes.add(sp);
  }
  eyes.visible = false;
  scene.add(eyes);
  function frame(ms: number) {
    if (dead) return;
    requestAnimationFrame(frame);
    const real = last ? ms - last : 16;
    last = ms;
    if (document.hidden) return;
    const dt = Math.min(0.05, real / 1000);
    age += dt;
    avg = avg * 0.95 + Math.min(real, 100) * 0.05;
    if ((tune += Math.min(real / 1000, 0.5)) > 2) {
      tune = 0;
      const next = T.MathUtils.clamp(
        scale + (avg > 34 ? -0.1 : avg < 18 ? 0.05 : 0),
        0.6,
        1,
      );
      if (next !== scale) {
        scale = next;
        resize();
      }
    }
    const pad = navigator.getGamepads?.()[0];
    if (pad?.buttons[9]?.pressed && !padMenu) {
      if (dialog.open) dialog.close();
      else menu();
    }
    padMenu = !!pad?.buttons[9]?.pressed;
    const back = !!pad?.buttons[1]?.pressed;
    if (back && !padBack && dialog.open) dialog.close();
    padBack = back;
    const up = pad?.buttons[12]?.pressed || pad?.buttons[14]?.pressed,
      down = pad?.buttons[13]?.pressed || pad?.buttons[15]?.pressed;
    if (dialog.open && (up || down) && !padNav) {
      const items = [
        ...dialog.querySelectorAll<HTMLElement>("button,a,input,summary"),
      ];
      const i = items.indexOf(document.activeElement as HTMLElement);
      items[(i + (up ? -1 : 1) + items.length) % items.length]?.focus();
    }
    padNav = !!(up || down);
    if (pad?.buttons[0]?.pressed && !padA) {
      if (dialog.open) (document.activeElement as HTMLElement)?.click();
      else if (!active) el("start").click();
      else interact();
    }
    padA = !!pad?.buttons[0]?.pressed;
    if (active && !dialog.open && beat < 0) {
      const axis = (i: number) =>
        Math.abs(pad?.axes[i] || 0) > 0.15 ? pad!.axes[i] : 0;
      yaw -= axis(2) * dt * 2;
      pitch = T.MathUtils.clamp(pitch - axis(3) * dt * 2, -1.2, 1.25);
      let fwd =
          Number(keys.has("KeyW") || keys.has("ArrowUp")) -
          Number(keys.has("KeyS") || keys.has("ArrowDown")) -
          joy.y -
          axis(1),
        strafe =
          Number(keys.has("KeyD")) - Number(keys.has("KeyA")) + joy.x + axis(0);
      yaw +=
        (Number(keys.has("ArrowLeft")) - Number(keys.has("ArrowRight"))) *
        dt *
        1.8;
      forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      side.set(Math.cos(yaw), 0, -Math.sin(yaw));
      dir
        .copy(forward)
        .multiplyScalar(fwd)
        .addScaledVector(side, strafe)
        .clampLength(0, 1);
      pos.addScaledVector(
        dir,
        dt *
          (keys.has("ShiftLeft") ||
          keys.has("ShiftRight") ||
          pad?.buttons[10]?.pressed
            ? 8
            : 4),
      );
      collide(pos, open);
      if (phase === 0 && pos.z < 5.5) {
        phase = 1;
        hud();
      }
      if (phase === 1 && pos.z > 6 && !openingGate) {
        phase = 0;
        hud();
      }
      if (phase === 2 && pos.z < -26 && relicsReady) {
        beginBeat();
      }
      if (phase === 4) {
        near = -1;
        let dist = 3.65;
        trophies.forEach((g, i) => {
          g.position.y = T.MathUtils.lerp(
            g.position.y,
            1.03,
            1 - Math.exp(-dt * 2),
          );
          g.rotation.y = age * 0.28 + i;
          const d = Math.hypot(g.position.x - pos.x, g.position.z - pos.z);
          if (d < dist) {
            near = i;
            dist = d;
          }
        });
      }
    }
    if (openingGate && !dialog.open && hallReady) {
      open = Math.min(1, open + dt * 0.4);
      const swing = T.MathUtils.smootherstep(open, 0, 1) * 1.52;
      left.rotation.y = swing;
      right.rotation.y = -swing;
      if (open === 1 && phase === 1) {
        phase = 2;
        hud();
      }
    }
    if (active) {
      cam.position.copy(pos);
      cam.rotation.set(pitch, yaw, 0, "YXZ");
    } else {
      cam.position.set(Math.sin(age * 0.08) * 0.7, 2.2, 38);
      cam.lookAt(0, 4.5, 0);
    }
    let fo = 0,
      sm = 0;
    if (beat >= 0) {
      if (!dialog.open) beat += Math.min(0.25, real / 1000);
      const l = T.MathUtils.smoothstep(beat, 2.5, 4.6);
      dragon.visible = beat > 2.25;
      dragon.position.set(5.7 - 2.2 * l, 0.8, -36 + 3 * l);
      dragon.scale.set(1.32, 1.32 + 0.018 * Math.sin(beat * 3), 1.32);
      if (jaw)
        jaw.quaternion
          .copy(jawRest)
          .multiply(
            bend.setFromAxisAngle(
              hinge,
              -0.34 * T.MathUtils.smoothstep(beat, 3.2, 5),
            ),
          );
      if (head)
        head.quaternion
          .copy(headRest)
          .multiply(bend.setFromAxisAngle(roll, Math.sin(beat * 2) * 0.055));
      dragon.localToWorld(muzzle.set(0, 1.65, 1.75));
      eyes.visible = beat < 3.1;
      eyes.position.set(4.6, 3.6, -34);
      targetCam.position.copy(pos);
      targetCam.lookAt(4, 3.8, -33);
      cam.quaternion
        .copy(base)
        .slerp(
          targetCam.quaternion,
          T.MathUtils.smoothstep(beat, 0, 2) *
            (1 - T.MathUtils.smoothstep(beat, 8, 10)),
        );
      cam.fov = 64 - 8 * Math.sin((Math.PI * Math.min(beat, 10)) / 10);
      cam.updateProjectionMatrix();
      fo =
        T.MathUtils.smoothstep(beat, 4, 5) *
        (1 - T.MathUtils.smoothstep(beat, 8, 10));
      sm = T.MathUtils.smoothstep(beat, 6.7, 8.4);
      dissolve.value = T.MathUtils.smoothstep(beat, 5, 8);
      flameLight.intensity = fo * 95;
      if (beat >= 10) finishBeat();
    } else {
      eyes.visible = false;
      flameLight.intensity = 0;
    }
    if (sound.crackle && sound.ctx)
      sound.crackle.gain.setTargetAtTime(
        0.09 +
          0.75 * fo +
          0.11 * Math.exp(-Math.abs(Math.sin((pos.z / 8.75) * Math.PI)) * 5),
        sound.ctx.currentTime,
        0.18,
      );
    compose.heatUniform.value = fo * (1 - sm);
    fire(age, fo, sm, muzzle);
    dust(age, openingGate && open < 1 ? Math.sin(Math.PI * open) : 0);
    world.tick(age);
    const action =
      phase === 1 && !openingGate
        ? "Open gate"
        : phase === 4 && near >= 0
          ? "Inspect " + f.categories[near][0]
          : phase === 4 && collected.size === 5
            ? "Register"
            : "";
    el("act").hidden = !action;
    if (action) el("act").innerHTML = action + " <kbd>E</kbd>";
    if (phase === 4 && trophies[0])
      root.dataset.rise = trophies[0].position.y.toFixed(2);
    r.info.reset();
    compose.render(dt);
    peakCalls = Math.max(peakCalls, r.info.render.calls);
    peakTriangles = Math.max(peakTriangles, r.info.render.triangles);
    root.dataset.stats = JSON.stringify({
      tier: high ? "High" : "Standard",
      peakCalls,
      peakTriangles,
      calls: r.info.render.calls,
      triangles: r.info.render.triangles,
      textures: r.info.memory.textures,
      scale,
      phase,
      yaw: +yaw.toFixed(3),
      pitch: +pitch.toFixed(3),
      z: +pos.z.toFixed(1),
      x: +pos.x.toFixed(1),
      collected: collected.size,
      beat: +beat.toFixed(2),
    });
  }
  requestAnimationFrame(frame);
  r.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    if (!dead) location.replace("?quality=lite");
  });
  window.addEventListener("pagehide", (e) => {
    if (e.persisted) return;
    dead = true;
    compose.dispose();
    r.dispose();
    envMap.dispose();
    sound.ctx?.close();
  });
}
