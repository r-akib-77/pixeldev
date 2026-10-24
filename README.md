# PixelDev — a living pixel-art developer portfolio

A hand-built, game-style portfolio: you walk around a pixel-art house and night
garden and "meet" the content as interactive objects. Every panel (About, Skills,
Projects, Achievements, Blog, Resume, Contact) is opened by walking to a hotspot,
pressing **E**, clicking its label in the world, using the bottom navbar (desktop)
or the ☰ menu (mobile), or via the **View Map** modal.

Everything — the world, the characters, the map artwork, the screens on the
monitors — is drawn procedurally in code with Canvas 2D. There are **no image
assets, no frameworks, no build step**. It is plain HTML + CSS + ES6 JavaScript.

---

## Run it

Static files only — no build, no dependencies.

| Option | How |
| --- | --- |
| **Double-click** | Open `index.html` in any modern browser (`file://` works — everything is classic scripts; only the optional resume check uses `fetch`, and it fails gracefully offline). |
| **Local server (recommended)** | `python -m http.server 8000` or `npx serve .` in this folder, then open `http://localhost:8000/` |

Note: two `?`-query deep links exist (`?panel=skills`, `?modal=map`) and are
harmless; they also make automated screenshot testing possible.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Walk | `W A S D` / arrow keys (diagonals normalized) | virtual d-pad, bottom-left |
| Interact | `E` near a glowing hotspot or click any label | ✋ button, bottom-right |
| Close panel | `Esc` or ✕ | ✕ |
| Warp | `View Map` → tap a pin or legend chip | same, from ☰ menu |
| Sound / Fullscreen / Help | top-right buttons | top-right buttons |

Sound is **off by default** (browser policy) and remembered in `localStorage`.
Hearts/XP/Lv are game decorations, not real stats — noted in the Help modal.

## Structure

```
2d-portfolio/
├─ index.html            app skeleton + inline SVG icon library
├─ styles/
│  ├─ main.css           design tokens, controls, panel/modal atoms, toast/tip
│  ├─ game.css           canvas layers, HUD, prompts, boot overlay
│  ├─ desktop.css        ≥901px layout (fit-camera, bottom navbar)
│  ├─ mobile.css         ≤900px or coarse-pointer (d-pad, sheets, menu, safe areas)
│  └─ animations.css     keyframes (pop, fade, sheet-up, glows…)
├─ scripts/
│  ├─ data.js            ★ ALL editable content (profile, skills, projects,
│  │                       achievements, blog samples, contact links, nav)
│  ├─ art.js             palette, drawing primitives, character/cat sprites,
│  │                       3x5 micro-font, thumbnails & portrait painters
│  ├─ world.js           960x608 world: furniture, garden, collisions (SOLIDS),
│  │                       hotspots (HOTSPOTS/WARP), glows, water zones
│  ├─ audio.js           SND — every sound is synthesized with WebAudio
│  ├─ game.js            engine: loop, input, camera (fit desktop / follow
│  │                       mobile), collisions, FX (fireflies, petals, water)
│  ├─ ui.js              HUD, hotspots, navbar, panels, map/help, toasts,
│  │                       touch controls, achievements wiring
│  └─ main.js            boot: classes, engine init, UI init, resume check,
│                          deep links (?panel= / ?modal=)
└─ assets/               optional; see "Adding your resume" below
```

### Editing content

Everything the panels show comes from `scripts/data.js` — edit it and refresh.
Small art tweaks: `scripts/world.js` (furniture, garden, hotspots) and
`scripts/art.js` (palette `P`, sprites). Collision boxes live in `world.js`
(`SOLIDS`) and must be updated if you move furniture or hotspots.

### Progress is stored locally

`localStorage` keys: `pixeldev.ach.<id>` (in-game achievements, from the
Achievements panel list), `pixeldev.visits` (sections you have opened), sound
preference. No server, no analytics, no tracking.

## Adding your resume

1. Export a one-page PDF named `resume.pdf`.
2. Drop it into `assets/` (create the folder if needed): `assets/resume.pdf`.
3. Reload. The panel checks the file with a `HEAD` request on boot and enables
   **Download PDF** / **View Online** only when it actually exists — until then
   the buttons stay honestly disabled with guidance text instead of 404ing.
   (Tip: the check needs HTTP, i.e. use a local server rather than `file://`.)

## Honesty policy in the demo content

* Blog posts are clearly labeled **Sample** and the panel explains where to
  replace them (`scripts/data.js` → `blog`).
* Contact links are marked **PLACEHOLDER** chips until replaced.
* Achievements claim nothing about real work: game-related badges unlock by
  playing, and the Achievements panel says so.

## Deploying

**Cloudflare Pages**
1. Push this folder to a GitHub repo (no build).
2. Cloudflare dashboard → *Workers & Pages* → *Create* → *Pages* → *Connect to Git*
   — pick the repo, **build command: (none), output directory: `/`** → Deploy.
3. Or CLI: `npx wrangler pages deploy .`

**GitHub Pages**
1. Push the files to a repo.
2. Repo → *Settings* → *Pages* → *Source: Deploy from a branch* → `main` / `(root)`.

Both serve pure static files; nothing to configure. Your project URLs
(`Kickzone`, `Jersey Store Demo`, `Forme Studio`, `Scentora`) already point to
their live `*.pages.dev` hosts, and “View All Projects” links to
`https://rakib-builds.pages.dev/`.

## Browser support

Evergreen Chrome / Edge / Firefox / Safari. Uses Canvas 2D, `localStorage`,
WebAudio, CSS grid/env(safe-area-inset-*) and `:has`-free styling. Tested
viewports: ≥900px desktop fit-camera layout; 430/390/320px touch layout with
notch-safe areas; landscape touch keeps the d-pad above the screen edge.
