# Real-time fortress implementation

## Routing and loading

The root page contains the festival data as semantic HTML before JavaScript runs. The renderer is a dynamic import. Auto checks reduced motion, WebGL2 availability, renderer identity, device memory, logical cores, network hints and an approximately two-second offscreen shader timing loop. The scene avoids measuring a hidden tab. A software rasterizer, 2G connection, data-saver mode or low benchmark result selects Lite. On a capable phone Auto caps at Standard. Manual quality persists locally. A dedicated info view works without WebGL.

The exterior and single gate leaf arrive first. The hall and throne load after walking begins. Interacting with the gate starts loading the partial dragon and trophies. Models in each group share a promise. The Level BVH is made from the walkable parapets, room boundaries and columns. Capsule contacts project the horizontal player position back into the walkable corridor. The animated doorway has a separate clearance check.

## Rendering and controls

Three.js renders instanced architectural modules, cliff blocks and torch hardware. Standard uses a lower cylinder and cliff mesh detail, fewer light shafts and a lighter postprocessing stack. Both tiers scale internal resolution between 0.6 and 1.0 and cap the input display pixel ratio at 1.5. The nominal render target is capped at 2.07 megapixels on High and 1.44 megapixels on Standard before the dynamic multiplier. High adds SMAA, fine grain and subtle chromatic aberration. Bloom, ACES mapping, a generated colour LUT, vignette and fire-driven heat distortion run through postprocessing. SMAA and chromatic aberration use separate passes because combining these two convolution effects failed on the tested renderer.

A hemisphere light, directional sun, cold hall light and fire light are the complete dynamic light inventory. Projected architectural shadows are refreshed during zone construction and cached. Stone uses baked material AO, albedo and an OpenGL normal map. World-space pools around sconces, reflective materials, baked-detail maps and additive shaft geometry provide indirect-light cues. The architecture uses generated illumination and cached shadows without a full unique-UV lightmap atlas. Flipbooks and depth-tested point sprites provide breath, smoke, dust and embers. The sound bed and rumble are synthesized from noise, filters and oscillator envelopes in WebAudio.

## Art and delivery

The eight sculptures originate in `blender/heroes.py`. The script builds a three-joint skeleton with rigidly weighted anatomical sections and no unnecessary lower body. The runtime applies motion relative to the exported bone pose so the same lunge, breathing and jaw timing can follow replay and skip. Material emission and eye sprites handle the reveal. The throne dissolves through a position-dependent threshold and emissive burn edge.

Meshopt compression and quantization are applied after Blender export. Licensed images use WebP because the KTX encoder was unavailable. The sky is an offline Filmic conversion of the CC0 Poly Haven panorama. Masonry derives from an official CC0 photogrammetry set. Asset inventory reads the final GLBs, decodes them and measures skinned bounds in the renderer's coordinate system.

The film remains the recommended Auto path on software rendering. Geometry and texture results do not establish a physical GPU frame-rate guarantee. The release measurements and exact viewport appear in the final report.

# Classic film engineering notes

The following decisions describe the archived v1 scroll-film implementation and its retained Lite path.

# Media and interaction decisions

The supplied H.264/AAC file is exactly 72 s at 24 fps. The two-second storyboard shows an aerial view at the start, the gate beginning to open near 18–20 s, the main hall around 26–28 s, the head entering from the right at 42–44 s, fire near 50 s, and trophies becoming clear around 66–68 s. The copy transitions anticipate some visual beats. The awakening plays from 39 to 49 s. Chapter links, backward navigation and a skip button remain available.

Six crops spaced 12 s apart show the original star and the encoded replacement in preflight/mark-before.jpg and mark-after.jpg. Delogo removed the star but smeared a stone ledge. The WebGL pass feathers a nearby texture sample over this source-space region. The native-video fallback retains the encoded correction.

## Scrub experiment

Production-size local files. Each method drew 16 target frames, including reversals and adjacent requests. Native used a muted video seek. WebCodecs used sample offsets, keyframe flags, timestamps and AVC configuration extracted from the MP4 by ffprobe, HTTP byte ranges per GOP and up to 24 retained decoded frames. WebP fetched individual frames of an 8 fps sequence. Browser/network/heap measurements and all individual timings are in preflight/scrub-metrics.json.

| Resolution and method | Median ms (lower middle sample) | Worst ms | Requests over 41.7 ms | Complete asset MB | JS heap change MB |
|---|---:|---:|---:|---:|---:|
| Mobile native | 22.8 | 80.5 | 2/16 | 7.30 | 0.19 |
| Mobile WebCodecs | 24.0 | 90.6 | 3/16 | 7.30 | 0.79 |
| Mobile WebP | 10.8 | 13.5 | 0/16 | 19.51 | 1.10 |
| HD native | 41.4 | 74.5 | 7/16 | 21.90 | 0.77 |
| HD WebCodecs | 39.6 | 60.4 | 7/16 | 21.90 | 1.00 |
| HD WebP | 16.9 | 24.1 | 0/16 | 43.56 | 0.88 |

Native won the size/simplicity trade-off. WebP produced the fastest individual seeks but delivered only eight distinct frames per second and doubled the full asset size. WebCodecs gained 1.8 ms at the desktop median and added decoder lifetime, keyframe indexing and range transport. Native gives the surprise segment a continuous playback clock. Native reported zero dropped video frames during isolated paused seeks. WebCodecs and bitmap draws do not expose that counter. Over-budget requests measure delayed draws. JS heap excludes decoder surfaces and GPU memory. Some media range transfers did not emit completed CDP transfer events before page close, so use file sizes for worst-case transfer planning.

## Rendering

A sticky 900vh chapter stage leaves scrolling native, with Lenis smoothing wheel input. The initial poster and HTML shell paint before user input loads video or Three.js. Portrait framing moves right for the dragon. A fullscreen shader grades and reframes the image, adds grain, mist and heat distortion, and composites a separate point draw for ash and embers. DPR is capped at 1.5. Hidden tabs suspend animation. Still view and system reduced motion use one poster-height hero. The form is local and ephemeral.

The five SVG trophy illustrations are original and share no video texture or 3D payload. The team did not establish a visual or performance advantage for 3D trophy cards. No GLBs were produced. Fonts are self-hosted. No GSAP dependency was needed.

## Steady forward motion

A four-second fire-chapter trace exposed a limit that isolated seek timings missed. In the software-rendered browser, repeated seeks presented about 8, 5 and 8 distinct video frames per second on desktop, tablet and phone viewports. The release now follows sustained forward scrolling with muted native playback, adjusting playback rate to scroll velocity and correcting drift. Abrupt jumps, stops and reversals still seek precisely. The same trace then presented about 19, 15 and 18 video frames per second. The source itself is 24 fps on desktop and 18 fps on mobile. Rendering and video presentation are separate measurements. Both trace files are in review/seek-only.json and review/playback-check/metrics.json.

The mobile focus moves right for the animal, then travels left to reveal all five trophies on the dais. Native-video and poster fallbacks select chapter-specific object positions. No camera permission or orientation prompt is required.
The benchmark supplied the precomputed WebCodecs sample index directly to the browser harness. Its byte counters omit delivery of that index and its startup timings omit a client-side MP4 index parse. The comparison therefore favors the WebCodecs prototype on those two costs.

