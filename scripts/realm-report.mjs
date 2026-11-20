import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const read=async file=>JSON.parse(await readFile(file,'utf8'));
const qa=await Promise.all(['standard','high'].map(t=>read('review/realm/'+t+'.json')));
const inputs=await read('review/realm/inputs.json');
const classic=await read('review/lighthouse.json');
const classicBudget=await read('review/budgets.json');
const art=await read('docs/ASSET_MANIFEST.json');
for(const q of qa){if(q.errors.length||!q.timing||!q.peakCalls)throw Error('Walkthrough incomplete: '+q.tier)}
const mb=n=>(n/1e6).toFixed(2);
const format=n=>n.toLocaleString('en-US');
const rows=qa.map(q=>`| ${q.tier} | ${q.peakCalls} | ${format(q.peakTriangles)} | ${mb(q.sampledTexturePeakBytes)} MB | ${mb(q.firstPlayableBytes)} MB | ${mb(q.totalBytes)} MB | ${q.timing.medianFrameMs.toFixed(1)} / ${q.timing.p95FrameMs.toFixed(1)} ms |`).join('\n');
const heroes=art.assets.filter(a=>a.path.endsWith('.glb'));
const gpuReports=await Promise.all(['standard','high'].map(t=>read('review/realm/hardware/'+t+'.json'))).catch(()=>[]);
for(const q of gpuReports){if(q.errors.length||!q.renderer||/swiftshader/i.test(q.renderer))throw Error('Hardware walkthrough failed')}
const imageFolder=gpuReports.length?'review/realm/hardware':'review/realm';
const gpuTable=gpuReports.length?[
 '## Physical desktop GPU',
 '',
 'Both complete routes ran at 1440 × 900 in Chromium using '+gpuReports[0].renderer+'. The frame intervals include streaming, postprocessing, UI interaction and screenshot capture.',
 '',
 '| Tier | Peak draws | Peak triangles | Texture allocation | First playable | Total | Median FPS | p95 frame time |',
 '|---|---:|---:|---:|---:|---:|---:|---:|',
 ...gpuReports.map(q=>'| '+[q.tier,q.peakCalls,format(q.peakTriangles),mb(q.sampledTexturePeakBytes)+' MB',mb(q.firstPlayableBytes)+' MB',mb(q.totalBytes)+' MB',(1000/q.timing.medianFrameMs).toFixed(1),q.timing.p95FrameMs.toFixed(1)+' ms'].join(' | ')+' |'),
 '',
 'The desktop check uses a physical graphics processor through a headless browser. Phone performance remains unmeasured. Texture memory is an allocation estimate.',
 '',
 ].join('\n'):'';
const labels=[['approach','The causeway'],['gate','The bronze gate'],['hall','The obsidian throne'],['awakening','The awakening'],['reveal','Five disciplines'],['trophies','The dais']];
const pieces=[];for(const [i,[name,label]] of labels.entries()){
const left=i%2*520,top=Math.floor(i/2)*350;
pieces.push({input:await sharp(imageFolder+'/high-'+name+'.jpg').resize(520,325).toBuffer(),left,top},{input:Buffer.from(`<svg width="520" height="25"><text x="12" y="17" fill="#eace95" font-family="Arial" font-size="13">${label}</text></svg>`),left,top:top+325});
}
await sharp({create:{width:1040,height:1050,channels:3,background:'#142025'}}).composite(pieces).jpeg({quality:87}).toFile('review/realm/walkthrough.jpg');
await writeFile('FINAL_REPORT.md',`# LPU Tech Fest · Playable fortress

The real-time edition and the classic film share the same entry point. The game covers the causeway, opening gate, throne hall, dragon reveal and five interactive trophies. The production output is in \`dist/\`. Run \`npm run preview\` to serve it locally. Use \`/?quality=high\` or \`/?quality=standard\` to enter 3D directly. \`/?quality=lite\` opens the original scroll film.

## Walkthrough measurements

Playwright used keyboard movement and interaction to complete each route, collect the five trophies, replay and skip the awakening, and submit the local registration preview. The measurements cover startup and all chapters in a 960 × 600 Chromium window. Both runs completed with zero captured browser errors.

| Tier | Peak draws/frame | Peak triangles/frame | Sampled texture allocation | First playable | Whole walkthrough | Median / p95 frame interval |
|---|---:|---:|---:|---:|---:|---:|
${rows}

Draw calls and triangles are maxima from Three.js renderer.info across frames, including shadow refreshes and postprocessing. Texture figures estimate allocations from observed two-dimensional and cube texture formats, dimensions and mip levels. They exclude driver overhead, multisample renderbuffers and the 3D colour LUT. Transfer figures count each requested asset once, gzip text payloads and use the supplied byte size for binary assets. HTTP headers and protocol overhead are excluded. Values use decimal MB.

The observed geometry counts, sampled texture allocations, first playable transfers and High total transfer are inside the supplied numeric budgets. The Standard total is reported as measured because the brief ends before its numeric limit. Timing is from a software-rendered browser during an instrumented run. Auto selected Lite in the software-rendered context. Physical GPU results appear below when available.

${gpuTable}
## Controls and compatibility

- Classic playback decoded a ${inputs.liteVideo.width} × ${inputs.liteVideo.height} video during the automatic fallback test.
- The emulated touchscreen moved the player with the left joystick, changed view with a drag and opened the menu and FAQ by tap.
- A simulated standard gamepad started the walk, moved the player, opened the menu, navigated by D-pad and selected and closed a panel. The sound toggle activated successfully.
- The credits footer opened the generated credits page. Its ${inputs.creditsLinks} outgoing source links and the initial semantic festival information were present.
- The live Blender MCP connection reported Blender 3.5.1 and add-on 2.0. The sculptures were exported by an independent headless Blender process.

## Classic regression checks

The classic film passed desktop, tablet and mobile viewport checks, milestone seeking, natural playback and skip, touch chapter selection, orientation, hidden-tab handling, keyboard skip and the native-video fallback. Its mobile Lighthouse shell scored ${classic.shell.score} for performance and ${classic.shell.accessibility} for accessibility. The Lite JavaScript dependency graph is ${format(classicBudget.combinedGzipJsBytes)} bytes gzipped. The v1 archive CRC passed; both classic MP4s and the film shader are byte-identical to the snapshot.

## Art and handoff

The eight meshopt-compressed hero GLBs total ${format(heroes.reduce((n,a)=>n+a.bytes,0))} bytes. The dragon has ${format(heroes.find(a=>a.path.endsWith('dragon.glb')).tris)} triangles and neck, skull and jaw joints. Two CC0 photographic assets supply the masonry and sky. Architecture and hero pieces are stylized. Private source footage remains the visual reference and the Lite tier. The stage uses baked material AO and cached shadows. It has no full-scene lightmap bake.

- [Walkthrough contact sheet](review/realm/walkthrough.jpg)
- [Standard measurements](review/realm/standard.json) and [High measurements](review/realm/high.json)
- [Input checks](review/realm/inputs.json)
- [Asset manifest](docs/ASSET_MANIFEST.json) and [credit ledger](docs/LICENSES.md)
- [Game design](docs/GDD.md) and [technical decisions](docs/TECH_DECISIONS.md)
- [Original working snapshot](snapshots/prototype-v1.zip)

Event identity and dates, five competition descriptions, contact and prizes remain provisional in \`src/config.ts\`. Registration is a local preview. The handoff archive excludes large videos and account data. The working directory contains the optimized Lite videos. Restore them from the supplied original with \`npm run media\` when working from the archive. The earlier review folders and film reports describe v1; current 3D evidence lives under \`review/realm/\`.
`);
console.log('Wrote the walkthrough contact sheet and final report');
