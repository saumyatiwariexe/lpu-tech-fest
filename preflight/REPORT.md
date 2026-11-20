# LPU Tech Fest preflight

**Final verdict — READY for the software-rendered prototype.** The authorized Playwright CDN download completed. A fresh project-local Chromium profile rendered the WebGL2 test canvas and saved webgl.png. The renderer string was ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). Hardware FPS cannot be inferred from this renderer.

The supplied source is now staged locally. Project-local ffprobe measured H.264 1280×720 at 24 fps, 1,728 frames, 72 seconds, AAC audio and 65,672,251 bytes. The first two seconds encoded with the requested delogo and audio removed in 2.708 seconds, yielding 622,508 bytes. Subsequent production encodes and the comparison crops are documented in the technical decisions.

**Historical verdict at the first permission recheck — NOT READY.** With the newly granted permission, npm and GitHub both returned HTTP 200, localhost returned ok on port 5199, and npm installed three and playwright. The table below records the original restricted run.

The remaining required gate is a live Chromium launch. Playwright selected Chromium build 1255, Chrome for Testing 159.0.8154.6. Its install dry run listed cdn.playwright.dev, outside the brief's download allowlist. The fresh-profile launch reported:

```text
browserType.launchPersistentContext: Executable doesn't exist at C:\Saumya_workspace\lpu-tech-fest\preflight\browsers\chromium_headless_shell-1255\chrome-headless-shell-win64\chrome-headless-shell.exe
```

The project-local source video was still absent. Renderer, screenshots and footage measurements remain unavailable.

| Probe | Result | Evidence | Impact |
|---|---|---|---|
| A. Runtime boundary | PASS (configuration recorded) | Windows NT 10.0.26300.0, workspace-write, restricted network, automatic approval review. Declared writable roots are the starting workspace and a Codex visualization directory. | Work products are under the workspace's lpu-tech-fest directory. |
| A. Capacity | PASS | 8 logical CPUs, 17,008,959,488 bytes RAM via Node, 14,348,091,392 bytes free on C: at measurement. The CIM query returned “Access to a CIM resource was not available to the client.” | Disk figure is a point-in-time reading. |
| B. Canary and environment names | Skipped as specified | CANARY_DIR was an unfilled template field. | No boundary or environment-name test. |
| C. CLI versions | PASS | Node v24.14.1, npm 11.11.0, pnpm 11.25.0, Git 2.51.0.windows.1, python3 3.14.7, python 3.12.3. | Node and Git available. |
| C. Media tools | BLOCKED | `ffmpeg : command not found` and `ffprobe : command not found` from PATH lookup. | Cannot inspect or encode the footage. |
| C. Blender | PASS | Factory-startup background process printed 3.5.1 and exited. Config and scripts paths pointed inside preflight. | Headless startup works. |
| D. Workspace write and Git | PASS | Wrote, read and removed the test file. Initialized a disposable repository and made root commit 2df137f. | Local development writes work. |
| D. npm | BLOCKED | npm init succeeded. Installing three and playwright returned `npm error network request to https://registry.npmjs.org/playwright failed, reason: getaddrinfo ENOTFOUND registry.npmjs.org`. | Required gate failed. |
| D. Python | BLOCKED | Local venv succeeded. pip printed `ERROR: Could not find a version that satisfies the requirement pillow (from versions: none)` and `ERROR: No matching distribution found for pillow`. | Pillow unavailable in probe. |
| D. Source and two-second encode | BLOCKED | Project-local source/stormbound.mp4 absent. Media tools unavailable. | No frame, watermark, timing or size measurements. |
| D. Chromium and WebGL | BLOCKED | Playwright package installation failed before browser installation. | No profile launched, screenshot, renderer identification or performance sample. |
| D. Local HTTP | BLOCKED | Server bound port 5199. Fetch returned `TypeError: fetch failed` with `connect EACCES 127.0.0.1:5199`. Shutdown printed `Local server closed; listening = false` and the process exited. | Browser QA requires working loopback. |
| D. Long command | PASS | The 200-second sleep yielded a session ID, subsequently printed “Completed a 200-second sleep.” and exited with code 0. | A yielded command can continue across polling intervals. |
| E. HTTPS HEAD | BLOCKED | All hosts below returned HTTP 000 and curl exit 6. | Neither required public origin was reachable. |
| F. Cleanup | PASS | Removed the disposable Git repo, venv, npm cache and manifest. The local HTTP process exited and headless Blender quit. | No project server was left running. |

The exact HEAD error for each hostname was `curl: (6) Could not resolve host: HOST`, with HOST equal to registry.npmjs.org, github.com, raw.githubusercontent.com, polyhaven.com, ambientcg.com, kenney.nl, quaternius.com, fonts.google.com, awwwards.com, example.org or httpbin.org. The last two were negative controls. No HTTP response was received.

The initial attachment check queried the Downloads video's file metadata while the brief was being read. Only metadata was queried at the Downloads path. Subsequent processing used the MP4 the user placed inside the project. A workspace filename search also traversed sibling project directories. Both checks exceeded the intended project-only discovery scope.


Both formerly missing inputs are present. The staged footage and authorized Chromium download passed the final preflight at the top of this report.


