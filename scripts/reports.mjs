import { readFile, writeFile, stat, readdir } from "node:fs/promises";
const read = async (p) => JSON.parse(await readFile(p, "utf8"));
const dimensions = [
  "Visual quality",
  "Story and pacing",
  "Typography and layout",
  "Motion polish",
  "Performance evidence",
  "Mobile",
  "Accessibility",
  "Originality",
  "University brand fit",
];
const ratings = [
  [7, 7, 6, 6, 4, 5, 6, 6, 6],
  [7, 7, 7, 6, 5, 6, 6, 6, 6],
  [8, 7, 7, 7, 6, 7, 7, 7, 6],
  [8, 8, 7, 7, 6, 7, 8, 7, 6],
];
const comments = [
  [
    "The footage carries the opening at desktop-000. The mobile-000 title wraps after Tech. Mobile-075 shows five largely abstract shapes.",
    "Mobile title width, indistinct trophy symbols, and cache reuse in the transfer measurement.",
    "Shortened the mobile title measure, revised the mobile rail and disabled HTTP cache for each viewport measurement.",
  ],
  [
    "Mobile-000 now holds the complete name on one line. The three-column tablet treatment squeezes the last two cards into an incomplete row. Desktop-080 reads as five technical emblems.",
    "Card silhouettes, portrait framing around the dragon, and the absence of a persistent still-mode choice.",
    "Drew individual metal trophy bodies, biased the portrait crop during the awakening and added Still view.",
  ],
  [
    "Desktop-080 shows a different silhouette on each plinth. The desktop progression is readable. The dragon segment consumes ten seconds if the visitor does not skip.",
    "Delayed first paint from eagerly starting WebGL, text-label accessibility audit, and handheld motion framing.",
    "Deferred the video and Three.js import until interaction, corrected navigation names and added tilt response where supported.",
  ],
  [
    "Mobile-040 keeps both eyes and the face visible while the chapter title occupies the lower foreground. Skip and still controls fit at phone width. Fast full-page sweeps alone cannot establish that the snap returns control correctly.",
    "Institutional identity remains provisional, hardware budgets remain unmeasured, and the small delogo patch softened stone detail.",
    "Added dedicated snap, release and fallback tests, a feathered shader patch and font preloads. Inspected the final contact sheets.",
  ],
];
for (let i = 0; i < 4; i++) {
  const dir = "review/round-" + (i + 1),
    rows = await read(dir + "/metrics.json");
  const scores = dimensions
    .map((d, k) => "| " + d + " | " + ratings[i][k] + "/10 |")
    .join("\n");
  const text =
    "# Review round " +
    (i + 1) +
    "\n\n" +
    comments[i][0] +
    "\n\n| Criterion | Score |\n|---|---:|\n" +
    scores +
    "\n\n**Three weakest items.** " +
    comments[i][1] +
    "\n\n**Changes for the next pass.** " +
    comments[i][2] +
    "\n\nEach viewport has 21 JPEGs and five timing/heap samples in metrics.json. Runtime/console error count across viewports: " +
    rows.reduce((n, r) => n + r.errors.length, 0) +
    ". Scores are editorial judgments. The browser uses SwiftShader.\n";
  await writeFile(dir + "/REVIEW.md", text);
}
const results = await read("review/verify/metrics.json"),
  lh = await read("review/lighthouse.json"),
  soak = await read("review/soak-final.json");
const fmt = (n) => (n / 1e6).toFixed(2),
  scores = Object.entries(lh)
    .map(
      ([k, v]) =>
        k +
        " " +
        v.score +
        "/100, FCP " +
        (v.FCPms / 1000).toFixed(2) +
        " s, LCP " +
        (v.LCPms / 1000).toFixed(2) +
        " s, CLS " +
        v.CLS.toFixed(4),
    )
    .join(". ");
const heap = soak.map((s) => s.usedSize),
  heapLine =
    "After forced GC, JS heap measured " +
    fmt(heap[0]) +
    " MB initially, " +
    fmt(heap.at(-1)) +
    " MB at " +
    Math.round(soak.at(-1).seconds) +
    " s, and " +
    fmt(Math.min(...heap.slice(1))) +
    "–" +
    fmt(Math.max(...heap.slice(1))) +
    " MB after minute one.";
const fsizes = (await readdir("dist/assets")).filter((f) => f.endsWith(".js"));
const { gzipSync } = await import("node:zlib");
let gz = 0;
for (const name of fsizes)
  gz += gzipSync(await readFile("dist/assets/" + name)).length;
const counts = await Promise.all(
  ["round-1", "round-2", "round-3", "round-4", "verify"].map(
    async (d) =>
      (await readdir("review/" + d)).filter((f) => f.endsWith(".jpg")).length,
  ),
);
if (counts.some((n) => n !== 63)) throw Error("Missing screenshots");
const metricTable = results
  .map(
    (v) =>
      "| " +
      v.name +
      " | " +
      v.samples.map((s) => s.medianFrameMs.toFixed(1)).join(" / ") +
      " | " +
      Math.max(...v.samples.map((s) => s.p95FrameMs)).toFixed(1) +
      " | " +
      fmt(v.bytes) +
      " | " +
      v.errors.length +
      " |",
  )
  .join("\n");
const risks = [
  "Physical laptop and phone GPU performance is unverified.",
  "Fast seeks can trail input, especially on the 21.90 MB HD asset.",
  "iOS Safari and touch hardware need a device pass.",
  "The six-footage-crop test found a soft patch on detailed stone.",
  "Dates, tracks, prizes, sponsors, contact and registration need organizer approval before publication.",
];
const network = await read("review/network-profile.json");
const frameResults = results
  .map((v) => {
    const t = v.continuousScrub;
    const updates = Math.round((t.presentedVideoFrames * 1000) / t.durationMs);
    const callbacks = Math.round((t.animationCallbacks * 1000) / t.durationMs);
    return `| ${v.name} | ${updates} | ${callbacks} | ${Math.round(t.p95PlayheadDifferenceSec * 1000)} | ${fmt(v.receivedEncodedBodyBytes)} |`;
  })
  .join("\n");
const detailedPerformance = `

### Continuous forward scrolling

These four-second traces cross the fire chapter. Presented video frames count decoded images displayed. Animation callbacks include shader animation and page scroll.

| Viewport | Presented video frames/s | Animation callbacks/s | p95 playhead difference, ms | Encoded body MB received over the viewport test |
|---|---:|---:|---:|---:|
${frameResults}

The cold mobile network trace used ${network.downMbps} Mbps down and ${network.latencyMs} ms latency. First contentful paint occurred at ${(network.paint.find((p) => p.name === "first-contentful-paint").ms / 1000).toFixed(2)} s. The first two warm-up seeks finished ${(network.millisecondsFromInteractionToFirstTwoSeeks / 1000).toFixed(2)} s after input. Before interaction the page requested its document, CSS, script, poster and local fonts.

The three shell Lighthouse scores were ${lh.shell.runs.map((r) => r.score).join(", ")}. The reported shell score is their median. An earlier run scored 89 while other rendering tests competed for the CPU. See [the raw Lighthouse runs](review/lighthouse.json).
`;
await writeFile(
  "review/CLASSIC_REPORT.md",
  "# LPU Tech Fest prototype\n\nThe local production build and npm run verify passed. The festival page includes a six-chapter scroll film, a skippable real-time awakening, still and native-video fallbacks, five trophy cards, schedule, prizes, partners, a local registration preview, FAQ and contact. Four review rounds and a separate final sweep each captured 63 screenshots. Those five sweeps contain " +
    counts.reduce((a, b) => a + b, 0) +
    " viewport screenshots plus ten named story moments.\n\n## Measured results\n\nLighthouse mobile, simulated throttling: " +
    scores +
    ". Accessibility scores: " +
    lh.shell.accessibility +
    " shell, " +
    lh.journey.accessibility +
    " journey. Combined production JavaScript including Three.js is " +
    (gz / 1000).toFixed(1) +
    " KB gzip. HD: 21.90 MB at 1280×720, 24 fps. Mobile: 7.30 MB at 768×432, 18 fps. Both encodes contain only H.264 video.\n\n| Viewport | Median animation-frame interval at 0 / 25 / 50 / 75 / 100%, ms | Worst sampled p95, ms | Completed CDP transfers, MB | Console/runtime errors |\n|---|---|---:|---:|---:|\n" +
    metricTable +
    detailedPerformance +
    "\n\nCDP completed transfers can omit ongoing/range-cached media requests. File sizes above capture full media weight. Frame intervals measure browser callbacks on the SwiftShader software renderer. They do not verify the physical device FPS budgets.\n\n" +
    heapLine +
    " The ten-minute soak exercised forward-follow playback. The final release additionally adjusts trophy framing and handles an interrupted play request on tab hide. GPU and decoder allocations are outside this JS-heap measurement. The final JS-heap reading exceeded the initial reading. The strict zero-growth budget remains unconfirmed.\n\n## Interaction and evidence\n\nThe flow test exercised a natural awakening, manual skip, re-entry from an earlier chapter, still mode, keyboard skip-to-content, native fallback with WebGL disabled, FAQ expansion and the stubbed form. The touch test exercised phone scrolling, navigation, rotation and the DPR cap. The lifecycle test verified pause and resume through the visibility handler and confirmed the canvas and video source were released on teardown. The three labelled contact sheets and all raw metrics are in review.\n\n## Release risks and next steps\n\n" +
    risks.map((x, i) => i + 1 + ". " + x).join("\n") +
    "\n\nOpen the local preview, confirm provisional details with the organizer, test real devices and acquire publication clearance for the supplied film before any public release. No deployment or registration backend is included. See README.md for restore and run commands.\n",
);
await writeFile(
  "review/MORNING_BRIEF.md",
  "# Morning brief\n\nThe local prototype builds and passes npm run verify. The camera follows the visitor from cliff to gate, throne, dragon, fire and trophies. The awakening plays in real time and can be skipped. A still version, competition cards and an ephemeral registration form are included.\n\n**Measurements.** " +
    scores +
    ". The HD/mobile encodes are 21.90/7.30 MB. Production JS including Three.js is " +
    (gz / 1000).toFixed(1) +
    " KB gzip. Four QA rounds covered three viewports. Final sweep: zero console errors. " +
    heapLine +
    "\n\n**Five release risks**\n\n" +
    risks.map((x, i) => i + 1 + ". " + x).join("\n") +
    "\n\n**Ranked open questions**\n\n1. What event details and registration destination can be published?\n2. Which phone and laptop should define sign-off?\n3. Should the dragon sequence be opt-in for the public event audience?\n",
);
await writeFile(
  "review/FOR_CLAUDE.md",
  "# External design review prompt\n\nPlease review the attached LPU Tech Fest prototype evidence. The audience is university students choosing a technical competition. The opening is a field chronicle set in a stormbound coastal fortress. Scroll drives the camera. The ten-second dragon beat has a skip button and the event information is reachable immediately. The mobile crop follows the face. The five trophies are original SVG illustrations.\n\nStart with sheet-desktop.png, sheet-mobile.png and sheet-moments.png. Each has ten labelled views. Full sizes are in verify/ as desktop-, tablet- and mobile-000.jpg through -100.jpg in 5% steps. metrics.json records five frame/heap samples per viewport. Numbers: " +
    scores +
    ". HD/mobile 21.90/7.30 MB. Browser uses SwiftShader.\n\n1. Which frame first communicates the purpose as a university technology festival?\n2. Which chapter title obscures a critical subject on mobile?\n3. Does the real-time dragon interruption earn its length?\n4. Can a first-time visitor find the right competition and its team size?\n5. Which single change should precede on-device testing?\n",
);
console.log("Reports written", scores, heapLine);


