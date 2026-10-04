# ritangkar.github.io

Personal portfolio of **Ritangkar Dey** — AI-First Enterprise Commerce Architect.
Live at <https://ritangkar.github.io>. Static HTML/CSS/vanilla JS: no framework, no backend, no runtime dependencies.

## Layout

```
index.html                 home (generated from tools/home.template.html)
lab/index.html             Engineering Lab index (generated)
lab/<slug>/index.html      17 project pages (generated), each with an interactive demo
assets/css/site.css        design tokens, layout, components, demo kit
assets/js/site.js          nav, reveal, career progression, architecture graph
assets/js/lab.js           lab filter + demo loader
assets/js/demos/*.js       one hard-coded, synthetic-data demo per project (+ _kit.js helpers)
data/projects.mjs          single source of truth for the 17 projects
tools/build.mjs            generator for index.html, lab/**, sitemap.xml
```

## Editing

- Home copy: edit `tools/home.template.html`. Project copy: edit `data/projects.mjs`.
- Regenerate: `node tools/build.mjs` (Node 18+), then commit the output. GitHub Pages serves the committed files directly — there is no CI build.
- Preview locally: `python3 -m http.server` from the repo root and open <http://localhost:8000> (paths are root-relative, so a file:// open will not work).
- Demos are static: they use hard-coded values taken from the corresponding repositories and make no network calls. Data in them is synthetic.

## Deployment

GitHub Pages → Settings → Pages → **Deploy from a branch**, branch `main`, folder `/ (root)`. `.nojekyll` disables Jekyll processing.
