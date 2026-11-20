# Fortress asset selection

| Need | Source or decision | Result |
|---|---|---|
| Modular architecture, gate hardware and props | Kenney and Quaternius public libraries were considered alongside custom geometry. | Built the specific causeway, keep, gate and vaulted hall in-house for the reference silhouette and collision layout. |
| Stone surface | ambientCG, Bricks 097 official page | Retained the CC0 color, ambient occlusion and normal detail. |
| Clouded horizon | Poly Haven, Kloppenheim 06 (Pure Sky) official page | Retained the CC0 panorama and transformed it offline. |
| Hero models, marks, flame atlas and wood | Project Blender and shader pipeline | Original geometry, particles and spatial grain. |
| Sound | OpenGameArt and public-library options considered | Synthesis supplies wind, crackle and impacts without recorded samples. |
| Typography and icons | Existing locally bundled OFL fonts and project marks | Kept Cinzel, Barlow and the original compass. |

[Bricks 097](https://ambientcg.com/view?id=Bricks097) · [Kloppenheim 06](https://polyhaven.com/a/kloppenheim_06_puresky) · [Kenney assets](https://kenney.nl/assets) · [Quaternius](https://quaternius.com/) · [OpenGameArt](https://opengameart.org/)

# Earlier scroll-film research

# Interaction references

The study used publicly available award entries. Their descriptions and highlighted interactions support the decisions below. The underlying sites' mobile breakpoints, timing curves, loader accuracy and performance were not measured.

| Work | Observed in the award entry | Application to the fest |
|---|---|---|
| The Year of Greta | A single-page timeline combines drag or scroll exploration with a distinct welcome transition. | Introduce the world's tone on the first frame and retain a chapter index throughout exploration. [Entry](https://www.awwwards.com/sites/the-year-of-greta) |
| Active Theory v5 | The portfolio presents multiple real-time environments and gives the about/contact area its own highlight. | Give the film and practical event information distinct layouts. Keep registration accessible from both. [Entry](https://www.awwwards.com/sites/active-theory-v5) |
| Paper Planes | A mobile-first experience builds its interaction around catching and throwing a plane. | Keep one primary gesture on mobile. Make the alternate path a visible link. [Entry](https://www.awwwards.com/sites/paper-planes) |
| The Symphony of Vines | Terrain formation, rivers and interactive titles mark stages in a cinematic origin story. | Time chapter changes to physical changes in the scene. Reserve the shimmer for the fire sequence. [Entry](https://www.awwwards.com/sites/the-symphony-of-vines) |
| Nomadic Tribe | Hold and drag interactions punctuate an illustrated tale. | Give the dragon a single real-time interval and an explicit exit. Do not require a custom gesture to reach competitions. [Entry](https://www.awwwards.com/sites/nomadic-tribe) |
| Three.js Journey | A WebGL learning site uses a journey as the organizing premise for a technical subject. | Retain literal competition names beside the fantasy trophy titles, so students can identify their discipline. [Entry](https://www.awwwards.com/sites/three-js-journey) |

Typography, local font delivery, poster-first loading and responsive framing were resolved against our own screenshots and measurements. Original procedural particles and vector trophies avoided external sprite sheets, HDRIs and model downloads.

