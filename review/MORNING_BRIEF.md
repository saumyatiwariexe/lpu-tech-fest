# Morning brief

The local prototype builds and passes npm run verify. The camera follows the visitor from cliff to gate, throne, dragon, fire and trophies. The awakening plays in real time and can be skipped. A still version, competition cards and an ephemeral registration form are included.

**Measurements.** shell 100/100, FCP 1.06 s, LCP 1.06 s, CLS 0.0000. journey 100/100, FCP 1.03 s, LCP 1.03 s, CLS 0.0000. The HD/mobile encodes are 21.90/7.30 MB. Production JS including Three.js is 143.0 KB gzip. Four QA rounds covered three viewports. Final sweep: zero console errors. After forced GC, JS heap measured 3.69 MB initially, 4.24 MB at 600 s, and 4.11–4.25 MB after minute one.

**Five release risks**

1. Physical laptop and phone GPU performance is unverified.
2. Fast seeks can trail input, especially on the 21.90 MB HD asset.
3. iOS Safari and touch hardware need a device pass.
4. The six-footage-crop test found a soft patch on detailed stone.
5. Dates, tracks, prizes, sponsors, contact and registration need organizer approval before publication.

**Ranked open questions**

1. What event details and registration destination can be published?
2. Which phone and laptop should define sign-off?
3. Should the dragon sequence be opt-in for the public event audience?
