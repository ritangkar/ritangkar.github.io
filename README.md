# Ritangkar Dey — Portfolio Site

A single-file portfolio (`index.html` — HTML, CSS and vanilla JavaScript, no build step,
no framework, no backend) built for GitHub Pages.

## Folder structure

```
ritangkar.github.io/
├── index.html                        ← the entire site
├── robots.txt
├── sitemap.xml
├── README.md
├── assets/
│   ├── Ritangkar-Dey-Resume.pdf      ← already included, wired to the Download Résumé buttons
│   └── og-image.png                  ← optional, add a 1200×630 image for social-share previews
└── images/
    ├── README.md                     ← explains the expected subfolders/filenames
    ├── ai-commerce/
    ├── executive-copilot/
    └── service-cloud-chat/
```

Only `index.html` is required for the site to work. Everything else is supporting content.

## What's already wired up

- **Résumé download** — `assets/Ritangkar-Dey-Resume.pdf` is included, and both the hero and
  the Resume section already link to it.
- **LinkedIn** — links to `https://www.linkedin.com/in/ritangkar-dey`.
- **Email** — `mailto:ritangkardey11@gmail.com` links in the hero, contact section and footer.
- **3 full AI case studies** — Enterprise AI Commerce Assistant, Multi-Agent Executive Business
  Copilot, and SAP Commerce + Service Cloud Live-Agent Chat — each with its own architecture
  diagram, reachable via "View case study" from the AI Lab grid, with working back navigation.
- **Scroll reveal, mobile menu, active-nav highlighting, and a lightbox for the architecture
  diagrams** — all vanilla JS, no dependencies, and all respect `prefers-reduced-motion`.

## What still needs your input

Search `index.html` for the word `placeholder` (or look for text styled in muted grey) to find
every spot that needs a real value. Specifically:

| What | Where | Replace with |
|---|---|---|
| GitHub profile URL | Hero social row, Projects section, footer | Your real GitHub URL, and remove the `is-placeholder` class from that `<a>`/`<span>` |
| Project screenshots | Inside each `<section class="case-study">` | Real `<img>` tags — see `images/README.md` |
| Social preview image | `<meta property="og:image">` in `<head>` | A 1200×630 image saved to `assets/og-image.png` |

Everything else on the site (job titles, dates, project descriptions, skills) is drawn directly
from your résumé — update the résumé first, then mirror any change into `index.html`.

## Adding a new project or AI case study later

- **A simple project card:** copy one `<div class="project-card">…</div>` block in the Projects
  section and edit the text.
- **A simple AI card (no dedicated page):** copy one of the plain `<article class="ai-card">`
  blocks in the AI Lab section (the ones without a "View case study" link).
- **A full case-study page:** duplicate one of the three `<section class="case-study">` blocks
  near the bottom of the file, give it a new `id="cs-your-id"`, then:
  1. Add `'your-id'` to the `caseStudyIds` array near the top of the `<script>` block.
  2. Add a matching entry to the `caseStudyTitles` object right below it.
  3. Link to it from an AI Lab card with `<a href="#your-id" class="case-link">`.

## Deployment (GitHub Pages)

1. Create a GitHub account if you don't have one.
2. Create a new repository named exactly **`ritangkar.github.io`** (this exact name is what
   makes GitHub serve it at the root domain).
3. Upload everything in this folder — `index.html`, `robots.txt`, `sitemap.xml`, `assets/`,
   `images/` — into the root of that repository.
4. In the repository, go to **Settings → Pages**.
5. Under **Build and deployment**, set **Source** to **Deploy from a branch**, branch **main**,
   folder **/(root)**, then **Save**.
6. Wait 1–2 minutes for the first deployment (the Pages settings page shows a green checkmark
   and a link when it's live).
7. Open **https://ritangkar.github.io** — you should see the hero section with the "Enterprise
   commerce platforms, engineered with AI at the core." headline and the animated architecture
   diagram.

## Notes

- No client-confidential details (system names, internal URLs, customer data) are included
  anywhere on the site — enterprise project descriptions use generalized language on purpose.
- No API keys, tokens or credentials are used anywhere — the whole site is static and safe to
  make public.
