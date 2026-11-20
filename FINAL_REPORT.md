# LPU Tech Fest · Playable fortress

The real-time edition and the classic film share the same entry point. The game covers the causeway, opening gate, throne hall, dragon reveal and five interactive trophies. The production output is in `dist/`. Run `npm run preview` to serve it locally. Use `/?quality=high` or `/?quality=standard` to enter 3D directly. `/?quality=lite` opens the original scroll film.

## Walkthrough measurements

Playwright used keyboard movement and interaction to complete each route, collect the five trophies, replay and skip the awakening, and submit the local registration preview. The measurements cover startup and all chapters in a 960 × 600 Chromium window. Both runs completed with zero captured browser errors.

| Tier | Peak draws/frame | Peak triangles/frame | Sampled texture allocation | First playable | Whole walkthrough | Median / p95 frame interval |
|---|---:|---:|---:|---:|---:|---:|
| standard | 111 | 81,176 | 31.77 MB | 0.62 MB | 0.76 MB | 300.0 / 400.0 ms |
| high | 118 | 110,216 | 75.44 MB | 0.62 MB | 0.76 MB | 366.6 / 499.9 ms |

Draw calls and triangles are maxima from Three.js renderer.info across frames, including shadow refreshes and postprocessing. Texture figures estimate allocations from observed two-dimensional and cube texture formats, dimensions and mip levels. They exclude driver overhead, multisample renderbuffers and the 3D colour LUT. Transfer figures count each requested asset once, gzip text payloads and use the supplied byte size for binary assets. HTTP headers and protocol overhead are excluded. Values use decimal MB.

The observed geometry counts, sampled texture allocations, first playable transfers and High total transfer are inside the supplied numeric budgets. The Standard total is reported as measured because the brief ends before its numeric limit. Timing is from a software-rendered browser during an instrumented run. Auto selected Lite in the software-rendered context. Physical GPU results appear below when available.

## Physical desktop GPU

Both complete routes ran at 1440 × 900 in Chromium using ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 (0x00001F99) Direct3D11 vs_5_0 ps_5_0, D3D11). The frame intervals include streaming, postprocessing, UI interaction and screenshot capture.

| Tier | Peak draws | Peak triangles | Texture allocation | First playable | Total | Median FPS | p95 frame time |
|---|---:|---:|---:|---:|---:|---:|---:|
| standard | 111 | 81,176 | 46.64 MB | 0.62 MB | 0.76 MB | 59.9 | 16.8 ms |
| high | 118 | 110,216 | 103.28 MB | 0.62 MB | 0.76 MB | 59.9 | 16.8 ms |

The desktop check uses a physical graphics processor through a headless browser. Phone performance remains unmeasured. Texture memory is an allocation estimate.

## Controls and compatibility

- Classic playback decoded a 768 × 432 video during the automatic fallback test.
- The emulated touchscreen moved the player with the left joystick, changed view with a drag and opened the menu and FAQ by tap.
- A simulated standard gamepad started the walk, moved the player, opened the menu, navigated by D-pad and selected and closed a panel. The sound toggle activated successfully.
- The credits footer opened the generated credits page. Its 9 outgoing source links and the initial semantic festival information were present.
- The live Blender MCP connection reported Blender 3.5.1 and add-on 2.0. The sculptures were exported by an independent headless Blender process.

## Classic regression checks

The classic film passed desktop, tablet and mobile viewport checks, milestone seeking, natural playback and skip, touch chapter selection, orientation, hidden-tab handling, keyboard skip and the native-video fallback. Its mobile Lighthouse shell scored 97 for performance and 100 for accessibility. The Lite JavaScript dependency graph is 158,751 bytes gzipped. The v1 archive CRC passed; both classic MP4s and the film shader are byte-identical to the snapshot.

## Art and handoff

The eight meshopt-compressed hero GLBs total 202,216 bytes. The dragon has 6,552 triangles and neck, skull and jaw joints. Two CC0 photographic assets supply the masonry and sky. Architecture and hero pieces are stylized. Private source footage remains the visual reference and the Lite tier. The stage uses baked material AO and cached shadows. It has no full-scene lightmap bake.

- [Walkthrough contact sheet](review/realm/walkthrough.jpg)
- [Standard measurements](review/realm/standard.json) and [High measurements](review/realm/high.json)
- [Input checks](review/realm/inputs.json)
- [Asset manifest](docs/ASSET_MANIFEST.json) and [credit ledger](docs/LICENSES.md)
- [Game design](docs/GDD.md) and [technical decisions](docs/TECH_DECISIONS.md)
- [Original working snapshot](snapshots/prototype-v1.zip)

Event identity and dates, five competition descriptions, contact and prizes remain provisional in `src/config.ts`. Registration is a local preview. The handoff archive excludes large videos and account data. The working directory contains the optimized Lite videos. Restore them from the supplied original with `npm run media` when working from the archive. The earlier review folders and film reports describe v1; current 3D evidence lives under `review/realm/`.
