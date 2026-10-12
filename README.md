# ritangkar.github.io

Personal portfolio of **Ritangkar Dey** — AI-First Enterprise Commerce Architect.
Live at <https://ritangkar.github.io>. Static HTML/CSS/vanilla JS: no framework, no backend. Three small vendored libraries (Lenis, GSAP + ScrollTrigger) are committed under `assets/vendor/` — there is no npm install or bundler.

## Layout

```
index.html                 home (generated from tools/home.template.html)
lab/index.html             Engineering Lab index (generated)
lab/<slug>/index.html      19 project pages (generated), each with an interactive demo
assets/css/site.css        design tokens, layout, components, demo kit
assets/js/site.js          nav, reveal, career progression, architecture graph
assets/js/world.js         raw-WebGL scene chain: one continuous camera flight, velocity-reactive
assets/js/motion.js        home page only: Lenis + GSAP/ScrollTrigger; scroll -> scene/velocity -> world
assets/vendor/             Lenis, GSAP, ScrollTrigger (+ licences, NOTICE.md)
assets/fonts/              Fraunces + Inter (OFL), self-hosted
assets/js/lab.js           lab filter + demo loader
assets/js/demos/*.js       one hard-coded, synthetic-data demo per project (+ _kit.js helpers); the Developer Toolkit links to its live app instead
data/projects.mjs          single source of truth for the 19 projects
tools/build.mjs            generator for index.html, lab/**, sitemap.xml
```

## Editing

- Home copy: edit `tools/home.template.html`. Project copy: edit `data/projects.mjs`.
- Regenerate: `node tools/build.mjs` (Node 18+), then commit the output. GitHub Pages serves the committed files directly — there is no CI build.
- Preview locally: `python3 -m http.server` from the repo root and open <http://localhost:8000> (paths are root-relative, so a file:// open will not work).
- Projects with a `live` URL in `data/projects.mjs` (the SAP Commerce Developer Toolkit) show a launch panel instead of a demo. The SAP Commerce MCP demo is a simulation with sample data.
- Demos are static: they use hard-coded values taken from the corresponding repositories and make no network calls. Data in them is synthetic.

## Deployment

GitHub Pages → Settings → Pages → **Deploy from a branch**, branch `main`, folder `/ (root)`. `.nojekyll` disables Jekyll processing.

## Motion & 3D design notes

- **Concept:** the page is one connected flight through "the commerce stack" — catalog field → career ascent → architecture layers → AI mesh inside a guardrail cage → the 19 lab projects → destination. Scene order follows the sections; `BOUNDS`/`LINGER` in `motion.js` map scroll position to camera position (the dwell/seam idea from [scroll-world](https://github.com/oso95/scroll-world), rendered live instead of as paid AI video).
- **Velocity** (from Lenis' smoothed scroll) drives the star streaks, field of view and camera roll in the WebGL world. Inner pages (Lab, projects) get a calm static backdrop and native scrolling — no Lenis/GSAP is loaded there.
- **Fallbacks:** no WebGL → CSS background; `prefers-reduced-motion` → native scroll, one static frame, no GSAP choreography; touch devices keep native touch scrolling and a lighter scene (fewer points, DPR ≤ 1.5).
- Third-party licences and attribution: `assets/vendor/NOTICE.md`.
