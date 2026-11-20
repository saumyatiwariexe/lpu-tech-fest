import Lenis from "lenis";
import { fest } from "./config";
export function startJourney() {
  const get = <T extends HTMLElement>(s: string) =>
    document.querySelector<T>(s)!;
  const stage = get<HTMLElement>(".stage"),
    section = get<HTMLElement>("#journey"),
    video = get<HTMLVideoElement>("video"),
    plate = get<HTMLImageElement>(".plate"),
    skip = get<HTMLButtonElement>(".skip-film"),
    status = get(".load");
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>("[data-chapter]"),
  ];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const numbers = ["I", "II", "III", "IV", "V", "VI"];
  let chapter = -1;
  function label(sec: number) {
    const index = fest.chapters.reduce((n, c, i) => (sec >= c.at ? i : n), 0);
    if (index === chapter) return;
    chapter = index;
    section.dataset.chapter = String(index);
    const c = fest.chapters[index];
    get("#chapter-key").textContent =
      "Chapter " + numbers[index] + " · " + c.kicker;
    get("#chapter-title").textContent = c.title;
    get(".tagline").textContent = c.line;
    plate.src = "/media/" + c.image + ".jpg";
    buttons.forEach((b, i) => {
      b.classList.toggle("active", index === i);
      b.setAttribute("aria-current", index === i ? "step" : "false");
    });
    if (index > 0 && !reduced.matches)
      get(".hero-copy").animate(
        [
          { opacity: 0.3, transform: "translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 320 },
      );
  }
  label(0);
  if (
    reduced.matches ||
    new URLSearchParams(location.search).get("motion") === "still"
  ) {
    document.body.classList.add("still");
    return;
  }
  const lenis = new Lenis({
    duration: 0.85,
    anchors: true,
    stopInertiaOnNavigate: true,
  });
  let film:
    Awaited<ReturnType<(typeof import("./film"))["createFilm"]>> | undefined;
  let started = false,
    seekChecks = 0;
  let loaded = false,
    dead = false,
    ready = false,
    playing = false,
    armed = true,
    last = 0,
    raf = 0,
    target = 0,
    renderTime = 0;
  const span = () => Math.max(1, section.offsetHeight - stage.offsetHeight);
  const go = (s: number) =>
    lenis.scrollTo(section.offsetTop + (span() * s) / 72, {
      immediate: true,
      force: true,
    });
  function done(jump = true) {
    if (!playing) return;
    playing = false;
    video.pause();
    skip.hidden = true;
    lenis.start();
    if (jump) go(49);
    last = 49;
  }
  function playAwakening() {
    video.play().catch((error: DOMException) => {
      // Hiding the tab can interrupt a pending play request before its first frame.
      if (playing && !document.hidden && error.name !== "AbortError") done();
    });
  }
  function manual(s: number) {
    done(false);
    armed = s < 38;
    go(s);
  }
  buttons.forEach(
    (b, i) => (b.onclick = () => manual(fest.chapters[i].at + 0.12)),
  );
  get(".discover").onclick = () => manual(fest.chapters[1].at + 0.12);
  skip.onclick = () => done();
  document
    .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    .forEach((a) => a.addEventListener("click", () => done(false)));
  function seek() {
    if (!loaded || playing || video.seeking || video.readyState < 1) return;
    const t = Math.min(video.duration - 0.09, target);
    if (Math.abs(video.currentTime - t) > 0.055) video.currentTime = t;
  }
  let previousTick = 0,
    lastMovement = 0,
    velocity = 1,
    forwardSamples = 0;
  let following = false;
  function stopFollowing() {
    if (following) video.pause();
    following = false;
    forwardSamples = 0;
    if (video.playbackRate !== 1) video.playbackRate = 1;
  }
  function followScroll(now: number, delta: number) {
    const elapsed = (now - previousTick) / 1000;
    if (!ready || elapsed <= 0 || elapsed > 0.2 || delta < 0 || delta > 0.8) {
      stopFollowing();
      seek();
      return;
    }
    if (delta > 0) {
      const speed = delta / elapsed;
      if (speed < 0.15 || speed > 3.5) {
        stopFollowing();
        seek();
        return;
      }
      velocity = forwardSamples ? velocity * 0.65 + speed * 0.35 : speed;
      forwardSamples++;
      lastMovement = now;
    }
    const drift = target - video.currentTime;
    if (now - lastMovement > 75 || Math.abs(drift) > 0.5) {
      stopFollowing();
      seek();
      return;
    }
    if (forwardSamples >= 3 && !video.seeking) {
      video.playbackRate = Math.max(0.25, Math.min(4, velocity + drift * 2));
      if (!following) {
        following = true;
        video.play().catch(() => {
          following = false;
        });
      }
    } else if (!following) seek();
  }
  async function open() {
    if (dead || started) return;
    started = true;
    status.textContent = "Preparing chronicle";
    video.src = "/media/" + (innerWidth < 850 ? "mobile" : "wide") + ".mp4";
    video.preload = "metadata";
    video.load();
    try {
      const m = await import("./film");
      if (!dead) {
        const test = document.createElement("canvas").getContext("webgl2");
        if (test) {
          test.getExtension("WEBGL_lose_context")?.loseContext();
          film = m.createFilm(video, get("#cinema"));
        }
      }
    } catch {
      get("#cinema").hidden = true;
    }
  }
  video.addEventListener("progress", () => {
    if (!ready && video.buffered.length && video.duration)
      status.textContent =
        "Buffering " +
        Math.min(
          100,
          Math.round((video.buffered.end(0) / video.duration) * 100),
        ) +
        "%";
  });
  video.addEventListener("loadeddata", () => {
    loaded = true;
    video.currentTime = 0.075;
  });
  video.addEventListener("seeked", () => {
    if (!ready && ++seekChecks < 2) {
      video.currentTime = 0.16;
      return;
    }
    ready = true;
    status.textContent = "";
    video.classList.add("ready");
  });
  video.addEventListener("error", () => {
    loaded = false;
    ready = false;
    get("#cinema").hidden = true;
    video.classList.remove("ready");
    status.textContent = "Illustrated journey";
    done();
  });
  function animate(t: number) {
    if (dead || document.hidden) return;
    lenis.raf(t);
    const sec = Math.max(
      0,
      Math.min(72, ((scrollY - section.offsetTop) / span()) * 72),
    );
    target = sec;
    if (sec < 37) armed = true;
    if (!playing && armed && ready && last < 39 && sec >= 39 && sec < 41) {
      stopFollowing();
      armed = false;
      playing = true;
      lenis.stop();
      skip.hidden = false;
      video.currentTime = 39;
      playAwakening();
    }
    if (playing && (video.currentTime >= 49 || sec < 37 || sec > 51))
      done(sec >= 37 && sec <= 51);
    if (!playing) followScroll(t, sec - last);
    previousTick = t;
    const current = playing ? video.currentTime : sec;
    label(current);
    if (
      ready &&
      film &&
      scrollY < section.offsetHeight &&
      t - renderTime >= 15
    ) {
      film.draw(t / 1000, current);
      renderTime = t;
    }
    if (sec > 0.015 && !started) void open();
    last = sec;
    raf = requestAnimationFrame(animate);
  }
  function visibility() {
    cancelAnimationFrame(raf);
    if (document.hidden) {
      if (following) stopFollowing();
      if (playing) video.pause();
    } else {
      if (playing) playAwakening();
      raf = requestAnimationFrame(animate);
    }
  }
  document.addEventListener("visibilitychange", visibility);
  raf = requestAnimationFrame(animate);
  for (const event of ["wheel", "touchstart", "keydown"])
    window.addEventListener(event, open, { once: true, passive: true });
  function dispose() {
    dead = true;
    for (const event of ["wheel", "touchstart", "keydown"])
      window.removeEventListener(event, open);
    cancelAnimationFrame(raf);
    film?.dispose();
    lenis.destroy();
    video.pause();
    video.removeAttribute("src");
    video.load();
    document.removeEventListener("visibilitychange", visibility);
  }
  window.addEventListener(
    "wheel",
    (e) => {
      if (playing && e.deltaY < 0) {
        done(false);
        manual(38.5);
      }
    },
    { passive: true },
  );
  window.addEventListener("keydown", (e) => {
    if (playing && e.key === "Escape") done();
  });
  window.addEventListener(
    "pagehide",
    (e) => {
      if (!e.persisted) dispose();
    },
    { once: true },
  );
  reduced.addEventListener("change", () => location.reload(), { once: true });
}

