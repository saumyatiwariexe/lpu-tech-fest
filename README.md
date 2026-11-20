# LPU Tech Fest · The Lantern Causeway

Walk across a torchlit sea bridge, open the gate, follow the carpet and discover the five festival disciplines. The original scroll-driven film remains available as the Classic site.

## Play locally

From this folder, run `npm ci` if dependencies are missing, then `npm run dev`. Open the localhost address printed by Vite. Use `npm run build` and `npm run preview` for the production version. The production site is in `dist/`.

| Route | Experience |
|---|---|
| / | Opening choice between the 3D fortress and scroll film |
| /?quality=high | Full effects and higher starting resolution |
| /?quality=standard | Lighter 3D geometry and effects |
| /?quality=lite | Original interactive scroll film |
| /?motion=still | Classic accessible still view |
| /?info | Festival programme, prizes, competitions, FAQ and contact in HTML |
| /credits | Public asset and software credits |

WASD moves, Shift sprints, mouse looks and E interacts. Arrow keys also move forward/backward and turn. Click the scene to capture the mouse. Escape opens the festival menu. On a touchscreen, move with the left joystick, drag the world to look and tap the interaction button. A standard gamepad uses the left and right sticks, left stick click for sprint, A to start or interact, Menu to open the guide, D-pad to move focus and B to close it. Sound starts muted. The registration form previews the interaction locally.

## Content and assets

Edit `src/config.ts` to replace the example event identity, dates, programme, contact address, disciplines and prizes. The festival information and public credits also ship as static HTML. The current project includes the local reference footage, optimized classic videos and reference frames. The source handoff archive omits MP4s. To restore Lite playback from that archive, put the supplied original at `source/stormbound.mp4`, run `npm run media` and rebuild. The 3D tiers run from the distributed build independently of the MP4.

The game design is in `docs/GDD.md`. Art and software provenance are in `docs/LICENSES.md`, supporting records in `docs/licenses/` and measured asset details in `docs/ASSET_MANIFEST.json`. `snapshots/prototype-v1.zip` preserves the original working prototype.

## Rebuild and verify

- `npm run heroes` regenerates all eight sculptures with headless Blender and applies meshopt compression. Blender 3.5 is the tested exporter. Set `BLENDER_BIN` to its executable if installed elsewhere.
- `npm run manifest` decodes the shipped GLBs, checks the dragon skeleton and compression, measures bounds and triangle counts and inventories distributed assets.
- `npm run verify:game` builds, plays both 3D tiers and tests the alternative inputs, auto routing, credits and Lite playback. Screenshots and JSON are written under `review/realm/`.
- For an isolated Windows Direct3D 11 measurement, set `REALM_QA_GPU` to `hardware` and run `node scripts/realm-qa.mjs`. The 1440 × 900 reports are saved in `review/realm/hardware/`.
- `npm run verify` exercises the classic film, seek behavior, layout and film-specific budgets.
- `python scripts/package.py` assembles and CRC-checks the source and build handoff.

For a fresh Windows installation, set `PLAYWRIGHT_BROWSERS_PATH` to the absolute path of `preflight/browsers` and run `npm exec playwright install chromium --only-shell`. Tests start their own loopback previews. No account session is needed. The Windows FFmpeg and ffprobe packages are for regenerating the classic media. See `FINAL_REPORT.md` for measured budgets and remaining verification limits.
